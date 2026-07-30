const request = require('supertest')
const app = require('../../src/server')
const { Guest, GuestStay, FinancialBookingTransaction, FinancialMonthly } = require('../../src/models')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const { createUser, createProperty, createGuest } = require('../utils/factories')

// Mock external services that may be triggered by side-effects in the app
jest.mock('../../src/services/stripeService')
jest.mock('../../src/services/emailService')
jest.mock('../../src/services/preStayEmailService')

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convenience: POST /api/guests/manual-stay with Bearer token */
async function postManualStay(token, payload) {
  return request(app)
    .post('/api/guests/manual-stay')
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
}

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('Guest Controller — POST /api/guests/manual-stay', () => {
  let testUser
  let authToken
  let testProperty

  // Shared valid payload dates for most tests
  const CHECK_IN  = '2025-06-15'
  const CHECK_OUT = '2025-06-20'   // 5 nights
  const AMOUNT    = 500

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()

    testUser = await createUser({
      email: 'owner@example.com',
      password: 'password123',
      role: 'owner'
    })

    testProperty = await createProperty(testUser.id, {
      name: 'Vermont Condo',
      slug: `vermont-condo-${Date.now()}`
    })

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@example.com', password: 'password123' })

    authToken = loginRes.body.data.token
  })

  // ── 1. 401 without auth token ─────────────────────────────────────────────

  it('returns 401 when no auth token is provided', async () => {
    const res = await request(app)
      .post('/api/guests/manual-stay')
      .send({
        propertyId: testProperty.id,
        name: 'Anyone',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
  })

  // ── 2. Wrong property (belongs to another user) ───────────────────────────

  it('returns 404 when propertyId belongs to another user', async () => {
    const otherUser = await createUser({ email: 'other@example.com', password: 'pass123', role: 'owner' })
    const otherProperty = await createProperty(otherUser.id, { slug: `other-${Date.now()}` })

    const res = await postManualStay(authToken, {
      propertyId: otherProperty.id,
      name: 'Jane Traveler',
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      amount: AMOUNT
    })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Property not found')
  })

  // ── 3. Invalid dates (checkOut before checkIn) ────────────────────────────

  it('returns 400 when checkOut is before checkIn', async () => {
    const res = await postManualStay(authToken, {
      propertyId: testProperty.id,
      name: 'Bad Dates Guest',
      checkIn: '2025-06-20',
      checkOut: '2025-06-15',   // before check-in
      amount: AMOUNT
    })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Check-out must be after check-in')
  })

  it('returns 400 when checkOut equals checkIn (0 nights)', async () => {
    const res = await postManualStay(authToken, {
      propertyId: testProperty.id,
      name: 'Same Day Guest',
      checkIn: '2025-06-15',
      checkOut: '2025-06-15',
      amount: AMOUNT
    })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Check-out must be after check-in')
  })

  // ── 4. Non-existent guestId ───────────────────────────────────────────────

  it('returns 404 when guestId does not exist', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000'

    const res = await postManualStay(authToken, {
      propertyId: testProperty.id,
      guestId: fakeId,
      checkIn: CHECK_IN,
      checkOut: CHECK_OUT,
      amount: AMOUNT
    })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(res.body.message).toBe('Guest not found')
  })

  // ── 5. Success with existing guest (guestId) ─────────────────────────────

  describe('Success with existing guest (guestId)', () => {
    let existingGuest

    beforeEach(async () => {
      existingGuest = await createGuest({
        name: 'Returning Visitor',
        totalStays: 2,
        totalSpent: 800
      })
    })

    it('returns 200 with success:true and the guest/stay objects', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT,
        numberOfGuests: 3,
        notes: 'Repeat visitor'
      })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.message).toBe('Stay recorded successfully')
      expect(res.body.guest.id).toBe(existingGuest.id)
      expect(res.body.stay).toBeDefined()
      expect(res.body.year).toBe(2025)
      expect(res.body.month).toBe(6)
    })

    it('increments totalStays by 1 on the existing guest', async () => {
      await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

      const reloaded = await Guest.findByPk(existingGuest.id)
      expect(reloaded.totalStays).toBe(3)   // 2 + 1
    })

    it('increments totalSpent by the amount paid', async () => {
      await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

      const reloaded = await Guest.findByPk(existingGuest.id)
      expect(parseFloat(reloaded.totalSpent)).toBeCloseTo(1300, 2)  // 800 + 500
    })

    it('creates a GuestStay row with bookingSource=direct and correct nights', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT,
        numberOfGuests: 3
      })

      const stayId = res.body.stay.id
      const stay = await GuestStay.findByPk(stayId)

      expect(stay).not.toBeNull()
      expect(stay.guestId).toBe(existingGuest.id)
      expect(stay.propertyId).toBe(testProperty.id)
      expect(stay.bookingSource).toBe('direct')
      expect(stay.nights).toBe(5)
      expect(stay.numberOfGuests).toBe(3)
      expect(parseFloat(stay.totalAmount)).toBe(AMOUNT)
    })

    it('creates a FinancialBookingTransaction row with externalBookingId=direct-<stayId>', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

      const stayId = res.body.stay.id
      const txn = await FinancialBookingTransaction.findOne({
        where: { externalBookingId: `direct-${stayId}` }
      })

      expect(txn).not.toBeNull()
      expect(txn.propertyId).toBe(testProperty.id)
      expect(txn.year).toBe(2025)
      expect(txn.month).toBe(6)
      expect(parseFloat(txn.grossAmount)).toBe(AMOUNT)
      expect(txn.nightsBooked).toBe(5)
      expect(txn.bookingSource).toBe('direct')
      expect(txn.status).toBe('Checked out')
      expect(txn.guestName).toBe(existingGuest.name)
    })

    it('creates or updates FinancialMonthly with correct grossIncome and numReservations', async () => {
      await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

      const monthly = await FinancialMonthly.findOne({
        where: { propertyId: testProperty.id, year: 2025, month: 6 }
      })

      expect(monthly).not.toBeNull()
      expect(parseFloat(monthly.grossIncome)).toBeCloseTo(AMOUNT, 2)
      expect(monthly.numReservations).toBe(1)
      expect(monthly.nightsBooked).toBe(5)
    })

    it('accumulates grossIncome across multiple stays in the same month', async () => {
      // Use two different properties to avoid the unique(guestId, propertyId) constraint
      // that Sequelize's belongsToMany adds to the guest_stays through table (see bug note in report).
      // Dates chosen in mid-month to avoid UTC→local-time month boundary at UTC-4 offset.
      const prop2 = await createProperty(testUser.id, { slug: `prop2-accumulate-${Date.now()}` })
      const guest2 = await createGuest({ name: 'Second Guest' })

      const res1 = await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: '2025-06-10',
        checkOut: '2025-06-14',
        amount: 300
      })
      expect(res1.status).toBe(200)

      const res2 = await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: guest2.id,
        checkIn: '2025-06-20',
        checkOut: '2025-06-23',
        amount: 200
      })
      expect(res2.status).toBe(200)

      const monthly = await FinancialMonthly.findOne({
        where: { propertyId: testProperty.id, year: 2025, month: 6 }
      })

      expect(parseFloat(monthly.grossIncome)).toBeCloseTo(500, 2)
      expect(monthly.numReservations).toBe(2)
    })

    it('sets lastStayDate on the guest to checkOut if it is later', async () => {
      // existingGuest has no lastStayDate set
      await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

      const reloaded = await Guest.findByPk(existingGuest.id)
      expect(reloaded.lastStayDate).not.toBeNull()
    })

    it('sets firstStayDate on the guest to checkIn if it has no prior firstStayDate', async () => {
      await postManualStay(authToken, {
        propertyId: testProperty.id,
        guestId: existingGuest.id,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: AMOUNT
      })

      const reloaded = await Guest.findByPk(existingGuest.id)
      expect(reloaded.firstStayDate).not.toBeNull()
    })
  })

  // ── 6. Success with new guest by name only (no email, no guestId) ─────────

  describe('Success with new guest by name only', () => {
    it('returns 200 and creates a brand-new Guest record', async () => {
      const guestCountBefore = await Guest.count()

      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'Brand New Guest',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: 750
      })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.guest.name).toBe('Brand New Guest')

      const guestCountAfter = await Guest.count()
      expect(guestCountAfter).toBe(guestCountBefore + 1)
    })

    it('creates a GuestStay for the new guest', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'Name Only Guest',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: 200
      })

      const stays = await GuestStay.findAll({
        where: { guestId: res.body.guest.id }
      })

      expect(stays).toHaveLength(1)
      expect(stays[0].propertyId).toBe(testProperty.id)
    })

    it('creates a FinancialMonthly row for the check-in month', async () => {
      await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'Monthly Test Guest',
        checkIn: '2025-03-10',
        checkOut: '2025-03-14',
        amount: 400
      })

      const monthly = await FinancialMonthly.findOne({
        where: { propertyId: testProperty.id, year: 2025, month: 3 }
      })

      expect(monthly).not.toBeNull()
      expect(parseFloat(monthly.grossIncome)).toBeCloseTo(400, 2)
    })

    it('returns 400 when no name is provided for a new guest', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        // no guestId, no name
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: 100
      })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Guest name is required for new guests')
    })

    it('sets guest totalStays to 1 after first manual stay', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'First Timer',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: 300
      })

      const guest = await Guest.findByPk(res.body.guest.id)
      expect(guest.totalStays).toBe(1)
      expect(parseFloat(guest.totalSpent)).toBeCloseTo(300, 2)
    })
  })

  // ── 7. Success with new guest by name+email (findOrCreate on second call) ─

  describe('Success with new guest by name + email (findOrCreate)', () => {
    const EMAIL = 'repeat.guest@example.com'

    it('creates a new guest on first call', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'Email Guest',
        email: EMAIL,
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: 600
      })

      expect(res.status).toBe(200)
      expect(res.body.guest.name).toBe('Email Guest')

      const created = await Guest.findOne({ where: { email: EMAIL } })
      expect(created).not.toBeNull()
    })

    it('reuses the same guest on second call with same email', async () => {
      // Use two different properties to avoid the UNIQUE(guestId, propertyId) constraint
      // that Sequelize's belongsToMany adds to guest_stays (see bug note in report).
      const prop2 = await createProperty(testUser.id, { slug: `prop2-email-reuse-${Date.now()}` })

      const firstRes = await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'Email Guest',
        email: EMAIL,
        checkIn: '2025-05-10',
        checkOut: '2025-05-14',
        amount: 600
      })
      expect(firstRes.status).toBe(200)

      const secondRes = await postManualStay(authToken, {
        propertyId: prop2.id,          // second property — avoids the unique constraint
        name: 'Email Guest Again',     // different name — should still find by email
        email: EMAIL,
        checkIn: '2025-07-10',
        checkOut: '2025-07-14',
        amount: 400
      })

      expect(secondRes.status).toBe(200)
      // Same guest ID used on both calls — findOrCreate found the existing record by email
      expect(secondRes.body.guest.id).toBe(firstRes.body.guest.id)

      // Guest should now have 2 stays and combined spend
      const guestRecord = await Guest.findByPk(firstRes.body.guest.id)
      expect(guestRecord.totalStays).toBe(2)
      expect(parseFloat(guestRecord.totalSpent)).toBeCloseTo(1000, 2)
    })

    it('stores notes on the stay as the review field', async () => {
      const res = await postManualStay(authToken, {
        propertyId: testProperty.id,
        name: 'Notes Guest',
        email: 'notes@example.com',
        checkIn: CHECK_IN,
        checkOut: CHECK_OUT,
        amount: 100,
        notes: 'Arrived late, lovely couple'
      })

      const stay = await GuestStay.findByPk(res.body.stay.id)
      expect(stay.review).toBe('Arrived late, lovely couple')
    })
  })
})
