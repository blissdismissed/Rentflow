const Booking = require('../models/Booking');
const Property = require('../models/Property');
const { Op } = require('sequelize');
const stripeService = require('../services/stripeService');
const emailService = require('../services/emailService');

class BookingController {
  /**
   * Get all bookings for the authenticated user
   */
  async getBookings(req, res) {
    try {
      const { status, propertyId, startDate, endDate, platform } = req.query;

      console.log('📊 Fetching bookings for user:', req.user.id);

      // Build filter conditions for Booking
      const bookingWhere = {};

      if (status) {
        bookingWhere.status = status;
      }

      if (propertyId) {
        bookingWhere.propertyId = propertyId;
      }

      if (platform) {
        bookingWhere.channel = platform;
      }

      // Date range filter
      if (startDate || endDate) {
        bookingWhere.checkIn = {};
        if (startDate) {
          bookingWhere.checkIn[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          bookingWhere.checkIn[Op.lte] = new Date(endDate);
        }
      }

      // Query bookings through Property relationship (user owns properties)
      const bookings = await Booking.findAll({
        where: bookingWhere,
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'city', 'images'],
          where: { userId: req.user.id }, // Filter by user's properties
          required: true // Inner join - only bookings for user's properties
        }],
        order: [['checkIn', 'DESC']]
      });

      console.log(`✅ Found ${bookings.length} bookings`);

      res.json({
        success: true,
        bookings: bookings // Match what dashboard.html expects
      });
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch bookings',
        error: error.message
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
        where: { id },
        include: [{
          model: Property,
          as: 'property',
          attributes: ['id', 'name', 'address', 'city', 'state', 'images', 'basePrice'],
          where: { userId: req.user.id }, // Ensure booking is for user's property
          required: true
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
      console.error('❌ Error fetching booking:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking',
        error: error.message
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
        channel: 'direct',
        nights,
        baseAmount: totalAmount, // Simplified - you may want to break this down
        cleaningFee: 0,
        depositAmount: (totalAmount * 0.1).toFixed(2),
        balanceAmount: (totalAmount * 0.9).toFixed(2)
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
        where: { id },
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user.id },
          required: true
        }]
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
        where: { id },
        include: [{
          model: Property,
          as: 'property',
          where: { userId: req.user.id },
          required: true
        }]
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
      let paymentSuccess = false;
      let captureResult = null;
      try {
        captureResult = await stripeService.captureDeposit(booking.id);
        paymentSuccess = true;
      } catch (stripeError) {
        // If Stripe fails, still approve but flag payment issue
        await booking.update({
          bookingStatus: 'approved',
          status: 'confirmed'
        });
        console.error('Payment capture failed:', stripeError);
      }

      // Reload booking to get updated data
      const updatedBooking = await Booking.findByPk(booking.id, {
        include: [{
          model: Property,
          as: 'property'
        }]
      });

      // Send confirmation email to guest
      try {
        await emailService.sendBookingApprovalToGuest(updatedBooking, updatedBooking.property);
      } catch (emailError) {
        console.error('Failed to send approval email to guest:', emailError);
        // Continue - don't fail the approval if email fails
      }

      res.json({
        success: true,
        message: paymentSuccess
          ? 'Booking approved and deposit charged successfully'
          : 'Booking approved but payment capture failed. Please collect manually.',
        data: {
          booking: updatedBooking,
          payment: captureResult
        }
      });
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

      // Send decline email to guest
      try {
        await emailService.sendBookingDeclineToGuest(booking, booking.property, reason);
      } catch (emailError) {
        console.error('Failed to send decline email to guest:', emailError);
        // Continue - don't fail the decline if email fails
      }

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

      console.log('📊 Fetching booking stats for user:', req.user.id);

      // Build booking filter conditions
      const bookingWhere = {};

      // Date range filter
      if (startDate || endDate) {
        bookingWhere.checkIn = {};
        if (startDate) {
          bookingWhere.checkIn[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          bookingWhere.checkIn[Op.lte] = new Date(endDate);
        }
      }

      // Include condition to filter by user's properties
      const includeProperty = {
        model: Property,
        as: 'property',
        attributes: [],
        where: { userId: req.user.id },
        required: true
      };

      const [totalBookings, confirmedBookings, cancelledBookings, totalRevenue] = await Promise.all([
        Booking.count({
          where: bookingWhere,
          include: [includeProperty]
        }),
        Booking.count({
          where: { ...bookingWhere, status: 'confirmed' },
          include: [includeProperty]
        }),
        Booking.count({
          where: { ...bookingWhere, status: 'cancelled' },
          include: [includeProperty]
        }),
        Booking.sum('totalAmount', {
          where: { ...bookingWhere, status: { [Op.notIn]: ['cancelled'] } },
          include: [includeProperty]
        })
      ]);

      // Platform breakdown
      const platformStats = await Booking.findAll({
        where: bookingWhere,
        attributes: [
          'channel',
          [Booking.sequelize.fn('COUNT', Booking.sequelize.col('Booking.id')), 'count'],
          [Booking.sequelize.fn('SUM', Booking.sequelize.col('totalAmount')), 'revenue']
        ],
        include: [{
          model: Property,
          as: 'property',
          attributes: [],
          where: { userId: req.user.id },
          required: true
        }],
        group: ['channel'],
        raw: true
      });

      console.log(`✅ Stats: ${totalBookings} total bookings, ${confirmedBookings} confirmed`);

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
      console.error('❌ Error fetching booking stats:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch booking statistics',
        error: error.message
      });
    }
  }
}

module.exports = new BookingController();
