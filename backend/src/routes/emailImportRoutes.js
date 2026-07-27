const express = require('express')
const { processEmailImport } = require('../controllers/emailImportController')

const router = express.Router()

// POST /api/import/email — Resend inbound webhook (JSON)
router.post('/email', processEmailImport)

module.exports = router
