/**
 * HalalCheck EU - Dashboard Routes
 * 
 * API endpoints for dashboard statistics and data
 */

import express from 'express'
import { Request, Response } from 'express'
import { authenticate, authorize } from '../middleware/auth'
import { pool } from '../database/connection'
import { HalalStatus, UserRole } from '../types'

const router = express.Router()

// Get dashboard statistics
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const organizationId = req.user!.organizationId

    // Base query conditions based on user role
    let whereClause = ''
    let queryParams: any[] = []

    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      // Admin sees all statistics
      whereClause = ''
    } else if (userRole === UserRole.CERTIFIER && organizationId) {
      // Certifiers see their organization's data
      whereClause = 'WHERE pa.organization_id = $1'
      queryParams = [organizationId]
    } else {
      // Regular users see only their own data
      whereClause = 'WHERE pa.analyzed_by = $1'
      queryParams = [userId]
    }

    // Get total analyses count
    const totalQuery = `
      SELECT COUNT(*) as total_count
      FROM product_analyses pa
      ${whereClause}
    `
    const totalResult = await pool.query(totalQuery, queryParams)
    const totalAnalyses = parseInt(totalResult.rows[0].total_count)

    // Get analyses by status
    const statusQuery = `
      SELECT 
        overall_status,
        COUNT(*) as count
      FROM product_analyses pa
      ${whereClause}
      GROUP BY overall_status
    `
    const statusResult = await pool.query(statusQuery, queryParams)
    
    let halalCount = 0
    let haramCount = 0
    let mashboohCount = 0

    statusResult.rows.forEach(row => {
      switch (row.overall_status) {
        case HalalStatus.HALAL:
          halalCount = parseInt(row.count)
          break
        case HalalStatus.HARAM:
          haramCount = parseInt(row.count)
          break
        case HalalStatus.MASHBOOH:
          mashboohCount = parseInt(row.count)
          break
      }
    })

    // Get pending expert reviews
    const pendingQuery = `
      SELECT COUNT(*) as pending_count
      FROM product_analyses pa
      ${whereClause ? whereClause + ' AND' : 'WHERE'} 
      pa.expert_review_required = true 
      AND pa.expert_reviewed_at IS NULL
    `
    const pendingParams = whereClause ? queryParams : []
    const pendingResult = await pool.query(pendingQuery, pendingParams)
    const pendingReviews = parseInt(pendingResult.rows[0].pending_count)

    // Get current month analyses
    const monthlyQuery = `
      SELECT COUNT(*) as monthly_count
      FROM product_analyses pa
      ${whereClause ? whereClause + ' AND' : 'WHERE'}
      pa.analyzed_at >= date_trunc('month', CURRENT_DATE)
    `
    const monthlyParams = whereClause ? queryParams : []
    const monthlyResult = await pool.query(monthlyQuery, monthlyParams)
    const monthlyAnalyses = parseInt(monthlyResult.rows[0].monthly_count)

    // Get previous month for growth calculation
    const previousMonthQuery = `
      SELECT COUNT(*) as prev_monthly_count
      FROM product_analyses pa
      ${whereClause ? whereClause + ' AND' : 'WHERE'}
      pa.analyzed_at >= date_trunc('month', CURRENT_DATE - interval '1 month')
      AND pa.analyzed_at < date_trunc('month', CURRENT_DATE)
    `
    const prevMonthResult = await pool.query(previousMonthQuery, monthlyParams)
    const prevMonthlyAnalyses = parseInt(prevMonthResult.rows[0].prev_monthly_count)

    // Calculate growth percentages
    const monthlyGrowth = prevMonthlyAnalyses > 0 ? 
      Math.round(((monthlyAnalyses - prevMonthlyAnalyses) / prevMonthlyAnalyses) * 100) : 
      monthlyAnalyses > 0 ? 100 : 0

    // Get total analyses from 2 months ago for overall growth
    const twoMonthsAgoQuery = `
      SELECT COUNT(*) as two_months_count
      FROM product_analyses pa
      ${whereClause ? whereClause + ' AND' : 'WHERE'}
      pa.analyzed_at < date_trunc('month', CURRENT_DATE - interval '1 month')
    `
    const twoMonthsResult = await pool.query(twoMonthsAgoQuery, monthlyParams)
    const twoMonthsAgoTotal = parseInt(twoMonthsResult.rows[0].two_months_count)
    
    const analysesGrowth = twoMonthsAgoTotal > 0 ? 
      Math.round(((totalAnalyses - twoMonthsAgoTotal) / twoMonthsAgoTotal) * 100) : 
      totalAnalyses > 0 ? 100 : 0

    const stats = {
      totalAnalyses,
      halalCount,
      haramCount,
      mashboohCount,
      pendingReviews,
      monthlyAnalyses,
      monthlyGrowth,
      analysesGrowth
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics' 
    })
  }
})

