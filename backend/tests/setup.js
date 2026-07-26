require('dotenv').config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
})

afterAll(async () => {
  // Clean up after all tests
})
