const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

/**
 * Webhook Routes
 * Important: Stripe webhooks require raw body, so we need special middleware
 */

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handle Stripe webhooks
 * @access  Public (verified by Stripe signature)
 */
router.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

module.exports = router;
