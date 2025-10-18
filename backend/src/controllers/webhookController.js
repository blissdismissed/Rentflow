const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Property = require('../models/Property');
const emailService = require('../services/emailService');

/**
 * Webhook Controller
 * Handles webhooks from external services (Stripe, etc.)
 */
class WebhookController {
  /**
   * Handle Stripe webhooks
   * POST /api/webhooks/stripe
   */
  async handleStripeWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object);
          break;

        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;

        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  /**
   * Handle successful payment intent
   */
  async handlePaymentIntentSucceeded(paymentIntent) {
    console.log('PaymentIntent succeeded:', paymentIntent.id);

    // Find booking by Stripe PaymentIntent ID
    const booking = await Booking.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: [{
        model: Property,
        as: 'property'
      }]
    });

    if (!booking) {
      console.log('No booking found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Update booking payment status
    await booking.update({
      depositPaid: true,
      depositPaidAt: new Date(),
      paymentStatus: 'partial'
    });

    console.log(`Deposit payment confirmed for booking ${booking.confirmationCode}`);
  }

  /**
   * Handle failed payment intent
   */
  async handlePaymentIntentFailed(paymentIntent) {
    console.log('PaymentIntent failed:', paymentIntent.id);

    const booking = await Booking.findOne({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: [{
        model: Property,
        as: 'property'
      }]
    });

    if (!booking) {
      console.log('No booking found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Log the failure but don't cancel the booking automatically
    // The host should be notified to handle manually
    console.log(`Payment failed for booking ${booking.confirmationCode}`);

    // Could send an email notification to host about payment failure
    // await emailService.sendPaymentFailureNotification(booking, booking.property);
  }

  /**
   * Handle canceled payment intent
   */
  async handlePaymentIntentCanceled(paymentIntent) {
    console.log('PaymentIntent canceled:', paymentIntent.id);

    const booking = await Booking.findOne({
      where: { stripePaymentIntentId: paymentIntent.id }
    });

    if (!booking) {
      console.log('No booking found for PaymentIntent:', paymentIntent.id);
      return;
    }

    // Payment authorization was released
    console.log(`Payment authorization released for booking ${booking.confirmationCode}`);
  }

  /**
   * Handle refunded charge
   */
  async handleChargeRefunded(charge) {
    console.log('Charge refunded:', charge.id);

    // Find the payment intent associated with this charge
    const booking = await Booking.findOne({
      where: { stripePaymentIntentId: charge.payment_intent },
      include: [{
        model: Property,
        as: 'property'
      }]
    });

    if (!booking) {
      console.log('No booking found for charge:', charge.id);
      return;
    }

    // Update booking to reflect refund
    await booking.update({
      depositPaid: false,
      paymentStatus: 'refunded',
      status: 'cancelled'
    });

    console.log(`Refund processed for booking ${booking.confirmationCode}`);

    // Could send refund confirmation email to guest
    // await emailService.sendRefundConfirmation(booking, booking.property);
  }

  /**
   * Handle successful charge
   */
  async handleChargeSucceeded(charge) {
    console.log('Charge succeeded:', charge.id);

    const booking = await Booking.findOne({
      where: { stripePaymentIntentId: charge.payment_intent },
      include: [{
        model: Property,
        as: 'property'
      }]
    });

    if (!booking) {
      console.log('No booking found for charge:', charge.id);
      return;
    }

    // Ensure deposit is marked as paid
    if (!booking.depositPaid) {
      await booking.update({
        depositPaid: true,
        depositPaidAt: new Date(),
        paymentStatus: 'partial'
      });
    }

    console.log(`Charge confirmed for booking ${booking.confirmationCode}`);
  }
}

module.exports = new WebhookController();
