const express = require('express');
const {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  updateMyProfile,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.put('/me', protect, updateMyProfile);

router.get('/', protect, adminOnly, getUsers);
router.get('/:id', protect, adminOnly, getUserById);
router.put('/:id/role', protect, adminOnly, updateUserRole);
router.put('/:id/status', protect, adminOnly, updateUserStatus);

module.exports = router;
