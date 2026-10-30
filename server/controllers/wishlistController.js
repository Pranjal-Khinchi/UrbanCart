const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const { getOrCreateCart } = require('./cartController');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/auditService');

async function getOrCreateWishlist(userId) {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
}

// @route GET /api/wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.populate('products', 'name slug price originalPrice images stock rating');
  sendSuccess(res, 200, wishlist);
});

// @route POST /api/wishlist  { productId }
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');

  const wishlist = await getOrCreateWishlist(req.user._id);
  if (!wishlist.products.some((p) => p.toString() === productId)) {
    wishlist.products.push(productId);
    await wishlist.save();

    await logActivity({
      action: 'WISHLIST_ADD',
      collection: 'wishlists',
      recordId: wishlist._id,
      userId: req.user._id,
      role: req.user.role,
      description: `Added "${product.name}" to wishlist`,
    });
  }

  await wishlist.populate('products', 'name slug price originalPrice images stock rating');
  sendSuccess(res, 200, wishlist);
});

// @route DELETE /api/wishlist/:productId
const removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
  await wishlist.save();
  await wishlist.populate('products', 'name slug price originalPrice images stock rating');

  await logActivity({
    action: 'WISHLIST_REMOVE',
    collection: 'wishlists',
    recordId: wishlist._id,
    userId: req.user._id,
    role: req.user.role,
    description: 'Removed a product from wishlist',
  });

  sendSuccess(res, 200, wishlist);
});

// @route POST /api/wishlist/:productId/move-to-cart
const moveToCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw new ApiError(404, 'Product not found.');
  if (product.stock < 1) throw new ApiError(400, `"${product.name}" is out of stock.`);

  const wishlist = await getOrCreateWishlist(req.user._id);
  const cart = await getOrCreateCart(req.user._id);

  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (existingItem) {
    if (existingItem.quantity + 1 > product.stock) {
      throw new ApiError(400, `Only ${product.stock} unit(s) of "${product.name}" available.`);
    }
    existingItem.quantity += 1;
  } else {
    cart.items.push({ product: productId, quantity: 1 });
  }
  await cart.save();

  wishlist.products = wishlist.products.filter((p) => p.toString() !== productId);
  await wishlist.save();
  await wishlist.populate('products', 'name slug price originalPrice images stock rating');

  await logActivity({
    action: 'WISHLIST_REMOVE',
    collection: 'wishlists',
    recordId: wishlist._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Moved "${product.name}" from wishlist to cart`,
  });

  sendSuccess(res, 200, { wishlist, cart });
});

module.exports = { getWishlist, addToWishlist, removeFromWishlist, moveToCart };
