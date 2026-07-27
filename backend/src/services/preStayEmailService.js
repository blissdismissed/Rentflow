const {
  Booking,
  Property,
  PropertySettings,
  PropertyLockPin,
  EmailTemplate,
  User
} = require('../models')
const emailService = require('./emailService')
const { Op } = require('sequelize')
const crypto = require('crypto')

/**
 * Pre-Stay Email Service
 * Handles automated pre-stay emails with PIN rotation
 */
class PreStayEmailService {
  /**
   * Get next available PIN for a property (round-robin rotation)
   * @param {string} propertyId - Property ID
   * @returns {Object} - { pin: string, pinId: string, pinRecord: PropertyLockPin }
   */
  async getNextRotatingPin(propertyId) {
    try {
      // Get property settings
      const settings = await PropertySettings.findOne({
        where: { propertyId }
      })

      if (!settings || !settings.rotatingPinsEnabled) {
        return null
      }

      // Get all active PINs ordered by rotation index
      const pins = await PropertyLockPin.findAll({
        where: {
          propertyId,
          isActive: true
        },
        order: [['orderIndex', 'ASC']]
      })

      if (pins.length === 0) {
        console.log(`No active PINs found for property ${propertyId}`)
        return null
      }

      // Get current rotation index
      const currentIndex = settings.currentPinIndex || 0

      // Get the PIN at current index (wrap around if needed)
      const pinIndex = currentIndex % pins.length
      const selectedPin = pins[pinIndex]

      // Update last used time and usage count
      selectedPin.lastUsedAt = new Date()
      selectedPin.usageCount += 1
      await selectedPin.save()

      // Update settings to next index
      settings.currentPinIndex = (currentIndex + 1) % pins.length
      await settings.save()

      console.log(`✅ Assigned PIN at index ${pinIndex} for property ${propertyId}`)

      return {
        pin: this.decryptPin(selectedPin.pin),
        pinId: selectedPin.id,
        pinRecord: selectedPin
      }
    } catch (error) {
      console.error('Error getting next rotating PIN:', error)
      throw error
    }
  }

  /**
   * Assign PIN to booking
   * @param {Object} booking - Booking object
   * @returns {string|null} - Assigned PIN or null
   */
  async assignPinToBooking(booking) {
    try {
      const pinData = await this.getNextRotatingPin(booking.propertyId)

      if (!pinData) {
        console.log(`No PIN assigned for booking ${booking.id}`)
        return null
      }

      // Update booking with assigned PIN
      booking.assignedLockPin = pinData.pin
      booking.lockPinId = pinData.pinId
      await booking.save()

      console.log(`✅ PIN assigned to booking ${booking.id}`)
      return pinData.pin
    } catch (error) {
      console.error('Error assigning PIN to booking:', error)
      throw error
    }
  }

  /**
   * Send pre-stay email for a booking
   * @param {string} bookingId - Booking ID
   */
  async sendPreStayEmail(bookingId) {
    try {
      // Get booking with all related data
      const booking = await Booking.findByPk(bookingId, {
        include: [
          {
            model: Property,
            as: 'property',
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email']
              },
              {
                model: PropertySettings,
                as: 'settings'
              },
              {
                model: EmailTemplate,
                as: 'emailTemplates',
                where: {
                  templateType: 'pre_stay',
                  isActive: true
                },
                required: false
              }
            ]
          },
          {
            model: PropertyLockPin,
            as: 'lockPin'
          }
        ]
      })

      if (!booking) {
        throw new Error(`Booking ${bookingId} not found`)
      }

      const property = booking.property
      const settings = property.settings

      // Check if pre-stay emails are enabled
      if (!settings || !settings.preStayEmailEnabled) {
        console.log(`Pre-stay emails not enabled for property ${property.id}`)
        return { success: false, reason: 'Pre-stay emails not enabled' }
      }

      // Check if email already sent
      if (booking.preStayEmailSentAt) {
        console.log(`Pre-stay email already sent for booking ${booking.id}`)
        return { success: false, reason: 'Email already sent' }
      }

      // Get or assign PIN if rotating pins are enabled
      let assignedPin = booking.assignedLockPin
      if (settings.rotatingPinsEnabled && !assignedPin) {
        assignedPin = await this.assignPinToBooking(booking)
      }

      // Get active pre-stay template
      let template = property.emailTemplates && property.emailTemplates.length > 0
        ? property.emailTemplates[0]
        : null

      // If no custom template, use default
      if (!template) {
        template = this.getDefaultPreStayTemplate()
      }

      // Prepare template data
      const templateData = {
        guest: {
          name: booking.guestName,
          email: booking.guestEmail,
          phone: booking.guestPhone
        },
        booking: {
          id: booking.id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          nights: booking.nights,
          numberOfGuests: booking.numberOfGuests,
          totalAmount: booking.totalAmount
        },
        property: {
          name: property.name,
          address: property.address,
          city: property.city,
          state: property.state,
          zip: property.zipCode
        },
        pin: {
          lockPin: assignedPin || 'N/A'
        },
        owner: {
          name: property.owner.name || 'Property Owner',
          phone: settings.checkInInstructions || '',
          email: property.owner.email
        },
        settings: {
          wifiNetwork: settings.wifiNetwork || '',
          wifiPassword: settings.wifiPassword || '',
          checkInInstructions: settings.checkInInstructions || '',
          parkingInstructions: settings.parkingInstructions || '',
          houseRules: settings.houseRules || ''
        }
      }

