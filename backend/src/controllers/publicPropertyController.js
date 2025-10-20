const Property = require('../models/Property')
const Booking = require('../models/Booking')
const { Op } = require('sequelize')

/**
 * Public Property Controller
 * Handles guest-facing property browsing and availability checking
 * No authentication required
 */

class PublicPropertyController {
  /**
   * Get all publicly visible properties
   * GET /api/public/properties
   */
  async getPublicProperties(req, res) {
    try {
      const { city, minPrice, maxPrice, bedrooms, maxGuests } = req.query

      const filters = {
        publiclyVisible: true,
        isActive: true,
        status: 'active'
      }

      // Apply optional filters
      if (city) {
        filters.city = { [Op.iLike]: `%${city}%` }
      }
      if (bedrooms) {
        filters.bedrooms = { [Op.gte]: parseInt(bedrooms) }
      }
      if (maxGuests) {
        filters.maxGuests = { [Op.gte]: parseInt(maxGuests) }
      }
      if (minPrice || maxPrice) {
        filters.basePrice = {}
        if (minPrice) filters.basePrice[Op.gte] = parseFloat(minPrice)
        if (maxPrice) filters.basePrice[Op.lte] = parseFloat(maxPrice)
      }

      const properties = await Property.findAll({
        where: filters,
        attributes: [
          'id',
          'slug',
          'name',
          'type',
          'description',
          'city',
          'state',
          'country',
          'bedrooms',
          'bathrooms',
          'maxGuests',
          'basePrice',
          'cleaningFee',
          'featuredImage',
          'images',
          'amenities',
          'minNights',
          'maxNights',
          'cancellationPolicy'
        ],
        order: [['createdAt', 'DESC']]
      })

      res.json({
        success: true,
        count: properties.length,
        properties
      })
    } catch (error) {
      console.error('Error fetching public properties:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch properties',
        error: error.message
      })
    }
  }

  /**
   * Get property details by slug
   * GET /api/public/properties/:slug
   */
  async getPropertyBySlug(req, res) {
    try {
      const { slug } = req.params

      const property = await Property.findOne({
        where: {
          slug,
          publiclyVisible: true,
          isActive: true,
          status: 'active'
        }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or not available for booking'
        })
      }

      // Get upcoming bookings for calendar display (next 6 months)
      const today = new Date()
      const sixMonthsLater = new Date()
      sixMonthsLater.setMonth(today.getMonth() + 6)

      const bookings = await Booking.findAll({
        where: {
          propertyId: property.id,
          bookingStatus: { [Op.in]: ['confirmed', 'approved'] },
          checkOut: { [Op.gte]: today },
          checkIn: { [Op.lte]: sixMonthsLater }
        },
        attributes: ['checkIn', 'checkOut'],
        order: [['checkIn', 'ASC']]
      })

      // Create array of booked date ranges
      const bookedDates = bookings.map(booking => ({
        start: booking.checkIn,
        end: booking.checkOut
      }))

      res.json({
        success: true,
        property: {
          ...property.toJSON(),
          bookedDates
        }
      })
    } catch (error) {
      console.error('Error fetching property by slug:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to fetch property details',
        error: error.message
      })
    }
  }

  /**
   * Check availability and calculate pricing
   * GET /api/public/properties/:slug/availability?checkIn=2025-03-15&checkOut=2025-03-20
   */
  async checkAvailability(req, res) {
    try {
      const { slug } = req.params
      const { checkIn, checkOut } = req.query

      if (!checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Check-in and check-out dates are required'
        })
      }

      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Validation
      if (checkInDate < today) {
        return res.status(400).json({
          success: false,
          message: 'Check-in date cannot be in the past'
        })
      }

      if (checkOutDate <= checkInDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        })
      }

      // Get property
      const property = await Property.findOne({
        where: {
          slug,
          publiclyVisible: true,
          isActive: true,
          status: 'active'
        }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        })
      }

      // Calculate nights
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))

      // Check min/max nights
      if (nights < property.minNights) {
        return res.status(400).json({
          success: false,
          message: `Minimum stay is ${property.minNights} night(s)`
        })
      }

      if (nights > property.maxNights) {
        return res.status(400).json({
          success: false,
          message: `Maximum stay is ${property.maxNights} night(s)`
        })
      }

      // Check for conflicting bookings
      // Use bookingStatus for workflow states (requested, approved, confirmed, etc.)
      // Proper overlap detection: two date ranges overlap if:
      // (StartA < EndB) AND (EndA > StartB)
      const conflictingBooking = await Booking.findOne({
        where: {
          propertyId: property.id,
          bookingStatus: { [Op.in]: ['requested', 'approved', 'confirmed'] },
          [Op.and]: [
            { checkIn: { [Op.lt]: checkOutDate } },  // Existing booking starts before new checkout
            { checkOut: { [Op.gt]: checkInDate } }   // Existing booking ends after new checkin
          ]
        }
      })

      console.log('🔍 Checking availability for:', {
        propertyId: property.id,
        requestedCheckIn: checkInDate,
        requestedCheckOut: checkOutDate,
        conflictFound: !!conflictingBooking
      })

      if (conflictingBooking) {
        console.log('❌ Conflict found:', {
          existingCheckIn: conflictingBooking.checkIn,
          existingCheckOut: conflictingBooking.checkOut,
          existingStatus: conflictingBooking.bookingStatus
        })
      }

      if (conflictingBooking) {
        return res.status(409).json({
          success: false,
          available: false,
          message: 'Property is not available for selected dates'
        })
      }

      // Calculate pricing
      const baseAmount = parseFloat(property.basePrice) * nights
      const cleaningFee = parseFloat(property.cleaningFee) || 0
      const subtotal = baseAmount + cleaningFee
      const depositAmount = (subtotal * 0.10).toFixed(2) // 10% deposit
      const balanceAmount = (subtotal * 0.90).toFixed(2) // 90% balance

      res.json({
        success: true,
        available: true,
        pricing: {
          nights,
          pricePerNight: parseFloat(property.basePrice),
          baseAmount: baseAmount.toFixed(2),
          cleaningFee: cleaningFee.toFixed(2),
          subtotal: subtotal.toFixed(2),
          depositAmount, // Due now (10%)
          balanceAmount, // Due at check-in (90%)
          currency: 'USD'
        }
      })
    } catch (error) {
      console.error('❌ Error checking availability:', error)
      console.error('Error stack:', error.stack)
      res.status(500).json({
        success: false,
        message: 'Failed to check availability',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}

module.exports = new PublicPropertyController()
