/**
 * HalalCheck EU - Authentication Controller
 * 
 * Handles all authentication-related endpoints with comprehensive security
 */

import { Request, Response } from 'express';
import { AuthService } from '@/services/authService';
import { AuditService } from '@/services/auditService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import { 
  LoginRequest, 
  RegisterRequest, 
  PasswordResetRequest, 
  PasswordResetConfirm 
} from '@/types/auth';

export class AuthController {
  private authService: AuthService;
  private auditService: AuditService;

  constructor() {
    this.authService = new AuthService();
    this.auditService = new AuditService();
  }

  /**
   * User registration
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const registerData: RegisterRequest = req.body;
    const ipAddress = req.ip || 'unknown';

    // Validate required fields
    const requiredFields = [
      'email', 'password', 'firstName', 'lastName', 
      'organizationName', 'organizationType', 'country', 'acceptTerms'
    ];
    
    for (const field of requiredFields) {
      if (!registerData[field]) {
        res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message: `Missing required field: ${field}`
        });
        return;
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format'
      });
      return;
    }

    // Validate password strength
    if (registerData.password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Validate terms acceptance
    if (!registerData.acceptTerms) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Terms and conditions must be accepted'
      });
      return;
    }

    try {
      const result = await this.authService.register(registerData, ipAddress);
      
      res.status(201).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Registration failed', { 
        error: error.message, 
        email: registerData.email 
      });
      
      res.status(400).json({
        success: false,
        error: 'REGISTRATION_FAILED',
        message: error.message
      });
    }
  });

  /**
   * User login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const loginData: LoginRequest = req.body;
    const ipAddress = req.ip || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    // Validate required fields
    if (!loginData.email || !loginData.password) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email and password are required'
      });
      return;
    }

    try {
      const result = await this.authService.login(loginData, ipAddress, userAgent);
      
      // Set secure HTTP-only cookie for refresh token
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            firstName: result.user.firstName,
            lastName: result.user.lastName,
            role: result.user.role,
            organizationId: result.user.organizationId,
            organization: result.user.organization,
            language: result.user.language,
            timezone: result.user.timezone,
            lastLoginAt: result.user.lastLoginAt
          },
          tokens: {
            accessToken: result.tokens.accessToken,
            tokenType: result.tokens.tokenType,
            expiresIn: result.tokens.expiresIn
          }
        }
      });

    } catch (error) {
      logger.error('Login failed', { 
        error: error.message, 
        email: loginData.email,
        ip: ipAddress 
      });
      
      res.status(401).json({
        success: false,
        error: 'LOGIN_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Email verification
   */
  verifyEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Verification token is required'
      });
      return;
    }

    try {
      const result = await this.authService.verifyEmail(token);
      
      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Email verification failed', { 
        error: error.message, 
        token: token.substring(0, 10) + '...' 
      });
      
      res.status(400).json({
        success: false,
        error: 'VERIFICATION_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Password reset request
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email }: PasswordResetRequest = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Email is required'
      });
      return;
    }

    try {
      await this.authService.requestPasswordReset(email);
      
      // Always return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, password reset instructions have been sent'
      });

    } catch (error) {
      logger.error('Password reset request failed', { 
        error: error.message, 
        email 
      });
      
      // Still return success to prevent email enumeration
      res.status(200).json({
        success: true,
        message: 'If the email exists, password reset instructions have been sent'
      });
    }
  });

  /**
   * Password reset confirmation
   */
  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { token, newPassword }: PasswordResetConfirm = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Token and new password are required'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters long'
      });
      return;
    }

    try {
      await this.authService.resetPassword(token, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Password reset successful'
      });

    } catch (error) {
      logger.error('Password reset failed', { 
        error: error.message, 
        token: token.substring(0, 10) + '...' 
      });
      
      res.status(400).json({
        success: false,
        error: 'RESET_FAILED',
        message: error.message
      });
    }
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Refresh token not provided'
      });
      return;
    }

    try {
      const tokens = await this.authService.refreshAccessToken(refreshToken);
      
      // Update refresh token cookie
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
          tokenType: tokens.tokenType,
          expiresIn: tokens.expiresIn
        }
      });

    } catch (error) {
      logger.error('Token refresh failed', { error: error.message });
      
      // Clear invalid refresh token
      res.clearCookie('refreshToken');
      
      res.status(401).json({
        success: false,
        error: 'REFRESH_FAILED',
        message: 'Invalid refresh token'
      });
    }
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;
    const userId = req.user?.id;

    try {
      if (refreshToken) {
        await this.authService.revokeRefreshToken(refreshToken);
      }

      if (userId) {
        await this.auditService.logAction({
          userId,
          organizationId: req.user?.organizationId,
          action: 'USER_LOGOUT',
          resource: 'auth',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        });
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');
      
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout failed', { error: error.message, userId });
      
      res.status(500).json({
        success: false,
        error: 'LOGOUT_FAILED',
        message: 'Logout failed'
      });
    }
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          firstName: req.user.firstName,
          lastName: req.user.lastName,
          role: req.user.role,
          organizationId: req.user.organizationId,
          organization: req.user.organization,
          language: req.user.language,
          timezone: req.user.timezone,
          lastLoginAt: req.user.lastLoginAt,
          emailVerified: req.user.emailVerified,
          mfaEnabled: req.user.mfaEnabled
        }
      }
    });
  });
}