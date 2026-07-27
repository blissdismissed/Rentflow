const express = require('express')
const emailTemplateController = require('../controllers/emailTemplateController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication and owner/admin role
router.use(authenticate)
router.use(authorize(['owner', 'admin']))

// Email template routes
router.get('/:propertyId/email-templates', emailTemplateController.getTemplates)
router.get('/:propertyId/email-templates/:templateId', emailTemplateController.getTemplate)
router.post('/:propertyId/email-templates', emailTemplateController.createTemplate)
router.put('/:propertyId/email-templates/:templateId', emailTemplateController.updateTemplate)
router.delete('/:propertyId/email-templates/:templateId', emailTemplateController.deleteTemplate)
router.post('/:propertyId/email-templates/:templateId/preview', emailTemplateController.previewTemplate)
router.post('/:propertyId/email-templates/:templateId/test', emailTemplateController.sendTestEmail)

module.exports = router
