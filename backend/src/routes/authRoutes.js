const express = require('express')
const passport = require('passport')
const { body } = require('express-validator')
const {
  register,
  login,
  googleCallback,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  changePassword
} = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')
const { validate } = require('../middleware/validator')

const router = express.Router()

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty()
]

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
]

// Routes
router.post('/register', registerValidation, validate, register)
router.post('/login', loginValidation, validate, login)
router.post('/refresh', refreshAccessToken)

// Google OAuth (to be configured with Passport)
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback)

// Protected routes
router.get('/me', authenticate, getCurrentUser)
router.put('/profile', authenticate, updateProfile)
router.put('/password', authenticate, changePassword)

module.exports = router
