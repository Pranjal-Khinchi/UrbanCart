const mongoose = require('mongoose');
const { getPrimaryConnection } = require('../config/db');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// One review per user per product (re-saving updates the existing review instead).
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = getPrimaryConnection().model('Review', reviewSchema);
