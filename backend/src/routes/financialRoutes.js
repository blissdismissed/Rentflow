const express = require('express')
const { authenticate } = require('../middleware/auth')
const {
  getFinancialProperties,
  getPropertySummary,
  getYearDetail,
  upsertMonthly,
  upsertAnnualConfig,
  upsertFinancialSettings,
  addExpenseItem,
  updateExpenseItem,
  deleteExpenseItem,
  toggleVisibility
} = require('../controllers/financialController')

const router = express.Router()
router.use(authenticate)

router.get('/properties', getFinancialProperties)
router.get('/:propertyId/summary', getPropertySummary)
router.get('/:propertyId/year/:year', getYearDetail)
router.post('/:propertyId/monthly', upsertMonthly)
router.post('/:propertyId/annual-config', upsertAnnualConfig)
router.post('/:propertyId/settings', upsertFinancialSettings)
router.post('/:propertyId/expenses', addExpenseItem)
router.put('/expenses/:id', updateExpenseItem)
router.delete('/expenses/:id', deleteExpenseItem)
router.patch('/:propertyId/visibility', toggleVisibility)

module.exports = router
