const { User, Cleaner, Property, PropertyCleaner, Booking } = require('../models')
const bcrypt = require('bcryptjs')
const { Op } = require('sequelize')

/**
 * Cleaner Controller
 * Handles cleaner management and calendar access
 */
class CleanerController {
  /**
   * Get all cleaners for a property owner
   * @route GET /api/cleaners
   */
  async getCleaners(req, res) {
    try {
      const userId = req.user.id
      const { role } = req.user

      let cleaners

      if (role === 'admin') {
        // Admins can see all cleaners
        cleaners = await Cleaner.findAll({
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive']
            },
            {
              model: Property,
              as: 'properties',
              attributes: ['id', 'name']
            }
          ],
          order: [['createdAt', 'DESC']]
        })
      } else if (role === 'owner') {
        // Owners can see cleaners assigned to their properties
        const properties = await Property.findAll({
          where: { userId },
          attributes: ['id']
        })

        const propertyIds = properties.map(p => p.id)

        const propertyCleaners = await PropertyCleaner.findAll({
          where: { propertyId: propertyIds },
          include: [
            {
              model: Cleaner,
              as: 'cleaner',
              include: [
                {
                  model: User,
                  as: 'user',
                  attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive']
                }
              ]
            },
            {
              model: Property,
              as: 'property',
              attributes: ['id', 'name']
            }
          ]
        })

        // Extract unique cleaners
        const cleanerMap = new Map()
        propertyCleaners.forEach(pc => {
          if (pc.cleaner && !cleanerMap.has(pc.cleaner.id)) {
            cleanerMap.set(pc.cleaner.id, {
              ...pc.cleaner.toJSON(),
              properties: []
            })
          }
          if (pc.cleaner && pc.property) {
            cleanerMap.get(pc.cleaner.id).properties.push(pc.property)
          }
        })

        cleaners = Array.from(cleanerMap.values())
      } else {
        return res.status(403).json({ success: false, message: 'Unauthorized' })
      }

