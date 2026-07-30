const Property = require('../models/Property')
const PropertyIcalSource = require('../models/PropertyIcalSource')
const Booking = require('../models/Booking')
const { generatePropertyIcal, syncIcalSource } = require('../services/icalService')
const { Op } = require('sequelize')

class IcalController {
  // GET /api/public/ical/:propertyId.ics
  // Public — no auth. Property UUID is the implicit access token.
  async exportIcal(req, res) {
    try {
      const propertyId = req.params.propertyId.replace(/\.ics$/, '')

      const property = await Property.findOne({
        where: { id: propertyId, isActive: true }
      })
      if (!property) return res.status(404).send('Property not found')

      const bookings = await Booking.findAll({
        where: {
          propertyId,
          bookingStatus: { [Op.in]: ['requested', 'approved', 'confirmed', 'checked_in'] },
          checkOut: { [Op.gte]: new Date() }
        },
        attributes: ['id', 'checkIn', 'checkOut'],
        order: [['checkIn', 'ASC']]
      })

      const ical = generatePropertyIcal(property, bookings)
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${property.slug || propertyId}.ics"`)
      res.send(ical)
    } catch (err) {
      console.error('iCal export error:', err)
      res.status(500).send('Failed to generate calendar')
    }
  }

  // GET /api/properties/:id/ical-sources
  async listSources(req, res) {
    try {
      const property = await Property.findOne({
        where: { id: req.params.id, userId: req.user.id }
      })
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

      const sources = await PropertyIcalSource.findAll({
        where: { propertyId: property.id },
        order: [['createdAt', 'ASC']]
      })
      res.json({ success: true, sources })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // POST /api/properties/:id/ical-sources
  async addSource(req, res) {
    try {
      const { channel, channelName, icalUrl } = req.body
      if (!channel || !icalUrl) {
        return res.status(400).json({ success: false, message: 'channel and icalUrl are required' })
      }
      const validChannels = ['airbnb', 'vrbo', 'booking_com', 'evolve', 'other']
      if (!validChannels.includes(channel)) {
        return res.status(400).json({ success: false, message: `channel must be one of: ${validChannels.join(', ')}` })
      }

      const property = await Property.findOne({
        where: { id: req.params.id, userId: req.user.id }
      })
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

      const source = await PropertyIcalSource.create({
        propertyId: property.id,
        channel,
        channelName: channelName || null,
        icalUrl
      })

      // Kick off an immediate sync in the background
      syncIcalSource(source).catch(err =>
        source.update({ lastSyncedAt: new Date(), lastSyncStatus: 'error', lastSyncError: err.message })
      )

      res.status(201).json({ success: true, source })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // DELETE /api/properties/:id/ical-sources/:sourceId
  async deleteSource(req, res) {
    try {
      const property = await Property.findOne({
        where: { id: req.params.id, userId: req.user.id }
      })
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

      const source = await PropertyIcalSource.findOne({
        where: { id: req.params.sourceId, propertyId: property.id }
      })
      if (!source) return res.status(404).json({ success: false, message: 'Source not found' })

      // Cancel future blocks imported from this source
      await Booking.update(
        { bookingStatus: 'cancelled', status: 'cancelled', cancelledAt: new Date(), cancellationReason: 'Channel disconnected' },
        {
          where: {
            propertyId: property.id,
            channel: source.channel,
            channelBookingId: { [Op.ne]: null },
            bookingStatus: { [Op.notIn]: ['cancelled'] },
            checkOut: { [Op.gte]: new Date() }
          }
        }
      )

      await source.destroy()
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }

  // POST /api/properties/:id/ical-sources/:sourceId/sync
  async syncSource(req, res) {
    try {
      const property = await Property.findOne({
        where: { id: req.params.id, userId: req.user.id }
      })
      if (!property) return res.status(404).json({ success: false, message: 'Property not found' })

      const source = await PropertyIcalSource.findOne({
        where: { id: req.params.sourceId, propertyId: property.id }
      })
      if (!source) return res.status(404).json({ success: false, message: 'Source not found' })

      const result = await syncIcalSource(source)
      await source.reload()
      res.json({ success: true, result, source })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
}

module.exports = new IcalController()
