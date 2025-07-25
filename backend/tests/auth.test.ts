/**
 * HalalCheck EU - Authentication Tests
 * 
 * Comprehensive unit tests for authentication functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import request from 'supertest'
import { HalalCheckApp } from '../src/app'
import { pool } from '../src/database/connection'
import { UserRole, UserStatus } from '../src/types'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

describe('Authentication', () => {
  let app: HalalCheckApp
  let server: any

  beforeEach(async () => {
    app = new HalalCheckApp()
    server = app.getApp()
    
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE %test%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Test%')
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM users WHERE email LIKE %test%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Test%')
  })

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345678',
        acceptTerms: true
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Registration successful'
      })
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('tokens')
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.user.firstName).toBe(userData.firstName)
      expect(response.body.data.user.lastName).toBe(userData.lastName)
    })

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345678',
        acceptTerms: true
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345678',
        acceptTerms: true
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345678',
        acceptTerms: true
      }

      // First registration
      await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      // Second registration with same email
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('EMAIL_ALREADY_EXISTS')
    })

    it('should return 400 when terms are not accepted', async () => {
      const userData = {
        email: 'test3@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        organizationName: 'Test Organization',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345678',
        acceptTerms: false
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/login', () => {
    let testUser: any

    beforeEach(async () => {
      // Create test user and organization
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['Test Organization', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'ACTIVE'])

      const organizationId = orgResult.rows[0].id
      const passwordHash = await bcrypt.hash('SecurePassword123!', 12)

      const userResult = await pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status, 
          organization_id, email_verified, language, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `, [
        'testuser@example.com',
        passwordHash,
        'Test',
        'User',
        UserRole.ANALYST,
        UserStatus.ACTIVE,
        organizationId,
        true,
        'en',
        'Europe/Amsterdam'
      ])

      testUser = userResult.rows[0]
    })

    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'SecurePassword123!'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful'
      })
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('tokens')
      expect(response.body.data.user.email).toBe(loginData.email)
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should return 401 for invalid password', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'WrongPassword'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('INVALID_CREDENTIALS')
    })

    it('should return 401 for suspended user', async () => {
      // Update user status to suspended
      await pool.query(
        'UPDATE users SET status = $1 WHERE email = $2',
        [UserStatus.SUSPENDED, 'testuser@example.com']
      )

      const loginData = {
        email: 'testuser@example.com',
        password: 'SecurePassword123!'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('ACCOUNT_SUSPENDED')
    })

    it('should return 401 for unverified email', async () => {
      // Update user to unverified
      await pool.query(
        'UPDATE users SET email_verified = false WHERE email = $1',
        ['testuser@example.com']
      )

      const loginData = {
        email: 'testuser@example.com',
        password: 'SecurePassword123!'
      }

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('EMAIL_NOT_VERIFIED')
    })
  })

  describe('POST /api/auth/refresh', () => {
    let testUser: any
    let refreshToken: string

    beforeEach(async () => {
      // Create test user and get refresh token
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['Test Organization', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'ACTIVE'])

      const organizationId = orgResult.rows[0].id
      const passwordHash = await bcrypt.hash('SecurePassword123!', 12)

      const userResult = await pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status, 
          organization_id, email_verified, language, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
        RETURNING *
      `, [
        'refreshtest@example.com',
        passwordHash,
        'Test',
        'User',
        UserRole.ANALYST,
        UserStatus.ACTIVE,
        organizationId,
        true,
        'en',
        'Europe/Amsterdam'
      ])

      testUser = userResult.rows[0]

      // Login to get refresh token
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'refreshtest@example.com',
          password: 'SecurePassword123!'
        })

      refreshToken = loginResponse.body.data.tokens.refreshToken
    })

    it('should refresh tokens successfully', async () => {
      const response = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Tokens refreshed successfully'
      })
      expect(response.body.data).toHaveProperty('tokens')
      expect(response.body.data.tokens).toHaveProperty('accessToken')
      expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('INVALID_TOKEN')
    })

    it('should return 401 for expired refresh token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { sub: testUser.id, type: 'refresh' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' }
      )

      const response = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('TOKEN_EXPIRED')
    })
  })

  describe('POST /api/auth/logout', () => {
    let accessToken: string

    beforeEach(async () => {
      // Create test user and login
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['Test Organization', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'ACTIVE'])

      const organizationId = orgResult.rows[0].id
      const passwordHash = await bcrypt.hash('SecurePassword123!', 12)

      await pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status, 
          organization_id, email_verified, language, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'logouttest@example.com',
        passwordHash,
        'Test',
        'User',
        UserRole.ANALYST,
        UserStatus.ACTIVE,
        organizationId,
        true,
        'en',
        'Europe/Amsterdam'
      ])

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'logouttest@example.com',
          password: 'SecurePassword123!'
        })

      accessToken = loginResponse.body.data.tokens.accessToken
    })

    it('should logout successfully', async () => {
      const response = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Logout successful'
      })
    })

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .post('/api/auth/logout')
        .expect(401)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('NO_TOKEN_PROVIDED')
    })
  })

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create test user
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['Test Organization', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'ACTIVE'])

      const organizationId = orgResult.rows[0].id
      const passwordHash = await bcrypt.hash('SecurePassword123!', 12)

      await pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status, 
          organization_id, email_verified, language, timezone
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        'forgottest@example.com',
        passwordHash,
        'Test',
        'User',
        UserRole.ANALYST,
        UserStatus.ACTIVE,
        organizationId,
        true,
        'en',
        'Europe/Amsterdam'
      ])
    })

    it('should send reset email for valid user', async () => {
      const response = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgottest@example.com' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password reset email sent'
      })

      // Verify reset token was created
      const userResult = await pool.query(
        'SELECT password_reset_token, password_reset_expires FROM users WHERE email = $1',
        ['forgottest@example.com']
      )

      expect(userResult.rows[0].password_reset_token).toBeTruthy()
      expect(userResult.rows[0].password_reset_expires).toBeTruthy()
    })

    it('should return success even for non-existent email (security)', async () => {
      const response = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password reset email sent'
      })
    })

    it('should return 400 for invalid email format', async () => {
      const response = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string

    beforeEach(async () => {
      // Create test user with reset token
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['Test Organization', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'ACTIVE'])

      const organizationId = orgResult.rows[0].id
      const passwordHash = await bcrypt.hash('SecurePassword123!', 12)
      resetToken = 'test-reset-token-' + Date.now()
      const resetExpires = new Date(Date.now() + 3600000) // 1 hour from now

      await pool.query(`
        INSERT INTO users (
          email, password_hash, first_name, last_name, role, status, 
          organization_id, email_verified, language, timezone,
          password_reset_token, password_reset_expires
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        'resettest@example.com',
        passwordHash,
        'Test',
        'User',
        UserRole.ANALYST,
        UserStatus.ACTIVE,
        organizationId,
        true,
        'en',
        'Europe/Amsterdam',
        resetToken,
        resetExpires
      ])
    })

    it('should reset password successfully', async () => {
      const response = await request(server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewSecurePassword123!'
        })
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        message: 'Password reset successful'
      })

      // Verify password was changed and reset token was cleared
      const userResult = await pool.query(
        'SELECT password_hash, password_reset_token FROM users WHERE email = $1',
        ['resettest@example.com']
      )

      const passwordChanged = await bcrypt.compare(
        'NewSecurePassword123!',
        userResult.rows[0].password_hash
      )
      expect(passwordChanged).toBe(true)
      expect(userResult.rows[0].password_reset_token).toBeNull()
    })

    it('should return 400 for invalid token', async () => {
      const response = await request(server)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewSecurePassword123!'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('INVALID_RESET_TOKEN')
    })

    it('should return 400 for expired token', async () => {
      // Update token to be expired
      const expiredDate = new Date(Date.now() - 3600000) // 1 hour ago
      await pool.query(
        'UPDATE users SET password_reset_expires = $1 WHERE email = $2',
        [expiredDate, 'resettest@example.com']
      )

      const response = await request(server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewSecurePassword123!'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('RESET_TOKEN_EXPIRED')
    })

    it('should return 400 for weak password', async () => {
      const response = await request(server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })
  })
})