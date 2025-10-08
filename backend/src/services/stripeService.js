require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Booking = require('../models/Booking')

/**
 * Stripe Payment Service
 * Handles deposit authorization and payment processing for direct bookings
 */

class StripeService {
  /**
   * Create PaymentIntent for booking deposit (10%)
   * Authorizes card but doesn't charge until host approves
   */
  async createDepositPaymentIntent(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId, {
        include: ['property']
      })

      if (!booking) {
        throw new Error('Booking not found')
      }

      // Convert deposit amount to cents (Stripe uses smallest currency unit)
      const amountInCents = Math.round(parseFloat(booking.depositAmount) * 100)

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'manual', // Don't charge immediately, wait for approval
        description: `Deposit for ${booking.property?.name || 'property'} - ${booking.confirmationCode}`,
        metadata: {
          bookingId: booking.id,
          confirmationCode: booking.confirmationCode,
          propertyId: booking.propertyId,
          guestEmail: booking.guestEmail,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut
        }
      })

      // Store PaymentIntent ID
      await booking.update({
        stripePaymentIntentId: paymentIntent.id
      })

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.depositAmount
      }
    } catch (error) {
      console.error('Error creating deposit PaymentIntent:', error)
      throw error
    }
  }

  /**
   * Capture payment after host approves booking
   * Charges the authorized card
   */
  async captureDeposit(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId)

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (!booking.stripePaymentIntentId) {
        throw new Error('No PaymentIntent found for this booking')
      }

      // Capture the authorized payment
      const paymentIntent = await stripe.paymentIntents.capture(
        booking.stripePaymentIntentId
      )

      // Update booking
      await booking.update({
        depositPaid: true,
        depositPaidAt: new Date(),
        paymentStatus: 'partial',
        bookingStatus: 'confirmed',
        status: 'confirmed'
      })

      return {
        success: true,
        chargeId: paymentIntent.id,
        amount: (paymentIntent.amount / 100).toFixed(2),
        status: paymentIntent.status
      }
    } catch (error) {
      console.error('Error capturing deposit:', error)
      throw error
    }
  }

  /**
   * Cancel PaymentIntent when host declines booking
   * Releases the authorization without charging
   */
  async cancelDeposit(bookingId, reason = 'Booking declined by host') {
    try {
      const booking = await Booking.findByPk(bookingId)

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (!booking.stripePaymentIntentId) {
        throw new Error('No PaymentIntent found for this booking')
      }

      // Cancel the PaymentIntent
      const paymentIntent = await stripe.paymentIntents.cancel(
        booking.stripePaymentIntentId
      )

      // Update booking
      await booking.update({
        bookingStatus: 'declined',
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      })

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        message: 'Authorization released, no charge made'
      }
    } catch (error) {
      console.error('Error canceling deposit:', error)
      throw error
    }
  }

  /**
   * Refund deposit if booking is cancelled after approval
   */
  async refundDeposit(bookingId, reason = 'Booking cancelled') {
    try {
      const booking = await Booking.findByPk(bookingId)

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (!booking.stripePaymentIntentId) {
        throw new Error('No PaymentIntent found for this booking')
      }

      if (!booking.depositPaid) {
        throw new Error('Deposit has not been paid yet')
      }

      // Get the PaymentIntent to find the charge
      const paymentIntent = await stripe.paymentIntents.retrieve(
        booking.stripePaymentIntentId
      )

      if (!paymentIntent.charges.data.length) {
        throw new Error('No charge found for this PaymentIntent')
      }

      // Refund the charge
      const refund = await stripe.refunds.create({
        charge: paymentIntent.charges.data[0].id,
        reason: 'requested_by_customer'
      })

      // Update booking
      await booking.update({
        depositPaid: false,
        depositPaidAt: null,
        paymentStatus: 'refunded',
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason
      })

      return {
        success: true,
        refundId: refund.id,
        amount: (refund.amount / 100).toFixed(2),
        status: refund.status
      }
    } catch (error) {
      console.error('Error refunding deposit:', error)
      throw error
    }
  }

  /**
   * Create payment link for balance payment (90%)
   * Can be sent to guest before arrival
   */
  async createBalancePaymentLink(bookingId) {
    try {
      const booking = await Booking.findByPk(bookingId, {
        include: ['property']
      })

      if (!booking) {
        throw new Error('Booking not found')
      }

      if (booking.balancePaid) {
        throw new Error('Balance has already been paid')
      }

      const amountInCents = Math.round(parseFloat(booking.balanceAmount) * 100)

      // Create a Payment Link
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Balance Payment - ${booking.property?.name || 'Property'}`,
                description: `Remaining balance for booking ${booking.confirmationCode}`,
                images: booking.property?.featuredImage ? [booking.property.featuredImage] : []
              },
              unit_amount: amountInCents
            },
            quantity: 1
          }
        ],
        metadata: {
          bookingId: booking.id,
          confirmationCode: booking.confirmationCode,
          paymentType: 'balance'
        }
      })

      return {
        url: paymentLink.url,
        amount: booking.balanceAmount
      }
    } catch (error) {
      console.error('Error creating balance payment link:', error)
      throw error
    }
  }

  /**
   * Mark balance as paid (for manual payments)
   */
  async markBalancePaid(bookingId, paymentMethod = 'cash') {
    try {
      const booking = await Booking.findByPk(bookingId)

      if (!booking) {
        throw new Error('Booking not found')
      }

      await booking.update({
        balancePaid: true,
        balancePaidAt: new Date(),
        paymentStatus: 'paid'
      })

      return {
        success: true,
        message: `Balance payment recorded (${paymentMethod})`
      }
    } catch (error) {
      console.error('Error marking balance as paid:', error)
      throw error
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          // Payment captured successfully
          console.log('PaymentIntent succeeded:', event.data.object.id)
          break

        case 'payment_intent.payment_failed':
          // Payment failed
          console.log('PaymentIntent failed:', event.data.object.id)
          break

        case 'charge.refunded':
          // Refund completed
          console.log('Charge refunded:', event.data.object.id)
          break

        default:
          console.log('Unhandled webhook event:', event.type)
      }

      return { received: true }
    } catch (error) {
      console.error('Error handling webhook:', error)
      throw error
    }
  }
}

module.exports = new StripeService()
