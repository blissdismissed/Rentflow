const express = require('express')
const router = express.Router()
const publicPropertyController = require('../controllers/publicPropertyController')
const publicBookingController = require('../controllers/publicBookingController')
const icalController = require('../controllers/icalController')

/**
 * Public API Routes
 * No authentication required - accessible to all guests
 */

// =====================
// Property Routes
// =====================

// Get all public properties with optional filters
router.get('/properties', publicPropertyController.getPublicProperties)

// Get property by slug
router.get('/properties/:slug', publicPropertyController.getPropertyBySlug)

// Check availability and get pricing
router.get('/properties/:slug/availability', publicPropertyController.checkAvailability)

// =====================
// Booking Routes
// =====================

// Create booking request
router.post('/bookings/request', publicBookingController.createBookingRequest)

// Get booking by confirmation code
router.get('/bookings/:confirmationCode', publicBookingController.getBookingByConfirmationCode)

// iCal export — public feed for OTAs to import (property UUID is the access token)
// OTAs paste: https://aspiretowards.com/api/public/ical/<propertyId>.ics
router.get('/ical/:propertyId', icalController.exportIcal)

module.exports = router
