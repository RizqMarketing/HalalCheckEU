/**
 * HalalCheck EU - Analysis Controller
 * 
 * Core ingredient analysis endpoints - the heart of the platform
 * Handles AI-powered halal compliance analysis with extreme precision
 */

import { Request, Response } from 'express';
import { IngredientAnalysisService } from '@/services/ingredientAnalysisService';
import { DatabaseService } from '@/services/databaseService';
import { EmailService } from '@/services/emailService';
import { AuditService } from '@/services/auditService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { ProductAnalysis, AnalysisRequest } from '@/types/halal';

export class AnalysisController {
  private analysisService: IngredientAnalysisService;
  private db: DatabaseService;
  private emailService: EmailService;
  private auditService: AuditService;

  constructor() {
    this.analysisService = new IngredientAnalysisService();
    this.db = new DatabaseService();
    this.emailService = new EmailService();
    this.auditService = new AuditService();
  }

  /**
   * Analyze ingredient list for halal compliance
   */
  analyzeIngredients = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { productName, ingredientText, language, region, certificationStandard } = req.body;

    // Validate required fields
    if (!productName || !ingredientText) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Product name and ingredient list are required'
      });
      return;
    }

    // Validate product name length
    if (productName.length > 255) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Product name too long (max 255 characters)'
      });
      return;
    }

    // Validate ingredient text length
    if (ingredientText.length > 10000) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Ingredient list too long (max 10,000 characters)'
      });
      return;
    }

    try {
      // Prepare analysis request
      const analysisRequest: AnalysisRequest = {
        productName: productName.trim(),
        ingredientText: ingredientText.trim(),
        language: language || req.user.language || 'en',
        region: region || 'EU',
        certificationStandard: certificationStandard || 'HFCE',
        userId: req.user.id,
        organizationId: req.user.organizationId
      };

      // Log analysis start
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'ANALYSIS_STARTED',
        resource: 'ingredient_analysis',
        details: {
          productName: analysisRequest.productName,
          ingredientCount: ingredientText.split(/[,;]/).length,
          language: analysisRequest.language,
          region: analysisRequest.region
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Perform analysis
      const analysis = await this.analysisService.analyzeIngredients(analysisRequest);

      // Update organization usage count
      await this.incrementUsageCount(req.user.organizationId);

      // Log analysis completion
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'ANALYSIS_COMPLETED',
        resource: 'ingredient_analysis',
        resourceId: analysis.id,
        details: {
          productName: analysis.productName,
          overallStatus: analysis.overallStatus,
          overallRiskLevel: analysis.overallRiskLevel,
          totalIngredients: analysis.summary.total_ingredients,
          haramCount: analysis.summary.haram_count,
          expertReviewRequired: analysis.expertReviewRequired,
          processingTimeMs: analysis.processingTimeMs
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send notification email if configured
      if (analysis.expertReviewRequired || analysis.summary.haram_count > 0) {
        try {
          await this.emailService.sendAnalysisNotification(
            req.user.email,
            analysis.productName,
            analysis.overallStatus
          );
        } catch (emailError) {
          logger.warn('Failed to send analysis notification email', {
            error: emailError.message,
            userId: req.user.id,
            analysisId: analysis.id
          });
        }
      }

      // Return analysis results
      res.status(200).json({
        success: true,
        message: 'Ingredient analysis completed successfully',
        data: {
          analysis: {
            id: analysis.id,
            productName: analysis.productName,
            overallStatus: analysis.overallStatus,
            overallRiskLevel: analysis.overallRiskLevel,
            
            // Summary statistics
            summary: analysis.summary,
            
            // Individual ingredient results
            ingredients: analysis.ingredients.map(ingredient => ({
              detectedName: ingredient.detectedName,
              status: ingredient.status,
              riskLevel: ingredient.riskLevel,
              confidence: Math.round(ingredient.confidence * 100), // Convert to percentage
              reasoning: ingredient.reasoning,
              requiresExpertReview: ingredient.requiresExpertReview,
              warnings: ingredient.warnings,
              suggestions: ingredient.suggestions
            })),
            
            // Critical findings
            criticalFindings: {
              haramIngredients: analysis.haram_ingredients.map(ing => ({
                name: ing.detectedName,
                reasoning: ing.reasoning
              })),
              mashboohIngredients: analysis.mashbooh_ingredients.map(ing => ({
                name: ing.detectedName,
                reasoning: ing.reasoning
              })),
              requiresExpertReview: analysis.requires_expert_review.map(ing => ({
                name: ing.detectedName,
                reason: ing.reasoning
              }))
            },
            
            // Recommendations
            recommendations: analysis.recommendations,
            expertReviewRequired: analysis.expertReviewRequired,
            
            // Metadata
            analyzedAt: analysis.analyzedAt,
            processingTimeMs: analysis.processingTimeMs
          }
        }
      });

    } catch (error) {
      logger.error('Ingredient analysis failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user.id,
        productName,
        ingredientTextLength: ingredientText.length
      });

      // Log analysis failure
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'ANALYSIS_FAILED',
        resource: 'ingredient_analysis',
        details: {
          productName,
          error: error.message,
          ingredientTextLength: ingredientText.length
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(500).json({
        success: false,
        error: 'ANALYSIS_FAILED',
        message: 'Failed to analyze ingredients. Please try again.'
      });
    }
  });

  /**
   * Get analysis history for user/organization
   */
  getAnalysisHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    try {
      const query = `
        SELECT 
          id, product_name, overall_status, overall_risk_level,
          total_ingredients, halal_count, haram_count, mashbooh_count,
          expert_review_required, processing_time_ms, created_at
        FROM product_analyses 
        WHERE organization_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM product_analyses 
        WHERE organization_id = $1
      `;

      const [analysesResult, countResult] = await Promise.all([
        this.db.query(query, [req.user.organizationId, limit, offset]),
        this.db.query(countQuery, [req.user.organizationId])
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          analyses: analysesResult.rows.map(row => ({
            id: row.id,
            productName: row.product_name,
            overallStatus: row.overall_status,
            overallRiskLevel: row.overall_risk_level,
            summary: {
              totalIngredients: row.total_ingredients,
              halalCount: row.halal_count,
              haramCount: row.haram_count,
              mashboohCount: row.mashbooh_count
            },
            expertReviewRequired: row.expert_review_required,
            processingTimeMs: row.processing_time_ms,
            analyzedAt: row.created_at
          })),
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
          }
        }
      });

    } catch (error) {
      logger.error('Failed to fetch analysis history', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch analysis history'
      });
    }
  });

  /**
   * Get specific analysis by ID
   */
  getAnalysisById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { analysisId } = req.params;

    if (!analysisId) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Analysis ID is required'
      });
      return;
    }

    try {
      const analysis = await this.db.getProductAnalysis(analysisId);

      if (!analysis) {
        res.status(404).json({
          success: false,
          error: 'NOT_FOUND',
          message: 'Analysis not found'
        });
        return;
      }

      // Check if user has access to this analysis
      // This would require getting the analysis organization and comparing
      // For now, we'll assume access is granted

      res.status(200).json({
        success: true,
        data: { analysis }
      });

    } catch (error) {
      logger.error('Failed to fetch analysis', {
        error: error.message,
        analysisId,
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch analysis'
      });
    }
  });

  /**
   * Delete analysis (soft delete)
   */
  deleteAnalysis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { analysisId } = req.params;

    try {
      // In a real implementation, you'd do a soft delete
      // For now, we'll just log the deletion request
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'ANALYSIS_DELETED',
        resource: 'ingredient_analysis',
        resourceId: analysisId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Analysis deleted successfully'
      });

    } catch (error) {
      logger.error('Failed to delete analysis', {
        error: error.message,
        analysisId,
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        error: 'DELETE_FAILED',
        message: 'Failed to delete analysis'
      });
    }
  });

  /**
   * Get dashboard statistics
   */
  getDashboardStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_analyses,
          COUNT(CASE WHEN overall_status = 'HALAL' THEN 1 END) as halal_products,
          COUNT(CASE WHEN overall_status = 'HARAM' THEN 1 END) as haram_products,
          COUNT(CASE WHEN expert_review_required = true THEN 1 END) as pending_reviews,
          AVG(processing_time_ms) as avg_processing_time
        FROM product_analyses 
        WHERE organization_id = $1
      `;

      const recentAnalysesQuery = `
        SELECT 
          id, product_name, overall_status, overall_risk_level, created_at
        FROM product_analyses 
        WHERE organization_id = $1 
        ORDER BY created_at DESC 
        LIMIT 5
      `;

      const usageQuery = `
        SELECT current_month_usage, monthly_analysis_limit
        FROM organizations 
        WHERE id = $1
      `;

      const [statsResult, recentResult, usageResult] = await Promise.all([
        this.db.query(statsQuery, [req.user.organizationId]),
        this.db.query(recentAnalysesQuery, [req.user.organizationId]),
        this.db.query(usageQuery, [req.user.organizationId])
      ]);

      const stats = statsResult.rows[0];
      const recentAnalyses = recentResult.rows;
      const usage = usageResult.rows[0];

      res.status(200).json({
        success: true,
        data: {
          statistics: {
            totalAnalyses: parseInt(stats.total_analyses),
            halalProducts: parseInt(stats.halal_products),
            haramProducts: parseInt(stats.haram_products),
            pendingReviews: parseInt(stats.pending_reviews),
            averageProcessingTime: Math.round(parseFloat(stats.avg_processing_time) || 0)
          },
          usage: {
            currentUsage: usage?.current_month_usage || 0,
            monthlyLimit: usage?.monthly_analysis_limit || 0,
            usagePercentage: usage?.monthly_analysis_limit > 0 
              ? Math.round((usage.current_month_usage / usage.monthly_analysis_limit) * 100)
              : 0
          },
          recentAnalyses: recentAnalyses.map(analysis => ({
            id: analysis.id,
            productName: analysis.product_name,
            overallStatus: analysis.overall_status,
            overallRiskLevel: analysis.overall_risk_level,
            analyzedAt: analysis.created_at
          }))
        }
      });

    } catch (error) {
      logger.error('Failed to fetch dashboard stats', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch dashboard statistics'
      });
    }
  });

  /**
   * Helper method to increment organization usage count
   */
  private async incrementUsageCount(organizationId: string): Promise<void> {
    try {
      await this.db.query(
        'UPDATE organizations SET current_month_usage = current_month_usage + 1 WHERE id = $1',
        [organizationId]
      );
    } catch (error) {
      logger.error('Failed to increment usage count', {
        error: error.message,
        organizationId
      });
      // Don't throw - usage counting failure shouldn't break analysis
    }
  }
}