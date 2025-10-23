const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const passport = require('./config/passport')
require('dotenv').config()

const { testConnection, sequelize } = require('./config/database')
const authRoutes = require('./routes/authRoutes')
const propertyRoutes = require('./routes/propertyRoutes')
const bookingRoutes = require('./routes/bookingRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const integrationRoutes = require('./routes/integrationRoutes')
const financialRoutes = require('./routes/financialRoutes')
const publicRoutes = require('./routes/publicRoutes')
const webhookRoutes = require('./routes/webhookRoutes')
const cleanerRoutes = require('./routes/cleanerRoutes')
const propertyContactRoutes = require('./routes/propertyContactRoutes')
const guestRoutes = require('./routes/guestRoutes')
const lockPinRoutes = require('./routes/lockPinRoutes')
const propertySettingsRoutes = require('./routes/propertySettingsRoutes')
const emailTemplateRoutes = require('./routes/emailTemplateRoutes')
const reviewRoutes = require('./routes/reviewRoutes')
const emailScheduler = require('./jobs/emailScheduler')

const app = express()

// Initialize Passport
app.use(passport.initialize())

// Security middleware
app.use(helmet())

// CORS - Allow S3 bucket and local development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.S3_BUCKET_URL,
  'http://localhost:8000',
  'http://127.0.0.1:8000'
].filter(Boolean) // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.warn(`CORS blocked origin: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later'
})
app.use('/api/', limiter)

// Webhook routes (BEFORE body parsing - Stripe needs raw body)
app.use('/api/webhooks', webhookRoutes)

// Body parsing middleware (AFTER webhook routes)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression
app.use(compression())

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/properties', propertyRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/financials', financialRoutes)

// Cleaner and property contact routes
app.use('/api/cleaners', cleanerRoutes)
app.use('/api/properties', propertyContactRoutes)

// Guest management routes
app.use('/api/guests', guestRoutes)

// Pre-stay email and lock PIN routes
app.use('/api/properties', lockPinRoutes)
app.use('/api/properties', propertySettingsRoutes)
app.use('/api/properties', emailTemplateRoutes)

// Review routes
app.use('/api', reviewRoutes)

// Public routes (no authentication required)
app.use('/api/public', publicRoutes)

// Note: Webhook routes are registered before body parsing middleware

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Start server
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    // Test database connection
    await testConnection()

    // Sync database (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      // Use { alter: false } to avoid schema modification errors
      // Run node reset-db.js if you need to reset the schema
      await sequelize.sync({ alter: false })
      console.log('✅ Database synchronized')
    }

    // Start email scheduler for automated pre-stay emails
    emailScheduler.start()

    // Start listening - bind to localhost only for security (use Nginx reverse proxy)
    const host = process.env.NODE_ENV === 'production' ? '127.0.0.1' : '0.0.0.0'
    const server = app.listen(PORT, host, () => {
      console.log(`🚀 Server running on ${host}:${PORT}`)
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`🔗 API URL: http://${host}:${PORT}`)
      if (process.env.NODE_ENV === 'production') {
        console.log(`⚠️  Server bound to localhost only - use Nginx reverse proxy for external access`)
      }
    })

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...')
      emailScheduler.stop()
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully...')
      emailScheduler.stop()
      server.close(() => {
        console.log('✅ Server closed')
        process.exit(0)
      })
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

module.exports = app
