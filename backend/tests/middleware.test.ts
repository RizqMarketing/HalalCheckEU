/**
 * HalalCheck EU - Middleware Tests
 * 
 * Tests for authentication and authorization middleware
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { Request, Response, NextFunction } from 'express'
import { authenticate, authorize } from '../src/middleware/auth'
import { errorHandler } from '../src/middleware/errorHandler'
import { UserRole, UserStatus } from '../src/types'
import jwt from 'jsonwebtoken'

describe('Authentication Middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {
      headers: {},
      user: undefined
    }
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })

  describe('authenticate', () => {
    it('should authenticate valid JWT token', async () => {
      const token = jwt.sign(
        {
          sub: 'user-id-123',
          email: 'test@example.com',
          role: UserRole.ANALYST,
          organizationId: 'org-123',
          permissions: ['analyze:ingredients']
        },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '1h' }
      )

      req.headers = {
        authorization: `Bearer ${token}`
      }

      await authenticate(req as Request, res as Response, next)

      expect(req.user).toBeDefined()
      expect(req.user?.id).toBe('user-id-123')
      expect(req.user?.email).toBe('test@example.com')
      expect(req.user?.role).toBe(UserRole.ANALYST)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should reject missing authorization header', async () => {
      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'NO_TOKEN_PROVIDED',
        message: 'No authorization token provided'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject malformed authorization header', async () => {
      req.headers = {
        authorization: 'InvalidHeader'
      }

      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_TOKEN_FORMAT',
        message: 'Invalid authorization header format'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject invalid JWT token', async () => {
      req.headers = {
        authorization: 'Bearer invalid-token'
      }

      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject expired JWT token', async () => {
      const expiredToken = jwt.sign(
        {
          sub: 'user-id-123',
          email: 'test@example.com',
          role: UserRole.ANALYST
        },
        process.env.JWT_SECRET || 'test-jwt-secret',
        { expiresIn: '-1h' } // Expired 1 hour ago
      )

      req.headers = {
        authorization: `Bearer ${expiredToken}`
      }

      await authenticate(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('authorize', () => {
    beforeEach(() => {
      req.user = {
        id: 'user-id-123',
        email: 'test@example.com',
        role: UserRole.ANALYST,
        organizationId: 'org-123',
        permissions: ['analyze:ingredients', 'view:analysis_history'],
        status: UserStatus.ACTIVE
      }
    })

    it('should authorize user with required permission', async () => {
      const middleware = authorize(['analyze:ingredients'])

      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should authorize user with any of the required permissions', async () => {
      const middleware = authorize(['manage:users', 'analyze:ingredients'])

      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should reject user without required permissions', async () => {
      const middleware = authorize(['manage:users'])

      await middleware(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Insufficient permissions for this operation'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject suspended user', async () => {
      req.user!.status = UserStatus.SUSPENDED
      const middleware = authorize(['analyze:ingredients'])

      await middleware(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'ACCOUNT_SUSPENDED',
        message: 'Account is suspended'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should reject inactive user', async () => {
      req.user!.status = UserStatus.INACTIVE
      const middleware = authorize(['analyze:ingredients'])

      await middleware(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'ACCOUNT_INACTIVE',
        message: 'Account is inactive'
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should allow super admin access to everything', async () => {
      req.user!.role = UserRole.SUPER_ADMIN
      req.user!.permissions = ['admin:all']
      const middleware = authorize(['some:rare:permission'])

      await middleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should handle missing user (should not happen after auth)', async () => {
      req.user = undefined
      const middleware = authorize(['analyze:ingredients'])

      await middleware(req as Request, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'NOT_AUTHENTICATED',
        message: 'Authentication required'
      })
      expect(next).not.toHaveBeenCalled()
    })
  })
})

describe('Error Handler Middleware', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: NextFunction

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }
    next = jest.fn()
  })

  it('should handle validation errors', () => {
    const error = new Error('Validation failed')
    error.name = 'ValidationError'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Validation failed'
    })
  })

  it('should handle JWT errors', () => {
    const error = new Error('jwt malformed')
    error.name = 'JsonWebTokenError'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Invalid token'
    })
  })

  it('should handle JWT expiration', () => {
    const error = new Error('jwt expired')
    error.name = 'TokenExpiredError'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Token has expired'
    })
  })

  it('should handle database constraint errors', () => {
    const error: any = new Error('duplicate key value violates unique constraint')
    error.code = '23505'
    error.constraint = 'users_email_unique'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'DUPLICATE_ENTRY',
      message: 'Email already exists'
    })
  })

  it('should handle foreign key constraint errors', () => {
    const error: any = new Error('foreign key constraint fails')
    error.code = '23503'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'REFERENCE_ERROR',
      message: 'Referenced resource does not exist'
    })
  })

  it('should handle custom application errors', () => {
    const error: any = new Error('Custom error message')
    error.statusCode = 422
    error.code = 'CUSTOM_ERROR'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(422)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'CUSTOM_ERROR',
      message: 'Custom error message'
    })
  })

  it('should handle generic errors in production', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const error = new Error('Internal server error')

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    })

    process.env.NODE_ENV = originalEnv
  })

  it('should include error details in development', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const error = new Error('Internal server error')
    error.stack = 'Error stack trace'

    errorHandler(error, req as Request, res as Response, next)

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: 'Internal server error',
      stack: 'Error stack trace'
    })

    process.env.NODE_ENV = originalEnv
  })
})