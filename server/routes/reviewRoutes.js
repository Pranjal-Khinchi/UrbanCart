const express = require('express');
const { updateReview, deleteReview, getAllReviews } = require('../controllers/reviewController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', adminOnly, getAllReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

module.exports = router;
