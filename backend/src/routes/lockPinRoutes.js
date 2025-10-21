const express = require('express')
const lockPinController = require('../controllers/lockPinController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication and owner/admin role
router.use(authenticate)
router.use(authorize(['owner', 'admin']))

// Lock PIN management routes
router.get('/:propertyId/lock-pins', lockPinController.getLockPins)
router.post('/:propertyId/lock-pins', lockPinController.addLockPin)
router.put('/:propertyId/lock-pins/:pinId', lockPinController.updateLockPin)
router.delete('/:propertyId/lock-pins/:pinId', lockPinController.deleteLockPin)
router.put('/:propertyId/lock-pins/reorder', lockPinController.reorderLockPins)
router.get('/:propertyId/lock-pins/history', lockPinController.getPinHistory)

module.exports = router
