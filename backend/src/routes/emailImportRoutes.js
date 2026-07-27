const express = require('express')
const multer = require('multer')
const { processEmailImport } = require('../controllers/emailImportController')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } })

// POST /api/import/email — SendGrid Inbound Parse webhook
// SendGrid sends multipart/form-data with email fields + file attachments
router.post('/email', upload.any(), processEmailImport)

module.exports = router
