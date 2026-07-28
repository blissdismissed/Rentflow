const { Guest, GuestStay, Property, Booking } = require('../models')
const { Op } = require('sequelize')

/**
 * Guest Management Controller
 * Handles guest tracking and management for property owners
 */
class GuestController {
  /**
   * Get all guests for owner's properties
   * @route GET /api/guests
   */
  async getGuests(req, res) {
    try {
      const userId = req.user.id
      const { propertyId, marketingOptIn, search, sortBy = 'lastStayDate', order = 'DESC' } = req.query

      // Get owner's properties
      const ownerProperties = await Property.findAll({
        where: { userId },
        attributes: ['id']
      })

      const propertyIds = ownerProperties.map(p => p.id)

      if (propertyIds.length === 0) {
        return res.json({ success: true, guests: [] })
      }

      // Build where clause
      const whereClause = {}
      if (marketingOptIn !== undefined) {
        whereClause.marketingOptIn = marketingOptIn === 'true'
      }
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } }
        ]
      }

      // Validate sortBy to prevent SQL injection
      const allowedSortCols = ['lastStayDate', 'totalStays', 'totalSpent', 'name', 'createdAt']
      const safeSortBy = allowedSortCols.includes(sortBy) ? sortBy : 'lastStayDate'
      const safeOrder = order === 'ASC' ? 'ASC' : 'DESC'

      // Get guests who have stayed at owner's properties
      const guests = await Guest.findAll({
        where: whereClause,
        include: [
          {
            model: GuestStay,
            as: 'stays',
            required: true,
            where: propertyId ? { propertyId } : { propertyId: propertyIds },
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name']
              }
            ],
          }
        ],
        order: [[safeSortBy, safeOrder]],
        distinct: true
      })

      // Sort each guest's stays by checkOut desc in JS (can't order nested includes in Sequelize)
      guests.forEach(g => {
        if (g.stays) g.stays.sort((a, b) => new Date(b.checkOut) - new Date(a.checkOut))
      })

      // Also send the owner's full property list so the filter dropdown is always populated
      const properties = await Property.findAll({
        where: { userId },
        attributes: ['id', 'name'],
        order: [['name', 'ASC']]
      })

      res.json({ success: true, guests, properties })
    } catch (error) {
      console.error('Error fetching guests:', error)
      res.status(500).json({ success: false, message: 'Error fetching guests', error: error.message })
    }
  }

  /**
   * Get single guest details
   * @route GET /api/guests/:id
   */
  async getGuestById(req, res) {
    try {
      const { id } = req.params
      const userId = req.user.id

      // Get owner's properties
      const ownerProperties = await Property.findAll({
        where: { userId },
        attributes: ['id']
      })

      const propertyIds = ownerProperties.map(p => p.id)

      const guest = await Guest.findByPk(id, {
        include: [
          {
            model: GuestStay,
            as: 'stays',
            where: { propertyId: propertyIds },
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name', 'city', 'state']
              }
            ],
            order: [['checkOut', 'DESC']]
          }
        ]
      })

      if (!guest) {
        return res.status(404).json({ success: false, message: 'Guest not found' })
      }

      res.json({ success: true, guest })
    } catch (error) {
      console.error('Error fetching guest:', error)
      res.status(500).json({ success: false, message: 'Error fetching guest', error: error.message })
    }
  }

  /**
   * Update guest information
   * @route PUT /api/guests/:id
   */
  async updateGuest(req, res) {
    try {
      const { id } = req.params
      const { notes, tags, marketingOptIn, isBlacklisted, blacklistReason } = req.body

      const guest = await Guest.findByPk(id)
      if (!guest) {
        return res.status(404).json({ success: false, message: 'Guest not found' })
      }

      // Update fields
      if (notes !== undefined) guest.notes = notes
      if (tags !== undefined) guest.tags = tags
      if (marketingOptIn !== undefined) guest.marketingOptIn = marketingOptIn
      if (isBlacklisted !== undefined) {
        guest.isBlacklisted = isBlacklisted
        if (isBlacklisted && blacklistReason) {
          guest.blacklistReason = blacklistReason
        } else if (!isBlacklisted) {
          guest.blacklistReason = null
        }
      }

      await guest.save()

      res.json({ success: true, message: 'Guest updated successfully', guest })
    } catch (error) {
      console.error('Error updating guest:', error)
      res.status(500).json({ success: false, message: 'Error updating guest', error: error.message })
    }
  }

  /**
   * Rate a guest stay
   * @route PUT /api/guests/stays/:stayId/rate
   */
  async rateGuestStay(req, res) {
    try {
      const { stayId } = req.params
      const { rating, review } = req.body
      const userId = req.user.id

      const stay = await GuestStay.findByPk(stayId, {
        include: [
          {
            model: Property,
            as: 'property',
            where: { userId }
          }
        ]
      })

      if (!stay) {
        return res.status(404).json({ success: false, message: 'Guest stay not found' })
      }

      if (rating) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' })
        }
        stay.rating = rating
      }

      if (review !== undefined) {
        stay.review = review
      }

      await stay.save()

      res.json({ success: true, message: 'Guest stay rated successfully', stay })
    } catch (error) {
      console.error('Error rating guest stay:', error)
      res.status(500).json({ success: false, message: 'Error rating guest stay', error: error.message })
    }
  }

  /**
   * Export guests to CSV
   * @route GET /api/guests/export/csv
   */
  async exportGuestsCSV(req, res) {
    try {
      const userId = req.user.id
      const { marketingOptIn } = req.query

      // Get owner's properties
      const ownerProperties = await Property.findAll({
        where: { userId },
        attributes: ['id']
      })

      const propertyIds = ownerProperties.map(p => p.id)

      if (propertyIds.length === 0) {
        return res.status(400).json({ success: false, message: 'No properties found' })
      }

      // Build where clause
      const whereClause = {}
      if (marketingOptIn !== undefined) {
        whereClause.marketingOptIn = marketingOptIn === 'true'
      }

      // Get guests
      const guests = await Guest.findAll({
        where: whereClause,
        include: [
          {
            model: GuestStay,
            as: 'stays',
            where: { propertyId: propertyIds },
            attributes: []
          }
        ],
        order: [['lastStayDate', 'DESC']],
        distinct: true
      })

      // Generate CSV
      const csv = [
        ['Name', 'Email', 'Phone', 'Total Stays', 'Total Spent', 'Last Stay Date', 'Marketing Opt-In', 'Tags'].join(','),
        ...guests.map(guest => [
          `"${guest.name}"`,
          guest.email,
          guest.phoneNumber || '',
          guest.totalStays,
          guest.totalSpent,
          guest.lastStayDate ? new Date(guest.lastStayDate).toLocaleDateString() : '',
          guest.marketingOptIn ? 'Yes' : 'No',
          `"${guest.tags.join(', ')}"`
        ].join(','))
      ].join('\n')

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=guests.csv')
      res.send(csv)
    } catch (error) {
      console.error('Error exporting guests:', error)
      res.status(500).json({ success: false, message: 'Error exporting guests', error: error.message })
    }
  }

  /**
   * Get guest statistics
   * @route GET /api/guests/stats
   */
  async getGuestStats(req, res) {
    try {
      const userId = req.user.id

      // Get owner's properties
      const ownerProperties = await Property.findAll({
        where: { userId },
        attributes: ['id']
      })

      const propertyIds = ownerProperties.map(p => p.id)

      if (propertyIds.length === 0) {
        return res.json({
          success: true,
          stats: {
            totalGuests: 0,
            marketingOptInGuests: 0,
            repeatGuests: 0,
            averageStays: 0
          }
        })
      }

      // Get all guests for owner's properties
      const allGuests = await Guest.findAll({
        include: [
          {
            model: GuestStay,
            as: 'stays',
            where: { propertyId: propertyIds },
            attributes: []
          }
        ],
        distinct: true
      })

      const totalGuests = allGuests.length
      const marketingOptInGuests = allGuests.filter(g => g.marketingOptIn).length
      const repeatGuests = allGuests.filter(g => g.totalStays > 1).length
      const averageStays = totalGuests > 0
        ? allGuests.reduce((sum, g) => sum + g.totalStays, 0) / totalGuests
        : 0

      res.json({
        success: true,
        stats: {
          totalGuests,
          marketingOptInGuests,
          repeatGuests,
          averageStays: Math.round(averageStays * 10) / 10
        }
      })
    } catch (error) {
      console.error('Error fetching guest stats:', error)
      res.status(500).json({ success: false, message: 'Error fetching stats', error: error.message })
    }
  }
  // POST /api/guests/bulk-import — upsert guests + stays from Evolve/external CSV
  async bulkImport(req, res) {
    try {
      const userId = req.user.id
      const { propertyId, bookings } = req.body

      if (!propertyId || !Array.isArray(bookings)) {
        return res.status(400).json({ success: false, message: 'propertyId and bookings array required' })
      }

      const property = await Property.findOne({ where: { id: propertyId, userId } })
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

      const results = { created: 0, updated: 0, skipped: 0 }

      for (const b of bookings) {
        if (b.status === 'Canceled') { results.skipped++; continue }
        if (!b.guestName) { results.skipped++; continue }

        // Upsert guest by externalBookingId (via stay), then email, then phone, then name
        let guest = null

        // Most reliable: find existing stay with same bookingId → get the guest
        if (b.externalBookingId) {
          const existingStay = await GuestStay.findOne({
            where: { externalBookingId: b.externalBookingId, propertyId },
            include: [{ model: Guest, as: 'guest' }]
          })
          if (existingStay?.guest) guest = existingStay.guest
        }

        // Fallback: match by email, phone, or name+property
        if (!guest && b.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) {
          guest = await Guest.findOne({ where: { email: b.email } })
        }
        if (!guest && b.phone) {
          guest = await Guest.findOne({ where: { phoneNumber: b.phone } })
        }
        if (!guest && b.guestName) {
          const existingStay = await GuestStay.findOne({
            where: { propertyId },
            include: [{ model: Guest, as: 'guest', where: { name: b.guestName }, required: true }]
          })
          if (existingStay?.guest) guest = existingStay.guest
        }

        // Sanitize email — only store if it looks like a real email
        const safeEmail = (b.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) ? b.email : null

        const payout = parseFloat(String(b.totalPayout || '0').replace(/[$,]/g, '')) || 0
        const nights = parseInt(b.nightsStayed || b.nights || 0) || 0
        const checkIn = b.checkIn ? new Date(b.checkIn) : null
        const checkOut = b.checkOut ? new Date(b.checkOut) : null

        if (!guest) {
          guest = await Guest.create({
            email: safeEmail,
            name: b.guestName,
            phoneNumber: b.phone || null,
            totalStays: b.status === 'Checked out' ? 1 : 0,
            totalSpent: b.status === 'Checked out' ? payout : 0,
            firstStayDate: b.status === 'Checked out' ? checkOut : null,
            lastStayDate: b.status === 'Checked out' ? checkOut : null,
            marketingOptIn: true,
          })
          results.created++
        } else {
          // Update aggregates for completed stays
          if (b.status === 'Checked out') {
            await guest.update({
              name: guest.name || b.guestName,
              phoneNumber: guest.phoneNumber || b.phone || null,
              email: guest.email || safeEmail,
              totalStays: (guest.totalStays || 0) + 1,
              totalSpent: parseFloat(guest.totalSpent || 0) + payout,
              firstStayDate: guest.firstStayDate && checkOut && new Date(guest.firstStayDate) < checkOut ? guest.firstStayDate : checkOut,
              lastStayDate: !guest.lastStayDate || (checkOut && new Date(guest.lastStayDate) < checkOut) ? checkOut : guest.lastStayDate,
            })
          }
          results.updated++
        }

        // Upsert stay by externalBookingId
        if (b.externalBookingId && checkIn && checkOut) {
          const [, stayCreated] = await GuestStay.findOrCreate({
            where: { guestId: guest.id, externalBookingId: b.externalBookingId },
            defaults: {
              guestId: guest.id,
              propertyId,
              bookingId: null,
              externalBookingId: b.externalBookingId,
              bookingSource: b.bookingSource || 'manual',
              checkIn: checkIn.toISOString().split('T')[0],
              checkOut: checkOut.toISOString().split('T')[0],
              nights: nights || Math.round((checkOut - checkIn) / 86400000),
              numberOfGuests: (parseInt(b.adults) || 1) + (parseInt(b.children) || 0),
              totalAmount: payout,
            }
          })
          if (!stayCreated) {
            // Update if already exists
            await GuestStay.update(
              { propertyId, bookingSource: b.bookingSource || 'manual', checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0], totalAmount: payout },
              { where: { guestId: guest.id, externalBookingId: b.externalBookingId } }
            )
          }
        }
      }

      res.json({ success: true, results })
    } catch (error) {
      console.error('bulkImport error:', error)
      res.status(500).json({ success: false, message: 'Import failed: ' + error.message })
    }
  }

  // POST /api/guests/send-email — send marketing email to selected guests
  async sendMarketingEmail(req, res) {
    try {
      const userId = req.user.id
      const { guestIds, subject, message, fromName } = req.body

      if (!guestIds?.length || !subject || !message) {
        return res.status(400).json({ success: false, message: 'guestIds, subject, and message required' })
      }

      // Verify owner owns properties where these guests stayed
      const ownerProperties = await Property.findAll({ where: { userId }, attributes: ['id', 'name'] })
      const propertyIds = ownerProperties.map(p => p.id)

      const guests = await Guest.findAll({
        where: {
          id: { [Op.in]: guestIds },
          marketingOptIn: true,
          email: { [Op.ne]: null }
        },
        include: [{
          model: GuestStay,
          as: 'stays',
          where: { propertyId: { [Op.in]: propertyIds } },
          required: true
        }]
      })

      if (guests.length === 0) {
        return res.json({ success: true, sent: 0, message: 'No eligible guests (must have email + marketing opt-in)' })
      }

      const { Resend } = require('resend')
      const r = new Resend(process.env.RESEND_API_KEY)

      const senderName = fromName || 'Rentflow'
      const fromEmail = process.env.EMAIL_FROM

      let sent = 0
      const errors = []
      for (const guest of guests) {
        try {
          const { error } = await r.emails.send({
            to: [guest.email],
            from: `${senderName} <${fromEmail}>`,
            subject,
            text: message,
            html: message.replace(/\n/g, '<br>'),
          })
          if (error) throw new Error(error.message)
          sent++
        } catch (e) {
          errors.push({ email: guest.email, error: e.message })
        }
      }

      res.json({ success: true, sent, errors })
    } catch (error) {
      console.error('sendMarketingEmail error:', error)
      res.status(500).json({ success: false, message: 'Send failed: ' + error.message })
    }
  }
}

module.exports = new GuestController()
