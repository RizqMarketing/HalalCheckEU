/**
 * HalalCheck EU - Logging Middleware
 * 
 * Comprehensive logging setup using Winston with structured logging
 */

import winston from 'winston'
import { Request, Response, NextFunction } from 'express'
import DailyRotateFile from 'winston-daily-rotate-file'
import path from 'path'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'grey',
  debug: 'white',
  silly: 'grey'
}

winston.addColors(colors)

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.colorize({ all: true })
)

// Define transport for error logs
const errorTransport = new DailyRotateFile({
  filename: path.join('logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Define transport for combined logs
const combinedTransport = new DailyRotateFile({
  filename: path.join('logs', 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Define transport for HTTP logs
const httpTransport = new DailyRotateFile({
  filename: path.join('logs', 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'http',
  maxSize: '20m',
  maxFiles: '7d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Define transport for audit logs
const auditTransport = new DailyRotateFile({
  filename: path.join('logs', 'audit-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  )
})

// Console transport for development
const consoleTransport = new winston.transports.Console({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
    })
  )
})

// Create the main logger
export const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'halalcheck-backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    errorTransport,
    combinedTransport,
    httpTransport,
    consoleTransport
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'exceptions.log') })
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: path.join('logs', 'rejections.log') })
  ]
})

// Create audit logger
export const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'halalcheck-audit',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [auditTransport]
})

// Log sanitization function
const sanitizeLogData = (data: any): any => {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data }
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization', 'cookie',
    'x-api-key', 'x-auth-token', 'jwt', 'refresh_token', 'access_token'
  ]

  const sanitizeObject = (obj: any, path = ''): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map((item, index) => sanitizeObject(item, `${path}[${index}]`))
    }

    const result: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key
      const keyLower = key.toLowerCase()

      if (sensitiveFields.some(field => keyLower.includes(field))) {
        result[key] = '[REDACTED]'
      } else if (typeof value === 'object') {
        result[key] = sanitizeObject(value, fullPath)
      } else {
        result[key] = value
      }
    }

    return result
  }

  return sanitizeObject(sanitized)
}

/**
 * HTTP request logging middleware
 */
export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // Log request
  logger.http('HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    headers: sanitizeLogData(req.headers),
    query: sanitizeLogData(req.query),
    body: sanitizeLogData(req.body)
  })

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const statusCode = res.statusCode

    const logLevel = statusCode >= 400 ? 'warn' : 'http'
    
    logger[logLevel]('HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode,
      duration,
      ip: req.ip,
      userId: req.user?.id,
      organizationId: req.user?.organizationId,
      contentLength: res.get('Content-Length')
    })
  })

  next()
}

/**
 * Audit logging functions
 */
export const auditLog = {
  userRegistration: (userId: string, email: string, organizationId?: string) => {
    auditLogger.info('User Registration', {
      event: 'USER_REGISTRATION',
      userId,
      email,
      organizationId,
      timestamp: new Date().toISOString()
    })
  },

  userLogin: (userId: string, email: string, ip: string, success: boolean) => {
    auditLogger.info('User Login', {
      event: 'USER_LOGIN',
      userId,
      email,
      ip,
      success,
      timestamp: new Date().toISOString()
    })
  },

  userLogout: (userId: string, email: string, ip: string) => {
    auditLogger.info('User Logout', {
      event: 'USER_LOGOUT',
      userId,
      email,
      ip,
      timestamp: new Date().toISOString()
    })
  },

  passwordChange: (userId: string, email: string, ip: string) => {
    auditLogger.info('Password Change', {
      event: 'PASSWORD_CHANGE',
      userId,
      email,
      ip,
      timestamp: new Date().toISOString()
    })
  },

  analysisCreated: (userId: string, analysisId: string, productName: string, organizationId?: string) => {
    auditLogger.info('Analysis Created', {
      event: 'ANALYSIS_CREATED',
      userId,
      analysisId,
      productName,
      organizationId,
      timestamp: new Date().toISOString()
    })
  },

  reportGenerated: (userId: string, reportId: string, analysisIds: string[], format: string) => {
    auditLogger.info('Report Generated', {
      event: 'REPORT_GENERATED',
      userId,
      reportId,
      analysisCount: analysisIds.length,
      format,
      timestamp: new Date().toISOString()
    })
  },

  subscriptionChanged: (userId: string, organizationId: string, oldPlan: string, newPlan: string) => {
    auditLogger.info('Subscription Changed', {
      event: 'SUBSCRIPTION_CHANGED',
      userId,
      organizationId,
      oldPlan,
      newPlan,
      timestamp: new Date().toISOString()
    })
  },

  adminAction: (adminUserId: string, action: string, targetId: string, details: any) => {
    auditLogger.info('Admin Action', {
      event: 'ADMIN_ACTION',
      adminUserId,
      action,
      targetId,
      details: sanitizeLogData(details),
      timestamp: new Date().toISOString()
    })
  },

  dataExport: (userId: string, exportType: string, recordCount: number) => {
    auditLogger.info('Data Export', {
      event: 'DATA_EXPORT',
      userId,
      exportType,
      recordCount,
      timestamp: new Date().toISOString()
    })
  },

  securityEvent: (event: string, userId?: string, ip?: string, details?: any) => {
    auditLogger.warn('Security Event', {
      event: 'SECURITY_EVENT',
      securityEvent: event,
      userId,
      ip,
      details: sanitizeLogData(details),
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Performance logging
 */
export const performanceLog = {
  databaseQuery: (operation: string, table: string, duration: number, success: boolean) => {
    logger.debug('Database Query', {
      operation,
      table,
      duration,
      success,
      timestamp: new Date().toISOString()
    })
  },

  externalApiCall: (service: string, endpoint: string, duration: number, success: boolean, statusCode?: number) => {
    logger.debug('External API Call', {
      service,
      endpoint,
      duration,
      success,
      statusCode,
      timestamp: new Date().toISOString()
    })
  },

  cacheOperation: (operation: string, key: string, hit: boolean, duration?: number) => {
    logger.debug('Cache Operation', {
      operation,
      key,
      hit,
      duration,
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * Error logging with context
 */
export const logError = (error: Error, context?: any) => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context: sanitizeLogData(context),
    timestamp: new Date().toISOString()
  })
}

/**
 * Business logic logging
 */
export const businessLog = {
  analysisResult: (analysisId: string, productName: string, result: any, confidence: number, duration: number) => {
    logger.info('Analysis Completed', {
      analysisId,
      productName,
      overallStatus: result.overallStatus,
      overallRisk: result.overallRisk,
      confidence,
      duration,
      ingredientCount: result.ingredients?.length || 0,
      requiresReview: result.expertReviewRequired,
      timestamp: new Date().toISOString()
    })
  },

  paymentEvent: (eventType: string, customerId: string, amount: number, currency: string, success: boolean) => {
    logger.info('Payment Event', {
      eventType,
      customerId,
      amount,
      currency,
      success,
      timestamp: new Date().toISOString()
    })
  },

  emailEvent: (type: string, recipient: string, success: boolean, error?: string) => {
    logger.info('Email Event', {
      type,
      recipient,
      success,
      error,
      timestamp: new Date().toISOString()
    })
  }
}