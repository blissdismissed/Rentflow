const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

const router = express.Router();

// Validation rules for creating bookings
const createBookingValidation = [
  body('propertyId').isUUID().withMessage('Valid property ID is required'),
  body('guestName').trim().notEmpty().withMessage('Guest name is required'),
  body('guestEmail').isEmail().withMessage('Valid email is required'),
  body('checkIn').isISO8601().withMessage('Valid check-in date is required'),
  body('checkOut').isISO8601().withMessage('Valid check-out date is required'),
  body('numberOfGuests').isInt({ min: 1 }).withMessage('Number of guests must be at least 1'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number')
];

// All routes require authentication
router.use(authenticate);

// Get all bookings with optional filters
router.get('/', bookingController.getBookings);

// Get booking statistics
router.get('/stats', bookingController.getBookingStats);

// Get specific booking
router.get('/:id', bookingController.getBookingById);

// Create new direct booking
router.post('/', createBookingValidation, validate, bookingController.createBooking);

// Update booking
router.put('/:id', bookingController.updateBooking);

// Cancel booking
router.post('/:id/cancel', bookingController.cancelBooking);

// Approve booking request (host)
router.post('/:id/approve', bookingController.approveBooking);

// Decline booking request (host)
router.post('/:id/decline', bookingController.declineBooking);

// Mark balance as paid (host)
router.post('/:id/mark-balance-paid', bookingController.markBalancePaid);

module.exports = router;
