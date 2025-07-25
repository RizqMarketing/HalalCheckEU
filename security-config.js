// HalalCheck AI - Enterprise Security Configuration
// This file contains all security middleware and configurations

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, param, query, validationResult } from 'express-validator';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

// ========================================
// 1. RATE LIMITING CONFIGURATION
// ========================================

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Analysis API rate limiting (more restrictive)
export const analysisRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 analysis requests per minute
  message: {
    error: 'Analysis rate limit exceeded. Maximum 10 analyses per minute.',
    retryAfter: '1 minute'
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  }
});

// File upload rate limiting
export const uploadRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 file uploads per 5 minutes
  message: {
    error: 'File upload rate limit exceeded. Maximum 20 files per 5 minutes.'
  }
});

// Authentication rate limiting
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: {
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  skipSuccessfulRequests: true // Don't count successful requests
});

// ========================================
// 2. SECURITY HEADERS CONFIGURATION
// ========================================

export const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline scripts for Next.js
        "https://unpkg.com", // For Supabase CDN
        "https://js.stripe.com", // For Stripe
        "https://checkout.stripe.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Allow inline styles for Tailwind
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:", // For base64 images
        "https://*.supabase.co", // For Supabase storage
        "https://pllewdnptglldpkuexxt.supabase.co"
      ],
      connectSrc: [
        "'self'",
        "https://pllewdnptglldpkuexxt.supabase.co",
        "https://api.openai.com",
        "https://api.stripe.com"
      ],
      frameSrc: [
        "https://js.stripe.com", // For Stripe Elements
        "https://checkout.stripe.com"
      ]
    }
  },
  
  // Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Other security headers
  noSniff: true, // X-Content-Type-Options: nosniff
  frameguard: { action: 'deny' }, // X-Frame-Options: DENY
  xssFilter: true, // X-XSS-Protection: 1; mode=block
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// ========================================
// 3. INPUT VALIDATION RULES
// ========================================

// Email validation
export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Valid email is required');

// Password validation
export const validatePassword = body('password')
  .isLength({ min: 12 })
  .withMessage('Password must be at least 12 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
  .withMessage('Password must contain uppercase, lowercase, number, and special character');

// Analysis text validation
export const validateAnalysisInput = [
  body('ingredientText')
    .isLength({ min: 1, max: 50000 })
    .withMessage('Ingredient text must be between 1 and 50,000 characters')
    .trim()
    .escape(), // Prevent XSS
  
  body('analysisType')
    .isIn(['single', 'bulk', 'image_ocr'])
    .withMessage('Invalid analysis type')
];

// File upload validation
export const validateFileUpload = [
  body('filename')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('Invalid filename characters')
    .isLength({ max: 255 })
    .withMessage('Filename too long'),
  
  body('fileSize')
    .isInt({ min: 1, max: 52428800 }) // 50MB max
    .withMessage('File size must be between 1 byte and 50MB')
];

// UUID validation
export const validateUUID = param('id')
  .isUUID()
  .withMessage('Invalid ID format');

// ========================================
// 4. FILE SECURITY FUNCTIONS
// ========================================

// Allowed file types for upload
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/csv',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/rtf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

// File type validation
export function validateFileType(mimetype, originalname) {
  // Check MIME type
  if (!ALLOWED_FILE_TYPES.includes(mimetype)) {
    throw new Error(`File type ${mimetype} not allowed`);
  }
  
  // Check file extension
  const allowedExtensions = ['.txt', '.csv', '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.rtf', '.jpg', '.jpeg', '.png', '.webp'];
  const fileExtension = originalname.toLowerCase().substring(originalname.lastIndexOf('.'));
  
  if (!allowedExtensions.includes(fileExtension)) {
    throw new Error(`File extension ${fileExtension} not allowed`);
  }
  
  return true;
}

// Sanitize filename
export function sanitizeFilename(filename) {
  // Remove path traversal attempts
  let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '');
  
  // Remove hidden file indicators
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, 255 - extension.length);
    sanitized = name + extension;
  }
  
  return sanitized || 'upload';
}

// Generate secure file path
export function generateSecureFilePath(userId, originalFilename) {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const sanitizedName = sanitizeFilename(originalFilename);
  
  return `${userId}/${timestamp}-${randomString}-${sanitizedName}`;
}

// ========================================
// 5. AUTHENTICATION SECURITY
// ========================================

// Hash password with salt
export async function hashPassword(password) {
  const saltRounds = 12; // High security
  return await bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Generate secure session token
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Validate session token format
export function validateSessionToken(token) {
  return typeof token === 'string' && token.length === 64 && /^[a-f0-9]+$/.test(token);
}

// ========================================
// 6. ERROR HANDLING MIDDLEWARE
// ========================================

export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

// Security error handler
export function securityErrorHandler(err, req, res, next) {
  // Log security incidents
  console.error('Security Error:', {
    error: err.message,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    timestamp: new Date().toISOString()
  });
  
  // Don't expose internal errors
  if (err.name === 'ValidationError' || err.name === 'SecurityError') {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Request validation failed'
    });
  }
  
  // Generic error response
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
}

// ========================================
// 7. TRIAL ABUSE PREVENTION
// ========================================

// Track trial usage by IP and device fingerprint
const trialUsageTracker = new Map();

export function checkTrialAbuse(req, res, next) {
  const identifier = req.user?.id || req.ip;
  const userAgent = req.get('User-Agent') || '';
  const fingerprint = crypto.createHash('sha256').update(identifier + userAgent).digest('hex');
  
  const now = Date.now();
  const hour = 60 * 60 * 1000;
  
  if (!trialUsageTracker.has(fingerprint)) {
    trialUsageTracker.set(fingerprint, { count: 0, firstRequest: now });
  }
  
  const usage = trialUsageTracker.get(fingerprint);
  
  // Reset counter if more than 1 hour passed
  if (now - usage.firstRequest > hour) {
    usage.count = 0;
    usage.firstRequest = now;
  }
  
  // Check for abuse (more than 20 analyses per hour from same fingerprint)
  if (usage.count > 20) {
    return res.status(429).json({
      error: 'Trial abuse detected',
      message: 'Too many trial analyses from this device'
    });
  }
  
  usage.count++;
  next();
}

// ========================================
// 8. LOGGING SECURITY EVENTS
// ========================================

export function logSecurityEvent(event, details, req) {
  const logEntry = {
    event,
    details,
    timestamp: new Date().toISOString(),
    ip: req?.ip || 'unknown',
    userAgent: req?.get('User-Agent') || 'unknown',
    userId: req?.user?.id || null,
    path: req?.path || 'unknown'
  };
  
  // In production, send to security monitoring service
  console.log('SECURITY EVENT:', JSON.stringify(logEntry));
  
  // Could integrate with services like:
  // - Sentry for error tracking
  // - DataDog for logging
  // - AWS CloudWatch
  // - Custom security incident management
}

export default {
  generalRateLimit,
  analysisRateLimit,
  uploadRateLimit,
  authRateLimit,
  securityHeaders,
  validateEmail,
  validatePassword,
  validateAnalysisInput,
  validateFileUpload,
  validateUUID,
  validateFileType,
  sanitizeFilename,
  generateSecureFilePath,
  hashPassword,
  verifyPassword,
  generateSessionToken,
  validateSessionToken,
  handleValidationErrors,
  securityErrorHandler,
  checkTrialAbuse,
  logSecurityEvent
};