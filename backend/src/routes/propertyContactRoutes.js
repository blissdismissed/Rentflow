const express = require('express')
const propertyContactController = require('../controllers/propertyContactController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication and owner/admin role
router.use(authenticate)
router.use(authorize(['owner', 'admin']))

// Property contact routes
router.get('/:propertyId/contacts', propertyContactController.getPropertyContacts)
router.post('/:propertyId/contacts', propertyContactController.createPropertyContact)
router.put('/:propertyId/contacts/:id', propertyContactController.updatePropertyContact)
router.delete('/:propertyId/contacts/:id', propertyContactController.deletePropertyContact)

module.exports = router
