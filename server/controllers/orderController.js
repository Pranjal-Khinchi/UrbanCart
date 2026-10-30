const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/auditService');
const { getPrimaryConnection } = require('../config/db');

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 79;

/**
 * SERVER-SIDE ORDER CALCULATION.
 * The frontend sends only { shippingAddress, paymentMethod }. It never
 * sends prices or totals — those are never trusted from the client.
 * Everything here is computed from the user's current cart against the
 * live PRIMARY database.
 *
 * @route POST /api/orders
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress) throw new ApiError(400, 'Shipping address is required.');
  if (!['COD', 'TEST_PAYMENT'].includes(paymentMethod)) {
    throw new ApiError(400, 'Invalid payment method.');
  }

  const requiredAddressFields = ['fullName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'];
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field] || !String(shippingAddress[field]).trim()) {
      throw new ApiError(400, `Shipping address is missing "${field}".`);
    }
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, 'Your cart is empty.');
  }

  // Re-fetch every product fresh from the PRIMARY database and validate.
  const orderItems = [];
  let subtotal = 0;

  for (const cartItem of cart.items) {
    const product = await Product.findById(cartItem.product?._id || cartItem.product);
    if (!product || !product.isActive) {
      throw new ApiError(400, `A product in your cart is no longer available.`);
    }
    if (cartItem.quantity > product.stock) {
      throw new ApiError(400, `Insufficient stock for "${product.name}". Only ${product.stock} left.`);
    }

    // Prices always come from the current DB record, never the client.
    const linePrice = product.price;
    subtotal += linePrice * cartItem.quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: linePrice,
      quantity: cartItem.quantity,
      image: product.images?.[0] || '',
    });
  }

  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  const discount = 0; // No promo/coupon system in this build; placeholder kept honest at 0.
  const total = Math.round((subtotal + shippingFee - discount) * 100) / 100;

  // Create the order first, then reduce stock. Uses a transaction on the
  // PRIMARY connection where the deployment's MongoDB supports replica sets
  // (Atlas does, by default). Falls back to sequential writes otherwise,
  // so local/standalone MongoDB instances used for testing still work.
  let session = await getPrimaryConnection()
    .startSession()
    .catch(() => null);
  let order;
  let usingTransaction = false;

  try {
    if (session) {
      try {
        session.startTransaction();
        usingTransaction = true;
      } catch (txErr) {
        // Standalone MongoDB (no replica set) — transactions unsupported.
        // Fall back to sequential, non-transactional writes.
        session = null;
      }
    }

    const created = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          shippingAddress,
          subtotal,
          shippingFee,
          discount,
          total,
          paymentMethod,
          paymentStatus: paymentMethod === 'TEST_PAYMENT' ? 'Paid' : 'Pending',
          orderStatus: 'Pending',
        },
      ],
      session ? { session } : {}
    );
    order = created[0];

    for (const item of orderItems) {
      const updateResult = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        session ? { session } : {}
      );
      if (updateResult.matchedCount === 0) {
        throw new ApiError(400, `Insufficient stock for "${item.name}" — please review your cart.`);
      }
    }

    cart.items = [];
    await cart.save(session ? { session } : {});

    if (usingTransaction) await session.commitTransaction();
  } catch (err) {
    if (usingTransaction) await session.abortTransaction();
    throw err;
  } finally {
    if (session) session.endSession();
  }

  await logActivity({
    action: 'CREATE_ORDER',
    collection: 'orders',
    recordId: order._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Order placed — total ₹${total} (${paymentMethod})`,
    metadata: { itemCount: orderItems.length, total },
  });

  sendSuccess(res, 201, order);
});

// @route GET /api/orders (own orders for customers, all orders for admin via ?all=true)
const getOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 10 } = req.query;
  const isAdminRequest = req.user.role === 'admin' && req.query.all === 'true';

  const query = isAdminRequest ? {} : { user: req.user._id };
  if (status) query.orderStatus = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  let ordersQuery = Order.find(query)
    .sort({ createdAt: -1 })
    .skip((pageNum - 1) * limitNum)
    .limit(limitNum);

  if (isAdminRequest) {
    ordersQuery = ordersQuery.populate('user', 'name email');
  }

  let [orders, total] = await Promise.all([ordersQuery, Order.countDocuments(query)]);

  if (isAdminRequest && search) {
    const term = String(search).toLowerCase();
    orders = orders.filter(
      (o) => o.user?.name?.toLowerCase().includes(term) || o.user?.email?.toLowerCase().includes(term)
    );
  }

  sendSuccess(res, 200, orders, {
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
  });
});

// @route GET /api/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) throw new ApiError(404, 'Order not found.');

  const isOwner = order.user._id.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have access to this order.');
  }

  sendSuccess(res, 200, order);
});

// @route PUT /api/orders/:id/status (admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, paymentStatus } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const changes = {};
  if (orderStatus && Order.ORDER_STATUSES.includes(orderStatus)) {
    changes.orderStatus = { from: order.orderStatus, to: orderStatus };
    order.orderStatus = orderStatus;
  }
  if (paymentStatus && Order.PAYMENT_STATUSES.includes(paymentStatus)) {
    changes.paymentStatus = { from: order.paymentStatus, to: paymentStatus };
    order.paymentStatus = paymentStatus;
  }

  if (Object.keys(changes).length === 0) {
    throw new ApiError(400, 'No valid status update provided.');
  }

  await order.save();

  await logActivity({
    action: 'UPDATE_ORDER_STATUS',
    collection: 'orders',
    recordId: order._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Updated order ${order._id} status`,
    metadata: changes,
  });

  sendSuccess(res, 200, order);
});

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };
