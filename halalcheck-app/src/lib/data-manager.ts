// Centralized Data Management System for HalalCheck AI
// Handles all data synchronization between Applications, Certificates, and Analytics

import { OrganizationType, getPipelineStages, getOrganizationConfig } from './organization-context'

// Generic status type that works for all organization types
export type ApplicationStatus = string

export interface Application {
  id: string
  clientName: string
  company: string
  productName: string
  email: string
  phone: string
  submittedDate: string
  status: ApplicationStatus // Now supports organization-specific statuses
  priority: 'high' | 'normal' | 'low'
  documents: string[]
  analysisResult?: any
  notes: string
  organizationType?: OrganizationType // Track which organization type created this
  createdAt: string
  updatedAt: string
}

export interface Certificate {
  id: string
  certificateNumber: string
  applicationId: string // Links to the application
  clientName: string
  company: string
  productName: string
  email: string
  phone: string
  issuedDate: string
  expiryDate: string
  status: 'active' | 'expired' | 'revoked' | 'pending'
  analysisResult: any
  certificateType: 'standard' | 'premium' | 'export'
  notes: string
  pdfUrl?: string
  createdAt: string
}

export interface AnalyticsData {
  totalApplications: number
  certificatesIssued: number
  applicationsReceived: number
  averageProcessingTime: number
  clientSatisfaction: number
  revenueGenerated: number
  monthlyGrowth: number
  statusDistribution: Array<{
    status: string
    count: number
    color: string
  }>
  monthlyStats: Array<{
    month: string
    certificates: number
    applications: number
    revenue: number
  }>
  topClients: Array<{
    name: string
    company: string
    certificates: number
    revenue: number
  }>
  categoryBreakdown: Array<{
    category: string
    count: number
    percentage: number
  }>
}

class DataManager {
  private static instance: DataManager
  private applications: Application[] = []
  private certificates: Certificate[] = []
  private listeners: Array<() => void> = []
  private currentOrganizationType: OrganizationType = 'certification-body'

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  constructor() {
    this.loadData()
  }

  // Set organization type context
  setOrganizationType(type: OrganizationType) {
    this.currentOrganizationType = type
    this.notify() // Notify listeners of context change
  }

  getCurrentOrganizationType(): OrganizationType {
    return this.currentOrganizationType
  }

