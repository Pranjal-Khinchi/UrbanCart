const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { makeSlug } = require('../utils/slug');
const { logActivity } = require('../services/auditService');

// @route GET /api/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  sendSuccess(res, 200, categories);
});

// @route GET /api/categories/:slug
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) throw new ApiError(404, 'Category not found.');
  sendSuccess(res, 200, category);
});

// @route POST /api/categories (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  let slug = makeSlug(name);
  const clash = await Category.findOne({ slug });
  if (clash) throw new ApiError(409, 'A category with this name already exists.');

  const category = await Category.create({ name, slug, description, image });

  await logActivity({
    action: 'CREATE_CATEGORY',
    collection: 'categories',
    recordId: category._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Created category "${category.name}"`,
  });

  sendSuccess(res, 201, category);
});

// @route PUT /api/categories/:id (admin)
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const { name, description, image } = req.body;

  if (name && name !== category.name) {
    const newSlug = makeSlug(name);
    const clash = await Category.findOne({ slug: newSlug, _id: { $ne: category._id } });
    if (clash) throw new ApiError(409, 'A category with this name already exists.');
    category.name = name;
    category.slug = newSlug;
  }

  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;

  await category.save();

  await logActivity({
    action: 'UPDATE_CATEGORY',
    collection: 'categories',
    recordId: category._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Updated category "${category.name}"`,
  });

  sendSuccess(res, 200, category);
});

// @route DELETE /api/categories/:id (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete "${category.name}" — ${productCount} product(s) still reference this category. Reassign or remove them first.`
    );
  }

  await category.deleteOne();

  await logActivity({
    action: 'DELETE_CATEGORY',
    collection: 'categories',
    recordId: category._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Deleted category "${category.name}"`,
  });

  sendSuccess(res, 200, { message: 'Category deleted.' });
});

module.exports = { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory };
