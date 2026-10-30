const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/auditService');

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function populateCart(cart) {
  return cart.populate('items.product', 'name slug price originalPrice images stock isActive');
}

// @route GET /api/cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await populateCart(cart);
  sendSuccess(res, 200, cart);
});

// @route POST /api/cart  { productId, quantity }
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) throw new ApiError(400, 'productId is required.');
  if (quantity < 1) throw new ApiError(400, 'Quantity must be at least 1.');

  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found.');

  const cart = await getOrCreateCart(req.user._id);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  const desiredQty = (existingItem ? existingItem.quantity : 0) + Number(quantity);

  if (desiredQty > product.stock) {
    throw new ApiError(400, `Only ${product.stock} unit(s) of "${product.name}" available in stock.`);
  }

  if (existingItem) {
    existingItem.quantity = desiredQty;
  } else {
    cart.items.push({ product: productId, quantity: Number(quantity) });
  }

  await cart.save();
  await populateCart(cart);

  await logActivity({
    action: 'CART_ADD',
    collection: 'carts',
    recordId: cart._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Added "${product.name}" x${quantity} to cart`,
  });

  sendSuccess(res, 200, cart);
});

// @route PUT /api/cart/:itemId  { quantity }
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) throw new ApiError(400, 'Quantity must be at least 1.');

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found.');

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  const product = await Product.findById(item.product);
  if (!product) throw new ApiError(404, 'Product no longer exists.');
  if (quantity > product.stock) {
    throw new ApiError(400, `Only ${product.stock} unit(s) of "${product.name}" available in stock.`);
  }

  item.quantity = Number(quantity);
  await cart.save();
  await populateCart(cart);

  await logActivity({
    action: 'CART_UPDATE',
    collection: 'carts',
    recordId: cart._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Updated cart item quantity to ${quantity} for "${product.name}"`,
  });

  sendSuccess(res, 200, cart);
});

// @route DELETE /api/cart/:itemId
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new ApiError(404, 'Cart not found.');

  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  item.deleteOne();
  await cart.save();
  await populateCart(cart);

  await logActivity({
    action: 'CART_REMOVE',
    collection: 'carts',
    recordId: cart._id,
    userId: req.user._id,
    role: req.user.role,
    description: 'Removed an item from cart',
  });

  sendSuccess(res, 200, cart);
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem, getOrCreateCart };
