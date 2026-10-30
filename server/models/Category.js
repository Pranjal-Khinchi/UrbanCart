const mongoose = require('mongoose');
const { getPrimaryConnection } = require('../config/db');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Category name is required'], trim: true, unique: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: '', trim: true },
    image: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = getPrimaryConnection().model('Category', categorySchema);
