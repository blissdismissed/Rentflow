const ICAL = require('ical.js')
const axios = require('axios')
const crypto = require('crypto')
const { Op } = require('sequelize')
const Booking = require('../models/Booking')
const PropertyIcalSource = require('../models/PropertyIcalSource')

// ── Export ────────────────────────────────────────────────────────────────────

function escapeIcal(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toIcalDate(dateStr) {
  // '2025-03-15' → '20250315'
  return String(dateStr).replace(/-/g, '').substring(0, 8)
}

function generatePropertyIcal(property, bookings) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AspireTowards//Rentflow//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcal(property.name)}`
  ]

  for (const b of bookings) {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${b.id}@aspiretowards.com`)
    lines.push(`DTSTART;VALUE=DATE:${toIcalDate(b.checkIn)}`)
    lines.push(`DTEND;VALUE=DATE:${toIcalDate(b.checkOut)}`)
    lines.push('SUMMARY:Reserved')
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// ── Import ────────────────────────────────────────────────────────────────────

async function syncIcalSource(source) {
  let response
  try {
    response = await axios.get(source.icalUrl, {
      timeout: 15000,
      headers: { 'User-Agent': 'AspireTowards-Rentflow/1.0' }
    })
  } catch (err) {
    throw new Error(`Failed to fetch iCal URL: ${err.message}`)
  }

  let jCal
  try {
    jCal = ICAL.parse(response.data)
  } catch (err) {
    throw new Error(`Failed to parse iCal data: ${err.message}`)
  }

  const comp = new ICAL.Component(jCal)
  const vevents = comp.getAllSubcomponents('vevent')

  const now = new Date()
  const processedUids = new Set()
  let added = 0

  for (const vevent of vevents) {
    let event
    try {
      event = new ICAL.Event(vevent)
    } catch {
      continue
    }

    const uid = event.uid
    if (!uid) continue

    // Skip cancelled events
    const statusVal = vevent.getFirstPropertyValue('status')
    if (statusVal === 'CANCELLED') continue

    let startDate, endDate
    try {
      startDate = event.startDate.toJSDate()
      endDate = event.endDate.toJSDate()
    } catch {
      continue
    }

    // Skip fully past bookings
    if (endDate <= now) continue

    processedUids.add(uid)

    const checkIn = startDate.toISOString().split('T')[0]
    const checkOut = endDate.toISOString().split('T')[0]
    const nights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)))
    const summary = (event.summary || 'Reserved').substring(0, 255)

    const existing = await Booking.findOne({
      where: { channelBookingId: uid, propertyId: source.propertyId }
    })

    if (existing) {
      if (existing.checkIn !== checkIn || existing.checkOut !== checkOut) {
        await existing.update({ checkIn, checkOut, nights })
      }
    } else {
      const confirmationCode = 'OTA-' + crypto.randomBytes(4).toString('hex').toUpperCase()
      await Booking.create({
        propertyId: source.propertyId,
        channel: source.channel,
        channelBookingId: uid,
        guestName: summary,
        guestEmail: 'noreply@channel-block.internal',
        checkIn,
        checkOut,
        nights,
        baseAmount: 0,
        totalAmount: 0,
        taxes: 0,
        bookingStatus: 'confirmed',
        status: 'confirmed',
        paymentStatus: 'paid',
        confirmationCode
      })
      added++
    }
  }

  // Cancel orphaned blocks (UID no longer in feed = cancelled on OTA side)
  if (processedUids.size > 0) {
    const orphaned = await Booking.findAll({
      where: {
        propertyId: source.propertyId,
        channel: source.channel,
        channelBookingId: {
          [Op.and]: [
            { [Op.ne]: null },
            { [Op.notIn]: [...processedUids] }
          ]
        },
        bookingStatus: { [Op.notIn]: ['cancelled'] },
        checkOut: { [Op.gte]: now }
      }
    })
    for (const b of orphaned) {
      await b.update({
        bookingStatus: 'cancelled',
        status: 'cancelled',
        cancelledAt: now,
        cancellationReason: 'Removed from OTA calendar feed'
      })
    }
  }

  await source.update({
    lastSyncedAt: now,
    lastSyncStatus: 'success',
    lastSyncError: null,
    bookingCount: processedUids.size
  })

  return { added, total: processedUids.size }
}

async function syncAllSources() {
  const sources = await PropertyIcalSource.findAll()
  const results = []

  for (const source of sources) {
    try {
      const result = await syncIcalSource(source)
      results.push({ sourceId: source.id, channel: source.channel, ...result, status: 'success' })
    } catch (err) {
      await source.update({
        lastSyncedAt: new Date(),
        lastSyncStatus: 'error',
        lastSyncError: err.message
      })
      results.push({ sourceId: source.id, channel: source.channel, status: 'error', error: err.message })
    }
  }

  return results
}

module.exports = { generatePropertyIcal, syncIcalSource, syncAllSources }
