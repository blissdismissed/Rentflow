const express = require('express')
const propertySettingsController = require('../controllers/propertySettingsController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication and owner/admin role
router.use(authenticate)
router.use(authorize(['owner', 'admin']))

// Property settings routes
router.get('/:propertyId/settings', propertySettingsController.getSettings)
router.put('/:propertyId/settings', propertySettingsController.updateSettings)
router.post('/:propertyId/settings/toggle-pins', propertySettingsController.toggleRotatingPins)

module.exports = router
