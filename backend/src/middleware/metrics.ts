/**
 * HalalCheck EU - Metrics Middleware
 * 
 * Prometheus metrics collection for monitoring and observability
 */

import { Request, Response, NextFunction } from 'express'
import prometheus from 'prom-client'

// Create a registry
export const register = new prometheus.Registry()

// Add default metrics
prometheus.collectDefaultMetrics({
  register,
  prefix: 'halalcheck_',
})

// Custom metrics
export const httpRequestDuration = new prometheus.Histogram({
  name: 'halalcheck_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
})

export const httpRequestsTotal = new prometheus.Counter({
  name: 'halalcheck_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

export const activeConnections = new prometheus.Gauge({
  name: 'halalcheck_active_connections',
  help: 'Number of active connections'
})

export const analysisRequestsTotal = new prometheus.Counter({
  name: 'halalcheck_analysis_requests_total',
  help: 'Total number of ingredient analysis requests',
  labelNames: ['status', 'region', 'category']
})

export const analysisLatency = new prometheus.Histogram({
  name: 'halalcheck_analysis_latency_seconds',
  help: 'Latency of ingredient analysis requests in seconds',
  labelNames: ['status', 'region'],
  buckets: [1, 2, 5, 10, 20, 30, 60]
})

export const databaseQueries = new prometheus.Counter({
  name: 'halalcheck_database_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table', 'status']
})

export const databaseQueryDuration = new prometheus.Histogram({
  name: 'halalcheck_database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
})

export const openaiApiCalls = new prometheus.Counter({
  name: 'halalcheck_openai_api_calls_total',
  help: 'Total number of OpenAI API calls',
  labelNames: ['model', 'status']
})

export const openaiApiLatency = new prometheus.Histogram({
  name: 'halalcheck_openai_api_latency_seconds',
  help: 'Latency of OpenAI API calls in seconds',
  labelNames: ['model'],
  buckets: [1, 2, 5, 10, 20, 30, 60, 120]
})

export const stripeApiCalls = new prometheus.Counter({
  name: 'halalcheck_stripe_api_calls_total',
  help: 'Total number of Stripe API calls',
  labelNames: ['operation', 'status']
})

export const userRegistrations = new prometheus.Counter({
  name: 'halalcheck_user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['organization_type', 'country']
})

export const subscriptionEvents = new prometheus.Counter({
  name: 'halalcheck_subscription_events_total',
  help: 'Total number of subscription events',
  labelNames: ['event_type', 'plan']
})

export const emailsSent = new prometheus.Counter({
  name: 'halalcheck_emails_sent_total',
  help: 'Total number of emails sent',
  labelNames: ['type', 'status']
})

export const fileUploads = new prometheus.Counter({
  name: 'halalcheck_file_uploads_total',
  help: 'Total number of file uploads',
  labelNames: ['type', 'status']
})

export const cacheHits = new prometheus.Counter({
  name: 'halalcheck_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type']
})

export const cacheMisses = new prometheus.Counter({
  name: 'halalcheck_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type']
})

// Register all metrics
register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestsTotal)
register.registerMetric(activeConnections)
register.registerMetric(analysisRequestsTotal)
register.registerMetric(analysisLatency)
register.registerMetric(databaseQueries)
register.registerMetric(databaseQueryDuration)
register.registerMetric(openaiApiCalls)
register.registerMetric(openaiApiLatency)
register.registerMetric(stripeApiCalls)
register.registerMetric(userRegistrations)
register.registerMetric(subscriptionEvents)
register.registerMetric(emailsSent)
register.registerMetric(fileUploads)
register.registerMetric(cacheHits)
register.registerMetric(cacheMisses)

/**
 * Middleware to collect HTTP request metrics
 */
export const collectHttpMetrics = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now()
  
  // Count active connections
  activeConnections.inc()

  // Cleanup on response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000
    const route = req.route?.path || req.path
    const method = req.method
    const statusCode = res.statusCode.toString()

    // Record metrics
    httpRequestDuration
      .labels(method, route, statusCode)
      .observe(duration)

    httpRequestsTotal
      .labels(method, route, statusCode)
      .inc()

    activeConnections.dec()
  })

  next()
}

/**
 * Create a middleware for specific operation metrics
 */
export const createOperationMetrics = (operation: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.locals.operation = operation
    res.locals.startTime = Date.now()
    next()
  }
}

/**
 * Record analysis metrics
 */
export const recordAnalysisMetrics = (
  status: string,
  region: string,
  category: string,
  duration: number
) => {
  analysisRequestsTotal.labels(status, region, category).inc()
  analysisLatency.labels(status, region).observe(duration)
}

/**
 * Record database query metrics
 */
export const recordDatabaseMetrics = (
  operation: string,
  table: string,
  duration: number,
  success: boolean
) => {
  const status = success ? 'success' : 'error'
  
  databaseQueries.labels(operation, table, status).inc()
  databaseQueryDuration.labels(operation, table).observe(duration)
}

/**
 * Record OpenAI API metrics
 */
export const recordOpenAIMetrics = (
  model: string,
  duration: number,
  success: boolean
) => {
  const status = success ? 'success' : 'error'
  
  openaiApiCalls.labels(model, status).inc()
  openaiApiLatency.labels(model).observe(duration)
}

/**
 * Record Stripe API metrics
 */
export const recordStripeMetrics = (operation: string, success: boolean) => {
  const status = success ? 'success' : 'error'
  stripeApiCalls.labels(operation, status).inc()
}

/**
 * Record user registration metrics
 */
export const recordUserRegistration = (organizationType: string, country: string) => {
  userRegistrations.labels(organizationType, country).inc()
}

/**
 * Record subscription event metrics
 */
export const recordSubscriptionEvent = (eventType: string, plan: string) => {
  subscriptionEvents.labels(eventType, plan).inc()
}

/**
 * Record email metrics
 */
export const recordEmailMetrics = (type: string, success: boolean) => {
  const status = success ? 'success' : 'error'
  emailsSent.labels(type, status).inc()
}

/**
 * Record file upload metrics
 */
export const recordFileUploadMetrics = (type: string, success: boolean) => {
  const status = success ? 'success' : 'error'
  fileUploads.labels(type, status).inc()
}

/**
 * Record cache metrics
 */
export const recordCacheHit = (cacheType: string) => {
  cacheHits.labels(cacheType).inc()
}

export const recordCacheMiss = (cacheType: string) => {
  cacheMisses.labels(cacheType).inc()
}