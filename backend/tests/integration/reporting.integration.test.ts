/**
 * HalalCheck EU - Reporting Integration Tests
 * 
 * End-to-end integration tests for report generation and export functionality
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import { HalalCheckApp } from '../../src/app'
import { pool } from '../../src/database/connection'
import { HalalStatus, RiskLevel, UserRole } from '../../src/types'
import path from 'path'
import fs from 'fs'

describe('Reporting Integration', () => {
  let app: HalalCheckApp
  let server: any
  let adminToken: string
  let analystToken: string
  let organizationId: string
  let analystUserId: string
  let analysisIds: string[] = []

  beforeAll(async () => {
    app = new HalalCheckApp()
    server = app.getApp()
  })

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE \'%Reporting Integration%\'')
    await pool.query('DELETE FROM users WHERE email LIKE \'%reporting-integration%\'')
    await pool.query('DELETE FROM organizations WHERE name LIKE \'%Reporting Integration%\'')

    // Create test organization
    const orgResult = await pool.query(`
      INSERT INTO organizations (
        name, type, country, subscription_plan, subscription_status, 
        monthly_analysis_limit, current_month_usage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [
      'Reporting Integration Test Org', 
      'CERTIFICATION_BODY', 
      'Netherlands', 
      'PROFESSIONAL', 
      'ACTIVE',
      500,
      0
    ])

    organizationId = orgResult.rows[0].id

    // Create admin user
    const adminRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'reporting-integration-admin@example.com',
        password: 'AdminPassword123!',
        firstName: 'Reporting',
        lastName: 'Admin',
        organizationName: 'Reporting Integration Test Org',
        organizationType: 'CERTIFICATION_BODY',
        country: 'Netherlands',
        phone: '+31612345720',
        acceptTerms: true
      })

    adminToken = adminRegister.body.data.tokens.accessToken
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ADMIN, organizationId, adminRegister.body.data.user.id]
    )

    // Create analyst user
    const analystRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'reporting-integration-analyst@example.com',
        password: 'AnalystPassword123!',
        firstName: 'Reporting',
        lastName: 'Analyst',
        organizationName: 'Reporting Integration Test Org',
        organizationType: 'CERTIFICATION_BODY',
        country: 'Netherlands',
        phone: '+31612345721',
        acceptTerms: true
      })

    analystToken = analystRegister.body.data.tokens.accessToken
    analystUserId = analystRegister.body.data.user.id
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ANALYST, organizationId, analystUserId]
    )

    // Create diverse test analyses
    const analyses = [
      { name: 'Reporting Integration Halal Product 1', status: HalalStatus.HALAL, risk: RiskLevel.VERY_LOW },
      { name: 'Reporting Integration Halal Product 2', status: HalalStatus.HALAL, risk: RiskLevel.LOW },
      { name: 'Reporting Integration Haram Product 1', status: HalalStatus.HARAM, risk: RiskLevel.VERY_HIGH },
      { name: 'Reporting Integration Mashbooh Product 1', status: HalalStatus.MASHBOOH, risk: RiskLevel.MEDIUM },
      { name: 'Reporting Integration Review Product 1', status: HalalStatus.REQUIRES_REVIEW, risk: RiskLevel.HIGH },
      { name: 'Reporting Integration Halal Product 3', status: HalalStatus.HALAL, risk: RiskLevel.LOW }
    ]

    analysisIds = []
    
    for (const analysis of analyses) {
      const result = await pool.query(`
        INSERT INTO product_analyses (
          product_name, organization_id, analyzed_by, overall_status, 
          overall_risk_level, analyzed_at, expert_review_required,
          summary, ingredient_details
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        analysis.name,
        organizationId,
        analystUserId,
        analysis.status,
        analysis.risk,
        new Date(),
        analysis.status === HalalStatus.REQUIRES_REVIEW || analysis.status === HalalStatus.MASHBOOH,
        JSON.stringify({
          total_ingredients: 5,
          halal_count: analysis.status === HalalStatus.HALAL ? 5 : 3,
          haram_count: analysis.status === HalalStatus.HARAM ? 1 : 0,
          mashbooh_count: analysis.status === HalalStatus.MASHBOOH ? 1 : 0,
          unknown_count: analysis.status === HalalStatus.REQUIRES_REVIEW ? 1 : 0
        }),
        JSON.stringify([
          {
            name: 'Water',
            status: HalalStatus.HALAL,
            risk_level: RiskLevel.VERY_LOW,
            confidence: 0.99,
            reasoning: 'Water is universally halal',
            category: 'NATURAL',
            alternatives: []
          },
          {
            name: 'Salt',
            status: HalalStatus.HALAL,
            risk_level: RiskLevel.VERY_LOW,
            confidence: 0.99,
            reasoning: 'Natural salt is halal',
            category: 'NATURAL',
            alternatives: []
          }
        ])
      ])
      
      analysisIds.push(result.rows[0].id)
    }
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE \'%Reporting Integration%\'')
    await pool.query('DELETE FROM users WHERE email LIKE \'%reporting-integration%\'')
    await pool.query('DELETE FROM organizations WHERE name LIKE \'%Reporting Integration%\'')
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Report Generation', () => {
    it('should generate comprehensive PDF report', async () => {
      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: analysisIds,
          includeDetails: true,
          includeIngredientBreakdown: true,
          includeRecommendations: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('reportId')
      expect(response.body.data).toHaveProperty('downloadUrl')
      expect(response.body.data).toHaveProperty('expiresAt')

      // Verify report exists
      expect(response.body.data.downloadUrl).toContain('.pdf')
    })

    it('should generate Excel export with proper structure', async () => {
      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'excel',
          analysisIds: analysisIds,
          includeDetails: true,
          includeIngredientBreakdown: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.downloadUrl).toContain('.xlsx')

      // Should generate report with multiple sheets
      expect(response.body.data).toHaveProperty('reportId')
      expect(response.body.data).toHaveProperty('metadata')
    })

    it('should generate JSON export with complete data', async () => {
      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'json',
          analysisIds: analysisIds,
          includeDetails: true,
          includeIngredientBreakdown: true,
          includeRecommendations: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.downloadUrl).toContain('.json')

      // JSON should include all requested data
      expect(response.body.data.metadata).toHaveProperty('totalAnalyses')
      expect(response.body.data.metadata.totalAnalyses).toBe(analysisIds.length)
    })

    it('should handle filtered report generation', async () => {
      // Generate report for only halal products
      const halalAnalysisIds = analysisIds.slice(0, 3) // First 3 are halal

      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: halalAnalysisIds,
          includeDetails: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.metadata.totalAnalyses).toBe(halalAnalysisIds.length)
    })

    it('should validate analysis ownership for reports', async () => {
      // Try to generate report with analyses from different organization
      const fakeAnalysisIds = ['00000000-0000-0000-0000-000000000000']

      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: fakeAnalysisIds,
          includeDetails: true
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No valid analyses found')
    })

    it('should handle empty analysis list gracefully', async () => {
      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: [],
          includeDetails: true
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('No analyses selected')
    })

    it('should respect report generation limits', async () => {
      // Try to generate report with too many analyses
      const manyAnalysisIds = new Array(101).fill(analysisIds[0]) // Exceed limit

      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: manyAnalysisIds,
          includeDetails: true
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('too many analyses')
    })
  })

  describe('Report Download', () => {
    let reportId: string
    let downloadUrl: string

    beforeEach(async () => {
      // Generate a test report
      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: analysisIds.slice(0, 3),
          includeDetails: true
        })

      reportId = response.body.data.reportId
      downloadUrl = response.body.data.downloadUrl
    })

    it('should allow report download with valid token', async () => {
      const response = await request(server)
        .get(downloadUrl)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.headers['content-type']).toContain('application/pdf')
      expect(response.headers['content-disposition']).toContain('attachment')
    })

    it('should prevent unauthorized report access', async () => {
      const response = await request(server)
        .get(downloadUrl)
        .expect(401)

      expect(response.body.success).toBe(false)
    })

    it('should handle expired report links', async () => {
      // Mock expired report
      await pool.query(
        'UPDATE reports SET expires_at = $1 WHERE id = $2',
        [new Date(Date.now() - 1000), reportId]
      )

      const response = await request(server)
        .get(downloadUrl)
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('expired')
    })
  })

  describe('Report History', () => {
    beforeEach(async () => {
      // Generate several test reports
      for (let i = 0; i < 5; i++) {
        await request(server)
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${analystToken}`)
          .send({
            format: i % 2 === 0 ? 'pdf' : 'excel',
            analysisIds: analysisIds.slice(0, 2),
            includeDetails: true
          })
      }
    })

    it('should return user report history', async () => {
      const response = await request(server)
        .get('/api/reports/history')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBe(5)

      // Verify report structure
      const report = response.body.data[0]
      expect(report).toHaveProperty('id')
      expect(report).toHaveProperty('format')
      expect(report).toHaveProperty('analysisCount')
      expect(report).toHaveProperty('createdAt')
      expect(report).toHaveProperty('expiresAt')
      expect(report).toHaveProperty('status')
    })

    it('should filter reports by format', async () => {
      const response = await request(server)
        .get('/api/reports/history')
        .query({ format: 'pdf' })
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.forEach((report: any) => {
        expect(report.format).toBe('pdf')
      })
    })

    it('should paginate report history', async () => {
      const response = await request(server)
        .get('/api/reports/history')
        .query({ limit: 3, offset: 0 })
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBe(3)
      expect(response.body.data).toHaveProperty('total')
      expect(response.body.data).toHaveProperty('hasMore')
    })

    it('should sort reports by creation date', async () => {
      const response = await request(server)
        .get('/api/reports/history')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      
      // Should be sorted by most recent first
      const reports = response.body.data
      for (let i = 1; i < reports.length; i++) {
        const prevDate = new Date(reports[i - 1].createdAt)
        const currDate = new Date(reports[i].createdAt)
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime())
      }
    })
  })

  describe('Report Templates', () => {
    it('should list available report templates', async () => {
      const response = await request(server)
        .get('/api/reports/templates')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBeGreaterThan(0)

      const template = response.body.data[0]
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('supportedFormats')
      expect(template).toHaveProperty('requiredFields')
    })

    it('should generate report using specific template', async () => {
      const templatesResponse = await request(server)
        .get('/api/reports/templates')
        .set('Authorization', `Bearer ${analystToken}`)

      const template = templatesResponse.body.data[0]

      const response = await request(server)
        .post('/api/reports/generate')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'pdf',
          analysisIds: analysisIds.slice(0, 2),
          templateId: template.id,
          includeDetails: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('reportId')
    })
  })

  describe('Bulk Export', () => {
    it('should handle bulk export of all analyses', async () => {
      const response = await request(server)
        .post('/api/reports/bulk-export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'excel',
          filters: {
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          includeDetails: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('reportId')
      expect(response.body.data).toHaveProperty('totalAnalyses')
      expect(response.body.data.totalAnalyses).toBe(analysisIds.length)
    })

    it('should filter bulk export by status', async () => {
      const response = await request(server)
        .post('/api/reports/bulk-export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          format: 'json',
          filters: {
            status: [HalalStatus.HALAL],
            dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            dateTo: new Date().toISOString()
          },
          includeDetails: true
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      // Should only include halal analyses
      expect(response.body.data.totalAnalyses).toBe(3) // 3 halal products in our test data
    })

    it('should restrict bulk export to admin users', async () => {
      const response = await request(server)
        .post('/api/reports/bulk-export')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          format: 'excel',
          filters: {},
          includeDetails: true
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('insufficient permissions')
    })
  })

  describe('Report Analytics', () => {
    beforeEach(async () => {
      // Generate reports for analytics
      for (let i = 0; i < 10; i++) {
        await request(server)
          .post('/api/reports/generate')
          .set('Authorization', `Bearer ${analystToken}`)
          .send({
            format: ['pdf', 'excel', 'json'][i % 3],
            analysisIds: analysisIds.slice(0, Math.max(1, i % 4)),
            includeDetails: true
          })
      }
    })

    it('should provide report generation statistics', async () => {
      const response = await request(server)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalReports')
      expect(response.body.data).toHaveProperty('reportsByFormat')
      expect(response.body.data).toHaveProperty('reportsThisMonth')
      expect(response.body.data).toHaveProperty('averageAnalysesPerReport')

      expect(response.body.data.totalReports).toBe(10)
      expect(response.body.data.reportsByFormat).toHaveProperty('pdf')
      expect(response.body.data.reportsByFormat).toHaveProperty('excel')
      expect(response.body.data.reportsByFormat).toHaveProperty('json')
    })

    it('should show report trends over time', async () => {
      const response = await request(server)
        .get('/api/reports/analytics/trends')
        .query({ period: '30d' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('dailyReports')
      expect(response.body.data).toHaveProperty('formatTrends')
      expect(response.body.data.dailyReports).toBeInstanceOf(Array)
    })
  })
})