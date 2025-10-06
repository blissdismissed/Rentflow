const express = require('express')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)

// Payment routes - to be implemented
router.post('/stripe/create-intent', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/venmo/create', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/crypto/create', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/webhook/stripe', (req, res) => res.status(501).json({ message: 'Not implemented' }))

module.exports = router
