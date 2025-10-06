const express = require('express')
const { authenticate } = require('../middleware/auth')
// const bookingController = require('../controllers/bookingController')

const router = express.Router()

router.use(authenticate)

// TODO: Implement booking routes
router.get('/', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.get('/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.put('/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.delete('/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }))

module.exports = router
