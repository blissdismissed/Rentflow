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
  deleteYear,
  addExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  toggleVisibility,
  parseCaribbeaStatement,
  importBookingTransactions,
} = require('../controllers/financialController')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

router.use(authenticate)

router.get('/properties', getFinancialProperties)
router.post('/parse-caribbean-statement', upload.single('file'), parseCaribbeaStatement)
router.get('/:propertyId/summary', getPropertySummary)
router.get('/:propertyId/year/:year', getYearDetail)
router.post('/:propertyId/monthly', upsertMonthly)
router.post('/:propertyId/annual-config', upsertAnnualConfig)
router.post('/:propertyId/year-summary', upsertYearSummary)
router.post('/:propertyId/booking-transactions', importBookingTransactions)
router.post('/:propertyId/settings', upsertFinancialSettings)
router.delete('/:propertyId/year/:year', deleteYear)
router.delete('/:propertyId/monthly/:monthlyId', deleteMonthly)
router.post('/:propertyId/expenses', addExpenseItem)
router.put('/expenses/:id', updateExpenseItem)
router.delete('/expenses/:id', deleteExpenseItem)
router.patch('/:propertyId/visibility', toggleVisibility)

module.exports = router
