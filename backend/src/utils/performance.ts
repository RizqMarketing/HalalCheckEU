/**
 * HalalCheck EU - Performance Optimization Utilities
 * 
 * Tools and utilities for application performance optimization
 */

import { Request, Response, NextFunction } from 'express'
import compression from 'compression'
import cache from 'memory-cache'
import Redis from 'ioredis'
import { performance } from 'perf_hooks'
import { logger, performanceLog } from '../middleware/logger'

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

/**
 * Response compression middleware
 */
export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    // Don't compress if the request includes a cache-control directive
    if (req.headers['cache-control']?.includes('no-transform')) {
      return false
    }
    
    // Use compression filter
    return compression.filter(req, res)
  },
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (1-9)
})

/**
 * Cache configuration
 */
const cacheConfig = {
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  maxKeys: 1000,
  
  // Cache TTL by route pattern
  routeTTL: {
    '/api/halal-ingredients': 24 * 60 * 60 * 1000, // 24 hours - ingredients rarely change
    '/api/dashboard/stats': 5 * 60 * 1000, // 5 minutes - stats can be slightly stale
    '/api/analysis/history': 2 * 60 * 1000, // 2 minutes - history updates frequently
    '/api/reports': 10 * 60 * 1000, // 10 minutes - reports are expensive
  }
}

/**
 * Memory cache wrapper
 */
export class MemoryCache {
  private cache = cache
  
  get(key: string): any {
    const startTime = performance.now()
    const value = this.cache.get(key)
    const duration = performance.now() - startTime
    
    performanceLog.cacheOperation('GET', key, !!value, duration)
    
    if (value) {
      logger.debug('Cache hit', { key, type: 'memory' })
    } else {
      logger.debug('Cache miss', { key, type: 'memory' })
    }
    
    return value
  }
  
  set(key: string, value: any, ttl?: number): void {
    const startTime = performance.now()
    this.cache.put(key, value, ttl || cacheConfig.defaultTTL)
    const duration = performance.now() - startTime
    
    performanceLog.cacheOperation('SET', key, true, duration)
    logger.debug('Cache set', { key, ttl, type: 'memory' })
  }
  
  delete(key: string): void {
    this.cache.del(key)
    logger.debug('Cache delete', { key, type: 'memory' })
  }
  
  clear(): void {
    this.cache.clear()
    logger.info('Memory cache cleared')
  }
  
  size(): number {
    return this.cache.size()
  }
}

/**
 * Redis cache wrapper
 */
export class RedisCache {
  private client = redis
  
  async get(key: string): Promise<any> {
    const startTime = performance.now()
    try {
      const value = await this.client.get(key)
      const duration = performance.now() - startTime
      
      performanceLog.cacheOperation('GET', key, !!value, duration)
      
      if (value) {
        logger.debug('Cache hit', { key, type: 'redis' })
        return JSON.parse(value)
      } else {
        logger.debug('Cache miss', { key, type: 'redis' })
        return null
      }
    } catch (error) {
      logger.error('Redis cache get error', { key, error: (error as Error).message })
      return null
    }
  }
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const startTime = performance.now()
    try {
      const serializedValue = JSON.stringify(value)
      
      if (ttl) {
        await this.client.setex(key, Math.floor(ttl / 1000), serializedValue)
      } else {
        await this.client.set(key, serializedValue)
      }
      
      const duration = performance.now() - startTime
      performanceLog.cacheOperation('SET', key, true, duration)
      logger.debug('Cache set', { key, ttl, type: 'redis' })
    } catch (error) {
      logger.error('Redis cache set error', { key, error: (error as Error).message })
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
      logger.debug('Cache delete', { key, type: 'redis' })
    } catch (error) {
      logger.error('Redis cache delete error', { key, error: (error as Error).message })
    }
  }
  
  async clear(): Promise<void> {
    try {
      await this.client.flushall()
      logger.info('Redis cache cleared')
    } catch (error) {
      logger.error('Redis cache clear error', { error: (error as Error).message })
    }
  }
}

// Cache instances
export const memoryCache = new MemoryCache()
export const redisCache = new RedisCache()

/**
 * Cache middleware factory
 */
export const createCacheMiddleware = (options: {
  key?: (req: Request) => string
  ttl?: number
  type?: 'memory' | 'redis' | 'both'
  condition?: (req: Request) => boolean
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const {
      key = (req: Request) => `${req.method}:${req.path}:${JSON.stringify(req.query)}`,
      ttl,
      type = 'redis',
      condition = () => req.method === 'GET'
    } = options
    
    // Skip caching if condition not met
    if (!condition(req)) {
      return next()
    }
    
    const cacheKey = key(req)
    let cachedValue: any = null
    
    try {
      // Try to get from cache
      if (type === 'memory' || type === 'both') {
        cachedValue = memoryCache.get(cacheKey)
      }
      
      if (!cachedValue && (type === 'redis' || type === 'both')) {
        cachedValue = await redisCache.get(cacheKey)
      }
      
      // Return cached value if found
      if (cachedValue) {
        res.setHeader('X-Cache', 'HIT')
        return res.json(cachedValue)
      }
      
      // Intercept response to cache it
      const originalJson = res.json
      res.json = function(data: any) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheTTL = ttl || cacheConfig.routeTTL[req.path] || cacheConfig.defaultTTL
          
          if (type === 'memory' || type === 'both') {
            memoryCache.set(cacheKey, data, cacheTTL)
          }
          
          if (type === 'redis' || type === 'both') {
            redisCache.set(cacheKey, data, cacheTTL).catch(err => {
              logger.error('Failed to cache response', { error: err.message })
            })
          }
        }
        
        res.setHeader('X-Cache', 'MISS')
        return originalJson.call(this, data)
      }
      
      next()
    } catch (error) {
      logger.error('Cache middleware error', { error: (error as Error).message })
      next()
    }
  }
}

