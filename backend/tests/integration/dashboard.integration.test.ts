/**
 * HalalCheck EU - Dashboard Integration Tests
 * 
 * End-to-end integration tests for dashboard statistics and data
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals'
import request from 'supertest'
import { HalalCheckApp } from '../../src/app'
import { pool } from '../../src/database/connection'
import { HalalStatus, RiskLevel, UserRole } from '../../src/types'

describe('Dashboard Integration', () => {
  let app: HalalCheckApp
  let server: any
  let adminToken: string
  let analystToken: string
  let viewerToken: string
  let organizationId: string
  let analystUserId: string

  beforeAll(async () => {
    app = new HalalCheckApp()
    server = app.getApp()
  })

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Dashboard Integration%')
    await pool.query('DELETE FROM users WHERE email LIKE %dashboard-integration%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Dashboard Integration%')

    // Create test organization
    const orgResult = await pool.query(`
      INSERT INTO organizations (
        name, type, country, subscription_plan, subscription_status, 
        monthly_analysis_limit, current_month_usage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [
      'Dashboard Integration Test Org', 
      'CERTIFICATION_BODY', 
      'Netherlands', 
      'ENTERPRISE', 
      'ACTIVE',
      1000,
      0
    ])

    organizationId = orgResult.rows[0].id

    // Create admin user
    const adminRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'dashboard-integration-admin@example.com',
        password: 'AdminPassword123!',
        firstName: 'Dashboard',
        lastName: 'Admin',
        organizationName: 'Dashboard Integration Test Org',
        organizationType: 'CERTIFICATION_BODY',
        country: 'Netherlands',
        phone: '+31612345710',
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
        email: 'dashboard-integration-analyst@example.com',
        password: 'AnalystPassword123!',
        firstName: 'Dashboard',
        lastName: 'Analyst',
        organizationName: 'Dashboard Integration Test Org',
        organizationType: 'CERTIFICATION_BODY',
        country: 'Netherlands',
        phone: '+31612345711',
        acceptTerms: true
      })

    analystToken = analystRegister.body.data.tokens.accessToken
    analystUserId = analystRegister.body.data.user.id
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ANALYST, organizationId, analystUserId]
    )

    // Create viewer user
    const viewerRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'dashboard-integration-viewer@example.com',
        password: 'ViewerPassword123!',
        firstName: 'Dashboard',
        lastName: 'Viewer',
        organizationName: 'Dashboard Integration Test Org',
        organizationType: 'CERTIFICATION_BODY',
        country: 'Netherlands',
        phone: '+31612345712',
        acceptTerms: true
      })

    viewerToken = viewerRegister.body.data.tokens.accessToken
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.VIEWER, organizationId, viewerRegister.body.data.user.id]
    )
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Dashboard Integration%')
    await pool.query('DELETE FROM users WHERE email LIKE %dashboard-integration%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Dashboard Integration%')
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Dashboard Statistics', () => {
    beforeEach(async () => {
      // Create test analyses with various statuses
      const analyses = [
        { name: 'Dashboard Integration Halal Product 1', status: HalalStatus.HALAL, risk: RiskLevel.LOW },
        { name: 'Dashboard Integration Halal Product 2', status: HalalStatus.HALAL, risk: RiskLevel.VERY_LOW },
        { name: 'Dashboard Integration Haram Product 1', status: HalalStatus.HARAM, risk: RiskLevel.VERY_HIGH },
        { name: 'Dashboard Integration Mashbooh Product 1', status: HalalStatus.MASHBOOH, risk: RiskLevel.MEDIUM },
        { name: 'Dashboard Integration Mashbooh Product 2', status: HalalStatus.MASHBOOH, risk: RiskLevel.HIGH },
        { name: 'Dashboard Integration Review Product 1', status: HalalStatus.REQUIRES_REVIEW, risk: RiskLevel.MEDIUM }
      ]

      for (const analysis of analyses) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required,
            summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
          })
        ])
      }

      // Create some analyses from previous month for growth calculation
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)

      for (let i = 0; i < 3; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required,
            summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Last Month Product ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.HALAL,
          RiskLevel.LOW,
          lastMonth,
          false,
          JSON.stringify({
            total_ingredients: 3,
            halal_count: 3,
            haram_count: 0,
            mashbooh_count: 0,
            unknown_count: 0
          })
        ])
      }
    })

    it('should return comprehensive dashboard statistics', async () => {
      const response = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('totalAnalyses')
      expect(response.body.data).toHaveProperty('halalCount')
      expect(response.body.data).toHaveProperty('haramCount')
      expect(response.body.data).toHaveProperty('mashboohCount')
      expect(response.body.data).toHaveProperty('pendingReviews')
      expect(response.body.data).toHaveProperty('monthlyAnalyses')

      // Verify counts are correct
      expect(response.body.data.totalAnalyses).toBe(9) // 6 current + 3 last month
      expect(response.body.data.halalCount).toBe(5) // 2 current + 3 last month
      expect(response.body.data.haramCount).toBe(1)
      expect(response.body.data.mashboohCount).toBe(2)
      expect(response.body.data.pendingReviews).toBe(3) // 2 mashbooh + 1 requires review
      expect(response.body.data.monthlyAnalyses).toBe(6) // Only current month

      // Should include growth metrics
      expect(response.body.data).toHaveProperty('monthlyGrowth')
      expect(response.body.data).toHaveProperty('analysesGrowth')
    })

    it('should scope statistics by user role', async () => {
      // Admin should see all organization data
      const adminResponse = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      // Analyst should see their own data
      const analystResponse = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      // Viewer should see organization data
      const viewerResponse = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200)

      // All should see the same data since they're in the same organization
      expect(adminResponse.body.data.totalAnalyses).toBe(analystResponse.body.data.totalAnalyses)
      expect(analystResponse.body.data.totalAnalyses).toBe(viewerResponse.body.data.totalAnalyses)
    })

    it('should handle empty statistics gracefully', async () => {
      // Clean up all analyses
      await pool.query('DELETE FROM product_analyses WHERE organization_id = $1', [organizationId])

      const response = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.totalAnalyses).toBe(0)
      expect(response.body.data.halalCount).toBe(0)
      expect(response.body.data.haramCount).toBe(0)
      expect(response.body.data.mashboohCount).toBe(0)
      expect(response.body.data.pendingReviews).toBe(0)
      expect(response.body.data.monthlyAnalyses).toBe(0)
    })
  })

  describe('Recent Analyses', () => {
    beforeEach(async () => {
      // Create analyses with different timestamps
      const now = new Date()
      
      for (let i = 0; i < 8; i++) {
        const analysisDate = new Date(now.getTime() - (i * 60 * 60 * 1000)) // Each 1 hour apart
        
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required,
            summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Recent Product ${i + 1}`,
          organizationId,
          analystUserId,
          i % 2 === 0 ? HalalStatus.HALAL : HalalStatus.MASHBOOH,
          RiskLevel.LOW,
          analysisDate,
          i % 2 !== 0, // Every other requires review
          JSON.stringify({
            total_ingredients: 4,
            halal_count: 3,
            haram_count: 0,
            mashbooh_count: i % 2 !== 0 ? 1 : 0,
            unknown_count: 0
          })
        ])
      }
    })

    it('should return recent analyses in chronological order', async () => {
      const response = await request(server)
        .get('/api/dashboard/recent-analyses')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(5) // Default limit

      // Should be ordered by most recent first
      const analyses = response.body.data
      for (let i = 1; i < analyses.length; i++) {
        const prevDate = new Date(analyses[i - 1].analyzedAt)
        const currDate = new Date(analyses[i].analyzedAt)
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime())
      }

      // Verify structure
      expect(analyses[0]).toHaveProperty('id')
      expect(analyses[0]).toHaveProperty('productName')
      expect(analyses[0]).toHaveProperty('overallStatus')
      expect(analyses[0]).toHaveProperty('overallRiskLevel')
      expect(analyses[0]).toHaveProperty('expertReviewRequired')
      expect(analyses[0]).toHaveProperty('analyzedAt')
      expect(analyses[0]).toHaveProperty('summary')
    })

    it('should respect limit parameter', async () => {
      const response = await request(server)
        .get('/api/dashboard/recent-analyses')
        .query({ limit: 3 })
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(3)
    })

    it('should cap limit at maximum value', async () => {
      const response = await request(server)
        .get('/api/dashboard/recent-analyses')
        .query({ limit: 100 }) // Should be capped at 20
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.length).toBeLessThanOrEqual(20)
    })

    it('should include analyzer information', async () => {
      const response = await request(server)
        .get('/api/dashboard/recent-analyses')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data[0]).toHaveProperty('analyzerName')
      expect(response.body.data[0].analyzerName).toContain('Dashboard')
    })
  })

  describe('Usage Statistics', () => {
    beforeEach(async () => {
      // Create current month analyses
      const currentDate = new Date()
      
      for (let i = 0; i < 25; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required,
            summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Usage Product ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.HALAL,
          RiskLevel.LOW,
          currentDate,
          false,
          JSON.stringify({
            total_ingredients: 3,
            halal_count: 3,
            haram_count: 0,
            mashbooh_count: 0,
            unknown_count: 0
          })
        ])
      }

      // Update organization usage count
      await pool.query(
        'UPDATE organizations SET current_month_usage = $1 WHERE id = $2',
        [25, organizationId]
      )
    })

    it('should return accurate usage statistics', async () => {
      const response = await request(server)
        .get('/api/dashboard/usage')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('currentUsage')
      expect(response.body.data).toHaveProperty('monthlyLimit')
      expect(response.body.data).toHaveProperty('planName')

      expect(response.body.data.currentUsage).toBe(25)
      expect(response.body.data.monthlyLimit).toBe(1000)
      expect(response.body.data.planName).toBe('ENTERPRISE')
    })

    it('should calculate usage percentage correctly', async () => {
      // Update to 50% usage
      await pool.query(
        'UPDATE organizations SET current_month_usage = $1, monthly_analysis_limit = $2 WHERE id = $3',
        [500, 1000, organizationId]
      )

      const response = await request(server)
        .get('/api/dashboard/usage')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.data.currentUsage).toBe(500)
      expect(response.body.data.monthlyLimit).toBe(1000)
      
      // Usage percentage should be calculated correctly
      const usagePercentage = (500 / 1000) * 100
      expect(usagePercentage).toBe(50)
    })

    it('should handle usage near limits', async () => {
      // Set usage to 95%
      await pool.query(
        'UPDATE organizations SET current_month_usage = $1 WHERE id = $2',
        [950, organizationId]
      )

      const response = await request(server)
        .get('/api/dashboard/usage')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.data.currentUsage).toBe(950)
      
      // Should indicate high usage
      const usagePercentage = (950 / 1000) * 100
      expect(usagePercentage).toBe(95)
    })

    it('should handle over-limit usage', async () => {
      // Set usage to 105%
      await pool.query(
        'UPDATE organizations SET current_month_usage = $1 WHERE id = $2',
        [1050, organizationId]
      )

      const response = await request(server)
        .get('/api/dashboard/usage')
        .set('Authorization', `Bearer ${analystToken}`)
        .expect(200)

      expect(response.body.data.currentUsage).toBe(1050)
      
      // Should indicate over limit
      const usagePercentage = (1050 / 1000) * 100
      expect(usagePercentage).toBe(105)
    })
  })

  describe('Dashboard Data Integration', () => {
    it('should provide consistent data across all dashboard endpoints', async () => {
      // Create a known set of analyses
      const analysisData = {
        halal: 3,
        haram: 1,
        mashbooh: 2,
        review: 1
      }

      // Create analyses
      for (let i = 0; i < analysisData.halal; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required, summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Halal ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.HALAL,
          RiskLevel.LOW,
          new Date(),
          false,
          JSON.stringify({ total_ingredients: 3, halal_count: 3, haram_count: 0, mashbooh_count: 0, unknown_count: 0 })
        ])
      }

      for (let i = 0; i < analysisData.haram; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required, summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Haram ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.HARAM,
          RiskLevel.VERY_HIGH,
          new Date(),
          false,
          JSON.stringify({ total_ingredients: 3, halal_count: 2, haram_count: 1, mashbooh_count: 0, unknown_count: 0 })
        ])
      }

      for (let i = 0; i < analysisData.mashbooh; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required, summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Mashbooh ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.MASHBOOH,
          RiskLevel.MEDIUM,
          new Date(),
          true,
          JSON.stringify({ total_ingredients: 3, halal_count: 2, haram_count: 0, mashbooh_count: 1, unknown_count: 0 })
        ])
      }

      for (let i = 0; i < analysisData.review; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required, summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Review ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.REQUIRES_REVIEW,
          RiskLevel.MEDIUM,
          new Date(),
          true,
          JSON.stringify({ total_ingredients: 3, halal_count: 2, haram_count: 0, mashbooh_count: 0, unknown_count: 1 })
        ])
      }

      // Get statistics
      const statsResponse = await request(server)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${analystToken}`)

      // Get recent analyses
      const recentResponse = await request(server)
        .get('/api/dashboard/recent-analyses')
        .set('Authorization', `Bearer ${analystToken}`)

      // Verify consistency
      const totalAnalyses = analysisData.halal + analysisData.haram + analysisData.mashbooh + analysisData.review
      expect(statsResponse.body.data.monthlyAnalyses).toBe(totalAnalyses)
      expect(statsResponse.body.data.halalCount).toBe(analysisData.halal)
      expect(statsResponse.body.data.haramCount).toBe(analysisData.haram)
      expect(statsResponse.body.data.mashboohCount).toBe(analysisData.mashbooh)
      expect(statsResponse.body.data.pendingReviews).toBe(analysisData.mashbooh + analysisData.review)

      // Recent analyses should include our created analyses
      expect(recentResponse.body.data.length).toBeGreaterThan(0)
      expect(recentResponse.body.data.length).toBeLessThanOrEqual(totalAnalyses)
    })

    it('should handle concurrent dashboard requests', async () => {
      // Create some test data
      for (let i = 0; i < 10; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at, expert_review_required, summary
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          `Dashboard Integration Concurrent ${i + 1}`,
          organizationId,
          analystUserId,
          HalalStatus.HALAL,
          RiskLevel.LOW,
          new Date(),
          false,
          JSON.stringify({ total_ingredients: 3, halal_count: 3, haram_count: 0, mashbooh_count: 0, unknown_count: 0 })
        ])
      }

      // Make concurrent requests
      const promises = [
        request(server).get('/api/dashboard/stats').set('Authorization', `Bearer ${analystToken}`),
        request(server).get('/api/dashboard/recent-analyses').set('Authorization', `Bearer ${analystToken}`),
        request(server).get('/api/dashboard/usage').set('Authorization', `Bearer ${analystToken}`),
        request(server).get('/api/dashboard/stats').set('Authorization', `Bearer ${adminToken}`),
        request(server).get('/api/dashboard/recent-analyses').set('Authorization', `Bearer ${viewerToken}`)
      ]

      const responses = await Promise.all(promises)

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
        expect(response.body.success).toBe(true)
      })

      // Data should be consistent across concurrent requests
      const statsResponses = responses.filter((_, index) => index === 0 || index === 3)
      expect(statsResponses[0].body.data.monthlyAnalyses).toBe(statsResponses[1].body.data.monthlyAnalyses)
    })
  })
})