/**
 * HalalCheck EU - Security Middleware
 * 
 * Comprehensive security middleware for protection against common vulnerabilities
 */

import { Request, Response, NextFunction } from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { body, validationResult, sanitizeBody } from 'express-validator'
import crypto from 'crypto'
import { auditLog } from './logger'

/**
 * Helmet configuration for security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", 'https://js.stripe.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'wss:', 'ws:'],
      frameSrc: ['https://js.stripe.com'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
})

/**
 * Rate limiting configurations
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    auditLog.securityEvent('RATE_LIMIT_AUTH', req.user?.id, req.ip, {
      endpoint: req.path,
      method: req.method
    })
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later'
    })
  }
})

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please slow down',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    auditLog.securityEvent('RATE_LIMIT_API', req.user?.id, req.ip, {
      endpoint: req.path,
      method: req.method
    })
    res.status(429).json({
      success: false,
      error: 'Too many requests, please slow down'
    })
  }
})

export const analysisRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 analysis requests per minute
  message: {
    success: false,
    error: 'Too many analysis requests, please wait before submitting another',
    retryAfter: 60
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip
  },
  handler: (req: Request, res: Response) => {
    auditLog.securityEvent('RATE_LIMIT_ANALYSIS', req.user?.id, req.ip, {
      endpoint: req.path
    })
    res.status(429).json({
      success: false,
      error: 'Too many analysis requests, please wait before submitting another'
    })
  }
})

/**
 * Slow down middleware for progressive delays
 */
export const progressiveDelay = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 2, // Start delaying after 2 requests
  delayMs: 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
})

/**
 * Input validation and sanitization
 */
export const validateAndSanitizeInput = [
  // Sanitize all string inputs
  sanitizeBody('*').trim().escape(),
  
  // Custom sanitization for specific fields
  body('email').isEmail().normalizeEmail(),
  body('productName').isLength({ min: 1, max: 200 }),
  body('ingredientList').isLength({ min: 10, max: 5000 }),
  
  // Handle validation errors
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      auditLog.securityEvent('INPUT_VALIDATION_FAILED', req.user?.id, req.ip, {
        errors: errors.array(),
        body: req.body
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid input data',
        details: errors.array()
      })
    }
    next()
  }
]

/**
 * CSRF protection
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for API endpoints with proper authentication
  if (req.path.startsWith('/api/') && req.headers.authorization) {
    return next()
  }
  
  const token = req.headers['x-csrf-token'] as string
  const sessionToken = req.session?.csrfToken
  
  if (!token || !sessionToken || token !== sessionToken) {
    auditLog.securityEvent('CSRF_TOKEN_MISMATCH', req.user?.id, req.ip, {
      providedToken: token ? '[REDACTED]' : null,
      hasSessionToken: !!sessionToken
    })
    return res.status(403).json({
      success: false,
      error: 'CSRF token mismatch'
    })
  }
  
  next()
}

/**
 * SQL injection protection
 */
export const sqlInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /('|(\\\')|(\-\-)|(;)|(\/\*)|(\*\/)|(xp_)|(sp_)|(delete|drop|create|alter|insert|update|select|union)\s+/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload|onerror|onclick|onmouseover/gi
  ]
  
  const checkForInjection = (obj: any, path = ''): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj))
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForInjection(value, path ? `${path}.${key}` : key)) {
          return true
        }
      }
    }
    
    return false
  }
  
  if (checkForInjection(req.body) || checkForInjection(req.query)) {
    auditLog.securityEvent('SQL_INJECTION_ATTEMPT', req.user?.id, req.ip, {
      body: req.body,
      query: req.query,
      path: req.path
    })
    return res.status(400).json({
      success: false,
      error: 'Malicious input detected'
    })
  }
  
  next()
}

