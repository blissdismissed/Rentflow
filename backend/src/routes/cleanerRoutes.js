const express = require('express')
const cleanerController = require('../controllers/cleanerController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Cleaner calendar (for cleaner role)
router.get('/calendar', authorize(['cleaner']), cleanerController.getCleanerCalendar)

// Cleaner management (for owners and admins)
router.get('/', authorize(['owner', 'admin']), cleanerController.getCleaners)
router.post('/', authorize(['owner', 'admin']), cleanerController.createCleaner)
router.put('/:id', authorize(['owner', 'admin']), cleanerController.updateCleaner)
router.delete('/:id', authorize(['owner', 'admin']), cleanerController.deleteCleaner)

module.exports = router
