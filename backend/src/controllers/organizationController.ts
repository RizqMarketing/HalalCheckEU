/**
 * HalalCheck EU - Organization Management Controller
 * 
 * Handles organization profile, settings, and subscription management
 */

import { Request, Response } from 'express';
import { DatabaseService } from '@/services/databaseService';
import { AuditService } from '@/services/auditService';
import { EmailService } from '@/services/emailService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { UserRole } from '@/types/auth';

export class OrganizationController {
  private db: DatabaseService;
  private auditService: AuditService;
  private emailService: EmailService;

  constructor() {
    this.db = new DatabaseService();
    this.auditService = new AuditService();
    this.emailService = new EmailService();
  }

  /**
   * Get organization profile
   */
  getOrganizationProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    try {
      const orgQuery = `
        SELECT 
          id, name, type, country, address, phone, website,
          subscription_plan, monthly_analysis_limit, current_month_usage,
          settings, created_at, updated_at
        FROM organizations 
        WHERE id = $1
      `;

      const result = await this.db.query(orgQuery, [req.user.organizationId]);
      
      if (!result.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found'
        });
        return;
      }

      const org = result.rows[0];

      res.status(200).json({
        success: true,
        data: {
          organization: {
            id: org.id,
            name: org.name,
            type: org.type,
            country: org.country,
            address: org.address,
            phone: org.phone,
            website: org.website,
            subscription: {
              plan: org.subscription_plan,
              monthlyLimit: org.monthly_analysis_limit,
              currentUsage: org.current_month_usage,
              usagePercentage: org.monthly_analysis_limit > 0 
                ? Math.round((org.current_month_usage / org.monthly_analysis_limit) * 100)
                : 0
            },
            settings: org.settings || {},
            createdAt: org.created_at,
            updatedAt: org.updated_at
          }
        }
      });

    } catch (error) {
      logger.error('Failed to fetch organization profile', {
        error: error.message,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch organization profile'
      });
    }
  });

  /**
   * Update organization profile (admin only)
   */
  updateOrganizationProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has admin role
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
      return;
    }

    const { name, type, country, address, phone, website } = req.body;

    // Validate required fields
    if (!name || !type || !country) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Organization name, type, and country are required'
      });
      return;
    }

    try {
      const updateQuery = `
        UPDATE organizations 
        SET 
          name = $1,
          type = $2,
          country = $3,
          address = $4,
          phone = $5,
          website = $6,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING id, name, type, country, address, phone, website
      `;

      const result = await this.db.query(updateQuery, [
        name,
        type,
        country,
        address,
        phone,
        website,
        req.user.organizationId
      ]);

      const updatedOrg = result.rows[0];

      // Log profile update
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'ORGANIZATION_UPDATED',
        resource: 'organization',
        resourceId: req.user.organizationId,
        details: {
          updatedFields: { name, type, country, address, phone, website }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Organization profile updated successfully',
        data: {
          organization: {
            id: updatedOrg.id,
            name: updatedOrg.name,
            type: updatedOrg.type,
            country: updatedOrg.country,
            address: updatedOrg.address,
            phone: updatedOrg.phone,
            website: updatedOrg.website
          }
        }
      });

    } catch (error) {
      logger.error('Failed to update organization profile', {
        error: error.message,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update organization profile'
      });
    }
  });

  /**
   * Get organization settings
   */
  getOrganizationSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    try {
      const settingsQuery = 'SELECT settings FROM organizations WHERE id = $1';
      const result = await this.db.query(settingsQuery, [req.user.organizationId]);
      
      if (!result.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found'
        });
        return;
      }

      const settings = result.rows[0].settings || {};

      res.status(200).json({
        success: true,
        data: { settings }
      });

    } catch (error) {
      logger.error('Failed to fetch organization settings', {
        error: error.message,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch organization settings'
      });
    }
  });

  /**
   * Update organization settings (admin only)
   */
  updateOrganizationSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has admin role
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
      return;
    }

    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Valid settings object is required'
      });
      return;
    }

    try {
      // Get current settings first
      const currentQuery = 'SELECT settings FROM organizations WHERE id = $1';
      const currentResult = await this.db.query(currentQuery, [req.user.organizationId]);
      const currentSettings = currentResult.rows[0]?.settings || {};

      // Merge settings
      const mergedSettings = { ...currentSettings, ...settings };

      // Update settings
      const updateQuery = `
        UPDATE organizations 
        SET settings = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING settings
      `;

      const result = await this.db.query(updateQuery, [
        JSON.stringify(mergedSettings),
        req.user.organizationId
      ]);

      // Log settings update
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'ORGANIZATION_SETTINGS_UPDATED',
        resource: 'organization',
        resourceId: req.user.organizationId,
        details: {
          updatedSettings: settings
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Organization settings updated successfully',
        data: {
          settings: result.rows[0].settings
        }
      });

    } catch (error) {
      logger.error('Failed to update organization settings', {
        error: error.message,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update organization settings'
      });
    }
  });

  /**
   * Get usage statistics
   */
  getUsageStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    try {
      // Get current month usage and limits
      const orgQuery = `
        SELECT 
          current_month_usage, 
          monthly_analysis_limit,
          subscription_plan,
          created_at
        FROM organizations 
        WHERE id = $1
      `;

      // Get daily usage for current month
      const dailyUsageQuery = `
        SELECT 
          DATE_TRUNC('day', created_at) as usage_date,
          COUNT(*) as daily_count
        FROM product_analyses 
        WHERE organization_id = $1 
          AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY usage_date
      `;

      // Get monthly usage history
      const monthlyUsageQuery = `
        SELECT 
          DATE_TRUNC('month', created_at) as usage_month,
          COUNT(*) as monthly_count
        FROM product_analyses 
        WHERE organization_id = $1 
          AND created_at >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY usage_month
      `;

      const [orgResult, dailyResult, monthlyResult] = await Promise.all([
        this.db.query(orgQuery, [req.user.organizationId]),
        this.db.query(dailyUsageQuery, [req.user.organizationId]),
        this.db.query(monthlyUsageQuery, [req.user.organizationId])
      ]);

      const org = orgResult.rows[0];
      const dailyUsage = dailyResult.rows;
      const monthlyUsage = monthlyResult.rows;

      if (!org) {
        res.status(404).json({
          success: false,
          error: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          currentMonth: {
            usage: org.current_month_usage,
            limit: org.monthly_analysis_limit,
            percentage: org.monthly_analysis_limit > 0 
              ? Math.round((org.current_month_usage / org.monthly_analysis_limit) * 100)
              : 0,
            remaining: Math.max(0, org.monthly_analysis_limit - org.current_month_usage)
          },
          subscription: {
            plan: org.subscription_plan,
            memberSince: org.created_at
          },
          dailyUsage: dailyUsage.map(day => ({
            date: day.usage_date,
            count: parseInt(day.daily_count)
          })),
          monthlyUsage: monthlyUsage.map(month => ({
            month: month.usage_month,
            count: parseInt(month.monthly_count)
          }))
        }
      });

    } catch (error) {
      logger.error('Failed to fetch usage statistics', {
        error: error.message,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch usage statistics'
      });
    }
  });

  /**
   * Get organization activity log (admin only)
   */
  getActivityLog = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    // Check if user has admin role
    if (![UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Admin access required'
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = (page - 1) * limit;
    const action = req.query.action as string;
    const userId = req.query.userId as string;

    try {
      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [req.user.organizationId];
      let paramIndex = 2;

      // Add action filter
      if (action) {
        whereClause += ` AND action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }

      // Add user filter
      if (userId) {
        whereClause += ` AND user_id = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }

      const activityQuery = `
        SELECT 
          al.id, al.action, al.resource, al.resource_id, al.details,
          al.ip_address, al.user_agent, al.created_at,
          u.first_name, u.last_name, u.email
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM audit_log 
        ${whereClause}
      `;

      params.push(limit, offset);

      const [activityResult, countResult] = await Promise.all([
        this.db.query(activityQuery, params),
        this.db.query(countQuery, params.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          activities: activityResult.rows.map(activity => ({
            id: activity.id,
            action: activity.action,
            resource: activity.resource,
            resourceId: activity.resource_id,
            details: activity.details,
            user: activity.first_name ? {
              name: `${activity.first_name} ${activity.last_name}`,
              email: activity.email
            } : null,
            ipAddress: activity.ip_address,
            userAgent: activity.user_agent,
            timestamp: activity.created_at
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
      logger.error('Failed to fetch activity log', {
        error: error.message,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch activity log'
      });
    }
  });
}