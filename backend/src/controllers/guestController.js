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

      // Get guests who have stayed at owner's properties
      const guests = await Guest.findAll({
        where: whereClause,
        include: [
          {
            model: GuestStay,
            as: 'stays',
            where: propertyId ? { propertyId } : { propertyId: propertyIds },
            include: [
              {
                model: Property,
                as: 'property',
                attributes: ['id', 'name']
              }
            ],
            order: [['checkOut', 'DESC']]
          }
        ],
        order: [[sortBy, order]],
        distinct: true
      })

      res.json({ success: true, guests })
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
}

module.exports = new GuestController()
