const mongoose = require('mongoose');
const { getPrimaryConnection } = require('../config/db');

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    products: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], default: [] },
  },
  { timestamps: true }
);

module.exports = getPrimaryConnection().model('Wishlist', wishlistSchema);
