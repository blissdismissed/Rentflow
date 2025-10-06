const express = require('express')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)

// Integration routes - to be implemented
router.get('/', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/airbnb/connect', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/vrbo/connect', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/booking-com/connect', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/ical', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/:id/sync', (req, res) => res.status(501).json({ message: 'Not implemented' }))

module.exports = router
