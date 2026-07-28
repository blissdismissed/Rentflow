'use strict'

jest.setTimeout(30000)

const request = require('supertest')
const app = require('../../src/server')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const {
  createUser,
  createProperty,
  createFinancialSettings,
  createFinancialMonthly,
  createExpenseItem,
} = require('../utils/factories')

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Financial Controller', () => {
  let testUser, authToken, testProperty
  let otherUser, otherToken, otherProperty

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()

    // Primary test user
    testUser = await createUser({ email: 'owner@example.com', password: 'password123', role: 'owner' })
    testProperty = await createProperty(testUser.id)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' })
    authToken = loginRes.body.data.token

    // Secondary user (to test ownership enforcement)
    otherUser = await createUser({ email: 'other@example.com', password: 'password123', role: 'owner' })
    otherProperty = await createProperty(otherUser.id)
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'other@example.com', password: 'password123' })
    otherToken = otherLogin.body.data.token
  })

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/financials/properties
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /api/financials/properties', () => {
    test('returns 200 with owner properties list', async () => {
      const res = await request(app)
        .get('/api/financials/properties')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.properties)).toBe(true)
      expect(res.body.properties).toHaveLength(1)
      expect(res.body.properties[0].id).toBe(testProperty.id)
    })

    test('each property entry has expected fields', async () => {
      const res = await request(app)
        .get('/api/financials/properties')
        .set('Authorization', `Bearer ${authToken}`)
      const prop = res.body.properties[0]
      expect(prop).toHaveProperty('id')
      expect(prop).toHaveProperty('name')
      expect(prop).toHaveProperty('city')
      expect(prop).toHaveProperty('state')
      expect(prop).toHaveProperty('publiclyVisible')
      expect(prop).toHaveProperty('slug')
      expect(prop).toHaveProperty('financialSettings')
    })

    test('includes financialSettings when they exist', async () => {
      await createFinancialSettings(testProperty.id, { dataSource: 'manual' })
      const res = await request(app)
        .get('/api/financials/properties')
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.body.properties[0].financialSettings).not.toBeNull()
      expect(res.body.properties[0].financialSettings.dataSource).toBe('manual')
    })

    test('does not include another user\'s properties', async () => {
      const res = await request(app)
        .get('/api/financials/properties')
        .set('Authorization', `Bearer ${authToken}`)
      const ids = res.body.properties.map(p => p.id)
      expect(ids).not.toContain(otherProperty.id)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app).get('/api/financials/properties')
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/financials/:propertyId/summary
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /api/financials/:propertyId/summary', () => {
    test('returns 200 with years array and property info', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.years)).toBe(true)
      expect(res.body.property).toHaveProperty('id', testProperty.id)
    })

    test('years array is empty when no monthly data', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.body.years).toHaveLength(0)
    })

    test('years array contains correct year when monthly data exists', async () => {
      await createFinancialMonthly(testProperty.id, { year: 2025, month: 1, grossIncome: 1000 })
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
      const years = res.body.years.map(y => y.year)
      expect(years).toContain(2025)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .get(`/api/financials/${otherProperty.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/summary`)
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // GET /api/financials/:propertyId/year/:year
  // ───────────────────────────────────────────────────────────────────────────

  describe('GET /api/financials/:propertyId/year/:year', () => {
    test('returns 200 with 12 month rows', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.months).toHaveLength(12)
    })

    test('each month has monthName and computed metric fields', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const jan = res.body.months[0]
      expect(jan.month).toBe(1)
      expect(jan.monthName).toBe('January')
      expect(jan).toHaveProperty('grossIncome')
      expect(jan).toHaveProperty('grossExpenses')
      expect(jan).toHaveProperty('netIncome')
      expect(jan).toHaveProperty('occupancyRatio')
      expect(jan).toHaveProperty('avgLengthOfStay')
      expect(jan).toHaveProperty('grossProfits')
    })

    test('existing monthly record values are reflected in response', async () => {
      await createFinancialMonthly(testProperty.id, {
        year: 2025, month: 3, grossIncome: 3500, managementFee: 525
      })
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const march = res.body.months.find(m => m.month === 3)
      expect(march.grossIncome).toBeCloseTo(3500, 2)
      expect(march.managementFee).toBeCloseTo(525, 2)
    })

    test('annualTotals is present and sums months', async () => {
      await createFinancialMonthly(testProperty.id, { year: 2025, month: 1, grossIncome: 1000 })
      await createFinancialMonthly(testProperty.id, { year: 2025, month: 2, grossIncome: 2000 })
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.body.annualTotals).toBeDefined()
      expect(res.body.annualTotals.grossIncome).toBeCloseTo(3000, 2)
    })

    test('expenseItems array is returned', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(Array.isArray(res.body.expenseItems)).toBe(true)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .get(`/api/financials/${otherProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/financials/:propertyId/monthly
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/financials/:propertyId/monthly (upsert monthly)', () => {
    test('creates new monthly record', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 5, grossIncome: 2500, managementFee: 375 })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.record).toBeDefined()
    })

    test('created record appears in subsequent GET year detail', async () => {
      await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 6, grossIncome: 1800 })

      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const june = res.body.months.find(m => m.month === 6)
      expect(june.grossIncome).toBeCloseTo(1800, 2)
    })

    test('upserts (updates) existing record', async () => {
      // Create first
      await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 7, grossIncome: 1000 })

      // Upsert with new value
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 7, grossIncome: 2000 })
      expect(res.status).toBe(200)

      // Verify updated value
      const getRes = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const july = getRes.body.months.find(m => m.month === 7)
      expect(july.grossIncome).toBeCloseTo(2000, 2)
    })

    test('skipIfExists skips update when record already exists', async () => {
      await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 8, grossIncome: 1000 })

      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 8, grossIncome: 9999, skipIfExists: true })
      expect(res.status).toBe(200)
      expect(res.body.skipped).toBe(true)

      // Verify original value preserved
      const getRes = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const aug = getRes.body.months.find(m => m.month === 8)
      expect(aug.grossIncome).toBeCloseTo(1000, 2)
    })

    test('400 when year or month missing', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ grossIncome: 1000 })
      expect(res.status).toBe(400)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .post(`/api/financials/${otherProperty.id}/monthly`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 1, grossIncome: 1000 })
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/monthly`)
        .send({ year: 2025, month: 1, grossIncome: 1000 })
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/financials/:propertyId/expenses (addExpenseItem)
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/financials/:propertyId/expenses', () => {
    test('creates expense item and returns 201', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/expenses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          year: 2025,
          month: 1,
          expenseName: 'Plumber',
          amount: 350,
          tag: 'maintenance',
          expenseDate: '2025-01-10'
        })
      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.item).toBeDefined()
      expect(res.body.item.expenseName).toBe('Plumber')
    })

    test('created expense item appears in GET year detail expenseItems', async () => {
      await request(app)
        .post(`/api/financials/${testProperty.id}/expenses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          year: 2025,
          month: 2,
          expenseName: 'Pool Cleaning',
          amount: 150,
          tag: 'maintenance',
          expenseDate: '2025-02-05'
        })

      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const found = res.body.expenseItems.some(e => e.expenseName === 'Pool Cleaning')
      expect(found).toBe(true)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .post(`/api/financials/${otherProperty.id}/expenses`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, month: 1, expenseName: 'Test', amount: 100, tag: 'other' })
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/expenses`)
        .send({ year: 2025, month: 1, expenseName: 'Test', amount: 100, tag: 'other' })
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // PUT /api/financials/expenses/:id (updateExpenseItem)
  // ───────────────────────────────────────────────────────────────────────────

  describe('PUT /api/financials/expenses/:id', () => {
    test('updates expense item and returns updated values', async () => {
      const item = await createExpenseItem(testProperty.id, {
        year: 2025, month: 1, expenseName: 'Old Name', amount: 100, tag: 'maintenance'
      })

      const res = await request(app)
        .put(`/api/financials/expenses/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ expenseName: 'New Name', amount: 250 })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.item.expenseName).toBe('New Name')
      expect(parseFloat(res.body.item.amount)).toBeCloseTo(250, 2)
    })

    test('updated values reflected in subsequent GET', async () => {
      const item = await createExpenseItem(testProperty.id, {
        year: 2025, month: 3, expenseName: 'Repair', amount: 100, tag: 'maintenance'
      })

      await request(app)
        .put(`/api/financials/expenses/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 500 })

      const getRes = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const found = getRes.body.expenseItems.find(e => e.id === item.id)
      expect(parseFloat(found.amount)).toBeCloseTo(500, 2)
    })

    test('403 when updating another user\'s property expense', async () => {
      const item = await createExpenseItem(otherProperty.id, {
        year: 2025, month: 1, expenseName: 'Other Expense', amount: 100, tag: 'maintenance'
      })

      const res = await request(app)
        .put(`/api/financials/expenses/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ expenseName: 'Hacked' })
      expect(res.status).toBe(403)
    })

    test('404 for non-existent expense item', async () => {
      const res = await request(app)
        .put(`/api/financials/expenses/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 100 })
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const item = await createExpenseItem(testProperty.id, {
        year: 2025, month: 1, amount: 100, tag: 'maintenance'
      })
      const res = await request(app)
        .put(`/api/financials/expenses/${item.id}`)
        .send({ amount: 200 })
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE /api/financials/expenses/:id (deleteExpenseItem)
  // ───────────────────────────────────────────────────────────────────────────

  describe('DELETE /api/financials/expenses/:id', () => {
    test('deletes expense item and returns success', async () => {
      const item = await createExpenseItem(testProperty.id, {
        year: 2025, month: 1, expenseName: 'Delete Me', amount: 100, tag: 'maintenance'
      })

      const res = await request(app)
        .delete(`/api/financials/expenses/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('deleted item no longer appears in GET year detail', async () => {
      const item = await createExpenseItem(testProperty.id, {
        year: 2025, month: 4, expenseName: 'Gone', amount: 100, tag: 'maintenance'
      })

      await request(app)
        .delete(`/api/financials/expenses/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      const getRes = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const found = getRes.body.expenseItems.find(e => e.id === item.id)
      expect(found).toBeUndefined()
    })

    test('403 when deleting another user\'s property expense', async () => {
      const item = await createExpenseItem(otherProperty.id, {
        year: 2025, month: 1, expenseName: 'Other', amount: 100, tag: 'maintenance'
      })

      const res = await request(app)
        .delete(`/api/financials/expenses/${item.id}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(403)
    })

    test('404 for non-existent expense item', async () => {
      const res = await request(app)
        .delete(`/api/financials/expenses/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const item = await createExpenseItem(testProperty.id, {
        year: 2025, month: 1, amount: 100, tag: 'maintenance'
      })
      const res = await request(app)
        .delete(`/api/financials/expenses/${item.id}`)
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/financials/:propertyId/annual-config
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/financials/:propertyId/annual-config', () => {
    test('creates annual config and returns it', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/annual-config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, scheduledMortgage: 1500, taxesInsurance: 2400, notes: 'Test notes' })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.config).toBeDefined()
      expect(parseFloat(res.body.config.scheduledMortgage)).toBeCloseTo(1500, 2)
    })

    test('400 when year is missing', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/annual-config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scheduledMortgage: 1500 })
      expect(res.status).toBe(400)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .post(`/api/financials/${otherProperty.id}/annual-config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025 })
      expect(res.status).toBe(404)
    })

    test('scheduledMortgage used in extraPaid calculation in year detail', async () => {
      await request(app)
        .post(`/api/financials/${testProperty.id}/annual-config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ year: 2025, scheduledMortgage: 1000 })

      await createFinancialMonthly(testProperty.id, {
        year: 2025, month: 1, actualMortgagePaid: 1200
      })

      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const jan = res.body.months[0]
      expect(jan.extraPaid).toBeCloseTo(1200 - 1000, 2)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/financials/:propertyId/settings
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/financials/:propertyId/settings', () => {
    test('creates financial settings', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchasePrice: 350000, dataSource: 'manual', wtrSplitMode: 'split' })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(parseFloat(res.body.settings.purchasePrice)).toBeCloseTo(350000, 2)
    })

    test('updates existing financial settings', async () => {
      await createFinancialSettings(testProperty.id, { purchasePrice: 300000 })

      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ purchasePrice: 400000 })
      expect(res.status).toBe(200)
      expect(parseFloat(res.body.settings.purchasePrice)).toBeCloseTo(400000, 2)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .post(`/api/financials/${otherProperty.id}/settings`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ dataSource: 'manual' })
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/settings`)
        .send({ dataSource: 'manual' })
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE /api/financials/:propertyId/monthly/:monthlyId
  // ───────────────────────────────────────────────────────────────────────────

  describe('DELETE /api/financials/:propertyId/monthly/:monthlyId', () => {
    test('deletes monthly record and returns success', async () => {
      const monthly = await createFinancialMonthly(testProperty.id, { year: 2025, month: 6 })

      const res = await request(app)
        .delete(`/api/financials/${testProperty.id}/monthly/${monthly.id}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })

    test('deleted record no longer has an id in GET year detail', async () => {
      const monthly = await createFinancialMonthly(testProperty.id, { year: 2025, month: 7, grossIncome: 1234 })

      await request(app)
        .delete(`/api/financials/${testProperty.id}/monthly/${monthly.id}`)
        .set('Authorization', `Bearer ${authToken}`)

      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      const july = res.body.months.find(m => m.month === 7)
      // After deletion, July should have no DB record (id is null)
      expect(july.id).toBeNull()
    })

    test('404 for non-existent monthly record', async () => {
      const res = await request(app)
        .delete(`/api/financials/${testProperty.id}/monthly/00000000-0000-0000-0000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })

    test('404 for another user\'s property', async () => {
      const monthly = await createFinancialMonthly(otherProperty.id, { year: 2025, month: 1 })
      const res = await request(app)
        .delete(`/api/financials/${otherProperty.id}/monthly/${monthly.id}`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // DELETE /api/financials/:propertyId/year/:year
  // ───────────────────────────────────────────────────────────────────────────

  describe('DELETE /api/financials/:propertyId/year/:year', () => {
    test('deletes all monthly records for the year', async () => {
      await createFinancialMonthly(testProperty.id, { year: 2024, month: 1 })
      await createFinancialMonthly(testProperty.id, { year: 2024, month: 2 })

      const res = await request(app)
        .delete(`/api/financials/${testProperty.id}/year/2024`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.monthlyDeleted).toBe(2)
    })

    test('year no longer appears in summary after deletion', async () => {
      await createFinancialMonthly(testProperty.id, { year: 2023, month: 1 })

      await request(app)
        .delete(`/api/financials/${testProperty.id}/year/2023`)
        .set('Authorization', `Bearer ${authToken}`)

      const res = await request(app)
        .get(`/api/financials/${testProperty.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`)
      const years = res.body.years.map(y => y.year)
      expect(years).not.toContain(2023)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .delete(`/api/financials/${otherProperty.id}/year/2025`)
        .set('Authorization', `Bearer ${authToken}`)
      expect(res.status).toBe(404)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // POST /api/financials/:propertyId/expenses/batch
  // ───────────────────────────────────────────────────────────────────────────

  describe('POST /api/financials/:propertyId/expenses/batch', () => {
    test('saves multiple expense items in a batch', async () => {
      const items = [
        { expenseName: 'Water Bill', amount: 75, tag: 'utilities', year: 2025, month: 1, expenseDate: '2025-01-10', vendor: 'utility-co' },
        { expenseName: 'Maintenance Visit', amount: 200, tag: 'maintenance', year: 2025, month: 1, expenseDate: '2025-01-15', vendor: 'handyman' },
      ]
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/expenses/batch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(Array.isArray(res.body.created)).toBe(true)
      expect(res.body.created).toHaveLength(2)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .post(`/api/financials/${otherProperty.id}/expenses/batch`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ items: [{ expenseName: 'Test', amount: 50, tag: 'other', year: 2025, month: 1 }] })
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .post(`/api/financials/${testProperty.id}/expenses/batch`)
        .send({ items: [] })
      expect(res.status).toBe(401)
    })
  })

  // ───────────────────────────────────────────────────────────────────────────
  // PATCH /api/financials/:propertyId/visibility
  // ───────────────────────────────────────────────────────────────────────────

  describe('PATCH /api/financials/:propertyId/visibility', () => {
    test('toggles publiclyVisible and returns new value', async () => {
      const res = await request(app)
        .patch(`/api/financials/${testProperty.id}/visibility`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ publiclyVisible: false })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.publiclyVisible).toBe(false)
    })

    test('404 for another user\'s property', async () => {
      const res = await request(app)
        .patch(`/api/financials/${otherProperty.id}/visibility`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ publiclyVisible: false })
      expect(res.status).toBe(404)
    })

    test('401 when unauthenticated', async () => {
      const res = await request(app)
        .patch(`/api/financials/${testProperty.id}/visibility`)
        .send({ publiclyVisible: false })
      expect(res.status).toBe(401)
    })
  })
})
