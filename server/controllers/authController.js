const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const generateToken = require('../utils/generateToken');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/auditService');

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  const user = await User.create({ name, email, password });

  await logActivity({
    action: 'USER_REGISTER',
    collection: 'users',
    recordId: user._id,
    userId: user._id,
    role: user.role,
    description: `New user registered: ${user.email}`,
  });

  const token = generateToken(user._id, user.role);
  sendSuccess(res, 201, { user: user.toSafeObject(), token });
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated.');
  }

  await logActivity({
    action: user.role === 'admin' ? 'ADMIN_LOGIN' : 'USER_LOGIN',
    collection: 'users',
    recordId: user._id,
    userId: user._id,
    role: user.role,
    description: `${user.role === 'admin' ? 'Admin' : 'User'} logged in: ${user.email}`,
  });

  const token = generateToken(user._id, user.role);
  sendSuccess(res, 200, { user: user.toSafeObject(), token });
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, 200, { user: req.user.toSafeObject() });
});

// @route POST /api/auth/logout (client discards token; we just log the event)
const logout = asyncHandler(async (req, res) => {
  await logActivity({
    action: 'USER_LOGOUT',
    collection: 'users',
    recordId: req.user._id,
    userId: req.user._id,
    role: req.user.role,
    description: `User logged out: ${req.user.email}`,
  });
  sendSuccess(res, 200, { message: 'Logged out' });
});

module.exports = { register, login, getMe, logout };
