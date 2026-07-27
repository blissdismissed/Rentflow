const { PropertyLockPin, Property, PropertySettings, Booking } = require('../models')
const { Op } = require('sequelize')
const crypto = require('crypto')

/**
 * Lock PIN Management Controller
 * Handles CRUD operations for property lock PINs and rotation settings
 */
class LockPinController {
  /**
   * Get all lock PINs for a property
   * @route GET /api/properties/:propertyId/lock-pins
   */
  async getLockPins(req, res) {
    try {
      const { propertyId } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Get all PINs ordered by rotation index
      const pins = await PropertyLockPin.findAll({
        where: { propertyId },
        order: [['orderIndex', 'ASC']],
        include: [
          {
            model: Booking,
            as: 'bookings',
            attributes: ['id', 'guestName', 'checkIn', 'checkOut'],
            limit: 5,
            order: [['checkIn', 'DESC']]
          }
        ]
      })

      // Get property settings to show current rotation index
      const settings = await PropertySettings.findOne({
        where: { propertyId }
      })

      res.json({
        success: true,
        pins: pins.map(pin => ({
          id: pin.id,
          pin: this.decryptPin(pin.pin),
          isActive: pin.isActive,
          orderIndex: pin.orderIndex,
          lastUsedAt: pin.lastUsedAt,
          usageCount: pin.usageCount,
          notes: pin.notes,
          recentBookings: pin.bookings
        })),
        currentPinIndex: settings?.currentPinIndex || 0,
        rotatingPinsEnabled: settings?.rotatingPinsEnabled || false
      })
    } catch (error) {
      console.error('Error fetching lock PINs:', error)
      res.status(500).json({
        success: false,
        message: 'Error fetching lock PINs',
        error: error.message
      })
    }
  }

  /**
   * Add a new lock PIN
   * @route POST /api/properties/:propertyId/lock-pins
   */
  async addLockPin(req, res) {
    try {
      const { propertyId } = req.params
      const { pin, notes } = req.body
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Validate PIN
      if (!pin || pin.length < 4) {
        return res.status(400).json({
          success: false,
          message: 'PIN must be at least 4 characters'
        })
      }

      // Get next order index
      const maxIndex = await PropertyLockPin.max('orderIndex', {
        where: { propertyId }
      })
      const nextIndex = (maxIndex || -1) + 1

      // Create new PIN
      const newPin = await PropertyLockPin.create({
        propertyId,
        pin: this.encryptPin(pin),
        orderIndex: nextIndex,
        notes,
        isActive: true
      })

      res.json({
        success: true,
        message: 'Lock PIN added successfully',
        pin: {
          id: newPin.id,
          pin: pin, // Return unencrypted for display
          orderIndex: newPin.orderIndex,
          isActive: newPin.isActive,
          notes: newPin.notes
        }
      })
    } catch (error) {
      console.error('Error adding lock PIN:', error)
      res.status(500).json({
        success: false,
        message: 'Error adding lock PIN',
        error: error.message
      })
    }
  }

  /**
   * Update a lock PIN
   * @route PUT /api/properties/:propertyId/lock-pins/:pinId
   */
  async updateLockPin(req, res) {
    try {
      const { propertyId, pinId } = req.params
      const { pin, notes, isActive } = req.body
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      const lockPin = await PropertyLockPin.findOne({
        where: { id: pinId, propertyId }
      })

      if (!lockPin) {
        return res.status(404).json({
          success: false,
          message: 'Lock PIN not found'
        })
      }

      // Update fields
      if (pin !== undefined) {
        if (pin.length < 4) {
          return res.status(400).json({
            success: false,
            message: 'PIN must be at least 4 characters'
          })
        }
        lockPin.pin = this.encryptPin(pin)
      }
      if (notes !== undefined) lockPin.notes = notes
      if (isActive !== undefined) lockPin.isActive = isActive

      await lockPin.save()

      res.json({
        success: true,
        message: 'Lock PIN updated successfully',
        pin: {
          id: lockPin.id,
          pin: pin || this.decryptPin(lockPin.pin),
          orderIndex: lockPin.orderIndex,
          isActive: lockPin.isActive,
          notes: lockPin.notes
        }
      })
    } catch (error) {
      console.error('Error updating lock PIN:', error)
      res.status(500).json({
        success: false,
        message: 'Error updating lock PIN',
        error: error.message
      })
    }
  }

