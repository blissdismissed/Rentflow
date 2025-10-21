const express = require('express')
const guestController = require('../controllers/guestController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication and owner/admin role
router.use(authenticate)
router.use(authorize(['owner', 'admin']))

// Guest management routes
router.get('/', guestController.getGuests)
router.get('/stats', guestController.getGuestStats)
router.get('/export/csv', guestController.exportGuestsCSV)
router.get('/:id', guestController.getGuestById)
router.put('/:id', guestController.updateGuest)
router.put('/stays/:stayId/rate', guestController.rateGuestStay)

module.exports = router
