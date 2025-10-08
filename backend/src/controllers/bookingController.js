const Booking = require('../models/Booking');
const Property = require('../models/Property');
const { Op } = require('sequelize');
const stripeService = require('../services/stripeService');

class BookingController {
  /**
   * Get all bookings for the authenticated user
   */
  async getBookings(req, res) {
    try {
      const { status, propertyId, startDate, endDate, platform } = req.query;

      // Build filter conditions
      const where = { userId: req.user.id };

      if (status) {
        where.status = status;
      }

      if (propertyId) {
        where.propertyId = propertyId;
      }

      if (platform) {
        where.platform = platform;
      }

      // Date range filter
      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.checkIn[Op.lte] = new Date(endDate);
        }
      }

      const bookings = await Booking.findAll({
        where,
        include: [{
          model: Property,
          attributes: ['id', 'name', 'address', 'city', 'images']
        }],
        order: [['checkIn', 'DESC']]
      });

      res.json({
        success: true,
        data: bookings
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings'
      });
    }
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(req, res) {
    try {
      const { id } = req.params;

      const booking = await Booking.findOne({
        where: {
          id,
          userId: req.user.id
        },
        include: [{
          model: Property,
          attributes: ['id', 'name', 'address', 'city', 'state', 'images', 'basePrice']
        }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      res.json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Error fetching booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking'
      });
    }
  }

  /**
   * Create a new direct booking
   */
  async createBooking(req, res) {
    try {
      const {
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        numberOfGuests,
        totalAmount,
        specialRequests
      } = req.body;

      // Verify property belongs to user
      const property = await Property.findOne({
        where: {
          id: propertyId,
          userId: req.user.id
        }
      });

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }

      // Check for booking conflicts
      const conflict = await Booking.findOne({
        where: {
          propertyId,
          status: { [Op.notIn]: ['cancelled'] },
          [Op.or]: [
            {
              checkIn: { [Op.between]: [checkIn, checkOut] }
            },
            {
              checkOut: { [Op.between]: [checkIn, checkOut] }
            },
            {
              [Op.and]: [
                { checkIn: { [Op.lte]: checkIn } },
                { checkOut: { [Op.gte]: checkOut } }
              ]
            }
          ]
        }
      });

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: 'Property is already booked for these dates'
        });
      }

      // Generate confirmation code
      const confirmationCode = `RFD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Calculate nights
      const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));

      const booking = await Booking.create({
        userId: req.user.id,
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut,
        numberOfGuests,
        totalAmount,
        specialRequests,
        confirmationCode,
        status: 'confirmed',
        paymentStatus: 'pending',
        platform: 'direct',
        metadata: {
          nights,
          createdBy: 'dashboard',
          bookingSource: 'direct'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error.message
      });
    }
  }

  /**
   * Update a booking
   */
  async updateBooking(req, res) {
    try {
      const { id } = req.params;
      const {
        guestName,
        guestEmail,
        guestPhone,
        numberOfGuests,
        totalAmount,
        status,
        paymentStatus,
        specialRequests
      } = req.body;

      const booking = await Booking.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      // Don't allow updating synced bookings from external platforms
      if (booking.platform && booking.platform !== 'direct') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify bookings synced from external platforms. Update them on the original platform.'
        });
      }

      const updateData = {};
      if (guestName) updateData.guestName = guestName;
      if (guestEmail) updateData.guestEmail = guestEmail;
      if (guestPhone) updateData.guestPhone = guestPhone;
      if (numberOfGuests) updateData.numberOfGuests = numberOfGuests;
      if (totalAmount) updateData.totalAmount = totalAmount;
      if (status) updateData.status = status;
      if (paymentStatus) updateData.paymentStatus = paymentStatus;
      if (specialRequests !== undefined) updateData.specialRequests = specialRequests;

      // If cancelling, set cancellation timestamp
      if (status === 'cancelled' && booking.status !== 'cancelled') {
        updateData.cancelledAt = new Date();
      }

      await booking.update(updateData);

      res.json({
        success: true,
        message: 'Booking updated successfully',
        data: booking
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update booking'
      });
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(req, res) {
    try {
      const { id } = req.params;
      const { cancellationReason } = req.body;

      const booking = await Booking.findOne({
        where: {
          id,
          userId: req.user.id
        }
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }

      // Don't allow cancelling external platform bookings
      if (booking.platform && booking.platform !== 'direct') {
        return res.status(400).json({
          success: false,
          message: 'Please cancel this booking on the original platform (Airbnb, VRBO, etc.)'
        });
      }

      await booking.update({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: cancellationReason || 'Cancelled by host'
      });

      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking
      });
    } catch (error) {
      console.error('Error cancelling booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel booking'
      });
    }
  }

  /**
   * Approve booking request (host action)
   */
  async approveBooking(req, res) {
    try {
      const { id } = req.params;

      // Find booking for the user's property
      const booking = await Booking.findOne({
        where: { id },
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user.id }
        }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.bookingStatus !== 'requested') {
        return res.status(400).json({
          success: false,
          message: `Booking is already ${booking.bookingStatus}`
        });
      }

      // Capture deposit via Stripe
      try {
        const captureResult = await stripeService.captureDeposit(booking.id);

        res.json({
          success: true,
          message: 'Booking approved and deposit charged successfully',
          data: {
            booking: await Booking.findByPk(booking.id),
            payment: captureResult
          }
        });
      } catch (stripeError) {
        // If Stripe fails, still approve but flag payment issue
        await booking.update({
          bookingStatus: 'approved',
          status: 'confirmed'
        });

        res.json({
          success: true,
          message: 'Booking approved but payment capture failed. Please collect manually.',
          data: {
            booking,
            paymentError: stripeError.message
          }
        });
      }

      // TODO: Send confirmation email to guest
    } catch (error) {
      console.error('Error approving booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve booking',
        error: error.message
      });
    }
  }

  /**
   * Decline booking request (host action)
   */
  async declineBooking(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Find booking for the user's property
      const booking = await Booking.findOne({
        where: { id },
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user.id }
        }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      if (booking.bookingStatus !== 'requested') {
        return res.status(400).json({
          success: false,
          message: `Booking is already ${booking.bookingStatus}`
        });
      }

      // Cancel Stripe PaymentIntent (release authorization)
      try {
        await stripeService.cancelDeposit(booking.id, reason);
      } catch (stripeError) {
        console.error('Stripe cancellation error:', stripeError);
        // Continue even if Stripe fails
      }

      // Update booking with host message
      await booking.update({
        hostMessage: reason || 'Booking request declined'
      });

      // TODO: Send decline email to guest

      res.json({
        success: true,
        message: 'Booking declined successfully',
        data: booking
      });
    } catch (error) {
      console.error('Error declining booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to decline booking',
        error: error.message
      });
    }
  }

  /**
   * Mark balance as paid (host action)
   */
  async markBalancePaid(req, res) {
    try {
      const { id } = req.params;
      const { paymentMethod } = req.body;

      const booking = await Booking.findOne({
        where: { id },
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user.id }
        }]
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }

      const result = await stripeService.markBalancePaid(booking.id, paymentMethod);

      res.json({
        success: true,
        message: 'Balance payment recorded successfully',
        data: await Booking.findByPk(booking.id)
      });
    } catch (error) {
      console.error('Error marking balance paid:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record balance payment',
        error: error.message
      });
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const where = { userId: req.user.id };

      // Date range filter
      if (startDate || endDate) {
        where.checkIn = {};
        if (startDate) {
          where.checkIn[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          where.checkIn[Op.lte] = new Date(endDate);
        }
      }

      const [totalBookings, confirmedBookings, cancelledBookings, totalRevenue] = await Promise.all([
        Booking.count({ where }),
        Booking.count({ where: { ...where, status: 'confirmed' } }),
        Booking.count({ where: { ...where, status: 'cancelled' } }),
        Booking.sum('totalAmount', { where: { ...where, status: { [Op.notIn]: ['cancelled'] } } })
      ]);

      // Platform breakdown
      const platformStats = await Booking.findAll({
        where,
        attributes: [
          'platform',
          [Booking.sequelize.fn('COUNT', Booking.sequelize.col('id')), 'count'],
          [Booking.sequelize.fn('SUM', Booking.sequelize.col('totalAmount')), 'revenue']
        ],
        group: ['platform']
      });

      res.json({
        success: true,
        data: {
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          totalRevenue: totalRevenue || 0,
          platformBreakdown: platformStats
        }
      });
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking statistics'
      });
    }
  }
}

module.exports = new BookingController();
