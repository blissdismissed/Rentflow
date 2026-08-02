/**
 * Integration tests for:
 *   GET /api/public/properties/:slug/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 *
 * No authentication is required for this endpoint.
 * Tests run against the real test DB (sequential, maxWorkers:1).
 */

const request = require('supertest')
const app = require('../../src/server')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const { createUser, createProperty, createBooking } = require('../utils/factories')

// These services are mocked so side-effects from other parts of the app don't
// interfere (e.g. email hooks on booking creation).
jest.mock('../../src/services/stripeService')
jest.mock('../../src/services/emailService')
jest.mock('../../src/services/preStayEmailService')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a YYYY-MM-DD string for a date N days from today.
 * Positive values are in the future, negative in the past.
 */
function dateOffset(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// Fixed future window used by most tests: check-in 45 days out, check-out 48 days out (3 nights).
const CHECK_IN  = dateOffset(45)
const CHECK_OUT = dateOffset(48)

/** Build the availability URL for a given slug and optional query params. */
function availUrl(slug, params = {}) {
  const qs = new URLSearchParams(params).toString()
  return `/api/public/properties/${slug}/availability${qs ? `?${qs}` : ''}`
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('GET /api/public/properties/:slug/availability', () => {
  let testUser
  let testProperty

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

    // A fully public, active property that the availability endpoint can find.
    testProperty = await createProperty(testUser.id, {
      slug: 'test-cabin',
      status: 'active',
      publiclyVisible: true,
      isActive: true,
      basePrice: 150.00,
      cleaningFee: 100.00,
      minNights: 1,
      maxNights: 365
    })
  })

  // -------------------------------------------------------------------------
  // 1. Missing checkIn
  // -------------------------------------------------------------------------
  it('returns 400 when checkIn is missing', async () => {
    const res = await request(app)
      .get(availUrl('test-cabin', { checkOut: CHECK_OUT }))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/required/i)
  })

  // -------------------------------------------------------------------------
  // 2. Missing checkOut
  // -------------------------------------------------------------------------
  it('returns 400 when checkOut is missing', async () => {
    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN }))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/required/i)
  })

  // -------------------------------------------------------------------------
  // 3. checkIn in the past
  // -------------------------------------------------------------------------
  it('returns 400 when checkIn is in the past', async () => {
    const res = await request(app)
      .get(availUrl('test-cabin', {
        checkIn:  dateOffset(-3),
        checkOut: dateOffset(1)
      }))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/past/i)
  })

  // -------------------------------------------------------------------------
  // 4. checkOut same day as checkIn (not after)
  // -------------------------------------------------------------------------
  it('returns 400 when checkOut is the same day as checkIn', async () => {
    const res = await request(app)
      .get(availUrl('test-cabin', {
        checkIn:  CHECK_IN,
        checkOut: CHECK_IN   // same day — zero nights
      }))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/after/i)
  })

  // -------------------------------------------------------------------------
  // 5. Slug not found (inactive / hidden / nonexistent)
  // -------------------------------------------------------------------------
  it('returns 404 when the slug does not match any active public property', async () => {
    const res = await request(app)
      .get(availUrl('no-such-property', {
        checkIn:  CHECK_IN,
        checkOut: CHECK_OUT
      }))
      .expect(404)

    expect(res.body.success).toBe(false)
  })

  it('returns 404 when the property exists but is not publicly visible', async () => {
    await createProperty(testUser.id, {
      slug: 'hidden-cabin',
      status: 'active',
      publiclyVisible: false,
      isActive: true,
      basePrice: 100.00
    })

    const res = await request(app)
      .get(availUrl('hidden-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(404)

    expect(res.body.success).toBe(false)
  })

  it('returns 200 when the property has a non-active status but isActive is true', async () => {
    // status field is no longer checked by the public endpoint — isActive is the sole
    // boolean gate. A property with status:'pending' or 'inactive' but isActive:true
    // and publiclyVisible:true is available for booking.
    await createProperty(testUser.id, {
      slug: 'inactive-cabin',
      status: 'pending',
      publiclyVisible: true,
      isActive: true,
      basePrice: 100.00
    })

    const res = await request(app)
      .get(availUrl('inactive-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  it('returns 404 when the property has isActive false', async () => {
    await createProperty(testUser.id, {
      slug: 'deactivated-cabin',
      status: 'active',
      publiclyVisible: true,
      isActive: false,
      basePrice: 100.00
    })

    const res = await request(app)
      .get(availUrl('deactivated-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(404)

    expect(res.body.success).toBe(false)
  })

  // -------------------------------------------------------------------------
  // 6. Valid available dates — correct 200 response with pricing
  // -------------------------------------------------------------------------
  it('returns 200 with correct pricing when the property is available', async () => {
    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)

    const { pricing } = res.body
    expect(pricing).toBeDefined()

    // CHECK_IN to CHECK_OUT is 3 nights
    expect(pricing.nights).toBe(3)
    expect(pricing.pricePerNight).toBe(150)
    expect(pricing.baseAmount).toBe('450.00')
    expect(pricing.cleaningFee).toBe('100.00')
    expect(pricing.subtotal).toBe('550.00')
    // 10% deposit, 90% balance
    expect(pricing.depositAmount).toBe('55.00')
    expect(pricing.balanceAmount).toBe('495.00')
    expect(pricing.currency).toBe('USD')
  })

  // -------------------------------------------------------------------------
  // 7. Full overlap with a confirmed booking → 409
  // -------------------------------------------------------------------------
  it('returns 409 when dates fully overlap an existing confirmed booking', async () => {
    // Existing booking: day 43 → day 50 (fully contains the requested day 45 → 48)
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(43)),
      checkOut:      new Date(dateOffset(50)),
      bookingStatus: 'confirmed'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(409)

    expect(res.body.success).toBe(false)
    expect(res.body.available).toBe(false)
  })

  // -------------------------------------------------------------------------
  // 8. Partial overlap — new check-in falls inside existing booking → 409
  // -------------------------------------------------------------------------
  it('returns 409 when the new check-in falls inside an existing approved booking', async () => {
    // Existing booking: day 40 → day 47 (new checkIn=45 is inside it)
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(40)),
      checkOut:      new Date(dateOffset(47)),
      bookingStatus: 'approved'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(409)

    expect(res.body.success).toBe(false)
    expect(res.body.available).toBe(false)
  })

  it('returns 409 when the new check-out falls inside an existing requested booking', async () => {
    // Existing booking: day 47 → day 55 (new checkOut=48 is inside it)
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(47)),
      checkOut:      new Date(dateOffset(55)),
      bookingStatus: 'requested'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(409)

    expect(res.body.success).toBe(false)
    expect(res.body.available).toBe(false)
  })

  // -------------------------------------------------------------------------
  // 9. Back-to-back booking — new checkIn equals existing checkOut → NOT a conflict
  // -------------------------------------------------------------------------
  it('returns 200 when new check-in equals an existing booking\'s check-out (back-to-back)', async () => {
    // Existing booking ends exactly when the new one starts: day 40 → day 45
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(40)),
      checkOut:      new Date(dateOffset(45)),  // same as CHECK_IN
      bookingStatus: 'confirmed'
    })

    // CHECK_IN = day 45, CHECK_OUT = day 48
    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  it('returns 200 when new check-out equals an existing booking\'s check-in (back-to-back, other direction)', async () => {
    // Existing booking starts exactly when the new one ends: day 48 → day 55
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(48)),  // same as CHECK_OUT
      checkOut:      new Date(dateOffset(55)),
      bookingStatus: 'confirmed'
    })

    // CHECK_IN = day 45, CHECK_OUT = day 48
    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  // -------------------------------------------------------------------------
  // 10. Stay shorter than minNights → 400
  // -------------------------------------------------------------------------
  it('returns 400 when the stay is shorter than the property minNights', async () => {
    await testProperty.update({ minNights: 5 })

    // CHECK_IN to CHECK_OUT is 3 nights, but minNights is now 5
    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/minimum/i)
  })

  // -------------------------------------------------------------------------
  // 11. Stay longer than maxNights → 400
  // -------------------------------------------------------------------------
  it('returns 400 when the stay is longer than the property maxNights', async () => {
    await testProperty.update({ maxNights: 2 })

    // CHECK_IN to CHECK_OUT is 3 nights, but maxNights is now 2
    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(400)

    expect(res.body.success).toBe(false)
    expect(res.body.message).toMatch(/maximum/i)
  })

  // -------------------------------------------------------------------------
  // 12. Cancelled / declined booking must NOT block availability
  // -------------------------------------------------------------------------
  it('returns 200 when the only overlapping booking is cancelled', async () => {
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(43)),
      checkOut:      new Date(dateOffset(50)),
      bookingStatus: 'cancelled'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  it('returns 200 when the only overlapping booking is declined', async () => {
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(43)),
      checkOut:      new Date(dateOffset(50)),
      bookingStatus: 'declined'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  it('returns 200 when the only overlapping booking is completed', async () => {
    await createBooking(testProperty.id, {
      checkIn:       new Date(dateOffset(43)),
      checkOut:      new Date(dateOffset(50)),
      bookingStatus: 'completed'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  // -------------------------------------------------------------------------
  // Additional edge cases
  // -------------------------------------------------------------------------

  it('returns 409 when a blocking booking exists on another property does NOT bleed over', async () => {
    // A different property belonging to the same user
    const otherProperty = await createProperty(testUser.id, {
      slug: 'other-cabin',
      status: 'active',
      publiclyVisible: true,
      isActive: true,
      basePrice: 200.00
    })

    // Overlapping booking on the OTHER property — should not block test-cabin
    await createBooking(otherProperty.id, {
      checkIn:       new Date(dateOffset(43)),
      checkOut:      new Date(dateOffset(50)),
      bookingStatus: 'confirmed'
    })

    const res = await request(app)
      .get(availUrl('test-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.success).toBe(true)
    expect(res.body.available).toBe(true)
  })

  it('returns 200 with zero cleaningFee when property has no cleaning fee', async () => {
    await createProperty(testUser.id, {
      slug: 'no-fee-cabin',
      status: 'active',
      publiclyVisible: true,
      isActive: true,
      basePrice: 200.00,
      cleaningFee: 0,
      minNights: 1,
      maxNights: 365
    })

    const res = await request(app)
      .get(availUrl('no-fee-cabin', { checkIn: CHECK_IN, checkOut: CHECK_OUT }))
      .expect(200)

    expect(res.body.pricing.cleaningFee).toBe('0.00')
    expect(res.body.pricing.subtotal).toBe('600.00')   // 200 * 3
    expect(res.body.pricing.depositAmount).toBe('60.00')
    expect(res.body.pricing.balanceAmount).toBe('540.00')
  })
})
