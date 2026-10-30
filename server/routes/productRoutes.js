const express = require('express');
const {
  getProducts,
  getFeaturedProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { getProductReviews, upsertReview } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { productValidator, reviewValidator } = require('../validators');

const router = express.Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/id/:id', protect, adminOnly, getProductById);
router.get('/:slug', getProductBySlug);

router.post('/', protect, adminOnly, productValidator, validate, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

// Reviews nested under a product, addressed by product id
router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', protect, reviewValidator, validate, upsertReview);

module.exports = router;
