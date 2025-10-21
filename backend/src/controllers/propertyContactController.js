const { PropertyContact, Property } = require('../models')

/**
 * Property Contact Controller
 * Handles owner and guest contact management for properties
 */
class PropertyContactController {
  /**
   * Get all contacts for a property
   * @route GET /api/properties/:propertyId/contacts
   */
  async getPropertyContacts(req, res) {
    try {
      const { propertyId } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      const contacts = await PropertyContact.findAll({
        where: { propertyId },
        order: [['contactType', 'ASC'], ['isPrimary', 'DESC'], ['createdAt', 'DESC']]
      })

      res.json({ success: true, contacts })
    } catch (error) {
      console.error('Error fetching property contacts:', error)
      res.status(500).json({ success: false, message: 'Error fetching contacts', error: error.message })
    }
  }

  /**
   * Create a new property contact
   * @route POST /api/properties/:propertyId/contacts
   */
  async createPropertyContact(req, res) {
    try {
      const { propertyId } = req.params
      const { contactType, name, email, phoneNumber, isPrimary, receiveBookingNotifications, notes } = req.body
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      // Validate required fields
      if (!contactType || !name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Contact type, name, and email are required'
        })
      }

      // If setting as primary, unset other primary contacts of same type
      if (isPrimary) {
        await PropertyContact.update(
          { isPrimary: false },
          {
            where: {
              propertyId,
              contactType
            }
          }
        )
      }

      const contact = await PropertyContact.create({
        propertyId,
        contactType,
        name,
        email,
        phoneNumber,
        isPrimary: isPrimary || false,
        receiveBookingNotifications: receiveBookingNotifications !== undefined ? receiveBookingNotifications : true,
        notes
      })

      res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        contact
      })
    } catch (error) {
      console.error('Error creating property contact:', error)
      res.status(500).json({ success: false, message: 'Error creating contact', error: error.message })
    }
  }

  /**
   * Update a property contact
   * @route PUT /api/properties/:propertyId/contacts/:id
   */
  async updatePropertyContact(req, res) {
    try {
      const { propertyId, id } = req.params
      const { name, email, phoneNumber, isPrimary, receiveBookingNotifications, notes } = req.body
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      const contact = await PropertyContact.findOne({
        where: { id, propertyId }
      })

      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }

      // If setting as primary, unset other primary contacts of same type
      if (isPrimary && !contact.isPrimary) {
        await PropertyContact.update(
          { isPrimary: false },
          {
            where: {
              propertyId,
              contactType: contact.contactType,
              id: { [require('sequelize').Op.ne]: id }
            }
          }
        )
      }

      // Update fields
      if (name) contact.name = name
      if (email) contact.email = email
      if (phoneNumber !== undefined) contact.phoneNumber = phoneNumber
      if (isPrimary !== undefined) contact.isPrimary = isPrimary
      if (receiveBookingNotifications !== undefined) contact.receiveBookingNotifications = receiveBookingNotifications
      if (notes !== undefined) contact.notes = notes

      await contact.save()

      res.json({
        success: true,
        message: 'Contact updated successfully',
        contact
      })
    } catch (error) {
      console.error('Error updating property contact:', error)
      res.status(500).json({ success: false, message: 'Error updating contact', error: error.message })
    }
  }

  /**
   * Delete a property contact
   * @route DELETE /api/properties/:propertyId/contacts/:id
   */
  async deletePropertyContact(req, res) {
    try {
      const { propertyId, id } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId }
      })

      if (!property) {
        return res.status(404).json({ success: false, message: 'Property not found' })
      }

      const contact = await PropertyContact.findOne({
        where: { id, propertyId }
      })

      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' })
      }

      await contact.destroy()

      res.json({ success: true, message: 'Contact deleted successfully' })
    } catch (error) {
      console.error('Error deleting property contact:', error)
      res.status(500).json({ success: false, message: 'Error deleting contact', error: error.message })
    }
  }
}

module.exports = new PropertyContactController()
