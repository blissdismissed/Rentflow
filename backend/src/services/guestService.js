const { Guest, GuestStay, Booking } = require('../models')
const { Op } = require('sequelize')

/**
 * Guest Service
 * Helper functions for managing guest records
 */
class GuestService {
  /**
   * Record a guest stay from a completed booking
   * Call this when a booking is completed (checked out)
   * @param {Object} booking - Completed booking object
   */
  async recordGuestStay(booking) {
    try {
      console.log(`Recording guest stay for booking ${booking.id}`)

      // Find or create guest
      let guest = await Guest.findOne({
        where: { email: booking.guestEmail }
      })

      if (!guest) {
        // Create new guest record
        guest = await Guest.create({
          email: booking.guestEmail,
          name: booking.guestName,
          phoneNumber: booking.guestPhone,
          totalStays: 0,
          totalSpent: 0,
          firstStayDate: booking.checkOut,
          lastStayDate: booking.checkOut,
          marketingOptIn: true // Default to true, can be updated later
        })
        console.log(`Created new guest record for ${booking.guestEmail}`)
      }

      // Create guest stay record
      const guestStay = await GuestStay.create({
        guestId: guest.id,
        propertyId: booking.propertyId,
        bookingId: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: booking.nights,
        numberOfGuests: booking.numberOfGuests,
        totalAmount: booking.totalAmount
      })

      // Update guest statistics
      guest.totalStays += 1
      guest.totalSpent = parseFloat(guest.totalSpent) + parseFloat(booking.totalAmount)
      guest.lastStayDate = booking.checkOut

      // Update first stay date if this is earlier
      if (!guest.firstStayDate || new Date(booking.checkOut) < new Date(guest.firstStayDate)) {
        guest.firstStayDate = booking.checkOut
      }

      // Add tags
      const tags = [...guest.tags]
      if (guest.totalStays >= 3 && !tags.includes('Repeat Guest')) {
        tags.push('Repeat Guest')
      }
      if (guest.totalStays >= 5 && !tags.includes('VIP')) {
        tags.push('VIP')
      }
      guest.tags = tags

      await guest.save()

      console.log(`✅ Guest stay recorded successfully for ${guest.email}`)
      return { success: true, guest, guestStay }
    } catch (error) {
      console.error('❌ Error recording guest stay:', error)
      throw error
    }
  }

  /**
   * Update guest from booking information
   * Call this when guest info is updated in a booking
   * @param {string} email - Guest email
   * @param {Object} updates - Fields to update (name, phoneNumber)
   */
  async updateGuestInfo(email, updates) {
    try {
      const guest = await Guest.findOne({ where: { email } })

      if (guest) {
        if (updates.name) guest.name = updates.name
        if (updates.phoneNumber) guest.phoneNumber = updates.phoneNumber

        await guest.save()
        console.log(`Updated guest info for ${email}`)
      }

      return { success: true, guest }
    } catch (error) {
      console.error('Error updating guest info:', error)
      throw error
    }
  }

  /**
   * Check if a guest is blacklisted
   * @param {string} email - Guest email
   * @returns {Object} - { isBlacklisted: boolean, reason: string|null }
   */
  async checkBlacklist(email) {
    try {
      const guest = await Guest.findOne({
        where: { email },
        attributes: ['isBlacklisted', 'blacklistReason']
      })

      if (!guest) {
        return { isBlacklisted: false, reason: null }
      }

      return {
        isBlacklisted: guest.isBlacklisted,
        reason: guest.blacklistReason
      }
    } catch (error) {
      console.error('Error checking blacklist:', error)
      throw error
    }
  }

  /**
   * Get guests eligible for marketing (opted in, not blacklisted)
   * @param {Array} propertyIds - Property IDs to filter by
   * @returns {Array} - Array of guest emails
   */
  async getMarketingList(propertyIds) {
    try {
      const guests = await Guest.findAll({
        where: {
          marketingOptIn: true,
          isBlacklisted: false
        },
        include: [
          {
            model: GuestStay,
            as: 'stays',
            where: { propertyId: propertyIds },
            attributes: []
          }
        ],
        attributes: ['email', 'name'],
        distinct: true
      })

      return guests.map(g => ({
        email: g.email,
        name: g.name
      }))
    } catch (error) {
      console.error('Error fetching marketing list:', error)
      throw error
    }
  }
}

module.exports = new GuestService()
