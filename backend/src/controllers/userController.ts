/**
 * HalalCheck EU - User Management Controller
 * 
 * Handles user profile management and admin operations
 */

import { Request, Response } from 'express';
import { DatabaseService } from '@/services/databaseService';
import { AuditService } from '@/services/auditService';
import { EmailService } from '@/services/emailService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { UserRole } from '@/types/auth';
import bcrypt from 'bcrypt';

export class UserController {
  private db: DatabaseService;
  private auditService: AuditService;
  private emailService: EmailService;

  constructor() {
    this.db = new DatabaseService();
    this.auditService = new AuditService();
    this.emailService = new EmailService();
  }

  /**
   * Update user profile
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { firstName, lastName, language, timezone, phoneNumber } = req.body;

    // Validate input
    if (!firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'First name and last name are required'
      });
      return;
    }

    try {
      const updateQuery = `
        UPDATE users 
        SET 
          first_name = $1,
          last_name = $2,
          language = $3,
          timezone = $4,
          phone_number = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, email, first_name, last_name, language, timezone, phone_number
      `;

      const result = await this.db.query(updateQuery, [
        firstName,
        lastName,
        language || req.user.language,
        timezone || req.user.timezone,
        phoneNumber,
        req.user.id
      ]);

      const updatedUser = result.rows[0];

      // Log profile update
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'PROFILE_UPDATED',
        resource: 'user',
        resourceId: req.user.id,
        details: {
          updatedFields: { firstName, lastName, language, timezone, phoneNumber }
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            firstName: updatedUser.first_name,
            lastName: updatedUser.last_name,
            language: updatedUser.language,
            timezone: updatedUser.timezone,
            phoneNumber: updatedUser.phone_number
          }
        }
      });

    } catch (error) {
      logger.error('Failed to update user profile', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        error: 'UPDATE_FAILED',
        message: 'Failed to update profile'
      });
    }
  });

  /**
   * Change user password
   */
  changePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Current password and new password are required'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 8 characters long'
      });
      return;
    }

    try {
      // Get current password hash
      const userQuery = 'SELECT password_hash FROM users WHERE id = $1';
      const userResult = await this.db.query(userQuery, [req.user.id]);
      
      if (!userResult.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
        return;
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          error: 'INVALID_PASSWORD',
          message: 'Current password is incorrect'
        });
        return;
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 12);

      // Update password
      const updateQuery = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `;

      await this.db.query(updateQuery, [newPasswordHash, req.user.id]);

      // Log password change
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'PASSWORD_CHANGED',
        resource: 'user',
        resourceId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send notification email
      try {
        await this.emailService.sendPasswordChangeNotification(
          req.user.email,
          req.user.firstName + ' ' + req.user.lastName
        );
      } catch (emailError) {
        logger.warn('Failed to send password change notification', {
          error: emailError.message,
          userId: req.user.id
        });
      }

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Failed to change password', {
        error: error.message,
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        error: 'PASSWORD_CHANGE_FAILED',
        message: 'Failed to change password'
      });
    }
  });

  /**
   * Get organization users (admin only)
   */
  getOrganizationUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    try {
      let whereClause = 'WHERE organization_id = $1';
      const params: any[] = [req.user.organizationId];
      let paramIndex = 2;

      // Add search filter
      if (search) {
        whereClause += ` AND (first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const usersQuery = `
        SELECT 
          id, email, first_name, last_name, role, language, timezone,
          email_verified, mfa_enabled, last_login_at, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM users 
        ${whereClause}
      `;

      params.push(limit, offset);

      const [usersResult, countResult] = await Promise.all([
        this.db.query(usersQuery, params.slice(0, -2).concat([limit, offset])),
        this.db.query(countQuery, params.slice(0, -2))
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      res.status(200).json({
        success: true,
        data: {
          users: usersResult.rows.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            language: user.language,
            timezone: user.timezone,
            emailVerified: user.email_verified,
            mfaEnabled: user.mfa_enabled,
            lastLoginAt: user.last_login_at,
            createdAt: user.created_at,
            updatedAt: user.updated_at
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
      logger.error('Failed to fetch organization users', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'FETCH_FAILED',
        message: 'Failed to fetch users'
      });
    }
  });

  /**
   * Update user role (admin only)
   */
  updateUserRole = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    const { userId } = req.params;
    const { role } = req.body;

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid role specified'
      });
      return;
    }

    // Prevent self-role modification
    if (userId === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Cannot modify your own role'
      });
      return;
    }

    try {
      // Check if target user exists and belongs to same organization
      const userCheckQuery = `
        SELECT id, email, first_name, last_name, role 
        FROM users 
        WHERE id = $1 AND organization_id = $2
      `;
      
      const userResult = await this.db.query(userCheckQuery, [userId, req.user.organizationId]);
      
      if (!userResult.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found in your organization'
        });
        return;
      }

      const targetUser = userResult.rows[0];
      const oldRole = targetUser.role;

      // Update role
      const updateQuery = `
        UPDATE users 
        SET role = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING role
      `;

      await this.db.query(updateQuery, [role, userId]);

      // Log role change
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'USER_ROLE_CHANGED',
        resource: 'user',
        resourceId: userId,
        details: {
          targetUser: targetUser.email,
          oldRole,
          newRole: role,
          changedBy: req.user.email
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Send notification email to affected user
      try {
        await this.emailService.sendRoleChangeNotification(
          targetUser.email,
          targetUser.first_name + ' ' + targetUser.last_name,
          oldRole,
          role
        );
      } catch (emailError) {
        logger.warn('Failed to send role change notification', {
          error: emailError.message,
          targetUserId: userId
        });
      }

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
          userId,
          oldRole,
          newRole: role
        }
      });

    } catch (error) {
      logger.error('Failed to update user role', {
        error: error.message,
        userId: req.user.id,
        targetUserId: userId,
        newRole: role
      });

      res.status(500).json({
        success: false,
        error: 'ROLE_UPDATE_FAILED',
        message: 'Failed to update user role'
      });
    }
  });

  /**
   * Deactivate user (admin only)
   */
  deactivateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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

    const { userId } = req.params;

    // Prevent self-deactivation
    if (userId === req.user.id) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Cannot deactivate your own account'
      });
      return;
    }

    try {
      // Check if target user exists and belongs to same organization
      const userCheckQuery = `
        SELECT id, email, first_name, last_name, active 
        FROM users 
        WHERE id = $1 AND organization_id = $2
      `;
      
      const userResult = await this.db.query(userCheckQuery, [userId, req.user.organizationId]);
      
      if (!userResult.rows[0]) {
        res.status(404).json({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found in your organization'
        });
        return;
      }

      const targetUser = userResult.rows[0];

      if (!targetUser.active) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'User is already deactivated'
        });
        return;
      }

      // Deactivate user
      const deactivateQuery = `
        UPDATE users 
        SET active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await this.db.query(deactivateQuery, [userId]);

      // Log deactivation
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'USER_DEACTIVATED',
        resource: 'user',
        resourceId: userId,
        details: {
          targetUser: targetUser.email,
          deactivatedBy: req.user.email
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'User deactivated successfully'
      });

    } catch (error) {
      logger.error('Failed to deactivate user', {
        error: error.message,
        userId: req.user.id,
        targetUserId: userId
      });

      res.status(500).json({
        success: false,
        error: 'DEACTIVATION_FAILED',
        message: 'Failed to deactivate user'
      });
    }
  });
}