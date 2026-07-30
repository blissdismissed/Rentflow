const { Guest, GuestStay, Property, Booking, FinancialBookingTransaction, FinancialMonthly } = require('../models')
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
      const {
        name, email, phoneNumber,
        totalStays, totalSpent,
        notes, tags, marketingOptIn,
        isBlacklisted, blacklistReason
      } = req.body

      const guest = await Guest.findByPk(id)
      if (!guest) {
        return res.status(404).json({ success: false, message: 'Guest not found' })
      }

      if (name !== undefined && name.trim()) guest.name = name.trim()
      if (email !== undefined) guest.email = email ? email.trim() : null
      if (phoneNumber !== undefined) guest.phoneNumber = phoneNumber ? phoneNumber.trim() : null
      if (totalStays !== undefined) guest.totalStays = Math.max(0, parseInt(totalStays) || 0)
      if (totalSpent !== undefined) guest.totalSpent = Math.max(0, parseFloat(totalSpent) || 0)
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
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'That email is already associated with another guest.' })
      }
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

        let guestJustCreated = false
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
          guestJustCreated = true
          results.created++
        } else {
          // Update profile fields only — aggregates are updated below, gated on stayCreated
          if (b.status === 'Checked out') {
            await guest.update({
              name: guest.name || b.guestName,
              phoneNumber: guest.phoneNumber || b.phone || null,
              email: guest.email || safeEmail,
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
            // Re-import: update stay fields but do NOT touch guest aggregates
            await GuestStay.update(
              { propertyId, bookingSource: b.bookingSource || 'manual', checkIn: checkIn.toISOString().split('T')[0], checkOut: checkOut.toISOString().split('T')[0], totalAmount: payout },
              { where: { guestId: guest.id, externalBookingId: b.externalBookingId } }
            )
          } else if (!guestJustCreated && b.status === 'Checked out') {
            // Genuinely new stay for an existing guest — update aggregates now
            await guest.reload()
            await guest.update({
              totalStays: (guest.totalStays || 0) + 1,
              totalSpent: parseFloat(guest.totalSpent || 0) + payout,
              firstStayDate: guest.firstStayDate && checkOut && new Date(guest.firstStayDate) < checkOut ? guest.firstStayDate : checkOut,
              lastStayDate: !guest.lastStayDate || (checkOut && new Date(guest.lastStayDate) < checkOut) ? checkOut : guest.lastStayDate,
            })
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

  /**
   * Record a manual / direct-booking stay
   * @route POST /api/guests/manual-stay
   */
  async manualStay(req, res) {
    try {
      const userId = req.user.id
      const {
        guestId, name, email, phoneNumber,
        propertyId, checkIn, checkOut,
        amount, numberOfGuests, notes
      } = req.body

      // Validate property belongs to this owner
      const property = await Property.findOne({ where: { id: propertyId, userId } })
      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      // Validate dates
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
      if (!checkIn || !checkOut || nights <= 0) {
        return res.status(400).json({ success: false, message: 'Check-out must be after check-in' })
      }

      // Resolve guest — use existing or create new
      let guest
      if (guestId) {
        guest = await Guest.findByPk(guestId)
        if (!guest) return res.status(404).json({ success: false, message: 'Guest not found' })
      } else {
        if (!name || !name.trim()) {
          return res.status(400).json({ success: false, message: 'Guest name is required for new guests' })
        }
        const cleanEmail = email ? email.trim().toLowerCase() : null
        if (cleanEmail) {
          const [g] = await Guest.findOrCreate({
            where: { email: cleanEmail },
            defaults: { name: name.trim(), phoneNumber: phoneNumber || null, totalStays: 0, totalSpent: 0 }
          })
          guest = g
        } else {
          guest = await Guest.create({
            name: name.trim(),
            phoneNumber: phoneNumber || null,
            totalStays: 0,
            totalSpent: 0
          })
        }
      }

      const paidAmount = parseFloat(amount) || 0
      const guestCount = Math.max(1, parseInt(numberOfGuests) || 1)

      // Create a Booking record so this appears in the Calendar and Bookings tab
      const confirmationCode = `RFD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const booking = await Booking.create({
        propertyId,
        channel: 'direct',
        guestName: guest.name,
        guestEmail: guest.email || 'noreply@direct.internal',
        checkIn,
        checkOut,
        nights,
        numberOfGuests: guestCount,
        baseAmount: paidAmount,
        totalAmount: paidAmount,
        taxes: 0,
        bookingStatus: 'confirmed',
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmationCode,
        specialRequests: notes || null
      })

      // Create the guest stay record, linked to the booking
      const stay = await GuestStay.create({
        guestId: guest.id,
        propertyId,
        bookingId: booking.id,
        checkIn,
        checkOut,
        nights,
        numberOfGuests: guestCount,
        totalAmount: paidAmount,
        bookingSource: 'direct',
        review: notes || null
      })

      // Update guest aggregate stats
      const guestUpdates = {
        totalStays: (parseInt(guest.totalStays) || 0) + 1,
        totalSpent: (parseFloat(guest.totalSpent) || 0) + paidAmount
      }
      if (!guest.firstStayDate || checkInDate < new Date(guest.firstStayDate)) guestUpdates.firstStayDate = checkIn
      if (!guest.lastStayDate || checkOutDate > new Date(guest.lastStayDate)) guestUpdates.lastStayDate = checkOut
      await guest.update(guestUpdates)

      // Record in financial ledger — same pattern as Evolve CSV import
      const year = checkInDate.getUTCFullYear()
      const month = checkInDate.getUTCMonth() + 1
      const externalBookingId = `direct-${stay.id}`

      await FinancialBookingTransaction.create({
        propertyId,
        externalBookingId,
        bookingSource: 'direct',
        year,
        month,
        grossAmount: paidAmount,
        managementFee: 0,
        nightsBooked: nights,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestName: guest.name,
        status: 'Checked out'
      })

      // Recompute FinancialMonthly.grossIncome from all transactions for this month
      const txns = await FinancialBookingTransaction.findAll({ where: { propertyId, year, month } })
      const grossIncome = txns.reduce((s, t) => s + parseFloat(t.grossAmount || 0), 0)
      const nightsTotal = txns.reduce((s, t) => s + parseInt(t.nightsBooked || 0), 0)

      const [monthly, monthlyCreated] = await FinancialMonthly.findOrCreate({
        where: { propertyId, year, month },
        defaults: { propertyId, year, month, grossIncome, nightsBooked: nightsTotal, numReservations: txns.length, syncSource: 'direct' }
      })
      if (!monthlyCreated) {
        await monthly.update({ grossIncome, nightsBooked: nightsTotal, numReservations: txns.length })
      }

      res.json({ success: true, message: 'Stay recorded successfully', guest, stay, year, month })
    } catch (error) {
      console.error('Error recording manual stay:', error)
      res.status(500).json({ success: false, message: 'Error recording stay', error: error.message })
    }
  }
}

module.exports = new GuestController()
