/**
 * HalalCheck EU - Report Controller
 * 
 * Handles analysis reporting and export functionality
 */

import { Request, Response } from 'express';
import { DatabaseService } from '@/services/databaseService';
import { AuditService } from '@/services/auditService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

export class ReportController {
  private db: DatabaseService;
  private auditService: AuditService;

  constructor() {
    this.db = new DatabaseService();
    this.auditService = new AuditService();
  }

  /**
   * Get analysis summary report
   */
  getAnalysisSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { startDate, endDate, status, riskLevel } = req.query;

    try {
      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [req.user.organizationId];
      let paramIndex = 2;

      // Add date filters
      if (startDate) {
        whereClause += ` AND created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      // Add status filter
      if (status && status !== 'all') {
        whereClause += ` AND overall_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      // Add risk level filter
      if (riskLevel && riskLevel !== 'all') {
        whereClause += ` AND overall_risk_level = $${paramIndex}`;
        params.push(riskLevel);
        paramIndex++;
      }

      const summaryQuery = `
        SELECT 
          COUNT(*) as total_analyses,
          COUNT(CASE WHEN overall_status = 'HALAL' THEN 1 END) as halal_count,
          COUNT(CASE WHEN overall_status = 'HARAM' THEN 1 END) as haram_count,
          COUNT(CASE WHEN overall_status = 'MASHBOOH' THEN 1 END) as mashbooh_count,
          COUNT(CASE WHEN overall_risk_level = 'LOW' THEN 1 END) as low_risk_count,
          COUNT(CASE WHEN overall_risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
          COUNT(CASE WHEN overall_risk_level = 'HIGH' THEN 1 END) as high_risk_count,
          COUNT(CASE WHEN expert_review_required = true THEN 1 END) as expert_review_count,
          AVG(processing_time_ms) as avg_processing_time,
          SUM(total_ingredients) as total_ingredients_analyzed
        FROM product_analyses 
        ${whereClause}
      `;

      const trendsQuery = `
        SELECT 
          DATE_TRUNC('day', created_at) as analysis_date,
          COUNT(*) as daily_count,
          COUNT(CASE WHEN overall_status = 'HALAL' THEN 1 END) as daily_halal,
          COUNT(CASE WHEN overall_status = 'HARAM' THEN 1 END) as daily_haram
        FROM product_analyses 
        ${whereClause}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY analysis_date DESC
        LIMIT 30
      `;

      const topIngredientsQuery = `
        SELECT 
          ingredient_name,
          COUNT(*) as frequency,
          halal_status,
          risk_level
        FROM ingredient_analyses ia
        JOIN product_analyses pa ON ia.analysis_id = pa.id
        ${whereClause.replace('organization_id', 'pa.organization_id')}
        GROUP BY ingredient_name, halal_status, risk_level
        ORDER BY frequency DESC
        LIMIT 20
      `;

      const [summaryResult, trendsResult, ingredientsResult] = await Promise.all([
        this.db.query(summaryQuery, params),
        this.db.query(trendsQuery, params),
        this.db.query(topIngredientsQuery, params)
      ]);

      const summary = summaryResult.rows[0];
      const trends = trendsResult.rows;
      const topIngredients = ingredientsResult.rows;

      // Log report generation
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'REPORT_GENERATED',
        resource: 'analysis_summary',
        details: {
          filters: { startDate, endDate, status, riskLevel },
          totalAnalyses: parseInt(summary.total_analyses)
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalAnalyses: parseInt(summary.total_analyses),
            halalCount: parseInt(summary.halal_count),
            haramCount: parseInt(summary.haram_count),
            mashboohCount: parseInt(summary.mashbooh_count),
            lowRiskCount: parseInt(summary.low_risk_count),
            mediumRiskCount: parseInt(summary.medium_risk_count),
            highRiskCount: parseInt(summary.high_risk_count),
            expertReviewCount: parseInt(summary.expert_review_count),
            averageProcessingTime: Math.round(parseFloat(summary.avg_processing_time) || 0),
            totalIngredientsAnalyzed: parseInt(summary.total_ingredients_analyzed) || 0
          },
          trends: trends.map(trend => ({
            date: trend.analysis_date,
            totalCount: parseInt(trend.daily_count),
            halalCount: parseInt(trend.daily_halal),
            haramCount: parseInt(trend.daily_haram)
          })),
          topIngredients: topIngredients.map(ingredient => ({
            name: ingredient.ingredient_name,
            frequency: parseInt(ingredient.frequency),
            status: ingredient.halal_status,
            riskLevel: ingredient.risk_level
          }))
        }
      });

    } catch (error) {
      logger.error('Failed to generate analysis summary', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'REPORT_FAILED',
        message: 'Failed to generate analysis summary'
      });
    }
  });

  /**
   * Export analysis data as CSV
   */
  exportAnalysesCSV = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { startDate, endDate, status, riskLevel, includeIngredients } = req.query;

    try {
      let whereClause = 'WHERE pa.organization_id = $1';
      const params: any[] = [req.user.organizationId];
      let paramIndex = 2;

      // Add filters (same logic as summary)
      if (startDate) {
        whereClause += ` AND pa.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND pa.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (status && status !== 'all') {
        whereClause += ` AND pa.overall_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (riskLevel && riskLevel !== 'all') {
        whereClause += ` AND pa.overall_risk_level = $${paramIndex}`;
        params.push(riskLevel);
        paramIndex++;
      }

      const exportQuery = `
        SELECT 
          pa.id,
          pa.product_name,
          pa.overall_status,
          pa.overall_risk_level,
          pa.total_ingredients,
          pa.halal_count,
          pa.haram_count,
          pa.mashbooh_count,
          pa.expert_review_required,
          pa.processing_time_ms,
          pa.created_at,
          u.first_name || ' ' || u.last_name as analyzed_by
        FROM product_analyses pa
        JOIN users u ON pa.user_id = u.id
        ${whereClause}
        ORDER BY pa.created_at DESC
      `;

      const analysesResult = await this.db.query(exportQuery, params);
      const analyses = analysesResult.rows;

      // Generate CSV content
      const csvHeaders = [
        'Analysis ID', 'Product Name', 'Overall Status', 'Risk Level',
        'Total Ingredients', 'Halal Count', 'Haram Count', 'Mashbooh Count',
        'Expert Review Required', 'Processing Time (ms)', 'Analyzed At', 'Analyzed By'
      ];

      let csvContent = csvHeaders.join(',') + '\n';

      for (const analysis of analyses) {
        const row = [
          analysis.id,
          `"${analysis.product_name.replace(/"/g, '""')}"`, // Escape quotes
          analysis.overall_status,
          analysis.overall_risk_level,
          analysis.total_ingredients,
          analysis.halal_count,
          analysis.haram_count,
          analysis.mashbooh_count,
          analysis.expert_review_required,
          analysis.processing_time_ms,
          analysis.created_at.toISOString(),
          `"${analysis.analyzed_by.replace(/"/g, '""')}"`
        ];
        csvContent += row.join(',') + '\n';
      }

      // If including ingredients, add detailed breakdown
      if (includeIngredients === 'true') {
        csvContent += '\n\n--- INGREDIENT DETAILS ---\n';
        csvContent += 'Analysis ID,Product Name,Ingredient Name,Status,Risk Level,Confidence,Reasoning\n';

        for (const analysis of analyses) {
          const ingredientsQuery = `
            SELECT ingredient_name, halal_status, risk_level, confidence, reasoning
            FROM ingredient_analyses 
            WHERE analysis_id = $1
            ORDER BY ingredient_name
          `;
          
          const ingredientsResult = await this.db.query(ingredientsQuery, [analysis.id]);
          
          for (const ingredient of ingredientsResult.rows) {
            const ingredientRow = [
              analysis.id,
              `"${analysis.product_name.replace(/"/g, '""')}"`,
              `"${ingredient.ingredient_name.replace(/"/g, '""')}"`,
              ingredient.halal_status,
              ingredient.risk_level,
              Math.round(ingredient.confidence * 100) + '%',
              `"${ingredient.reasoning.replace(/"/g, '""')}"`
            ];
            csvContent += ingredientRow.join(',') + '\n';
          }
        }
      }

      // Log export action
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'DATA_EXPORTED',
        resource: 'analysis_csv',
        details: {
          filters: { startDate, endDate, status, riskLevel },
          includeIngredients: includeIngredients === 'true',
          recordCount: analyses.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Set response headers for file download
      const filename = `halal_analysis_export_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      res.status(200).send(csvContent);

    } catch (error) {
      logger.error('Failed to export analysis data', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'EXPORT_FAILED',
        message: 'Failed to export analysis data'
      });
    }
  });

  /**
   * Get ingredient frequency report
   */
  getIngredientReport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { startDate, endDate, status, limit = 50 } = req.query;

    try {
      let whereClause = 'WHERE pa.organization_id = $1';
      const params: any[] = [req.user.organizationId];
      let paramIndex = 2;

      if (startDate) {
        whereClause += ` AND pa.created_at >= $${paramIndex}`;
        params.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereClause += ` AND pa.created_at <= $${paramIndex}`;
        params.push(endDate);
        paramIndex++;
      }

      if (status && status !== 'all') {
        whereClause += ` AND ia.halal_status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      const ingredientQuery = `
        SELECT 
          ia.ingredient_name,
          ia.halal_status,
          ia.risk_level,
          COUNT(*) as frequency,
          AVG(ia.confidence) as avg_confidence,
          COUNT(DISTINCT pa.id) as product_count,
          STRING_AGG(DISTINCT pa.product_name, ', ' ORDER BY pa.product_name) as sample_products
        FROM ingredient_analyses ia
        JOIN product_analyses pa ON ia.analysis_id = pa.id
        ${whereClause}
        GROUP BY ia.ingredient_name, ia.halal_status, ia.risk_level
        ORDER BY frequency DESC
        LIMIT $${paramIndex}
      `;

      params.push(parseInt(limit as string));

      const result = await this.db.query(ingredientQuery, params);

      res.status(200).json({
        success: true,
        data: {
          ingredients: result.rows.map(row => ({
            name: row.ingredient_name,
            status: row.halal_status,
            riskLevel: row.risk_level,
            frequency: parseInt(row.frequency),
            averageConfidence: Math.round(parseFloat(row.avg_confidence) * 100),
            productCount: parseInt(row.product_count),
            sampleProducts: row.sample_products?.split(', ').slice(0, 3) || []
          }))
        }
      });

    } catch (error) {
      logger.error('Failed to generate ingredient report', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'REPORT_FAILED',
        message: 'Failed to generate ingredient report'
      });
    }
  });
}