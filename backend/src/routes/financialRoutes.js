const express = require('express')
const multer = require('multer')
const { authenticate } = require('../middleware/auth')
const {
  getFinancialProperties,
  getPropertySummary,
  getYearDetail,
  upsertMonthly,
  upsertAnnualConfig,
  upsertFinancialSettings,
  upsertYearSummary,
  deleteMonthly,
  deleteMonthlyBatch,
  deleteYear,
  undoBookingTransactions,
  addExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  toggleVisibility,
  parseCaribbeaStatement,
  parseBromleyPdf,
  importBookingTransactions,
} = require('../controllers/financialController')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(authenticate)

router.get('/properties', getFinancialProperties)
router.post('/parse-caribbean-statement', upload.single('file'), parseCaribbeaStatement)
router.post('/parse-bromley-pdf', upload.single('file'), parseBromleyPdf)
router.get('/:propertyId/summary', getPropertySummary)
router.get('/:propertyId/year/:year', getYearDetail)
router.post('/:propertyId/monthly', upsertMonthly)
router.post('/:propertyId/annual-config', upsertAnnualConfig)
router.post('/:propertyId/year-summary', upsertYearSummary)
router.post('/:propertyId/booking-transactions', importBookingTransactions)
router.post('/:propertyId/settings', upsertFinancialSettings)
router.delete('/:propertyId/year/:year', deleteYear)
router.delete('/:propertyId/monthly/:monthlyId', deleteMonthly)
router.delete('/:propertyId/monthly-batch', deleteMonthlyBatch)
router.delete('/:propertyId/booking-transactions-undo', undoBookingTransactions)
router.post('/:propertyId/expenses', addExpenseItem)
router.put('/expenses/:id', updateExpenseItem)
router.delete('/expenses/:id', deleteExpenseItem)
router.patch('/:propertyId/visibility', toggleVisibility)

module.exports = router
