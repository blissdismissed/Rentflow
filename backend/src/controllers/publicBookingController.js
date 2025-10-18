const Booking = require('../models/Booking')
const Property = require('../models/Property')
const User = require('../models/User')
const { Op } = require('sequelize')
const crypto = require('crypto')
const stripeService = require('../services/stripeService')
const emailService = require('../services/emailService')

/**
 * Public Booking Controller
 * Handles guest booking requests (no authentication required)
 */

class PublicBookingController {
  /**
   * Create a booking request
   * POST /api/public/bookings/request
   */
  async createBookingRequest(req, res) {
    try {
      const {
        propertyId,
        checkIn,
        checkOut,
        guestName,
        guestEmail,
        guestPhone,
        numberOfGuests,
        guestMessage
      } = req.body

      // Validation
      if (!propertyId || !checkIn || !checkOut || !guestName || !guestEmail) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        })
      }

      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)

      // Get property
      const property = await Property.findOne({
        where: {
          id: propertyId,
          publiclyVisible: true,
          isActive: true,
          status: 'active'
        }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or not available'
        })
      }

      // Calculate nights
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))

      // Check for conflicts using bookingStatus (not status)
      const conflictingBooking = await Booking.findOne({
        where: {
          propertyId: property.id,
          bookingStatus: { [Op.in]: ['confirmed', 'requested', 'approved'] },
          [Op.or]: [
            {
              checkIn: {
                [Op.between]: [checkInDate, checkOutDate]
              }
            },
            {
              checkOut: {
                [Op.between]: [checkInDate, checkOutDate]
              }
            },
            {
              [Op.and]: [
                { checkIn: { [Op.lte]: checkInDate } },
                { checkOut: { [Op.gte]: checkOutDate } }
              ]
            }
          ]
        }
      })

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          message: 'Property is not available for selected dates'
        })
      }

      // Calculate pricing
      const baseAmount = parseFloat(property.basePrice) * nights
      const cleaningFee = parseFloat(property.cleaningFee) || 0
      const totalAmount = baseAmount + cleaningFee
      const depositAmount = (totalAmount * 0.10).toFixed(2)
      const balanceAmount = (totalAmount * 0.90).toFixed(2)

      // Generate confirmation code
      const confirmationCode = 'RFD-' + crypto.randomBytes(4).toString('hex').toUpperCase()

      // Create booking with status 'requested'
      const booking = await Booking.create({
        propertyId,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        numberOfGuests: numberOfGuests || 1,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        nights,
        baseAmount: baseAmount.toFixed(2),
        cleaningFee: cleaningFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        depositAmount,
        balanceAmount,
        channel: 'direct',
        status: 'pending',
        bookingStatus: 'requested',
        paymentStatus: 'pending',
        confirmationCode,
        guestMessage: guestMessage || null
      })

      // Create Stripe PaymentIntent for deposit
      let stripeClientSecret = null
      try {
        const paymentIntent = await stripeService.createDepositPaymentIntent(booking.id)
        stripeClientSecret = paymentIntent.clientSecret
      } catch (stripeError) {
        console.error('Stripe PaymentIntent creation failed:', stripeError)
        // Continue without Stripe - host can still approve manually
      }

      // Send email notification to host
      try {
        const host = await User.findByPk(property.userId)
        if (host && host.email) {
          await emailService.sendBookingRequestToHost(booking, property, host)
        }
      } catch (emailError) {
        console.error('Failed to send email to host:', emailError)
        // Continue - don't fail the booking if email fails
      }

      res.status(201).json({
        success: true,
        message: 'Booking request submitted successfully',
        booking: {
          id: booking.id,
          confirmationCode: booking.confirmationCode,
          propertyName: property.name,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
          totalAmount: booking.totalAmount,
          depositAmount: booking.depositAmount,
          balanceAmount: booking.balanceAmount,
          status: booking.bookingStatus
        },
        payment: stripeClientSecret ? {
          clientSecret: stripeClientSecret,
          depositAmount,
          message: 'Please provide payment information. Your card will be authorized but not charged until the host approves your request.'
        } : null,
        nextSteps: {
          message: 'Your booking request has been submitted. The host will review and respond within 24 hours.',
          depositDue: depositAmount,
          paymentRequired: !!stripeClientSecret
        }
      })
    } catch (error) {
      console.error('Error creating booking request:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to create booking request',
        error: error.message
      })
    }
  }

  /**
   * Get booking by confirmation code (for guest to check status)
   * GET /api/public/bookings/:confirmationCode
   */
  async getBookingByConfirmationCode(req, res) {
    try {
      const { confirmationCode } = req.params

      const booking = await Booking.findOne({
        where: { confirmationCode },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['name', 'city', 'state', 'featuredImage', 'address']
          }
        ]
      })

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        })
      }

      res.json({
        success: true,
        booking: {
          confirmationCode: booking.confirmationCode,
          propertyName: booking.property?.name,
          propertyLocation: `${booking.property?.city}, ${booking.property?.state}`,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
          guestName: booking.guestName,
          numberOfGuests: booking.numberOfGuests,
          totalAmount: booking.totalAmount,
          depositAmount: booking.depositAmount,
          depositPaid: booking.depositPaid,
          balanceAmount: booking.balanceAmount,
          balancePaid: booking.balancePaid,
          status: booking.bookingStatus,
          hostMessage: booking.hostMessage
        }
      })
    } catch (error) {
      console.error('Error fetching booking:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking details',
        error: error.message
      })
    }
  }
}

module.exports = new PublicBookingController()
