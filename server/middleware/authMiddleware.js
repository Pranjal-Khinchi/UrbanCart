const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the JWT sent in the Authorization header (Bearer token) and
 * attaches the authenticated user to req.user. Backend verification is
 * the real gate — frontend route protection is only a UX convenience.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Account not found or has been deactivated.');
  }

  req.user = user;
  next();
});

/**
 * Must run AFTER protect(). Verifies the authenticated user has the
 * admin role. This is enforced server-side regardless of what the
 * frontend UI shows or hides.
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required.');
  }
  next();
};

module.exports = { protect, adminOnly };