      res.json({ success: true, cleaners })
    } catch (error) {
      console.error('Error fetching cleaners:', error)
      res.status(500).json({ success: false, message: 'Error fetching cleaners', error: error.message })
    }
  }

  /**
   * Create a new cleaner
   * @route POST /api/cleaners
   */
  async createCleaner(req, res) {
    try {
      const { name, email, phoneNumber, password, propertyIds, notes } = req.body
      const ownerId = req.user.id

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and password are required'
        })
      }

      // Check if user with this email already exists
      const existingUser = await User.findOne({ where: { email } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'A user with this email already exists'
        })
      }

      // Create user account with cleaner role
      const [firstName, ...lastNameParts] = name.split(' ')
      const lastName = lastNameParts.join(' ') || firstName

      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phoneNumber,
        role: 'cleaner',
        emailVerified: true
      })

      // Create cleaner profile
      const cleaner = await Cleaner.create({
        userId: user.id,
        name,
        email,
        phoneNumber,
        notes
      })

      // Assign to properties
      if (propertyIds && Array.isArray(propertyIds) && propertyIds.length > 0) {
        // Verify all properties belong to the owner
        const properties = await Property.findAll({
          where: {
            id: propertyIds,
            userId: ownerId
          }
        })

        if (properties.length !== propertyIds.length) {
          return res.status(403).json({
            success: false,
            message: 'You can only assign cleaners to your own properties'
          })
        }

        // Create property-cleaner associations
        const associations = propertyIds.map(propertyId => ({
          propertyId,
          cleanerId: cleaner.id
        }))

        await PropertyCleaner.bulkCreate(associations)
      }

      // Fetch complete cleaner data
      const createdCleaner = await Cleaner.findByPk(cleaner.id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName', 'role']
          },
          {
            model: Property,
            as: 'properties',
            attributes: ['id', 'name']
          }
        ]
      })

      res.status(201).json({
        success: true,
        message: 'Cleaner created successfully',
        cleaner: createdCleaner
      })
    } catch (error) {
      console.error('Error creating cleaner:', error)
      res.status(500).json({
        success: false,
        message: 'Error creating cleaner',
        error: error.message
      })
    }
  }

  /**
   * Update cleaner
   * @route PUT /api/cleaners/:id
   */
  async updateCleaner(req, res) {
    try {
      const { id } = req.params
      const { name, email, phoneNumber, propertyIds, notes, isActive } = req.body
      const userId = req.user.id
      const { role } = req.user

      const cleaner = await Cleaner.findByPk(id)
      if (!cleaner) {
        return res.status(404).json({ success: false, message: 'Cleaner not found' })
      }

      // Update cleaner info
      if (name) cleaner.name = name
      if (email) cleaner.email = email
      if (phoneNumber !== undefined) cleaner.phoneNumber = phoneNumber
      if (notes !== undefined) cleaner.notes = notes
      if (isActive !== undefined) cleaner.isActive = isActive

      await cleaner.save()

      // Update property assignments if provided
      if (propertyIds && Array.isArray(propertyIds)) {
        // Verify all properties belong to the owner (unless admin)
        if (role !== 'admin') {
          const properties = await Property.findAll({
            where: {
              id: propertyIds,
              userId
            }
          })

          if (properties.length !== propertyIds.length) {
            return res.status(403).json({
              success: false,
              message: 'You can only assign cleaners to your own properties'
            })
          }
        }

        // Remove old assignments for this owner's properties
        const ownerProperties = await Property.findAll({
          where: { userId },
          attributes: ['id']
        })
        const ownerPropertyIds = ownerProperties.map(p => p.id)

        await PropertyCleaner.destroy({
          where: {
            cleanerId: id,
            propertyId: ownerPropertyIds
          }
        })

        // Add new assignments
        if (propertyIds.length > 0) {
          const associations = propertyIds.map(propertyId => ({
            propertyId,
            cleanerId: id
          }))

          await PropertyCleaner.bulkCreate(associations)
        }
      }

      // Fetch updated cleaner
      const updatedCleaner = await Cleaner.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName', 'role']
          },
          {
            model: Property,
            as: 'properties',
            attributes: ['id', 'name']
          }
        ]
      })

      res.json({
        success: true,
        message: 'Cleaner updated successfully',
        cleaner: updatedCleaner
      })
    } catch (error) {
      console.error('Error updating cleaner:', error)
      res.status(500).json({ success: false, message: 'Error updating cleaner', error: error.message })
    }
  }

  /**
   * Delete cleaner
   * @route DELETE /api/cleaners/:id
   */
  async deleteCleaner(req, res) {
    try {
      const { id } = req.params

      const cleaner = await Cleaner.findByPk(id)
      if (!cleaner) {
        return res.status(404).json({ success: false, message: 'Cleaner not found' })
      }

      // Delete associated user account
      await User.destroy({ where: { id: cleaner.userId } })

      // Cleaner will be deleted via cascade
      res.json({ success: true, message: 'Cleaner deleted successfully' })
    } catch (error) {
      console.error('Error deleting cleaner:', error)
      res.status(500).json({ success: false, message: 'Error deleting cleaner', error: error.message })
    }
  }

  /**
   * Get cleaner's calendar (approved bookings for their properties)
   * @route GET /api/cleaners/calendar
   */
  async getCleanerCalendar(req, res) {
    try {
      const userId = req.user.id

      // Get cleaner profile
      const cleaner = await Cleaner.findOne({
        where: { userId },
        include: [
          {
            model: Property,
            as: 'properties',
            attributes: ['id', 'name', 'address', 'city', 'state'],
            through: { attributes: [] }
          }
        ]
      })

      if (!cleaner) {
        return res.status(404).json({ success: false, message: 'Cleaner profile not found' })
      }

      const propertyIds = cleaner.properties.map(p => p.id)

      if (propertyIds.length === 0) {
        return res.json({
          success: true,
          bookings: [],
          properties: []
        })
      }

      // Get approved bookings for cleaner's properties
      const bookings = await Booking.findAll({
        where: {
          propertyId: propertyIds,
          bookingStatus: 'approved'
        },
        include: [
          {
            model: Property,
            as: 'property',
            attributes: ['id', 'name', 'address', 'city', 'state', 'checkInInstructions']
          }
        ],
        order: [['checkIn', 'ASC']]
      })

      res.json({
        success: true,
        bookings,
        properties: cleaner.properties
      })
    } catch (error) {
      console.error('Error fetching cleaner calendar:', error)
      res.status(500).json({ success: false, message: 'Error fetching calendar', error: error.message })
    }
  }
}

module.exports = new CleanerController()
