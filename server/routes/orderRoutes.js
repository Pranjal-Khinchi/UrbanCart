const express = require('express');
const { createOrder, getOrders, getOrderById, updateOrderStatus } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { orderValidator } = require('../validators');

const router = express.Router();

router.use(protect);
router.post('/', orderValidator, validate, createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/status', adminOnly, updateOrderStatus);

module.exports = router;