      // Render template
      const renderedSubject = this.renderTemplate(template.subject, templateData)
      const renderedHtml = this.renderTemplate(template.htmlContent, templateData)

      // Send email
      await emailService.sendCustomEmail(
        booking.guestEmail,
        renderedSubject,
        renderedHtml
      )

      // Mark email as sent
      booking.preStayEmailSentAt = new Date()
      await booking.save()

      console.log(`✅ Pre-stay email sent for booking ${booking.id}`)
      return { success: true, booking, assignedPin }
    } catch (error) {
      console.error('Error sending pre-stay email:', error)
      throw error
    }
  }

  /**
   * Process all bookings that need pre-stay emails
   * Called by scheduled job
   */
  async processPreStayEmails() {
    try {
      console.log('🔄 Processing pre-stay emails...')

      // Get all bookings that:
      // 1. Are approved
      // 2. Haven't had pre-stay email sent yet
      // 3. Check-in date is within the configured days
      const bookings = await Booking.findAll({
        where: {
          status: 'approved',
          preStayEmailSentAt: null,
          checkIn: {
            [Op.gte]: new Date(),
            [Op.lte]: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Next 14 days
          }
        },
        include: [
          {
            model: Property,
            as: 'property',
            include: [
              {
                model: PropertySettings,
                as: 'settings',
                where: {
                  preStayEmailEnabled: true
                }
              }
            ]
          }
        ]
      })

      console.log(`Found ${bookings.length} bookings to process`)

      const results = {
        processed: 0,
        sent: 0,
        skipped: 0,
        errors: 0
      }

      for (const booking of bookings) {
        try {
          results.processed++

          const settings = booking.property.settings
          const daysBeforeCheckIn = settings.preStayEmailDays || 3

          // Calculate days until check-in
          const checkInDate = new Date(booking.checkIn)
          const today = new Date()
          const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24))

          // Only send if within the configured days window
          if (daysUntilCheckIn <= daysBeforeCheckIn && daysUntilCheckIn >= 0) {
            await this.sendPreStayEmail(booking.id)
            results.sent++
          } else {
            console.log(`Booking ${booking.id}: ${daysUntilCheckIn} days until check-in (configured: ${daysBeforeCheckIn})`)
            results.skipped++
          }
        } catch (error) {
          console.error(`Error processing booking ${booking.id}:`, error)
          results.errors++
        }
      }

      console.log(`✅ Pre-stay email processing complete:`, results)
      return results
    } catch (error) {
      console.error('Error processing pre-stay emails:', error)
      throw error
    }
  }

  /**
   * Default pre-stay email template
   */
  getDefaultPreStayTemplate() {
    return {
      subject: 'Welcome to {property_name} - Check-in Information',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2c3e50;">Welcome to {property_name}!</h1>

          <p>Hi {guest_name},</p>

          <p>We're excited to host you! Here's your check-in information for your upcoming stay:</p>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2c3e50;">Booking Details</h2>
            <p><strong>Booking ID:</strong> {booking_id}</p>
            <p><strong>Check-in:</strong> {check_in_date}</p>
            <p><strong>Check-out:</strong> {check_out_date}</p>
            <p><strong>Nights:</strong> {nights}</p>
            <p><strong>Guests:</strong> {number_of_guests}</p>
          </div>

          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2c3e50;">Property Information</h2>
            <p><strong>Address:</strong><br>
            {property_address}<br>
            {property_city}, {property_state} {property_zip}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2c3e50;">🔑 Lock PIN Code</h2>
            <p style="font-size: 24px; font-weight: bold; color: #856404;">{lock_pin}</p>
            <p style="font-size: 12px; color: #856404;">Please keep this PIN secure and do not share it.</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2c3e50;">📶 WiFi Information</h2>
            <p><strong>Network:</strong> {wifi_network}</p>
            <p><strong>Password:</strong> {wifi_password}</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2c3e50;">Check-in Instructions</h2>
            <p>{check_in_instructions}</p>

            <h3 style="color: #2c3e50;">Parking</h3>
            <p>{parking_instructions}</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #2c3e50;">House Rules</h2>
            <p>{house_rules}</p>
          </div>

          <p>If you have any questions or need assistance during your stay, please don't hesitate to contact us.</p>

          <p>Enjoy your stay!<br>
          {owner_name}<br>
          {owner_email}</p>
        </div>
      `
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
      rendered = rendered.replace(/{wifi_network}/g, data.settings.wifiNetwork || 'Not provided')
      rendered = rendered.replace(/{wifi_password}/g, data.settings.wifiPassword || 'Not provided')
      rendered = rendered.replace(/{check_in_instructions}/g, data.settings.checkInInstructions || 'Standard check-in time is 3:00 PM')
      rendered = rendered.replace(/{parking_instructions}/g, data.settings.parkingInstructions || 'Parking available on premises')
      rendered = rendered.replace(/{house_rules}/g, data.settings.houseRules || 'Please respect the property and neighbors')
    }

    return rendered
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

module.exports = new PreStayEmailService()
