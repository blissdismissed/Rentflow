const request = require('supertest')
const app = require('../../src/server')
const { User } = require('../../src/models')
const { setupTestDatabase, teardownTestDatabase, resetDatabase } = require('../utils/testDb')
const { createUser } = require('../utils/factories')

describe('Auth Controller', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  afterAll(async () => {
    await teardownTestDatabase()
  })

  beforeEach(async () => {
    await resetDatabase()
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '555-0123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('User registered successfully')
      expect(response.body.data.user).toHaveProperty('email', userData.email)
      expect(response.body.data.user).toHaveProperty('firstName', userData.firstName)
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('refreshToken')
      expect(response.body.data.user).not.toHaveProperty('password')
    })

    it('should fail if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Doe'
      }

      // Create user first
      await createUser({ email: userData.email })

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('User already exists with this email')
    })

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' }) // Missing password
        .expect(400)

      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /api/auth/login', () => {
    let testUser

    beforeEach(async () => {
      // Create a test user
      testUser = await createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        isActive: true
      })
    })

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Login successful')
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('refreshToken')
    })

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Invalid credentials')
    })

    it('should fail if account is inactive', async () => {
      await testUser.update({ isActive: false })

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Account is inactive')
    })

    it('should update lastLogin timestamp', async () => {
      const beforeLogin = testUser.lastLogin

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(200)

      await testUser.reload()
      expect(testUser.lastLogin).not.toBe(beforeLogin)
      expect(testUser.lastLogin).toBeInstanceOf(Date)
    })
  })

  describe('GET /api/auth/me', () => {
    let testUser
    let authToken

    beforeEach(async () => {
      testUser = await createUser({
        email: 'test@example.com',
        password: 'password123'
      })

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      authToken = loginResponse.body.data.token
    })

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com')
    })

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401)

      expect(response.body.success).toBe(false)
    })
  })

  describe('PUT /api/auth/profile', () => {
    let testUser
    let authToken

    beforeEach(async () => {
      testUser = await createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Original',
        lastName: 'Name'
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        })

      authToken = loginResponse.body.data.token
    })

    it('should update profile successfully', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'User',
          phoneNumber: '555-9999'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.firstName).toBe('Updated')
      expect(response.body.data.user.lastName).toBe('User')
      expect(response.body.data.user.phoneNumber).toBe('555-9999')
    })

    it('should parse single name field into first/last name', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'John Doe Smith'
        })
        .expect(200)

      expect(response.body.data.user.firstName).toBe('John')
      expect(response.body.data.user.lastName).toBe('Doe Smith')
    })
  })

  describe('PUT /api/auth/password', () => {
    let testUser
    let authToken

    beforeEach(async () => {
      testUser = await createUser({
        email: 'test@example.com',
        password: 'oldpassword'
      })

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'oldpassword'
        })

      authToken = loginResponse.body.data.token
    })

    it('should change password successfully', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Password changed successfully')

      // Verify can login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'newpassword123'
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
    })

    it('should fail with incorrect current password', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toBe('Current password is incorrect')
    })
  })
})
