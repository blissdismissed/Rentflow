module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/config/**',
    '!src/server.js'
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  coverageThreshold: {
    './src/controllers/authController.js': {
      branches: 5,
      functions: 10,
      lines: 20,
      statements: 20
    },
    './src/controllers/bookingController.js': {
      branches: 50,
      functions: 65,
      lines: 50,
      statements: 50
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  maxWorkers: 1 // Run tests sequentially to avoid database conflicts
}
