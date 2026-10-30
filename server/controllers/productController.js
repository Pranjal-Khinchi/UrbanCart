const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/apiResponse');
const { makeSlug } = require('../utils/slug');
const { logActivity } = require('../services/auditService');

const SORT_MAP = {
  newest: { createdAt: -1 },
  'price-low': { price: 1 },
  'price-high': { price: -1 },
  rating: { rating: -1 },
  popularity: { reviewCount: -1 },
};

// @route GET /api/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    inStock,
    sort = 'newest',
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isActive: true };

  if (search && String(search).trim()) {
    // Safe: uses Mongo's $text search, not string-concatenated queries.
    query.$text = { $search: String(search).trim() };
  }

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) query.category = cat._id;
    else query.category = null; // no matching category -> no results, no crash
  }

  if (brand) {
    query.brand = { $regex: `^${String(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  if (minRating) {
    query.rating = { $gte: Number(minRating) };
  }

  if (inStock === 'true') {
    query.stock = { $gt: 0 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(48, Math.max(1, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;
  const sortSpec = SORT_MAP[sort] || SORT_MAP.newest;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sortSpec).skip(skip).limit(limitNum).populate('category', 'name slug'),
    Product.countDocuments(query),
  ]);

  sendSuccess(res, 200, products, {
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
    },
  });
});

// @route GET /api/products/featured
const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, featured: true })
    .sort({ createdAt: -1 })
    .limit(8)
    .populate('category', 'name slug');
  sendSuccess(res, 200, products);
});

// @route GET /api/products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true }).populate(
    'category',
    'name slug'
  );
  if (!product) throw new ApiError(404, 'Product not found.');

  const related = await Product.find({
    category: product.category?._id,
    _id: { $ne: product._id },
    isActive: true,
  })
    .limit(4)
    .populate('category', 'name slug');

  sendSuccess(res, 200, { product, related });
});

// @route POST /api/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, originalPrice, category, brand, images, stock, tags, featured, specifications } =
    req.body;

  const categoryDoc = await Category.findById(category);
  if (!categoryDoc) throw new ApiError(400, 'Selected category does not exist.');

  let slug = makeSlug(name);
  const existingSlug = await Product.findOne({ slug });
  if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

  const product = await Product.create({
    name,
    slug,
    description,
    price,
    originalPrice: originalPrice || null,
    category,
    brand,
    images,
    stock,
    tags,
    featured,
    specifications,
  });

  await logActivity({
    action: 'CREATE_PRODUCT',
    collection: 'products',
    recordId: product._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Created product "${product.name}"`,
    metadata: { price: product.price, stock: product.stock },
  });

  sendSuccess(res, 201, product);
});

// @route PUT /api/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  const updatable = [
    'name',
    'description',
    'price',
    'originalPrice',
    'category',
    'brand',
    'images',
    'stock',
    'tags',
    'featured',
    'specifications',
    'isActive',
  ];

  if (req.body.category) {
    const categoryDoc = await Category.findById(req.body.category);
    if (!categoryDoc) throw new ApiError(400, 'Selected category does not exist.');
  }

  if (req.body.name && req.body.name !== product.name) {
    let slug = makeSlug(req.body.name);
    const clash = await Product.findOne({ slug, _id: { $ne: product._id } });
    if (clash) slug = `${slug}-${Date.now().toString(36)}`;
    product.slug = slug;
  }

  updatable.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  await product.save();

  await logActivity({
    action: 'UPDATE_PRODUCT',
    collection: 'products',
    recordId: product._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Updated product "${product.name}"`,
    metadata: { updatedFields: Object.keys(req.body) },
  });

  sendSuccess(res, 200, product);
});

// @route DELETE /api/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found.');

  await product.deleteOne();

  await logActivity({
    action: 'DELETE_PRODUCT',
    collection: 'products',
    recordId: product._id,
    userId: req.user._id,
    role: req.user.role,
    description: `Deleted product "${product.name}"`,
  });

  sendSuccess(res, 200, { message: 'Product deleted.' });
});

// @route GET /api/products/id/:id (admin) — fetch a single product by its
// database id, for admin edit forms (the public route looks up by slug).
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name slug');
  if (!product) throw new ApiError(404, 'Product not found.');
  sendSuccess(res, 200, product);
});

module.exports = {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
