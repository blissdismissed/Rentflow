const { EmailTemplate, Property, Booking, PropertySettings } = require('../models')
const emailService = require('../services/emailService')

/**
 * Email Template Controller
 * Manages customizable email templates for properties
 */
class EmailTemplateController {
  /**
   * Get all email templates for a property
   * @route GET /api/properties/:propertyId/email-templates
   */
  async getTemplates(req, res) {
    try {
      const { propertyId } = req.params
      const { templateType } = req.query
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

      const whereClause = { propertyId }
      if (templateType) {
        whereClause.templateType = templateType
      }

      const templates = await EmailTemplate.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']]
      })

      res.json({
        success: true,
        templates
      })
    } catch (error) {
      console.error('Error fetching email templates:', error)
      res.status(500).json({
        success: false,
        message: 'Error fetching email templates',
        error: error.message
      })
    }
  }

  /**
   * Get single email template
   * @route GET /api/properties/:propertyId/email-templates/:templateId
   */
  async getTemplate(req, res) {
    try {
      const { propertyId, templateId } = req.params
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

      const template = await EmailTemplate.findOne({
        where: { id: templateId, propertyId }
      })

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        })
      }

      res.json({
        success: true,
        template
      })
    } catch (error) {
      console.error('Error fetching email template:', error)
      res.status(500).json({
        success: false,
        message: 'Error fetching email template',
        error: error.message
      })
    }
  }

  /**
   * Create new email template
   * @route POST /api/properties/:propertyId/email-templates
   */
  async createTemplate(req, res) {
    try {
      const { propertyId } = req.params
      const userId = req.user.id
      const {
        templateType,
        subject,
        htmlContent,
        plainTextContent,
        daysBeforeCheckIn,
        daysAfterCheckOut,
        isActive,
        includeLockPin
      } = req.body

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

      // Validate required fields
      if (!subject || !htmlContent) {
        return res.status(400).json({
          success: false,
          message: 'Subject and HTML content are required'
        })
      }

      // Create template
      const template = await EmailTemplate.create({
        propertyId,
        templateType: templateType || 'pre_stay',
        subject,
        htmlContent,
        plainTextContent,
        daysBeforeCheckIn,
        daysAfterCheckOut,
        isActive: isActive !== undefined ? isActive : true,
        includeLockPin: includeLockPin || false
      })

      res.json({
        success: true,
        message: 'Email template created successfully',
        template
      })
    } catch (error) {
      console.error('Error creating email template:', error)
      res.status(500).json({
        success: false,
        message: 'Error creating email template',
        error: error.message
      })
    }
  }

  /**
   * Update email template
   * @route PUT /api/properties/:propertyId/email-templates/:templateId
   */
  async updateTemplate(req, res) {
    try {
      const { propertyId, templateId } = req.params
      const userId = req.user.id
      const {
        subject,
        htmlContent,
        plainTextContent,
        daysBeforeCheckIn,
        daysAfterCheckOut,
        isActive,
        includeLockPin
      } = req.body

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

      const template = await EmailTemplate.findOne({
        where: { id: templateId, propertyId }
      })

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        })
      }

      // Update fields
      if (subject !== undefined) template.subject = subject
      if (htmlContent !== undefined) template.htmlContent = htmlContent
      if (plainTextContent !== undefined) template.plainTextContent = plainTextContent
      if (daysBeforeCheckIn !== undefined) template.daysBeforeCheckIn = daysBeforeCheckIn
      if (daysAfterCheckOut !== undefined) template.daysAfterCheckOut = daysAfterCheckOut
      if (isActive !== undefined) template.isActive = isActive
      if (includeLockPin !== undefined) template.includeLockPin = includeLockPin

      await template.save()

      res.json({
        success: true,
        message: 'Email template updated successfully',
        template
      })
    } catch (error) {
      console.error('Error updating email template:', error)
      res.status(500).json({
        success: false,
        message: 'Error updating email template',
        error: error.message
      })
    }
  }

  /**
   * Delete email template
   * @route DELETE /api/properties/:propertyId/email-templates/:templateId
   */
  async deleteTemplate(req, res) {
    try {
      const { propertyId, templateId } = req.params
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

      const template = await EmailTemplate.findOne({
        where: { id: templateId, propertyId }
      })

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        })
      }

      await template.destroy()

      res.json({
        success: true,
        message: 'Email template deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting email template:', error)
      res.status(500).json({
        success: false,
        message: 'Error deleting email template',
        error: error.message
      })
    }
  }

  /**
   * Preview email template with sample data
   * @route POST /api/properties/:propertyId/email-templates/:templateId/preview
   */
  async previewTemplate(req, res) {
    try {
      const { propertyId, templateId } = req.params
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId },
        include: [
          {
            model: PropertySettings,
            as: 'settings'
          }
        ]
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      const template = await EmailTemplate.findOne({
        where: { id: templateId, propertyId }
      })

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        })
      }

      // Create sample data
      const sampleData = {
        guest: {
          name: 'John Doe',
          email: 'johndoe@example.com',
          phone: '(555) 123-4567'
        },
        booking: {
          id: 'SAMPLE-123',
          checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nights: 3,
          numberOfGuests: 2,
          totalAmount: 450.00
        },
        property: {
          name: property.name,
          address: property.address,
          city: property.city,
          state: property.state,
          zip: property.zipCode
        },
        pin: {
          lockPin: '1234'
        },
        owner: {
          name: req.user.name || 'Property Owner',
          phone: property.settings?.checkInInstructions || '(555) 987-6543',
          email: req.user.email
        },
        settings: {
          wifiNetwork: property.settings?.wifiNetwork || 'SampleWiFi',
          wifiPassword: property.settings?.wifiPassword || 'samplepassword',
          checkInInstructions: property.settings?.checkInInstructions || 'Check-in is at 3 PM',
          parkingInstructions: property.settings?.parkingInstructions || 'Park in driveway',
          houseRules: property.settings?.houseRules || 'No smoking, No pets'
        }
      }

      // Render template with sample data
      const renderedSubject = this.renderTemplate(template.subject, sampleData)
      const renderedHtml = this.renderTemplate(template.htmlContent, sampleData)

      res.json({
        success: true,
        preview: {
          subject: renderedSubject,
          html: renderedHtml,
          sampleData
        }
      })
    } catch (error) {
      console.error('Error previewing email template:', error)
      res.status(500).json({
        success: false,
        message: 'Error previewing email template',
        error: error.message
      })
    }
  }

  /**
   * Send test email
   * @route POST /api/properties/:propertyId/email-templates/:templateId/test
   */
  async sendTestEmail(req, res) {
    try {
      const { propertyId, templateId } = req.params
      const { testEmail } = req.body
      const userId = req.user.id

      // Verify property ownership
      const property = await Property.findOne({
        where: { id: propertyId, userId },
        include: [
          {
            model: PropertySettings,
            as: 'settings'
          }
        ]
      })

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Property not found or access denied'
        })
      }

      const template = await EmailTemplate.findOne({
        where: { id: templateId, propertyId }
      })

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Email template not found'
        })
      }

      const emailToUse = testEmail || req.user.email

      // Create sample data (same as preview)
      const sampleData = {
        guest: {
          name: 'John Doe',
          email: emailToUse,
          phone: '(555) 123-4567'
        },
        booking: {
          id: 'TEST-123',
          checkIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          checkOut: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          nights: 3,
          numberOfGuests: 2,
          totalAmount: 450.00
        },
        property: {
          name: property.name,
          address: property.address,
          city: property.city,
          state: property.state,
          zip: property.zipCode
        },
        pin: {
          lockPin: '1234'
        },
        owner: {
          name: req.user.name || 'Property Owner',
          phone: '(555) 987-6543',
          email: req.user.email
        },
        settings: {
          wifiNetwork: property.settings?.wifiNetwork || 'SampleWiFi',
          wifiPassword: property.settings?.wifiPassword || 'samplepassword',
          checkInInstructions: property.settings?.checkInInstructions || 'Check-in is at 3 PM',
          parkingInstructions: property.settings?.parkingInstructions || 'Park in driveway',
          houseRules: property.settings?.houseRules || 'No smoking, No pets'
        }
      }

      // Render and send email
      const renderedSubject = this.renderTemplate(template.subject, sampleData)
      const renderedHtml = this.renderTemplate(template.htmlContent, sampleData)

      await emailService.sendCustomEmail(
        emailToUse,
        `[TEST] ${renderedSubject}`,
        renderedHtml
      )

      res.json({
        success: true,
        message: `Test email sent to ${emailToUse}`
      })
    } catch (error) {
      console.error('Error sending test email:', error)
      res.status(500).json({
        success: false,
        message: 'Error sending test email',
        error: error.message
      })
    }
  }

  /**
   * Render template by replacing variables
   */
  renderTemplate(template, data) {
    let rendered = template

    // Replace guest variables
    rendered = rendered.replace(/{guest_name}/g, data.guest.name)
    rendered = rendered.replace(/{guest_email}/g, data.guest.email)
    rendered = rendered.replace(/{guest_phone}/g, data.guest.phone)

    // Replace booking variables
    rendered = rendered.replace(/{booking_id}/g, data.booking.id)
    rendered = rendered.replace(/{check_in_date}/g, data.booking.checkIn)
    rendered = rendered.replace(/{check_out_date}/g, data.booking.checkOut)
    rendered = rendered.replace(/{nights}/g, data.booking.nights)
    rendered = rendered.replace(/{number_of_guests}/g, data.booking.numberOfGuests)
    rendered = rendered.replace(/{total_amount}/g, data.booking.totalAmount)

    // Replace property variables
    rendered = rendered.replace(/{property_name}/g, data.property.name)
    rendered = rendered.replace(/{property_address}/g, data.property.address)
    rendered = rendered.replace(/{property_city}/g, data.property.city)
    rendered = rendered.replace(/{property_state}/g, data.property.state)
    rendered = rendered.replace(/{property_zip}/g, data.property.zip)

    // Replace PIN variable
    rendered = rendered.replace(/{lock_pin}/g, data.pin.lockPin)

    // Replace owner variables
    rendered = rendered.replace(/{owner_name}/g, data.owner.name)
    rendered = rendered.replace(/{owner_phone}/g, data.owner.phone)
    rendered = rendered.replace(/{owner_email}/g, data.owner.email)

    // Replace settings variables
    if (data.settings) {
      rendered = rendered.replace(/{wifi_network}/g, data.settings.wifiNetwork || '')
      rendered = rendered.replace(/{wifi_password}/g, data.settings.wifiPassword || '')
      rendered = rendered.replace(/{check_in_instructions}/g, data.settings.checkInInstructions || '')
      rendered = rendered.replace(/{parking_instructions}/g, data.settings.parkingInstructions || '')
      rendered = rendered.replace(/{house_rules}/g, data.settings.houseRules || '')
    }

    return rendered
  }
}

module.exports = new EmailTemplateController()
