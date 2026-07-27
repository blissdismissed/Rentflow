const express = require('express');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Public routes (no auth required)
router.get('/properties/:propertyId/reviews', reviewController.getPropertyReviews);
router.post('/properties/:propertyId/reviews', reviewController.createReview);
router.post('/reviews/:reviewId/helpful', reviewController.markHelpful);

// Protected routes (authentication required)
router.get('/reviews', authenticate, reviewController.getOwnerReviews);
router.put('/reviews/:reviewId', authenticate, reviewController.updateReview);
router.post('/properties/:propertyId/reviews/import', authenticate, reviewController.importExternalReview);

module.exports = router;