  // Event system for real-time updates
  subscribe(listener: () => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener())
  }

  private loadData() {
    // Load applications
    const storedApps = localStorage.getItem('halalcheck_applications')
    if (storedApps) {
      this.applications = JSON.parse(storedApps)
      // Clean up any applications with invalid organization types (like old import-export)
      this.applications = this.applications.filter(app => 
        !app.organizationType || 
        app.organizationType === 'certification-body' || 
        app.organizationType === 'food-manufacturer'
      )
    } else {
      this.initializeSampleData()
    }

    // Load certificates
    const storedCerts = localStorage.getItem('halalcheck_certificates')
    if (storedCerts) {
      this.certificates = JSON.parse(storedCerts)
    }
  }

  private saveData() {
    localStorage.setItem('halalcheck_applications', JSON.stringify(this.applications))
    localStorage.setItem('halalcheck_certificates', JSON.stringify(this.certificates))
    this.notify()
  }

  private initializeSampleData() {
    const now = new Date().toISOString()
    this.applications = [
      {
        id: '1',
        clientName: 'Ahmed Hassan',
        company: 'Middle East Foods Ltd',
        productName: 'Halal Beef Sausages',
        email: 'ahmed@mefoods.com',
        phone: '+31 20 123 4567',
        submittedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'new',
        priority: 'high',
        documents: ['ingredient_list.pdf', 'supplier_certificates.pdf'],
        notes: 'Rush order for Eid production',
        createdAt: now,
        updatedAt: now
      },
      {
        id: '2',
        clientName: 'Fatima Al-Zahra',
        company: 'Istanbul Bakery Chain',
        productName: 'Traditional Baklava Mix',
        email: 'fatima@istanbulbakery.com',
        phone: '+31 20 987 6543',
        submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'reviewing',
        priority: 'normal',
        documents: ['baklava_recipe.pdf', 'supplier_list.xlsx'],
        notes: 'Traditional recipe, family business',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now
      },
      {
        id: '3',
        clientName: 'Mohammed Boutros',
        company: 'Halal Pharmaceuticals BV',
        productName: 'Vitamin Supplements (Capsules)',
        email: 'm.boutros@hpharma.nl',
        phone: '+31 20 555 0123',
        submittedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'approved',
        priority: 'normal',
        documents: ['ingredients.pdf', 'manufacturing_process.pdf', 'lab_reports.pdf'],
        notes: 'Pharmaceutical grade certification required',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now
      },
      {
        id: '4',
        clientName: 'Khadija Rahman',
        company: 'European Halal Meats',
        productName: 'Frozen Halal Chicken Products',
        email: 'khadija@ehmeats.eu',
        phone: '+31 20 444 5678',
        submittedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'certified',
        priority: 'high',
        documents: ['slaughter_certificate.pdf', 'cold_chain_docs.pdf', 'facility_inspection.pdf'],
        notes: 'Certificate issued HC-2024-001',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: now
      }
    ]

    // Create corresponding certificates for certified applications
    const certifiedApps = this.applications.filter(app => app.status === 'certified')
    this.certificates = certifiedApps.map(app => ({
      id: crypto.randomUUID(),
      certificateNumber: `HC-2024-${String(this.certificates.length + 1).padStart(3, '0')}`,
      applicationId: app.id,
      clientName: app.clientName,
      company: app.company,
      productName: app.productName,
      email: app.email,
      phone: app.phone,
      issuedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      expiryDate: new Date(Date.now() + 362 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      analysisResult: { overall_status: 'HALAL', confidence_score: 0.95 },
      certificateType: 'standard',
      notes: app.notes,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }))
  }

  // Application Management
  getApplications(): Application[] {
    return [...this.applications]
  }

  getApplicationById(id: string): Application | undefined {
    return this.applications.find(app => app.id === id)
  }

  addApplication(applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt' | 'organizationType'>): Application {
    const now = new Date().toISOString()
    const newApplication: Application = {
      ...applicationData,
      id: crypto.randomUUID(),
      organizationType: this.currentOrganizationType,
      createdAt: now,
      updatedAt: now
    }
    
    this.applications.push(newApplication)
    this.saveData()
    return newApplication
  }

  updateApplication(id: string, updates: Partial<Application>): Application | null {
    const index = this.applications.findIndex(app => app.id === id)
    if (index === -1) return null

    const oldStatus = this.applications[index].status
    const app = this.applications[index]
    const orgType = app.organizationType || this.currentOrganizationType
    
    this.applications[index] = {
      ...app,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Auto-generate certificate based on organization type final status
    const shouldGenerateCertificate = this.shouldGenerateCertificate(oldStatus, updates.status, orgType)
    if (shouldGenerateCertificate) {
      this.generateCertificateFromApplication(this.applications[index])
    }

    this.saveData()
    return this.applications[index]
  }

  // Determine if certificate should be generated based on organization type
  private shouldGenerateCertificate(oldStatus: string, newStatus: string | undefined, orgType: OrganizationType): boolean {
    if (!newStatus || oldStatus === newStatus) return false
    
    const config = getOrganizationConfig(orgType)
    
    // Only certification bodies generate actual certificates
    if (orgType === 'certification-body') {
      return oldStatus !== 'certified' && newStatus === 'certified'
    }
    
    // Manufacturers generate reports when reaching final stage
    if (orgType === 'food-manufacturer') {
      return oldStatus !== 'certification-ready' && newStatus === 'certification-ready'
    }
    
    // This was for import/export which has been removed
    
    return false
  }

  deleteApplication(id: string): boolean {
    const index = this.applications.findIndex(app => app.id === id)
    if (index === -1) return false

    // Also delete associated certificate if exists
    const associatedCert = this.certificates.find(cert => cert.applicationId === id)
    if (associatedCert) {
      this.deleteCertificate(associatedCert.id)
    }

    this.applications.splice(index, 1)
    this.saveData()
    return true
  }

  // Certificate Management
  getCertificates(): Certificate[] {
    return [...this.certificates]
  }

  getCertificateById(id: string): Certificate | undefined {
    return this.certificates.find(cert => cert.id === id)
  }

  generateCertificateFromApplication(application: Application): Certificate {
    const orgType = application.organizationType || this.currentOrganizationType
    const config = getOrganizationConfig(orgType)
    
    // Generate organization-specific certificate number
    const prefix = this.getCertificatePrefix(orgType)
    const certificateNumber = `${prefix}-${new Date().getFullYear()}-${String(this.certificates.length + 1).padStart(3, '0')}`
    
    const certificate: Certificate = {
      id: crypto.randomUUID(),
      certificateNumber,
      applicationId: application.id,
      clientName: application.clientName,
      company: application.company,
      productName: application.productName,
      email: application.email,
      phone: application.phone,
      issuedDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      analysisResult: application.analysisResult || { overall_status: 'HALAL', confidence_score: 0.95 },
      certificateType: this.getCertificateType(orgType),
      notes: `Auto-generated ${config.terminology.documentName.toLowerCase()} from ${application.id}`,
      pdfUrl: `/certificates/${certificateNumber}.pdf`,
      createdAt: new Date().toISOString()
    }

    this.certificates.push(certificate)
    this.saveData()
    return certificate
  }

  private getCertificatePrefix(orgType: OrganizationType): string {
    switch (orgType) {
      case 'certification-body': return 'HC'
      case 'food-manufacturer': return 'PCR'
      default: return 'HC'
    }
  }

  private getCertificateType(orgType: OrganizationType): 'standard' | 'premium' | 'export' {
    switch (orgType) {
      case 'certification-body': return 'standard'
      case 'food-manufacturer': return 'premium' // Pre-certification report
      default: return 'standard'
    }
  }

  updateCertificate(id: string, updates: Partial<Certificate>): Certificate | null {
    const index = this.certificates.findIndex(cert => cert.id === id)
    if (index === -1) return null

    this.certificates[index] = {
      ...this.certificates[index],
      ...updates
    }

    this.saveData()
    return this.certificates[index]
  }

  deleteCertificate(id: string): boolean {
    const index = this.certificates.findIndex(cert => cert.id === id)
    if (index === -1) return false

    this.certificates.splice(index, 1)
    this.saveData()
    return true
  }

  // Get applications filtered by organization type
  getApplicationsByOrganizationType(orgType?: OrganizationType): Application[] {
    const targetType = orgType || this.currentOrganizationType
    return this.applications.filter(app => 
      (app.organizationType || 'certification-body') === targetType
    )
  }

  // Get available statuses for current organization type
  getAvailableStatuses(orgType?: OrganizationType): string[] {
    const targetType = orgType || this.currentOrganizationType
    const stages = getPipelineStages(targetType)
    return stages.map(stage => stage.id)
  }

  // Validate status for organization type
  isValidStatus(status: string, orgType?: OrganizationType): boolean {
    const availableStatuses = this.getAvailableStatuses(orgType)
    return availableStatuses.includes(status)
  }

  // Analytics
  getAnalyticsData(orgType?: OrganizationType): AnalyticsData {
    const targetType = orgType || this.currentOrganizationType
    const apps = this.getApplicationsByOrganizationType(targetType)
    const certs = this.getCertificates() // All certificates for now
    const stages = getPipelineStages(targetType)

    // Calculate status distribution based on organization stages
    const statusCounts: Record<string, number> = {}
    stages.forEach(stage => {
      statusCounts[stage.id] = apps.filter(app => app.status === stage.id).length
    })
    
    // Add rejected count if not in stages
    if (!statusCounts.rejected) {
      statusCounts.rejected = apps.filter(app => app.status === 'rejected').length
    }

    const statusDistribution = stages.map(stage => ({
      status: stage.title,
      count: statusCounts[stage.id] || 0,
      color: stage.color.includes('bg-') ? stage.color.split(' ')[0] : 'bg-gray-500'
    }))

    // Calculate monthly stats
    const monthlyStats = this.calculateMonthlyStats(apps, certs)

    // Calculate top clients
    const topClients = this.calculateTopClients(apps, certs)

    // Category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(apps)

    return {
      totalApplications: apps.length,
      certificatesIssued: certs.length,
      applicationsReceived: apps.length,
      averageProcessingTime: this.calculateAverageProcessingTime(apps),
      clientSatisfaction: 4.8,
      revenueGenerated: certs.length * 350, // €350 per certificate
      monthlyGrowth: this.calculateMonthlyGrowth(apps),
      statusDistribution,
      monthlyStats,
      topClients,
      categoryBreakdown
    }
  }

  private calculateMonthlyStats(apps: Application[], certs: Certificate[]) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    
    return months.map((month, index) => {
      const monthApps = apps.filter(app => new Date(app.createdAt).getMonth() === index)
      const monthCerts = certs.filter(cert => new Date(cert.createdAt).getMonth() === index)
      
      return {
        month,
        certificates: monthCerts.length,
        applications: monthApps.length,
        revenue: monthCerts.length * 350
      }
    })
  }

  private calculateTopClients(apps: Application[], certs: Certificate[]) {
    const clientMap = new Map()
    
    apps.forEach(app => {
      if (!clientMap.has(app.clientName)) {
        clientMap.set(app.clientName, {
          name: app.clientName,
          company: app.company,
          certificates: 0,
          revenue: 0
        })
      }
    })

    certs.forEach(cert => {
      const client = clientMap.get(cert.clientName)
      if (client) {
        client.certificates += 1
        client.revenue += 350
      }
    })

    return Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }

  private calculateCategoryBreakdown(apps: Application[]) {
    const categories = new Map()
    
    apps.forEach(app => {
      let category = 'Others'
      const productName = app.productName.toLowerCase()
      
      if (productName.includes('meat') || productName.includes('chicken') || productName.includes('beef')) {
        category = 'Food Products'
      } else if (productName.includes('baklava') || productName.includes('bakery')) {
        category = 'Food Products'
      } else if (productName.includes('vitamin') || productName.includes('supplement')) {
        category = 'Pharmaceuticals'
      } else if (productName.includes('spice')) {
        category = 'Food Products'
      }
      
      categories.set(category, (categories.get(category) || 0) + 1)
    })

    const total = apps.length
    return Array.from(categories.entries()).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100)
    }))
  }

  private calculateAverageProcessingTime(apps: Application[]): number {
    const processedApps = apps.filter(app => app.status === 'certified' || app.status === 'rejected')
    if (processedApps.length === 0) return 0

    const totalTime = processedApps.reduce((sum, app) => {
      const created = new Date(app.createdAt).getTime()
      const updated = new Date(app.updatedAt).getTime()
      return sum + (updated - created)
    }, 0)

    return Math.round((totalTime / processedApps.length) / (1000 * 60 * 60 * 24) * 10) / 10 // Days with 1 decimal
  }

  private calculateMonthlyGrowth(apps: Application[]): number {
    const currentMonth = new Date().getMonth()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    
    const currentMonthApps = apps.filter(app => new Date(app.createdAt).getMonth() === currentMonth).length
    const lastMonthApps = apps.filter(app => new Date(app.createdAt).getMonth() === lastMonth).length
    
    if (lastMonthApps === 0) return 0
    return Math.round(((currentMonthApps - lastMonthApps) / lastMonthApps) * 100)
  }
}

export const dataManager = DataManager.getInstance()