// Get recent analyses
router.get('/recent-analyses', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const organizationId = req.user!.organizationId
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 20)

    // Base query conditions based on user role
    let whereClause = ''
    let queryParams: any[] = [limit]

    if (userRole === UserRole.SUPER_ADMIN || userRole === UserRole.ADMIN) {
      // Admin sees all analyses
      whereClause = ''
    } else if (userRole === UserRole.CERTIFIER && organizationId) {
      // Certifiers see their organization's data
      whereClause = 'WHERE pa.organization_id = $2'
      queryParams.push(organizationId)
    } else {
      // Regular users see only their own data
      whereClause = 'WHERE pa.analyzed_by = $2'
      queryParams.push(userId)
    }

    const query = `
      SELECT 
        pa.id,
        pa.product_name,
        pa.overall_status,
        pa.overall_risk_level,
        pa.expert_review_required,
        pa.analyzed_at,
        pa.summary,
        u.first_name as analyzer_first_name,
        u.last_name as analyzer_last_name
      FROM product_analyses pa
      LEFT JOIN users u ON pa.analyzed_by = u.id
      ${whereClause}
      ORDER BY pa.analyzed_at DESC
      LIMIT $1
    `

    const result = await pool.query(query, queryParams)
    
    const analyses = result.rows.map(row => ({
      id: row.id,
      productName: row.product_name,
      overallStatus: row.overall_status,
      overallRiskLevel: row.overall_risk_level,
      expertReviewRequired: row.expert_review_required,
      analyzedAt: row.analyzed_at,
      summary: row.summary,
      analyzerName: row.analyzer_first_name && row.analyzer_last_name ? 
        `${row.analyzer_first_name} ${row.analyzer_last_name}` : 'Unknown'
    }))

    res.json(analyses)
  } catch (error) {
    console.error('Error fetching recent analyses:', error)
    res.status(500).json({ 
      message: 'Failed to fetch recent analyses' 
    })
  }
})

// Get usage statistics for current user/organization
router.get('/usage', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role
    const organizationId = req.user!.organizationId

    // Base query conditions based on user role
    let whereClause = ''
    let queryParams: any[] = []

    if ((userRole === UserRole.CERTIFIER || userRole === UserRole.ADMIN) && organizationId) {
      // Organization users see organization usage
      whereClause = 'WHERE pa.organization_id = $1'
      queryParams = [organizationId]
    } else {
      // Regular users see only their own usage
      whereClause = 'WHERE pa.analyzed_by = $1'
      queryParams = [userId]
    }

    // Get current month usage
    const currentMonthQuery = `
      SELECT COUNT(*) as current_usage
      FROM product_analyses pa
      ${whereClause} 
      AND pa.analyzed_at >= date_trunc('month', CURRENT_DATE)
    `
    
    const result = await pool.query(currentMonthQuery, queryParams)
    const currentUsage = parseInt(result.rows[0].current_usage)

    // Get subscription limits (this would come from the user's subscription)
    // For now, we'll use default limits based on plan
    const user = req.user!
    const monthlyLimit = user.subscriptionPlan?.monthlyLimit || 100

    res.json({
      currentUsage,
      monthlyLimit,
      planName: user.subscriptionPlan?.name || 'Basic'
    })
  } catch (error) {
    console.error('Error fetching usage stats:', error)
    res.status(500).json({ 
      message: 'Failed to fetch usage statistics' 
    })
  }
})

export default router