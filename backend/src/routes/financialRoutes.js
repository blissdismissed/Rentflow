const express = require('express')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.use(authenticate)

// Financial routes - to be implemented
router.get('/', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.get('/summary', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.get('/reports', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.post('/', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.put('/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }))
router.delete('/:id', (req, res) => res.status(501).json({ message: 'Not implemented' }))

module.exports = router
