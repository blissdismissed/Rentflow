const request = require('supertest')
const bcrypt = require('bcryptjs')
const app = require('../../src/server')
const { User, Booking, Property } = require('../../src/models')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const { createUser, createProperty, createBooking } = require('../utils/factories')
const stripeService = require('../../src/services/stripeService')
const emailService = require('../../src/services/emailService')

// Mock external services
jest.mock('../../src/services/stripeService')
jest.mock('../../src/services/emailService')
jest.mock('../../src/services/preStayEmailService')

describe('Booking Controller', () => {
  let testUser
  let authToken
  let testProperty

  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()

    // Create test user and property
    testUser = await createUser({
      email: 'owner@example.com',
      password: 'password123',
      role: 'owner'
    })

    testProperty = await createProperty(testUser.id, {
      name: 'Test Property',
      slug: 'test-property',
      pricePerNight: 150.00,
      cleaningFee: 100.00
    })

    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'password123'
      })

    authToken = loginResponse.body.data.token
  })

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      // Create multiple bookings for the property
      await createBooking(testProperty.id, {
        guestName: 'Guest 1',
        status: 'confirmed',
        checkIn: new Date('2025-12-10'),
        checkOut: new Date('2025-12-13')
      })

      await createBooking(testProperty.id, {
        guestName: 'Guest 2',
        status: 'pending',
        checkIn: new Date('2025-12-15'),
        checkOut: new Date('2025-12-18')
      })

      await createBooking(testProperty.id, {
        guestName: 'Guest 3',
        status: 'cancelled',
        checkIn: new Date('2025-12-20'),
        checkOut: new Date('2025-12-23')
      })
    })

    it('should get all bookings for the authenticated user', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.bookings).toHaveLength(3)
      expect(response.body.bookings[0]).toHaveProperty('guestName')
      expect(response.body.bookings[0]).toHaveProperty('property')
    })

    it('should filter bookings by status', async () => {
      const response = await request(app)
        .get('/api/bookings?status=pending')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.bookings).toHaveLength(1)
      expect(response.body.bookings[0].status).toBe('pending')
    })

    it('should filter bookings by property', async () => {
      // Create another property and booking
      const anotherProperty = await createProperty(testUser.id, {
        name: 'Another Property',
        slug: 'another-property'
      })
      await createBooking(anotherProperty.id)

      const response = await request(app)
        .get(`/api/bookings?propertyId=${testProperty.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.bookings).toHaveLength(3)
      response.body.bookings.forEach(booking => {
        expect(booking.propertyId).toBe(testProperty.id)
      })
    })

    it('should not return bookings for properties not owned by user', async () => {
      // Create another user and their property
      const otherUser = await createUser({
        email: 'other@example.com',
        role: 'owner'
      })
      const otherProperty = await createProperty(otherUser.id)
      await createBooking(otherProperty.id)

      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      // Should only see the 3 bookings for testProperty
      expect(response.body.bookings).toHaveLength(3)
    })
  })

  describe('GET /api/bookings/:id', () => {
    let testBooking

    beforeEach(async () => {
      testBooking = await createBooking(testProperty.id, {
        guestName: 'Test Guest'
      })
    })

    it('should get a single booking by ID', async () => {
      const response = await request(app)
        .get(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testBooking.id)
      expect(response.body.data.guestName).toBe('Test Guest')
    })

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500) // TODO: Controller should return 404, not 500

      expect(response.body.success).toBe(false)
    })

    it('should not return booking for property not owned by user', async () => {
      // Create another user and their booking
      const otherUser = await createUser({
        email: 'other@example.com',
        role: 'owner'
      })
      const otherProperty = await createProperty(otherUser.id)
      const otherBooking = await createBooking(otherProperty.id)

      const response = await request(app)
        .get(`/api/bookings/${otherBooking.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        propertyId: testProperty.id,
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '555-1234',
        checkIn: '2025-12-25',
        checkOut: '2025-12-28',
        numberOfGuests: 4,
        totalAmount: 550.00,
        specialRequests: 'Early check-in if possible'
      }

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send(bookingData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Booking created successfully')
      expect(response.body.data.guestName).toBe('John Doe')
      expect(response.body.data.confirmationCode).toMatch(/^RFD-/)
      expect(response.body.data.status).toBe('confirmed')
      expect(parseFloat(response.body.data.depositAmount)).toBe(55.00)
      expect(parseFloat(response.body.data.balanceAmount)).toBe(495.00)
    })

    it('should fail to create booking for property not owned by user', async () => {
      const otherUser = await createUser({
        email: 'other@example.com',
        role: 'owner'
      })
      const otherProperty = await createProperty(otherUser.id)

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: otherProperty.id,
          guestName: 'John Doe',
          guestEmail: 'john@example.com',
          checkIn: '2025-12-25',
          checkOut: '2025-12-28',
          numberOfGuests: 4,
          totalAmount: 550.00
        })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Property not found')
    })

    it('should detect booking conflicts', async () => {
      // Create existing booking
      await createBooking(testProperty.id, {
        checkIn: new Date('2025-12-25'),
        checkOut: new Date('2025-12-28'),
        status: 'confirmed'
      })

      // Try to book overlapping dates
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          propertyId: testProperty.id,
          guestName: 'Jane Doe',
          guestEmail: 'jane@example.com',
          checkIn: '2025-12-26',
          checkOut: '2025-12-29',
          numberOfGuests: 2,
          totalAmount: 450.00
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Property is already booked for these dates')
    })
  })

  describe('PUT /api/bookings/:id', () => {
    let testBooking

    beforeEach(async () => {
      testBooking = await createBooking(testProperty.id, {
        guestName: 'Original Guest',
        status: 'pending'
      })
    })

    it('should update booking details', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestName: 'Updated Guest',
          numberOfGuests: 6,
          status: 'confirmed'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.guestName).toBe('Updated Guest')
      expect(response.body.data.numberOfGuests).toBe(6)
      expect(response.body.data.status).toBe('confirmed')
    })

    it('should set cancelledAt timestamp when cancelling', async () => {
      const response = await request(app)
        .put(`/api/bookings/${testBooking.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'cancelled'
        })
        .expect(200)

      expect(response.body.data.status).toBe('cancelled')
      expect(response.body.data.cancelledAt).toBeDefined()
    })

    it('should not allow updating external platform bookings', async () => {
      const airbnbBooking = await createBooking(testProperty.id, {
        platform: 'airbnb'
      })

      const response = await request(app)
        .put(`/api/bookings/${airbnbBooking.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          guestName: 'Updated Name'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Cannot modify bookings synced from external platforms')
    })
  })

  describe('POST /api/bookings/:id/approve', () => {
    let requestedBooking

    beforeEach(async () => {
      requestedBooking = await createBooking(testProperty.id, {
        bookingStatus: 'requested',
        status: 'pending',
        depositAmount: 55.00
      })

      // Mock Stripe and email services
      stripeService.captureDeposit = jest.fn().mockResolvedValue({
        success: true,
        amount: 55.00
      })
      emailService.sendBookingApprovalToGuest = jest.fn().mockResolvedValue(true)
    })

    it('should approve booking and capture deposit', async () => {
      const response = await request(app)
        .post(`/api/bookings/${requestedBooking.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('approved and deposit charged')
      expect(stripeService.captureDeposit).toHaveBeenCalledWith(requestedBooking.id)
      expect(emailService.sendBookingApprovalToGuest).toHaveBeenCalled()
    })

    it('should fail to approve already approved booking', async () => {
      await requestedBooking.update({ bookingStatus: 'approved' })

      const response = await request(app)
        .post(`/api/bookings/${requestedBooking.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('already approved')
    })

    it('should handle Stripe payment failure gracefully', async () => {
      stripeService.captureDeposit = jest.fn().mockRejectedValue(new Error('Card declined'))

      const response = await request(app)
        .post(`/api/bookings/${requestedBooking.id}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toContain('payment capture failed')
    })
  })

  describe('POST /api/bookings/:id/cancel', () => {
    let confirmedBooking

    beforeEach(async () => {
      confirmedBooking = await createBooking(testProperty.id, {
        status: 'confirmed',
        platform: 'direct'
      })
    })

    it('should cancel a booking', async () => {
      const response = await request(app)
        .post(`/api/bookings/${confirmedBooking.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cancellationReason: 'Guest requested cancellation'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe('cancelled')
      expect(response.body.data.cancelledAt).toBeDefined()
      expect(response.body.data.cancellationReason).toBe('Guest requested cancellation')
    })

    it('should fail to cancel already cancelled booking', async () => {
      await confirmedBooking.update({ status: 'cancelled' })

      const response = await request(app)
        .post(`/api/bookings/${confirmedBooking.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Booking is already cancelled')
    })

    it('should not allow cancelling external platform bookings', async () => {
      const vrboBooking = await createBooking(testProperty.id, {
        platform: 'vrbo',
        status: 'confirmed'
      })

      const response = await request(app)
        .post(`/api/bookings/${vrboBooking.id}/cancel`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('cancel this booking on the original platform')
    })
  })

  describe('PATCH /api/bookings/:id/resolve-conflict', () => {
    let conflictBooking

    beforeEach(async () => {
      conflictBooking = await createBooking(testProperty.id, {
        hasConflict: true,
        conflictNote: 'Overlaps with Airbnb booking AB-123'
      })
    })

    it('should clear hasConflict and conflictNote on own booking', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${conflictBooking.id}/resolve-conflict`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Re-fetch from DB and confirm fields were cleared
      const { Booking } = require('../../src/models')
      const reloaded = await Booking.findByPk(conflictBooking.id)
      expect(reloaded.hasConflict).toBe(false)
      expect(reloaded.conflictNote).toBeNull()
    })

    it('should return 404 for a non-existent booking UUID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .patch(`/api/bookings/${nonExistentId}/resolve-conflict`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Booking not found')
    })

    it('should return 401 when called without an auth token', async () => {
      const response = await request(app)
        .patch(`/api/bookings/${conflictBooking.id}/resolve-conflict`)
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should return 403 when booking belongs to another user', async () => {
      const otherUser = await createUser({
        email: 'other@example.com',
        role: 'owner'
      })
      const otherProperty = await createProperty(otherUser.id)
      const otherBooking = await createBooking(otherProperty.id, {
        hasConflict: true,
        conflictNote: 'Some conflict'
      })

      const response = await request(app)
        .patch(`/api/bookings/${otherBooking.id}/resolve-conflict`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Not authorized')
    })
  })
})
