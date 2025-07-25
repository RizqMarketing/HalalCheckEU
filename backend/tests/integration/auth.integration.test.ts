/**
 * HalalCheck EU - Authentication Integration Tests
 * 
 * End-to-end integration tests for authentication flows
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { HalalCheckApp } from '../../src/app'
import { pool } from '../../src/database/connection'
import { UserRole, UserStatus } from '../../src/types'

describe('Authentication Integration', () => {
  let app: HalalCheckApp
  let server: any

  beforeAll(async () => {
    app = new HalalCheckApp()
    server = app.getApp()
  })

  beforeEach(async () => {
    // Clean up test data before each test
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Integration Test%')
    await pool.query('DELETE FROM users WHERE email LIKE %integration-test%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Integration Test%')
  })

  afterEach(async () => {
    // Clean up test data after each test
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Integration Test%')
    await pool.query('DELETE FROM users WHERE email LIKE %integration-test%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Integration Test%')
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Complete Registration Flow', () => {
    it('should complete full registration and login flow', async () => {
      const registrationData = {
        email: 'integration-test-full@example.com',
        password: 'SecurePassword123!',
        firstName: 'Integration',
        lastName: 'Test',
        organizationName: 'Integration Test Organization',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345678',
        acceptTerms: true
      }

      // Step 1: Register new user
      const registerResponse = await request(server)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201)

      expect(registerResponse.body.success).toBe(true)
      expect(registerResponse.body.data.user.email).toBe(registrationData.email)
      expect(registerResponse.body.data.tokens).toHaveProperty('accessToken')
      expect(registerResponse.body.data.tokens).toHaveProperty('refreshToken')

      const { accessToken, refreshToken } = registerResponse.body.data.tokens
      const userId = registerResponse.body.data.user.id

      // Step 2: Verify user was created in database
      const userResult = await pool.query(
        'SELECT u.*, o.name as org_name FROM users u LEFT JOIN organizations o ON u.organization_id = o.id WHERE u.email = $1',
        [registrationData.email]
      )

      expect(userResult.rows).toHaveLength(1)
      expect(userResult.rows[0].first_name).toBe(registrationData.firstName)
      expect(userResult.rows[0].org_name).toBe(registrationData.organizationName)

      // Step 3: Use access token to access protected endpoint
      const protectedResponse = await request(server)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)

      expect(protectedResponse.body.success).toBe(true)
      expect(protectedResponse.body.data.email).toBe(registrationData.email)

      // Step 4: Refresh tokens
      const refreshResponse = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200)

      expect(refreshResponse.body.success).toBe(true)
      expect(refreshResponse.body.data.tokens).toHaveProperty('accessToken')
      expect(refreshResponse.body.data.tokens).toHaveProperty('refreshToken')

      const newAccessToken = refreshResponse.body.data.tokens.accessToken

      // Step 5: Use new access token
      const newProtectedResponse = await request(server)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      expect(newProtectedResponse.body.success).toBe(true)

      // Step 6: Logout
      const logoutResponse = await request(server)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200)

      expect(logoutResponse.body.success).toBe(true)

      // Step 7: Try to use token after logout (should fail)
      await request(server)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(401)
    })

    it('should handle complete password reset flow', async () => {
      // First register a user
      const registrationData = {
        email: 'integration-test-reset@example.com',
        password: 'OriginalPassword123!',
        firstName: 'Reset',
        lastName: 'Test',
        organizationName: 'Integration Test Reset Org',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345679',
        acceptTerms: true
      }

      await request(server)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201)

      // Step 1: Request password reset
      const forgotResponse = await request(server)
        .post('/api/auth/forgot-password')
        .send({ email: registrationData.email })
        .expect(200)

      expect(forgotResponse.body.success).toBe(true)

      // Step 2: Get reset token from database (simulating email click)
      const tokenResult = await pool.query(
        'SELECT password_reset_token FROM users WHERE email = $1',
        [registrationData.email]
      )

      expect(tokenResult.rows[0].password_reset_token).toBeTruthy()
      const resetToken = tokenResult.rows[0].password_reset_token

      // Step 3: Reset password
      const newPassword = 'NewSecurePassword123!'
      const resetResponse = await request(server)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword
        })
        .expect(200)

      expect(resetResponse.body.success).toBe(true)

      // Step 4: Verify old password no longer works
      await request(server)
        .post('/api/auth/login')
        .send({
          email: registrationData.email,
          password: registrationData.password
        })
        .expect(401)

      // Step 5: Verify new password works
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: registrationData.email,
          password: newPassword
        })
        .expect(200)

      expect(loginResponse.body.success).toBe(true)
      expect(loginResponse.body.data.tokens).toHaveProperty('accessToken')

      // Step 6: Verify reset token was cleared
      const clearedTokenResult = await pool.query(
        'SELECT password_reset_token FROM users WHERE email = $1',
        [registrationData.email]
      )

      expect(clearedTokenResult.rows[0].password_reset_token).toBeNull()
    })
  })

  describe('Role-Based Access Control Integration', () => {
    let adminToken: string
    let analyistToken: string
    let viewerToken: string
    let adminUserId: string
    let analystUserId: string
    let viewerUserId: string
    let organizationId: string

    beforeEach(async () => {
      // Create test organization
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status)
        VALUES ($1, $2, $3, $4, $5) RETURNING id
      `, ['RBAC Test Organization', 'CERTIFICATION_BODY', 'Netherlands', 'ENTERPRISE', 'ACTIVE'])

      organizationId = orgResult.rows[0].id

      // Create admin user
      const adminRegister = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'integration-test-admin@example.com',
          password: 'AdminPassword123!',
          firstName: 'Admin',
          lastName: 'User',
          organizationName: 'RBAC Test Organization',
          organizationType: 'CERTIFICATION_BODY',
          country: 'Netherlands',
          phone: '+31612345680',
          acceptTerms: true
        })

      adminUserId = adminRegister.body.data.user.id
      adminToken = adminRegister.body.data.tokens.accessToken

      // Update admin role
      await pool.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        [UserRole.ADMIN, adminUserId]
      )

      // Create analyst user
      const analystRegister = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'integration-test-analyst@example.com',
          password: 'AnalystPassword123!',
          firstName: 'Analyst',
          lastName: 'User',
          organizationName: 'RBAC Test Organization',
          organizationType: 'CERTIFICATION_BODY',
          country: 'Netherlands',
          phone: '+31612345681',
          acceptTerms: true
        })

      analystUserId = analystRegister.body.data.user.id
      analyistToken = analystRegister.body.data.tokens.accessToken

      // Update analyst role
      await pool.query(
        'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
        [UserRole.ANALYST, organizationId, analystUserId]
      )

      // Create viewer user
      const viewerRegister = await request(server)
        .post('/api/auth/register')
        .send({
          email: 'integration-test-viewer@example.com',
          password: 'ViewerPassword123!',
          firstName: 'Viewer',
          lastName: 'User',
          organizationName: 'RBAC Test Organization',
          organizationType: 'CERTIFICATION_BODY',
          country: 'Netherlands',
          phone: '+31612345682',
          acceptTerms: true
        })

      viewerUserId = viewerRegister.body.data.user.id
      viewerToken = viewerRegister.body.data.tokens.accessToken

      // Update viewer role
      await pool.query(
        'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
        [UserRole.VIEWER, organizationId, viewerUserId]
      )
    })

    it('should enforce admin-only endpoints', async () => {
      // Admin should access admin endpoints
      const adminResponse = await request(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(adminResponse.body.success).toBe(true)

      // Analyst should be denied admin endpoints
      await request(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${analyistToken}`)
        .expect(403)

      // Viewer should be denied admin endpoints
      await request(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403)
    })

    it('should enforce analysis permissions correctly', async () => {
      const analysisData = {
        productName: 'Integration Test Product',
        ingredientText: 'water, sugar, salt',
        language: 'en',
        region: 'EU'
      }

      // Admin should be able to analyze
      const adminAnalysis = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(analysisData)
        .expect(200)

      expect(adminAnalysis.body.success).toBe(true)

      // Analyst should be able to analyze
      const analystAnalysis = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${analyistToken}`)
        .send(analysisData)
        .expect(200)

      expect(analystAnalysis.body.success).toBe(true)

      // Viewer should be denied analysis creation
      await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(analysisData)
        .expect(403)
    })

    it('should enforce view permissions correctly', async () => {
      // Create an analysis as admin
      const analysisData = {
        productName: 'Integration Test View Product',
        ingredientText: 'water, sugar',
        language: 'en',
        region: 'EU'
      }

      const createResponse = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(analysisData)

      const analysisId = createResponse.body.data.id

      // All roles should be able to view analysis history
      const adminView = await request(server)
        .get('/api/analysis/history')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const analystView = await request(server)
        .get('/api/analysis/history')
        .set('Authorization', `Bearer ${analyistToken}`)
        .expect(200)

      const viewerView = await request(server)
        .get('/api/analysis/history')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200)

      expect(adminView.body.success).toBe(true)
      expect(analystView.body.success).toBe(true)
      expect(viewerView.body.success).toBe(true)
    })
  })

  describe('Security Integration', () => {
    it('should prevent SQL injection attacks', async () => {
      const maliciousEmail = "test'; DROP TABLE users; --"
      
      const response = await request(server)
        .post('/api/auth/login')
        .send({
          email: maliciousEmail,
          password: 'password'
        })
        .expect(401)

      expect(response.body.success).toBe(false)
      
      // Verify users table still exists
      const result = await pool.query('SELECT COUNT(*) FROM users')
      expect(result.rows).toBeDefined()
    })

    it('should handle rate limiting on login attempts', async () => {
      const loginData = {
        email: 'integration-test-rate-limit@example.com',
        password: 'WrongPassword123!'
      }

      // Make multiple failed login attempts
      const promises = Array(6).fill(null).map(() => 
        request(server)
          .post('/api/auth/login')
          .send(loginData)
      )

      const responses = await Promise.all(promises)
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    it('should sanitize input data', async () => {
      const maliciousData = {
        email: 'integration-test-xss@example.com',
        password: 'Password123!',
        firstName: '<script>alert("xss")</script>',
        lastName: 'Test',
        organizationName: '<img src="x" onerror="alert(1)">',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345683',
        acceptTerms: true
      }

      const response = await request(server)
        .post('/api/auth/register')
        .send(maliciousData)
        .expect(201)

      // Verify dangerous content was sanitized
      expect(response.body.data.user.firstName).not.toContain('<script>')
      expect(response.body.data.user.firstName).not.toContain('alert')
      
      // Verify in database
      const userResult = await pool.query(
        'SELECT first_name FROM users WHERE email = $1',
        [maliciousData.email]
      )
      
      expect(userResult.rows[0].first_name).not.toContain('<script>')
    })

    it('should handle concurrent registration attempts', async () => {
      const userData = {
        email: 'integration-test-concurrent@example.com',
        password: 'Password123!',
        firstName: 'Concurrent',
        lastName: 'Test',
        organizationName: 'Concurrent Test Org',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345684',
        acceptTerms: true
      }

      // Attempt concurrent registrations with same email
      const promises = Array(3).fill(null).map(() => 
        request(server)
          .post('/api/auth/register')
          .send(userData)
      )

      const responses = await Promise.all(promises)
      
      // Only one should succeed
      const successfulResponses = responses.filter(r => r.status === 201)
      const failedResponses = responses.filter(r => r.status === 409)
      
      expect(successfulResponses).toHaveLength(1)
      expect(failedResponses).toHaveLength(2)
      
      // Verify only one user was created
      const userResult = await pool.query(
        'SELECT COUNT(*) FROM users WHERE email = $1',
        [userData.email]
      )
      
      expect(parseInt(userResult.rows[0].count)).toBe(1)
    })
  })
})