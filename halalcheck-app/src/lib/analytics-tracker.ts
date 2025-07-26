// Organization-specific analytics tracking system
// Tracks usage patterns and metrics for different organization types

import { OrganizationType } from './organization-context'

export interface AnalyticsEvent {
  eventType: string
  organizationType: OrganizationType
  userId?: string
  sessionId: string
  timestamp: string
  data: any
  metadata?: any
}

export interface UsageMetrics {
  organizationType: OrganizationType
  totalSessions: number
  totalEvents: number
  uniqueUsers: number
  averageSessionDuration: number
  topFeatures: Array<{
    feature: string
    usage: number
    percentage: number
  }>
  organizationSpecificMetrics: any
}

export class AnalyticsTracker {
  private static instance: AnalyticsTracker
  private sessionId: string
  private userId?: string
  private organizationType?: OrganizationType
  private sessionStartTime: number
  private eventQueue: AnalyticsEvent[] = []
  private batchSize = 10
  private flushInterval = 30000 // 30 seconds

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker()
    }
    return AnalyticsTracker.instance
  }

  constructor() {
    this.sessionId = this.generateSessionId()
    this.sessionStartTime = Date.now()
    this.initializeAutoFlush()
    this.loadUserContext()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadUserContext(): void {
    try {
      this.userId = localStorage.getItem('user-email') || undefined
      this.organizationType = (localStorage.getItem('user-organization-type') as OrganizationType) || undefined
    } catch (error) {
      console.warn('Failed to load user context for analytics:', error)
    }
  }

  private initializeAutoFlush(): void {
    // Auto-flush events periodically
    setInterval(() => {
      this.flush()
    }, this.flushInterval)

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true)
      })
    }
  }

  // Set user context for analytics
  setUserContext(userId: string, organizationType: OrganizationType): void {
    this.userId = userId
    this.organizationType = organizationType
  }

  // Track general events
  track(eventType: string, data: any = {}, metadata: any = {}): void {
    if (!this.organizationType) {
      this.loadUserContext()
    }

    const event: AnalyticsEvent = {
      eventType,
      organizationType: this.organizationType || 'certification-body',
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        ...metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : ''
      }
    }

    this.eventQueue.push(event)

    // Auto-flush if queue is full
    if (this.eventQueue.length >= this.batchSize) {
      this.flush()
    }
  }

  // Organization-specific event tracking methods

  // Track analysis events
  trackAnalysis(action: string, data: any): void {
    this.track('analysis', {
      action, // 'started', 'completed', 'failed'
      ...data
    })
  }

  // Track pipeline events
  trackPipeline(action: string, data: any): void {
    this.track('pipeline', {
      action, // 'stage_changed', 'item_created', 'item_deleted'
      ...data
    })
  }

  // Track report generation
  trackReportGeneration(reportType: string, data: any): void {
    this.track('report_generation', {
      reportType, // 'certificate', 'pre_certification', 'trade_compliance'
      organizationType: this.organizationType,
      ...data
    })
  }

  // Track client management
  trackClientManagement(action: string, data: any): void {
    this.track('client_management', {
      action, // 'created', 'updated', 'selected'
      ...data
    })
  }

  // Track navigation and page views
  trackPageView(page: string, data: any = {}): void {
    this.track('page_view', {
      page,
      ...data
    })
  }

  // Track organization context switching
  trackOrganizationSwitch(fromType: OrganizationType, toType: OrganizationType): void {
    this.track('organization_switch', {
      fromType,
      toType,
      timestamp: new Date().toISOString()
    })
    
    // Update current organization type
    this.organizationType = toType
  }

  // Track feature usage patterns
  trackFeatureUsage(feature: string, data: any = {}): void {
    this.track('feature_usage', {
      feature,
      organizationType: this.organizationType,
      ...data
    })
  }

  // Track user onboarding
  trackOnboarding(step: string, data: any = {}): void {
    this.track('onboarding', {
      step, // 'started', 'step_completed', 'skipped', 'completed'
      organizationType: this.organizationType,
      ...data
    })
  }

  // Track performance metrics
  trackPerformance(metric: string, value: number, data: any = {}): void {
    this.track('performance', {
      metric, // 'load_time', 'analysis_time', 'report_generation_time'
      value,
      organizationType: this.organizationType,
      ...data
    })
  }

  // Track errors and issues
  trackError(error: string, data: any = {}): void {
    this.track('error', {
      error,
      organizationType: this.organizationType,
      stack: data.stack || '',
      ...data
    })
  }

  // Get organization-specific metrics
  getUsageMetrics(organizationType?: OrganizationType): UsageMetrics {
    const orgType = organizationType || this.organizationType || 'certification-body'
    const storedEvents = this.getStoredEvents()
    const orgEvents = storedEvents.filter(event => event.organizationType === orgType)

    const sessions = new Set(orgEvents.map(event => event.sessionId)).size
    const users = new Set(orgEvents.map(event => event.userId).filter(Boolean)).size

    // Calculate feature usage
    const featureUsage = new Map<string, number>()
    orgEvents.forEach(event => {
      if (event.eventType === 'feature_usage') {
        const feature = event.data.feature
        featureUsage.set(feature, (featureUsage.get(feature) || 0) + 1)
      }
    })

    const topFeatures = Array.from(featureUsage.entries())
      .map(([feature, usage]) => ({
        feature,
        usage,
        percentage: Math.round((usage / orgEvents.length) * 100)
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10)

    // Organization-specific metrics
    const organizationSpecificMetrics = this.calculateOrganizationSpecificMetrics(orgType, orgEvents)

    return {
      organizationType: orgType,
      totalSessions: sessions,
      totalEvents: orgEvents.length,
      uniqueUsers: users,
      averageSessionDuration: this.calculateAverageSessionDuration(orgEvents),
      topFeatures,
      organizationSpecificMetrics
    }
  }

  private calculateOrganizationSpecificMetrics(orgType: OrganizationType, events: AnalyticsEvent[]): any {
    const metrics: any = {}

    switch (orgType) {
      case 'certification-body':
        metrics.certificatesGenerated = events.filter(e => 
          e.eventType === 'report_generation' && e.data.reportType === 'certificate'
        ).length
        metrics.applicationsProcessed = events.filter(e => 
          e.eventType === 'pipeline' && e.data.action === 'stage_changed'
        ).length
        metrics.averageProcessingTime = this.calculateAverageProcessingTime(events)
        break

      case 'food-manufacturer':
        metrics.productsAnalyzed = events.filter(e => 
          e.eventType === 'analysis' && e.data.action === 'completed'
        ).length
        metrics.preCertReportsGenerated = events.filter(e => 
          e.eventType === 'report_generation' && e.data.reportType === 'pre_certification'
        ).length
        metrics.developmentStagesCompleted = events.filter(e => 
          e.eventType === 'pipeline' && e.data.action === 'stage_changed'
        ).length
        break

      case 'import-export':
        metrics.tradeComplianceChecks = events.filter(e => 
          e.eventType === 'analysis' && e.data.action === 'completed'
        ).length
        metrics.tradeCertificatesGenerated = events.filter(e => 
          e.eventType === 'report_generation' && e.data.reportType === 'trade_compliance'
        ).length
        metrics.internationalStandardsUsed = this.getUniqueInternationalStandards(events)
        break
    }

    return metrics
  }

  private calculateAverageSessionDuration(events: AnalyticsEvent[]): number {
    const sessionDurations = new Map<string, { start: number, end: number }>()
    
    events.forEach(event => {
      const timestamp = new Date(event.timestamp).getTime()
      const sessionId = event.sessionId
      
      if (!sessionDurations.has(sessionId)) {
        sessionDurations.set(sessionId, { start: timestamp, end: timestamp })
      } else {
        const session = sessionDurations.get(sessionId)!
        session.end = Math.max(session.end, timestamp)
      }
    })

    const durations = Array.from(sessionDurations.values())
      .map(session => session.end - session.start)
      .filter(duration => duration > 0)

    return durations.length > 0 
      ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length / 1000) // Convert to seconds
      : 0
  }

  private calculateAverageProcessingTime(events: AnalyticsEvent[]): number {
    const processingTimes = events
      .filter(e => e.eventType === 'performance' && e.data.metric === 'analysis_time')
      .map(e => e.data.value)

    return processingTimes.length > 0
      ? Math.round(processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length)
      : 0
  }

  private getUniqueInternationalStandards(events: AnalyticsEvent[]): number {
    const standards = new Set()
    events.forEach(event => {
      if (event.data.internationalStandards) {
        event.data.internationalStandards.forEach((standard: string) => standards.add(standard))
      }
    })
    return standards.size
  }

  // Flush events to storage/server
  private flush(sync: boolean = false): void {
    if (this.eventQueue.length === 0) return

    const eventsToFlush = [...this.eventQueue]
    this.eventQueue = []

    try {
      // Store events locally
      this.storeEventsLocally(eventsToFlush)
      
      // Send to server (if available)
      if (!sync) {
        this.sendToServer(eventsToFlush)
      } else {
        // Synchronous flush for page unload
        this.sendToServerSync(eventsToFlush)
      }
    } catch (error) {
      console.warn('Failed to flush analytics events:', error)
      // Re-add events to queue on failure
      this.eventQueue.unshift(...eventsToFlush)
    }
  }

  private storeEventsLocally(events: AnalyticsEvent[]): void {
    try {
      const existingEvents = this.getStoredEvents()
      const allEvents = [...existingEvents, ...events]
      
      // Keep only last 1000 events to prevent storage bloat
      const eventsToStore = allEvents.slice(-1000)
      
      localStorage.setItem('halalcheck_analytics_events', JSON.stringify(eventsToStore))
    } catch (error) {
      console.warn('Failed to store analytics events locally:', error)
    }
  }

  private getStoredEvents(): AnalyticsEvent[] {
    try {
      const stored = localStorage.getItem('halalcheck_analytics_events')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.warn('Failed to retrieve stored analytics events:', error)
      return []
    }
  }

  private async sendToServer(events: AnalyticsEvent[]): Promise<void> {
    try {
      // In a real implementation, send to analytics service
      // For now, just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics events:', events)
      }

      // Example server call:
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events })
      // })
    } catch (error) {
      console.warn('Failed to send analytics events to server:', error)
    }
  }

  private sendToServerSync(events: AnalyticsEvent[]): void {
    try {
      // Use sendBeacon for synchronous sending during page unload
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const data = JSON.stringify({ events })
        navigator.sendBeacon('/api/analytics', data)
      }
    } catch (error) {
      console.warn('Failed to send analytics events synchronously:', error)
    }
  }

  // Get analytics dashboard data
  getAnalyticsDashboard(): {
    organizationMetrics: UsageMetrics[]
    topFeatures: Array<{ feature: string, usage: number, orgType: OrganizationType }>
    recentEvents: AnalyticsEvent[]
    performanceMetrics: any
  } {
    const allEvents = this.getStoredEvents()
    const organizationTypes: OrganizationType[] = ['certification-body', 'food-manufacturer', 'import-export']
    
    const organizationMetrics = organizationTypes.map(orgType => 
      this.getUsageMetrics(orgType)
    ).filter(metrics => metrics.totalEvents > 0)

    // Get top features across all organizations
    const featureUsage = new Map<string, { usage: number, orgType: OrganizationType }>()
    allEvents.forEach(event => {
      if (event.eventType === 'feature_usage') {
        const key = `${event.data.feature}-${event.organizationType}`
        const existing = featureUsage.get(key)
        featureUsage.set(key, {
          usage: (existing?.usage || 0) + 1,
          orgType: event.organizationType
        })
      }
    })

    const topFeatures = Array.from(featureUsage.entries())
      .map(([key, data]) => ({
        feature: key.split('-')[0],
        usage: data.usage,
        orgType: data.orgType
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 20)

    // Get recent events (last 50)
    const recentEvents = allEvents
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50)

    // Performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(allEvents)

    return {
      organizationMetrics,
      topFeatures,
      recentEvents,
      performanceMetrics
    }
  }

  private calculatePerformanceMetrics(events: AnalyticsEvent[]): any {
    const performanceEvents = events.filter(e => e.eventType === 'performance')
    
    const metrics: any = {}
    performanceEvents.forEach(event => {
      const metric = event.data.metric
      if (!metrics[metric]) {
        metrics[metric] = []
      }
      metrics[metric].push(event.data.value)
    })

    // Calculate averages
    Object.keys(metrics).forEach(metric => {
      const values = metrics[metric]
      metrics[metric] = {
        average: Math.round(values.reduce((sum: number, val: number) => sum + val, 0) / values.length),
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    })

    return metrics
  }

  // Clear analytics data
  clearAnalyticsData(): void {
    try {
      localStorage.removeItem('halalcheck_analytics_events')
      this.eventQueue = []
      console.log('Analytics data cleared')
    } catch (error) {
      console.warn('Failed to clear analytics data:', error)
    }
  }

  // Get session info
  getSessionInfo(): { sessionId: string, userId?: string, organizationType?: OrganizationType, duration: number } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      organizationType: this.organizationType,
      duration: Date.now() - this.sessionStartTime
    }
  }
}

// Create singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance()

// Convenience functions for common tracking
export const trackAnalysis = (action: string, data: any) => analyticsTracker.trackAnalysis(action, data)
export const trackPipeline = (action: string, data: any) => analyticsTracker.trackPipeline(action, data)
export const trackReportGeneration = (reportType: string, data: any) => analyticsTracker.trackReportGeneration(reportType, data)
export const trackClientManagement = (action: string, data: any) => analyticsTracker.trackClientManagement(action, data)
export const trackPageView = (page: string, data?: any) => analyticsTracker.trackPageView(page, data)
export const trackFeatureUsage = (feature: string, data?: any) => analyticsTracker.trackFeatureUsage(feature, data)
export const trackOnboarding = (step: string, data?: any) => analyticsTracker.trackOnboarding(step, data)
export const trackPerformance = (metric: string, value: number, data?: any) => analyticsTracker.trackPerformance(metric, value, data)
export const trackError = (error: string, data?: any) => analyticsTracker.trackError(error, data)