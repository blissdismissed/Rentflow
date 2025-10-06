const express = require('express')
const { body } = require('express-validator')
const propertyController = require('../controllers/propertyController')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validator')

const router = express.Router()

// Validation rules
const propertyValidation = [
  body('name').trim().notEmpty().withMessage('Property name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be a positive number')
]

// All routes require authentication
router.use(authenticate)

// Property CRUD
router.get('/', propertyController.getProperties)
router.get('/:id', propertyController.getPropertyById)
router.post('/', propertyValidation, validate, propertyController.createProperty)
router.put('/:id', propertyController.updateProperty)
router.delete('/:id', propertyController.deleteProperty)

// Property images
router.post('/:id/images', propertyController.uploadImages)
router.delete('/:id/images/:imageId', propertyController.deleteImage)

// Property availability
router.get('/:id/availability', propertyController.getAvailability)
router.post('/:id/availability/block', propertyController.blockDates)

module.exports = router
