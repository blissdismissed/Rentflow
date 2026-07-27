/**
 * Test data factories for creating model instances
 */

/**
 * Create a test user
 */
async function createUser(overrides = {}) {
  const User = require('../../src/models/User')

  const defaults = {
    email: `test-${Date.now()}@example.com`,
    password: 'password123', // Plain password - will be hashed by User model hook
    firstName: 'Test',
    lastName: 'User',
    role: 'owner',
    isActive: true
  }

  return await User.create({ ...defaults, ...overrides })
}

/**
 * Create a test property
 */
async function createProperty(userId, overrides = {}) {
  const Property = require('../../src/models/Property')

  const defaults = {
    userId,
    name: 'Test Property',
    slug: `test-property-${Date.now()}`,
    description: 'A test property for testing',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    basePrice: 150.00,
    pricePerNight: 150.00,
    cleaningFee: 100.00,
    isActive: true,
    publiclyVisible: true
  }

  return await Property.create({ ...defaults, ...overrides })
}

/**
 * Create a test booking
 */
async function createBooking(propertyId, overrides = {}) {
  const Booking = require('../../src/models/Booking')

  const checkIn = new Date()
  checkIn.setDate(checkIn.getDate() + 7) // 7 days from now
  const checkOut = new Date(checkIn)
  checkOut.setDate(checkOut.getDate() + 3) // 3-night stay

  const defaults = {
    propertyId,
    confirmationCode: `TEST-${Date.now()}`,
    guestName: 'Test Guest',
    guestEmail: `guest-${Date.now()}@example.com`,
    guestPhone: '555-0123',
    checkIn,
    checkOut,
    numberOfGuests: 4,
    nights: 3,
    baseAmount: 450.00,
    cleaningFee: 100.00,
    totalAmount: 550.00,
    depositAmount: 55.00,
    balanceAmount: 495.00,
    status: 'pending',
    platform: 'direct',
    specialRequests: 'Test booking'
  }

  return await Booking.create({ ...defaults, ...overrides })
}

/**
 * Create a test payment
 */
async function createPayment(bookingId, overrides = {}) {
  const Payment = require('../../src/models/Payment')

  const defaults = {
    bookingId,
    amount: 55.00,
    type: 'deposit',
    method: 'card',
    status: 'pending',
    transactionId: `txn_test_${Date.now()}`
  }

  return await Payment.create({ ...defaults, ...overrides })
}

/**
 * Create a test cleaner
 */
async function createCleaner(overrides = {}) {
  const Cleaner = require('../../src/models/Cleaner')

  const defaults = {
    name: 'Test Cleaner',
    email: `cleaner-${Date.now()}@example.com`,
    phone: '555-0123',
    isActive: true
  }

  return await Cleaner.create({ ...defaults, ...overrides })
}

/**
 * Create a test cleaning assignment
 */
async function createCleaningAssignment(bookingId, cleanerId, overrides = {}) {
  const CleaningAssignment = require('../../src/models/CleaningAssignment')

  const defaults = {
    bookingId,
    cleanerId,
    scheduledDate: new Date(),
    status: 'assigned',
    notes: 'Test cleaning'
  }

  return await CleaningAssignment.create({ ...defaults, ...overrides })
}

module.exports = {
  createUser,
  createProperty,
  createBooking,
  createPayment,
  createCleaner,
  createCleaningAssignment
}
