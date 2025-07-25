/**
 * HalalCheck EU - Analysis Integration Tests
 * 
 * End-to-end integration tests for ingredient analysis workflows
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import { HalalCheckApp } from '../../src/app'
import { pool } from '../../src/database/connection'
import { HalalStatus, RiskLevel, UserRole } from '../../src/types'
import fs from 'fs'
import path from 'path'

// Mock OpenAI for consistent testing
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    }
  }))
}))

describe('Analysis Integration', () => {
  let app: HalalCheckApp
  let server: any
  let userToken: string
  let adminToken: string
  let userId: string
  let organizationId: string
  let mockOpenAI: any

  beforeAll(async () => {
    app = new HalalCheckApp()
    server = app.getApp()

    // Setup OpenAI mock
    mockOpenAI = require('openai').OpenAI
  })

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Integration Analysis%')
    await pool.query('DELETE FROM users WHERE email LIKE %analysis-integration%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Analysis Integration%')

    // Create test organization
    const orgResult = await pool.query(`
      INSERT INTO organizations (name, type, country, subscription_plan, subscription_status, monthly_analysis_limit)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, ['Analysis Integration Test Org', 'FOOD_MANUFACTURER', 'Netherlands', 'PROFESSIONAL', 'ACTIVE', 500])

    organizationId = orgResult.rows[0].id

    // Create test user
    const userRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'analysis-integration-user@example.com',
        password: 'UserPassword123!',
        firstName: 'Analysis',
        lastName: 'User',
        organizationName: 'Analysis Integration Test Org',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345690',
        acceptTerms: true
      })

    userId = userRegister.body.data.user.id
    userToken = userRegister.body.data.tokens.accessToken

    // Update user to belong to our test organization
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ANALYST, organizationId, userId]
    )

    // Create admin user
    const adminRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'analysis-integration-admin@example.com',
        password: 'AdminPassword123!',
        firstName: 'Admin',
        lastName: 'User',
        organizationName: 'Analysis Integration Test Org',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345691',
        acceptTerms: true
      })

    adminToken = adminRegister.body.data.tokens.accessToken
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ADMIN, organizationId, adminRegister.body.data.user.id]
    )

    // Setup default OpenAI mock response
    mockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  ingredients: [
                    {
                      name: 'water',
                      confidence: 0.99,
                      original_text: 'water'
                    },
                    {
                      name: 'sugar',
                      confidence: 0.95,
                      original_text: 'sugar'
                    }
                  ],
                  language_detected: 'en',
                  processing_notes: 'Successfully parsed ingredient list'
                })
              }
            }]
          })
        }
      }
    }))
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Integration Analysis%')
    await pool.query('DELETE FROM users WHERE email LIKE %analysis-integration%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Analysis Integration%')
    jest.clearAllMocks()
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Complete Analysis Workflow', () => {
    it('should complete full text analysis workflow', async () => {
      const analysisData = {
        productName: 'Integration Analysis Test Product',
        ingredientText: 'water, sugar, salt, natural vanilla flavor',
        language: 'en',
        region: 'EU'
      }

      // Step 1: Submit analysis
      const createResponse = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send(analysisData)
        .expect(200)

      expect(createResponse.body.success).toBe(true)
      expect(createResponse.body.data).toHaveProperty('id')
      expect(createResponse.body.data.productName).toBe(analysisData.productName)
      expect(createResponse.body.data.ingredients).toHaveLength(2) // water, sugar
      expect(createResponse.body.data).toHaveProperty('overallStatus')
      expect(createResponse.body.data).toHaveProperty('summary')

      const analysisId = createResponse.body.data.id

      // Step 2: Retrieve analysis by ID
      const getResponse = await request(server)
        .get(`/api/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(getResponse.body.success).toBe(true)
      expect(getResponse.body.data.id).toBe(analysisId)
      expect(getResponse.body.data.productName).toBe(analysisData.productName)

      // Step 3: Export analysis (PDF)
      const exportResponse = await request(server)
        .get(`/api/analysis/${analysisId}/export`)
        .query({ format: 'PDF' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(exportResponse.headers['content-type']).toContain('application/pdf')

      // Step 4: Export analysis (JSON)
      const jsonExportResponse = await request(server)
        .get(`/api/analysis/${analysisId}/export`)
        .query({ format: 'JSON' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(jsonExportResponse.headers['content-type']).toContain('application/json')
      expect(jsonExportResponse.body).toHaveProperty('id', analysisId)

      // Step 5: Verify analysis appears in history
      const historyResponse = await request(server)
        .get('/api/analysis/history')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(historyResponse.body.success).toBe(true)
      expect(historyResponse.body.data.data).toHaveLength.greaterThan(0)
      expect(historyResponse.body.data.data.some((a: any) => a.id === analysisId)).toBe(true)

      // Step 6: Update analysis (admin only)
      const updateData = {
        expertReviewCompleted: true,
        expertNotes: 'Reviewed and approved',
        overallStatus: HalalStatus.HALAL
      }

      const updateResponse = await request(server)
        .patch(`/api/analysis/${analysisId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200)

      expect(updateResponse.body.success).toBe(true)
      expect(updateResponse.body.data.expertReviewCompleted).toBe(true)
    })

    it('should handle image analysis workflow', async () => {
      // Mock image analysis responses
      const mockCreate = jest.fn()
        .mockResolvedValueOnce({
          // First call - vision API for text extraction
          choices: [{
            message: {
              content: 'Ingredients: water, sugar, wheat flour, vegetable oil (palm), salt'
            }
          }]
        })
        .mockResolvedValueOnce({
          // Second call - ingredient analysis
          choices: [{
            message: {
              content: JSON.stringify({
                ingredients: [
                  {
                    name: 'water',
                    confidence: 0.99,
                    original_text: 'water'
                  },
                  {
                    name: 'sugar',
                    confidence: 0.95,
                    original_text: 'sugar'
                  },
                  {
                    name: 'wheat flour',
                    confidence: 0.90,
                    original_text: 'wheat flour'
                  }
                ],
                language_detected: 'en',
                processing_notes: 'Extracted from image and analyzed'
              })
            }
          }]
        })

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      // Create a fake image file
      const imageBuffer = Buffer.from('fake-image-data')
      
      const response = await request(server)
        .post('/api/analysis/analyze-image')
        .set('Authorization', `Bearer ${userToken}`)
        .field('productName', 'Integration Analysis Image Test')
        .field('language', 'en')
        .field('region', 'EU')
        .attach('image', imageBuffer, 'test-image.jpg')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.productName).toBe('Integration Analysis Image Test')
      expect(response.body.data.ingredients).toHaveLength(3) // water, sugar, wheat flour
      expect(mockCreate).toHaveBeenCalledTimes(2) // Vision + Analysis calls
    })
  })

  describe('Analysis History and Search', () => {
    beforeEach(async () => {
      // Create multiple test analyses
      const analyses = [
        { name: 'Integration Analysis Cookies', ingredients: 'wheat flour, sugar, butter' },
        { name: 'Integration Analysis Bread', ingredients: 'wheat flour, water, yeast' },
        { name: 'Integration Analysis Juice', ingredients: 'apple juice, citric acid' },
        { name: 'Integration Analysis Candy', ingredients: 'sugar, gelatin, artificial flavors' }
      ]

      for (const analysis of analyses) {
        await request(server)
          .post('/api/analysis/analyze')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productName: analysis.name,
            ingredientText: analysis.ingredients,
            language: 'en',
            region: 'EU'
          })
      }
    })

    it('should support pagination', async () => {
      // Get first page
      const page1Response = await request(server)
        .get('/api/analysis/history')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(page1Response.body.success).toBe(true)
      expect(page1Response.body.data.data).toHaveLength(2)
      expect(page1Response.body.data.pagination.page).toBe(1)
      expect(page1Response.body.data.pagination.limit).toBe(2)
      expect(page1Response.body.data.pagination.total).toBeGreaterThanOrEqual(4)

      // Get second page
      const page2Response = await request(server)
        .get('/api/analysis/history')
        .query({ page: 2, limit: 2 })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(page2Response.body.data.data).toHaveLength.greaterThan(0)
      expect(page2Response.body.data.pagination.page).toBe(2)

      // Verify different results
      const page1Ids = page1Response.body.data.data.map((a: any) => a.id)
      const page2Ids = page2Response.body.data.data.map((a: any) => a.id)
      expect(page1Ids).not.toEqual(page2Ids)
    })

    it('should support search functionality', async () => {
      const searchResponse = await request(server)
        .get('/api/analysis/history')
        .query({ search: 'Cookies' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(searchResponse.body.success).toBe(true)
      expect(searchResponse.body.data.data).toHaveLength(1)
      expect(searchResponse.body.data.data[0].productName).toContain('Cookies')
    })

    it('should support filtering by status', async () => {
      // First, manually update one analysis to have HARAM status
      const analyses = await pool.query(
        'SELECT id FROM product_analyses WHERE product_name LIKE %Integration Analysis% LIMIT 1'
      )
      
      if (analyses.rows.length > 0) {
        await pool.query(
          'UPDATE product_analyses SET overall_status = $1 WHERE id = $2',
          [HalalStatus.HARAM, analyses.rows[0].id]
        )

        const filterResponse = await request(server)
          .get('/api/analysis/history')
          .query({ status: HalalStatus.HARAM })
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)

        expect(filterResponse.body.success).toBe(true)
        expect(filterResponse.body.data.data).toHaveLength(1)
        expect(filterResponse.body.data.data[0].overallStatus).toBe(HalalStatus.HARAM)
      }
    })

    it('should support sorting', async () => {
      // Sort by name ascending
      const nameAscResponse = await request(server)
        .get('/api/analysis/history')
        .query({ sortBy: 'name_asc' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(nameAscResponse.body.success).toBe(true)
      const nameAscNames = nameAscResponse.body.data.data.map((a: any) => a.productName)
      const sortedNames = [...nameAscNames].sort()
      expect(nameAscNames).toEqual(sortedNames)

      // Sort by date descending (newest first)
      const dateDescResponse = await request(server)
        .get('/api/analysis/history')
        .query({ sortBy: 'date_desc' })
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(dateDescResponse.body.success).toBe(true)
      const dates = dateDescResponse.body.data.data.map((a: any) => new Date(a.analyzedAt))
      
      // Verify dates are in descending order
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i-1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime())
      }
    })
  })

  describe('Bulk Operations', () => {
    let analysisIds: string[]

    beforeEach(async () => {
      analysisIds = []
      
      // Create multiple test analyses
      for (let i = 0; i < 3; i++) {
        const response = await request(server)
          .post('/api/analysis/analyze')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            productName: `Integration Analysis Bulk Test ${i + 1}`,
            ingredientText: 'water, sugar, salt',
            language: 'en',
            region: 'EU'
          })
        
        analysisIds.push(response.body.data.id)
      }
    })

    it('should support bulk export', async () => {
      const bulkExportResponse = await request(server)
        .post('/api/analysis/bulk-export')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          analysisIds,
          format: 'PDF',
          includeStatistics: true
        })
        .expect(200)

      expect(bulkExportResponse.headers['content-type']).toContain('application/pdf')
    })

    it('should support bulk status updates (admin only)', async () => {
      const bulkUpdateResponse = await request(server)
        .patch('/api/analysis/bulk-update')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          analysisIds,
          updates: {
            expertReviewCompleted: true,
            expertNotes: 'Bulk review completed'
          }
        })
        .expect(200)

      expect(bulkUpdateResponse.body.success).toBe(true)
      expect(bulkUpdateResponse.body.data.updatedCount).toBe(3)

      // Verify updates were applied
      for (const id of analysisIds) {
        const verifyResponse = await request(server)
          .get(`/api/analysis/${id}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200)

        expect(verifyResponse.body.data.expertReviewCompleted).toBe(true)
      }
    })

    it('should reject bulk operations for regular users', async () => {
      await request(server)
        .patch('/api/analysis/bulk-update')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          analysisIds,
          updates: {
            expertReviewCompleted: true
          }
        })
        .expect(403)
    })
  })

  describe('Usage Limits and Subscription', () => {
    it('should track analysis usage correctly', async () => {
      // Get initial usage
      const initialUsageResponse = await request(server)
        .get('/api/dashboard/usage')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const initialUsage = initialUsageResponse.body.data.currentUsage

      // Perform an analysis
      await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productName: 'Integration Analysis Usage Test',
          ingredientText: 'water, sugar',
          language: 'en',
          region: 'EU'
        })
        .expect(200)

      // Check updated usage
      const updatedUsageResponse = await request(server)
        .get('/api/dashboard/usage')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      const updatedUsage = updatedUsageResponse.body.data.currentUsage
      expect(updatedUsage).toBe(initialUsage + 1)
    })

    it('should enforce subscription limits', async () => {
      // Update organization to have very low limit
      await pool.query(
        'UPDATE organizations SET monthly_analysis_limit = 1, current_month_usage = 1 WHERE id = $1',
        [organizationId]
      )

      // Try to analyze (should be rejected)
      const response = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productName: 'Integration Analysis Limit Test',
          ingredientText: 'water, sugar',
          language: 'en',
          region: 'EU'
        })
        .expect(429)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('USAGE_LIMIT_EXCEEDED')
    })
  })

  describe('Error Handling', () => {
    it('should handle analysis of non-existent product', async () => {
      const response = await request(server)
        .get('/api/analysis/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('ANALYSIS_NOT_FOUND')
    })

    it('should handle malformed analysis requests', async () => {
      const response = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productName: '', // Empty name
          ingredientText: '', // Empty ingredients
          language: 'invalid'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('VALIDATION_ERROR')
    })

    it('should handle OpenAI API failures gracefully', async () => {
      // Mock OpenAI to throw error
      const mockCreate = jest.fn().mockRejectedValue(new Error('OpenAI API Error'))

      mockOpenAI.mockImplementation(() => ({
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }))

      const response = await request(server)
        .post('/api/analysis/analyze')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productName: 'Integration Analysis Error Test',
          ingredientText: 'water, sugar',
          language: 'en',
          region: 'EU'
        })
        .expect(500)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('ANALYSIS_FAILED')
    })
  })
})