  /**
   * Delete a lock PIN
   * @route DELETE /api/properties/:propertyId/lock-pins/:pinId
   */
  async deleteLockPin(req, res) {
    try {
      const { propertyId, pinId } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      const lockPin = await PropertyLockPin.findOne({
        where: { id: pinId, propertyId }
      })

      if (!lockPin) {
        return res.status(404).json({
          success: false,
          message: 'Lock PIN not found'
        })
      }

      const orderIndex = lockPin.orderIndex

      // Delete the PIN
      await lockPin.destroy()

      // Reorder remaining PINs
      await PropertyLockPin.decrement('orderIndex', {
        where: {
          propertyId,
          orderIndex: { [Op.gt]: orderIndex }
        }
      })

      // Reset current index if it's out of bounds
      const remainingPins = await PropertyLockPin.count({
        where: { propertyId, isActive: true }
      })

      const settings = await PropertySettings.findOne({
        where: { propertyId }
      })

      if (settings && settings.currentPinIndex >= remainingPins) {
        settings.currentPinIndex = 0
        await settings.save()
      }

      res.json({
        success: true,
        message: 'Lock PIN deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting lock PIN:', error)
      res.status(500).json({
        success: false,
        message: 'Error deleting lock PIN',
        error: error.message
      })
    }
  }

  /**
   * Reorder lock PINs
   * @route PUT /api/properties/:propertyId/lock-pins/reorder
   */
  async reorderLockPins(req, res) {
    try {
      const { propertyId } = req.params
      const { pinOrder } = req.body // Array of PIN IDs in desired order
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Update order index for each PIN
      const updatePromises = pinOrder.map((pinId, index) =>
        PropertyLockPin.update(
          { orderIndex: index },
          { where: { id: pinId, propertyId } }
        )
      )

      await Promise.all(updatePromises)

      res.json({
        success: true,
        message: 'Lock PINs reordered successfully'
      })
    } catch (error) {
      console.error('Error reordering lock PINs:', error)
      res.status(500).json({
        success: false,
        message: 'Error reordering lock PINs',
        error: error.message
      })
    }
  }

  /**
   * Get PIN usage history for a property
   * @route GET /api/properties/:propertyId/lock-pins/history
   */
  async getPinHistory(req, res) {
    try {
      const { propertyId } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      // Get all bookings with assigned PINs
      const bookings = await Booking.findAll({
        where: {
          propertyId,
          lockPinId: { [Op.not]: null }
        },
        include: [
          {
            model: PropertyLockPin,
            as: 'lockPin',
            attributes: ['id', 'pin', 'orderIndex']
          }
        ],
        order: [['checkIn', 'DESC']],
        limit: 100
      })

      res.json({
        success: true,
        history: bookings.map(booking => ({
          bookingId: booking.id,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          pin: booking.lockPin ? this.decryptPin(booking.lockPin.pin) : booking.assignedLockPin,
          pinOrderIndex: booking.lockPin?.orderIndex
        }))
      })
    } catch (error) {
      console.error('Error fetching PIN history:', error)
      res.status(500).json({
        success: false,
        message: 'Error fetching PIN history',
        error: error.message
      })
    }
  }

  /**
   * Encrypt PIN for storage
   */
  encryptPin(pin) {
    const algorithm = 'aes-256-cbc'
    const key = Buffer.from(process.env.PIN_ENCRYPTION_KEY || 'defaultkey32characterslong1234', 'utf8').slice(0, 32)
    const iv = crypto.randomBytes(16)

    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(pin, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    return iv.toString('hex') + ':' + encrypted
  }

  /**
   * Decrypt PIN for display
   */
  decryptPin(encryptedPin) {
    try {
      const algorithm = 'aes-256-cbc'
      const key = Buffer.from(process.env.PIN_ENCRYPTION_KEY || 'defaultkey32characterslong1234', 'utf8').slice(0, 32)

      const parts = encryptedPin.split(':')
      const iv = Buffer.from(parts[0], 'hex')
      const encrypted = parts[1]

      const decipher = crypto.createDecipheriv(algorithm, key, iv)
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      console.error('Error decrypting PIN:', error)
      return '****'
    }
  }
}

module.exports = new LockPinController()
