/**
 * HalalCheck EU - Authentication Middleware
 * 
 * Enterprise-grade JWT authentication with role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/services/authService';
import { User, UserRole, PERMISSIONS } from '@/types/auth';
import { logger } from '@/utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
      userOrganization?: any;
    }
  }
}

const authService = new AuthService();

/**
 * Verify JWT token and attach user to request
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication token required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token and get user
    const user = await authService.verifyToken(token);
    
    // Attach user to request
    req.user = user;
    
    logger.debug('User authenticated', { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    next();
    
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Check if user has required role
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
      
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

/**
 * Check if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      logger.warn('Access denied - missing permission', {
        userId: req.user.id,
        userPermissions: req.user.permissions,
        requiredPermission: permission
      });
      
      res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Missing required permission'
      });
      return;
    }

    next();
  };
};

/**
 * Check organization subscription limits
 */
export const checkUsageLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    // Get organization details (this would query the database)
    // For now, assume we have organization data
    const organization = req.user.organization;
    
    if (!organization) {
      res.status(400).json({
        success: false,
        error: 'BAD_REQUEST',
        message: 'Organization not found'
      });
      return;
    }

    // Check if usage limit is exceeded
    if (organization.monthlyAnalysisLimit > 0 && 
        organization.currentMonthUsage >= organization.monthlyAnalysisLimit) {
      
      logger.warn('Usage limit exceeded', {
        organizationId: organization.id,
        currentUsage: organization.currentMonthUsage,
        limit: organization.monthlyAnalysisLimit
      });
      
      res.status(429).json({
        success: false,
        error: 'USAGE_LIMIT_EXCEEDED',
        message: 'Monthly analysis limit exceeded. Please upgrade your plan.',
        data: {
          currentUsage: organization.currentMonthUsage,
          limit: organization.monthlyAnalysisLimit
        }
      });
      return;
    }

    next();
    
  } catch (error) {
    logger.error('Usage limit check failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to check usage limits'
    });
  }
};

/**
 * Optional authentication - continues even if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      req.user = await authService.verifyToken(token);
    }
    
    next();
    
  } catch (error) {
    // Continue without user if token is invalid
    logger.debug('Optional auth failed, continuing without user', { error: error.message });
    next();
  }
};

/**
 * Rate limiting middleware for sensitive endpoints
 */
export const rateLimitAuth = (maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    for (const [key, value] of attempts.entries()) {
      if (now > value.resetTime) {
        attempts.delete(key);
      }
    }
    
    // Check current attempts
    const current = attempts.get(identifier);
    
    if (current && current.count >= maxAttempts) {
      const remainingTime = Math.ceil((current.resetTime - now) / 1000);
      
      res.status(429).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many attempts. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime
      });
      return;
    }
    
    // Update attempts
    if (current) {
      current.count++;
    } else {
      attempts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      });
    }
    
    next();
  };
};

/**
 * Admin-only access
 */
export const requireAdmin = requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

/**
 * Certifier access (can perform halal analysis)
 */
export const requireCertifier = requireRole([
  UserRole.SUPER_ADMIN, 
  UserRole.ADMIN, 
  UserRole.CERTIFIER, 
  UserRole.ANALYST
]);

/**
 * Organization management access
 */
export const requireOrgManager = requireRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

/**
 * Analysis permission
 */
export const requireAnalysisPermission = requirePermission(PERMISSIONS.ANALYZE_INGREDIENTS);