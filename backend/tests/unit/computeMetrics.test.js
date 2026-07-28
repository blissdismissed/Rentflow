'use strict'

jest.setTimeout(30000)

/**
 * Tests for computeMonthMetrics logic.
 *
 * computeMonthMetrics is NOT in module.exports, so we verify the financial
 * derivations by calling the GET /api/financials/:propertyId/year/:year
 * endpoint via Supertest with known FinancialMonthly inputs and asserting
 * the computed fields returned in each month object.
 */

const request = require('supertest')
const app = require('../../src/server')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const { createUser, createProperty, createFinancialMonthly } = require('../utils/factories')

// days in each month of a non-leap year (2025) and leap year (2024)
const DAYS_IN_2025 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
const DAYS_IN_2024 = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

describe('computeMonthMetrics (via getYearDetail endpoint)', () => {
  let testUser, authToken, testProperty

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()
    testUser = await createUser({ email: 'metrics@example.com', password: 'password123', role: 'owner' })
    testProperty = await createProperty(testUser.id)
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'metrics@example.com', password: 'password123' })
    authToken = res.body.data.token
  })

  async function getMonth(year, month) {
    const res = await request(app)
      .get(`/api/financials/${testProperty.id}/year/${year}`)
      .set('Authorization', `Bearer ${authToken}`)
    expect(res.status).toBe(200)
    return res.body.months.find(m => m.month === month)
  }

  test('grossExpenses = cleaningFee + utilities + maintenance + otherExpenses + platformCharges', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 1,
      cleaningFee: 200,
      utilities: 50,
      maintenance: 30,
      otherExpenses: 20,
      platformCharges: 10,
    })
    const m = await getMonth(2025, 1)
    expect(m.grossExpenses).toBeCloseTo(200 + 50 + 30 + 20 + 10, 2)
  })

  test('netIncome = grossIncome - managementFee - grossExpenses', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 2,
      grossIncome: 3000,
      managementFee: 450,
      cleaningFee: 300,
      utilities: 0,
      maintenance: 0,
      otherExpenses: 0,
      platformCharges: 0,
    })
    const m = await getMonth(2025, 2)
    expect(m.netIncome).toBeCloseTo(3000 - 450 - 300, 2)
  })

  test('occupancyRatio = nightsBooked / daysInMonth', async () => {
    // January 2025 has 31 days
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 1,
      nightsBooked: 20,
    })
    const m = await getMonth(2025, 1)
    expect(m.occupancyRatio).toBeCloseTo(20 / DAYS_IN_2025[0], 4)
  })

  test('occupancyRatio uses correct days for February in non-leap year (28 days)', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 2,
      nightsBooked: 14,
    })
    const m = await getMonth(2025, 2)
    expect(m.occupancyRatio).toBeCloseTo(14 / 28, 4)
  })

  test('occupancyRatio uses correct days for February in leap year (29 days)', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2024, month: 2,
      nightsBooked: 14,
    })
    const m = await getMonth(2024, 2)
    expect(m.occupancyRatio).toBeCloseTo(14 / 29, 4)
  })

  test('avgLengthOfStay = nightsBooked / numReservations', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 3,
      nightsBooked: 18,
      numReservations: 3,
    })
    const m = await getMonth(2025, 3)
    expect(m.avgLengthOfStay).toBeCloseTo(18 / 3, 4)
  })

  test('avgLengthOfStay is 0 when numReservations is 0', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 4,
      nightsBooked: 0,
      numReservations: 0,
    })
    const m = await getMonth(2025, 4)
    expect(m.avgLengthOfStay).toBe(0)
  })

  test('grossProfits = netIncome - hoaPayment - actualMortgagePaid', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 5,
      grossIncome: 4000,
      managementFee: 600,
      cleaningFee: 400,
      utilities: 100,
      maintenance: 50,
      otherExpenses: 50,
      platformCharges: 0,
      hoaPayment: 200,
      actualMortgagePaid: 1500,
    })
    const m = await getMonth(2025, 5)
    const grossExpenses = 400 + 100 + 50 + 50 + 0
    const netIncome = 4000 - 600 - grossExpenses
    const grossProfits = netIncome - 200 - 1500
    expect(m.grossProfits).toBeCloseTo(grossProfits, 2)
  })

  test('percentageOfIncome = netIncome / grossIncome when grossIncome > 0', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 6,
      grossIncome: 2000,
      managementFee: 300,
      cleaningFee: 200,
      utilities: 0,
      maintenance: 0,
      otherExpenses: 0,
      platformCharges: 0,
    })
    const m = await getMonth(2025, 6)
    const expectedNet = 2000 - 300 - 200
    expect(m.percentageOfIncome).toBeCloseTo(expectedNet / 2000, 4)
  })

  test('percentageOfIncome is 0 when grossIncome is 0', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 7,
      grossIncome: 0,
      managementFee: 0,
      cleaningFee: 0,
    })
    const m = await getMonth(2025, 7)
    expect(m.percentageOfIncome).toBe(0)
  })

  test('all-zero month still has required computed fields', async () => {
    // Month 8 has no FinancialMonthly record — should return zero-filled metrics
    const m = await getMonth(2025, 8)
    expect(m).toHaveProperty('grossExpenses')
    expect(m).toHaveProperty('netIncome')
    expect(m).toHaveProperty('occupancyRatio')
    expect(m).toHaveProperty('avgLengthOfStay')
    expect(m).toHaveProperty('grossProfits')
    expect(m).toHaveProperty('percentageOfIncome')
    expect(m.grossExpenses).toBe(0)
    expect(m.netIncome).toBe(0)
    expect(m.percentageOfIncome).toBe(0)
  })

  test('extraPaid = actualMortgagePaid - scheduledMortgage (zero config)', async () => {
    await createFinancialMonthly(testProperty.id, {
      year: 2025, month: 9,
      actualMortgagePaid: 1800,
    })
    // No annual config → scheduledMortgage defaults to 0
    const m = await getMonth(2025, 9)
    expect(m.extraPaid).toBeCloseTo(1800, 2)
  })
})