/**
 * Database query optimization utilities
 */
export class QueryOptimizer {
  private queryCache = new Map<string, any>()
  
  /**
   * Create optimized database query with caching
   */
  async optimizedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    options: {
      ttl?: number
      skipCache?: boolean
    } = {}
  ): Promise<T> {
    const { ttl = 5 * 60 * 1000, skipCache = false } = options
    
    if (!skipCache && this.queryCache.has(queryKey)) {
      const cached = this.queryCache.get(queryKey)
      if (Date.now() - cached.timestamp < ttl) {
        logger.debug('Query cache hit', { queryKey })
        return cached.data
      }
    }
    
    const startTime = performance.now()
    try {
      const result = await queryFn()
      const duration = performance.now() - startTime
      
      // Cache successful results
      this.queryCache.set(queryKey, {
        data: result,
        timestamp: Date.now()
      })
      
      performanceLog.databaseQuery('SELECT', queryKey, duration, true)
      logger.debug('Query executed', { queryKey, duration: `${duration}ms` })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      performanceLog.databaseQuery('SELECT', queryKey, duration, false)
      logger.error('Query failed', { queryKey, duration: `${duration}ms`, error: (error as Error).message })
      throw error
    }
  }
  
  /**
   * Bulk operations optimization
   */
  async bulkInsert<T>(
    tableName: string,
    records: T[],
    batchSize: number = 1000
  ): Promise<void> {
    const batches = []
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize))
    }
    
    for (const batch of batches) {
      const startTime = performance.now()
      try {
        // Implement actual bulk insert logic here
        await this.executeBulkInsert(tableName, batch)
        const duration = performance.now() - startTime
        performanceLog.databaseQuery('BULK_INSERT', tableName, duration, true)
      } catch (error) {
        const duration = performance.now() - startTime
        performanceLog.databaseQuery('BULK_INSERT', tableName, duration, false)
        throw error
      }
    }
  }
  
  private async executeBulkInsert<T>(tableName: string, batch: T[]): Promise<void> {
    // Implementation depends on your database client
    // This is a placeholder
    logger.debug('Bulk insert', { tableName, count: batch.length })
  }
}

export const queryOptimizer = new QueryOptimizer()

/**
 * Response time monitoring
 */
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now()
  
  res.on('finish', () => {
    const duration = performance.now() - startTime
    const route = req.route?.path || req.path
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: route,
        duration: `${duration}ms`,
        statusCode: res.statusCode
      })
    }
    
    // Set response time header
    res.setHeader('X-Response-Time', `${duration}ms`)
    
    // Track performance metrics
    performanceLog.databaseQuery(req.method, route, duration / 1000, res.statusCode < 400)
  })
  
  next()
}

/**
 * Memory usage monitoring
 */
export const monitorMemoryUsage = () => {
  const usage = process.memoryUsage()
  const formatBytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`
  
  logger.info('Memory usage', {
    rss: formatBytes(usage.rss),
    heapTotal: formatBytes(usage.heapTotal),
    heapUsed: formatBytes(usage.heapUsed),
    external: formatBytes(usage.external)
  })
  
  // Alert if memory usage is high
  const heapUsedMB = usage.heapUsed / 1024 / 1024
  if (heapUsedMB > 500) { // Alert if heap usage > 500MB
    logger.warn('High memory usage detected', {
      heapUsed: formatBytes(usage.heapUsed),
      heapTotal: formatBytes(usage.heapTotal)
    })
  }
}

/**
 * Performance optimization recommendations
 */
export const performanceRecommendations = {
  /**
   * Analyze and provide recommendations based on metrics
   */
  analyze: () => {
    const recommendations = []
    
    // Memory cache size check
    const cacheSize = memoryCache.size()
    if (cacheSize > cacheConfig.maxKeys * 0.8) {
      recommendations.push('Consider increasing cache size or reducing TTL')
    }
    
    // Memory usage check
    const memUsage = process.memoryUsage()
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024
    if (heapUsedMB > 400) {
      recommendations.push('High memory usage - consider optimization')
    }
    
    return recommendations
  }
}

/**
 * Initialize performance monitoring
 */
export const initializePerformanceMonitoring = () => {
  // Monitor memory usage every 5 minutes
  setInterval(monitorMemoryUsage, 5 * 60 * 1000)
  
  // Clean up expired cache entries every 10 minutes
  setInterval(() => {
    try {
      const size = memoryCache.size()
      if (size > cacheConfig.maxKeys) {
        memoryCache.clear()
        logger.info('Memory cache cleared due to size limit', { size })
      }
    } catch (error) {
      logger.error('Cache cleanup error', { error: (error as Error).message })
    }
  }, 10 * 60 * 1000)
  
  logger.info('Performance monitoring initialized')
}