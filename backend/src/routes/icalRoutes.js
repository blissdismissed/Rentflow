const express = require('express')
const icalController = require('../controllers/icalController')
const { authenticate, authorize } = require('../middleware/auth')

const router = express.Router({ mergeParams: true }) // mergeParams to access :id from parent

router.use(authenticate)
router.use(authorize('owner', 'admin'))

router.get('/ical-sources', icalController.listSources)
router.post('/ical-sources', icalController.addSource)
router.delete('/ical-sources/:sourceId', icalController.deleteSource)
router.post('/ical-sources/:sourceId/sync', icalController.syncSource)

module.exports = router
