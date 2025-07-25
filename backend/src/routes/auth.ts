/**
 * HalalCheck EU - Authentication Routes
 * 
 * Secure authentication endpoints with rate limiting and validation
 */

import { Router } from 'express';
import { AuthController } from '@/controllers/authController';
import { authenticate, rateLimitAuth } from '@/middleware/auth';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authRateLimit = rateLimitAuth(5, 15 * 60 * 1000); // 5 attempts per 15 minutes
const strictRateLimit = rateLimitAuth(3, 60 * 60 * 1000); // 3 attempts per hour

/**
 * @route POST /api/auth/register
 * @desc Register new user and organization
 * @access Public
 */
router.post('/register', authRateLimit, authController.register);

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return JWT
 * @access Public
 */
router.post('/login', authRateLimit, authController.login);

/**
 * @route GET /api/auth/verify-email
 * @desc Verify user email address
 * @access Public
 */
router.get('/verify-email', authController.verifyEmail);

/**
 * @route POST /api/auth/request-password-reset
 * @desc Request password reset email
 * @access Public
 */
router.post('/request-password-reset', strictRateLimit, authController.requestPasswordReset);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password', strictRateLimit, authController.resetPassword);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token using refresh token
 * @access Public (requires refresh token in cookie)
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and revoke tokens
 * @access Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route GET /api/auth/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticate, authController.getProfile);

export default router;