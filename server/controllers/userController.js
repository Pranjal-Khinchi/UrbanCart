const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/auditService');

// @route GET /api/users (admin)
const getUsers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const query = {};

  if (search && search.trim()) {
    const term = search.trim();
    query.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(query),
  ]);

  sendSuccess(res, 200, users, {
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
  });
});

// @route GET /api/users/:id (admin)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  sendSuccess(res, 200, user);
});

// @route PUT /api/users/:id/role (admin) { role }
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['customer', 'admin'].includes(role)) throw new ApiError(400, 'Invalid role.');

  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role.');
  }

  const previousRole = user.role;
  user.role = role;
  await user.save();

  await logActivity({
    action: 'UPDATE_USER_ROLE',
    collection: 'users',
    recordId: user._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Changed role of ${user.email} from ${previousRole} to ${role}`,
  });

  sendSuccess(res, 200, user);
});

// @route PUT /api/users/:id/status (admin) { isActive }
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');

  if (user._id.toString() === req.user._id.toString()) {
    throw new ApiError(400, 'You cannot deactivate your own account.');
  }

  user.isActive = Boolean(isActive);
  await user.save();

  await logActivity({
    action: 'UPDATE_USER_STATUS',
    collection: 'users',
    recordId: user._id,
    userId: req.user._id,
    role: req.user.role,
    description: `${isActive ? 'Activated' : 'Deactivated'} account ${user.email}`,
  });

  sendSuccess(res, 200, user);
});

// @route PUT /api/users/me (self-service profile update)
const updateMyProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar, addresses } = req.body;
  const user = await User.findById(req.user._id);

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  if (addresses !== undefined) user.addresses = addresses;

  await user.save();

  await logActivity({
    action: 'UPDATE_PROFILE',
    collection: 'users',
    recordId: user._id,
    userId: user._id,
    role: user.role,
    description: `${user.email} updated their profile`,
  });

  sendSuccess(res, 200, user.toSafeObject());
});

module.exports = { getUsers, getUserById, updateUserRole, updateUserStatus, updateMyProfile };
