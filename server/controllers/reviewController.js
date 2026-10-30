const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { logActivity } = require('../services/auditService');

async function recalculateProductRating(productId) {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const rating = stats[0]?.avgRating || 0;
  const reviewCount = stats[0]?.count || 0;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(rating * 10) / 10,
    reviewCount,
  });
}

// @route GET /api/products/:id/reviews
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id })
    .sort({ createdAt: -1 })
    .populate('user', 'name avatar');
  sendSuccess(res, 200, reviews);
});

// @route POST /api/products/:id/reviews  { rating, comment }
// Creates a new review, or updates the user's existing review for this product.
const upsertReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Product not found.');
  if (!rating || rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');
  if (!comment || !comment.trim()) throw new ApiError(400, 'Review comment is required.');

  let review = await Review.findOne({ product: productId, user: req.user._id });
  let action = 'CREATE_REVIEW';

  if (review) {
    review.rating = rating;
    review.comment = comment;
    await review.save();
    action = 'UPDATE_REVIEW';
  } else {
    review = await Review.create({ product: productId, user: req.user._id, rating, comment });
  }

  await recalculateProductRating(product._id);

  await logActivity({
    action,
    collection: 'reviews',
    recordId: review._id,
    userId: req.user._id,
    role: req.user.role,
    description: `${action === 'CREATE_REVIEW' ? 'Created' : 'Updated'} review for "${product.name}" (${rating}★)`,
  });

  sendSuccess(res, action === 'CREATE_REVIEW' ? 201 : 200, review);
});

// @route PUT /api/reviews/:id
const updateReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only edit your own review.');
  }

  if (rating !== undefined) {
    if (rating < 1 || rating > 5) throw new ApiError(400, 'Rating must be between 1 and 5.');
    review.rating = rating;
  }
  if (comment !== undefined) review.comment = comment;

  await review.save();
  await recalculateProductRating(review.product);

  await logActivity({
    action: 'UPDATE_REVIEW',
    collection: 'reviews',
    recordId: review._id,
    userId: req.user._id,
    role: req.user.role,
    description: 'Updated a product review',
  });

  sendSuccess(res, 200, review);
});

// @route DELETE /api/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new ApiError(403, 'You can only delete your own review.');
  }

  const productId = review.product;
  await review.deleteOne();
  await recalculateProductRating(productId);

  await logActivity({
    action: 'DELETE_REVIEW',
    collection: 'reviews',
    recordId: review._id,
    userId: req.user._id,
    role: req.user.role,
    description: 'Deleted a product review',
  });

  sendSuccess(res, 200, { message: 'Review deleted.' });
});

// @route GET /api/reviews (admin) — list all reviews across all products
const getAllReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [reviews, total] = await Promise.all([
    Review.find()
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate('user', 'name email')
      .populate('product', 'name slug'),
    Review.countDocuments(),
  ]);

  sendSuccess(res, 200, reviews, {
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) || 1 },
  });
});

module.exports = { getProductReviews, getAllReviews, upsertReview, updateReview, deleteReview };