/**
 * File upload security
 */
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file && !req.files) {
    return next()
  }
  
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  const files = req.files ? Object.values(req.files).flat() : [req.file]
  
  for (const file of files) {
    if (!file) continue
    
    // Check file type
    if (!allowedMimes.includes(file.mimetype)) {
      auditLog.securityEvent('INVALID_FILE_TYPE', req.user?.id, req.ip, {
        filename: file.originalname,
        mimetype: file.mimetype
      })
      return res.status(400).json({
        success: false,
        error: 'Invalid file type'
      })
    }
    
    // Check file size
    if (file.size > maxSize) {
      auditLog.securityEvent('FILE_SIZE_EXCEEDED', req.user?.id, req.ip, {
        filename: file.originalname,
        size: file.size,
        maxSize
      })
      return res.status(400).json({
        success: false,
        error: 'File size exceeds limit'
      })
    }
    
    // Generate secure filename
    const ext = file.originalname.split('.').pop()
    const secureFilename = `${crypto.randomBytes(16).toString('hex')}.${ext}`
    file.filename = secureFilename
  }
  
  next()
}

/**
 * IP whitelist/blacklist
 */
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip
  const blacklistedIPs = process.env.BLACKLISTED_IPS?.split(',') || []
  const whitelistedIPs = process.env.WHITELISTED_IPS?.split(',') || []
  
  // Check blacklist
  if (blacklistedIPs.includes(clientIP)) {
    auditLog.securityEvent('BLACKLISTED_IP_ACCESS', undefined, clientIP, {
      path: req.path,
      method: req.method
    })
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    })
  }
  
  // Check whitelist (if configured)
  if (whitelistedIPs.length > 0 && !whitelistedIPs.includes(clientIP)) {
    auditLog.securityEvent('NON_WHITELISTED_IP_ACCESS', undefined, clientIP, {
      path: req.path,
      method: req.method
    })
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    })
  }
  
  next()
}

/**
 * Request size limiter
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const contentLength = parseInt(req.headers['content-length'] || '0')
  
  if (contentLength > maxSize) {
    auditLog.securityEvent('REQUEST_SIZE_EXCEEDED', req.user?.id, req.ip, {
      contentLength,
      maxSize,
      path: req.path
    })
    return res.status(413).json({
      success: false,
      error: 'Request entity too large'
    })
  }
  
  next()
}

/**
 * Honeypot field detection
 */
export const honeypotProtection = (req: Request, res: Response, next: NextFunction) => {
  // Check for common bot fields
  const honeypotFields = ['url', 'website', 'link', 'homepage', 'phone_number']
  
  for (const field of honeypotFields) {
    if (req.body[field] && req.body[field].trim() !== '') {
      auditLog.securityEvent('HONEYPOT_TRIGGERED', undefined, req.ip, {
        field,
        value: '[REDACTED]',
        path: req.path
      })
      
      // Simulate normal response to not alert bots
      setTimeout(() => {
        res.status(200).json({ success: true })
      }, Math.random() * 2000 + 1000)
      return
    }
  }
  
  next()
}

/**
 * User agent filtering
 */
export const userAgentFilter = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.headers['user-agent'] || ''
  
  // Block empty or suspicious user agents
  const suspiciousUAs = [
    'curl',
    'wget',
    'python-requests',
    'Go-http-client',
    'Java/',
    'Apache-HttpClient'
  ]
  
  if (!userAgent || suspiciousUAs.some(ua => userAgent.includes(ua))) {
    auditLog.securityEvent('SUSPICIOUS_USER_AGENT', req.user?.id, req.ip, {
      userAgent,
      path: req.path
    })
    
    // Return 403 for suspicious agents
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    })
  }
  
  next()
}

/**
 * Security headers middleware
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  
  // Remove server information
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  
  next()
}

/**
 * Session security
 */
export const sessionSecurity = {
  name: 'sessionId',
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' as const
  }
}

/**
 * Combine all security middlewares
 */
export const applySecurity = (app: any) => {
  // Basic security headers
  app.use(helmetConfig)
  app.use(securityHeaders)
  
  // Request processing security
  app.use(requestSizeLimiter)
  app.use(sqlInjectionProtection)
  app.use(honeypotProtection)
  
  // IP and user agent filtering
  app.use(ipFilter)
  app.use(userAgentFilter)
  
  // File upload security (applied to upload routes)
  app.use('/api/upload', fileUploadSecurity)
  
  // Rate limiting
  app.use('/api/auth', authRateLimit)
  app.use('/api/analysis', analysisRateLimit)
  app.use('/api/', apiRateLimit)
  
  // Progressive delay for repeated requests
  app.use(progressiveDelay)
  
  // CSRF protection (for non-API routes)
  app.use(csrfProtection)
}