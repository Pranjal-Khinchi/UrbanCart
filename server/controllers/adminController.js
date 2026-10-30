const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { sendSuccess } = require('../utils/apiResponse');

const LOW_STOCK_THRESHOLD = 5;

// @route GET /api/admin/dashboard
// All numbers below are computed live from the PRIMARY database — nothing is hardcoded.
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    revenueAgg,
    totalOrders,
    totalUsers,
    totalProducts,
    lowStockProducts,
    recentOrders,
    recentUsers,
    orderStatusAgg,
  ] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments(),
    User.countDocuments(),
    Product.countDocuments(),
    Product.find({ stock: { $lte: LOW_STOCK_THRESHOLD } })
      .sort({ stock: 1 })
      .limit(10)
      .select('name slug stock images'),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const orderStatusOverview = orderStatusAgg.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  sendSuccess(res, 200, {
    totalRevenue,
    totalOrders,
    totalUsers,
    totalProducts,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
    recentOrders,
    recentUsers,
    orderStatusOverview,
  });
});

module.exports = { getDashboardStats };
