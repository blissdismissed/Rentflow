/**
 * Mock factories for external services (Stripe, SendGrid, AWS S3)
 */

// Mock Stripe
const mockStripe = {
  paymentIntents: {
    create: jest.fn().mockResolvedValue({
      id: 'pi_test_123456',
      amount: 10000,
      currency: 'usd',
      status: 'requires_capture',
      client_secret: 'pi_test_secret_123456'
    }),
    capture: jest.fn().mockResolvedValue({
      id: 'pi_test_123456',
      amount: 10000,
      status: 'succeeded'
    }),
    cancel: jest.fn().mockResolvedValue({
      id: 'pi_test_123456',
      status: 'canceled'
    })
  },
  refunds: {
    create: jest.fn().mockResolvedValue({
      id: 'ref_test_123456',
      amount: 10000,
      status: 'succeeded'
    })
  },
  paymentLinks: {
    create: jest.fn().mockResolvedValue({
      id: 'plink_test_123456',
      url: 'https://pay.stripe.com/test_link',
      active: true
    })
  }
}

// Mock SendGrid
const mockSendGrid = {
  setApiKey: jest.fn(),
  send: jest.fn().mockResolvedValue([
    {
      statusCode: 202,
      body: '',
      headers: {}
    }
  ])
}

// Mock AWS S3
const mockS3 = {
  upload: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
      Location: 'https://s3.amazonaws.com/test-bucket/test-file.jpg',
      Key: 'test-file.jpg',
      Bucket: 'test-bucket'
    })
  }),
  deleteObject: jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({})
  }),
  getSignedUrl: jest.fn().mockReturnValue('https://s3.amazonaws.com/test-bucket/signed-url')
}

/**
 * Reset all mocks to their default state
 */
function resetMocks() {
  Object.values(mockStripe.paymentIntents).forEach(fn => fn.mockClear())
  Object.values(mockStripe.refunds).forEach(fn => fn.mockClear())
  Object.values(mockStripe.paymentLinks).forEach(fn => fn.mockClear())
  mockSendGrid.send.mockClear()
  mockS3.upload().promise.mockClear()
  mockS3.deleteObject().promise.mockClear()
}

module.exports = {
  mockStripe,
  mockSendGrid,
  mockS3,
  resetMocks
}
