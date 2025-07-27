/**
 * Domain Models for Agent-Based MVP Architecture
 * Clean domain entities that represent business concepts
 */

// Base Entity
export abstract class Entity {
  public readonly id: string
  public readonly createdAt: Date
  public updatedAt: Date

  constructor(id: string, createdAt?: Date) {
    this.id = id
    this.createdAt = createdAt || new Date()
    this.updatedAt = new Date()
  }

  protected touch(): void {
    this.updatedAt = new Date()
  }
}

// Value Objects
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string = 'EUR'
  ) {
    if (amount < 0) throw new Error('Money amount cannot be negative')
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies')
    }
    return new Money(this.amount + other.amount, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency)
  }

  toString(): string {
    return `${this.amount} ${this.currency}`
  }
}

export class ContactInfo {
  constructor(
    public readonly email: string,
    public readonly phone: string,
    public readonly address?: string
  ) {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }
}

export class ProductInfo {
  constructor(
    public readonly name: string,
    public readonly category: string,
    public readonly ingredients: string[],
    public readonly manufacturingProcess?: string,
    public readonly targetMarkets?: string[]
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name is required')
    }
    if (ingredients.length === 0) {
      throw new Error('At least one ingredient is required')
    }
  }
}

// Organization Context
export type OrganizationType = 'certification-body' | 'food-manufacturer'

export class OrganizationContext {
  constructor(
    public readonly type: OrganizationType,
    public readonly name: string,
    public readonly country: string,
    public readonly certificationStandards: string[] = [],
    public readonly preferences: Record<string, any> = {}
  ) {}
}

// Core Domain Entities

export class Client extends Entity {
  constructor(
    id: string,
    public readonly name: string,
    public readonly company: string,
    public readonly contactInfo: ContactInfo,
    public readonly organizationContext: OrganizationContext,
    createdAt?: Date
  ) {
    super(id, createdAt)
  }

  updateContactInfo(newContactInfo: ContactInfo): void {
    // In a real implementation, this would create a new instance
    // following immutability principles
    this.touch()
  }
}

export class IngredientAnalysis extends Entity {
  constructor(
    id: string,
    public readonly productInfo: ProductInfo,
    public readonly analysisResult: AnalysisResult,
    public readonly clientId: string,
    public readonly organizationType: OrganizationType,
    createdAt?: Date
  ) {
    super(id, createdAt)
  }

  isHalal(): boolean {
    return this.analysisResult.overallStatus === 'APPROVED'
  }

  hasProhibitedIngredients(): boolean {
    return this.analysisResult.ingredients.some(i => i.status === 'HARAM')
  }

  requiresVerification(): boolean {
    return this.analysisResult.ingredients.some(i => i.status === 'VERIFY_SOURCE')
  }
}

export class Application extends Entity {
  public status: ApplicationStatus
  public priority: Priority
  public assignedTo?: string
  public documents: Document[] = []
  public analysis?: IngredientAnalysis
  public notes: string = ''

  constructor(
    id: string,
    public readonly clientId: string,
    public readonly productInfo: ProductInfo,
    public readonly organizationType: OrganizationType,
    createdAt?: Date
  ) {
    super(id, createdAt)
    this.status = ApplicationStatus.NEW
    this.priority = Priority.NORMAL
  }

  canAdvanceTo(newStatus: ApplicationStatus): boolean {
    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      [ApplicationStatus.NEW]: [ApplicationStatus.REVIEWING, ApplicationStatus.REJECTED],
      [ApplicationStatus.REVIEWING]: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
      [ApplicationStatus.APPROVED]: [ApplicationStatus.CERTIFIED, ApplicationStatus.REJECTED],
      [ApplicationStatus.CERTIFIED]: [ApplicationStatus.REVOKED],
      [ApplicationStatus.REJECTED]: [ApplicationStatus.NEW],
      [ApplicationStatus.REVOKED]: []
    }

    return validTransitions[this.status]?.includes(newStatus) || false
  }

  advanceTo(newStatus: ApplicationStatus): void {
    if (!this.canAdvanceTo(newStatus)) {
      throw new Error(`Invalid status transition: ${this.status} -> ${newStatus}`)
    }
    this.status = newStatus
    this.touch()
  }

  attachDocument(document: Document): void {
    this.documents.push(document)
    this.touch()
  }

  setAnalysis(analysis: IngredientAnalysis): void {
    this.analysis = analysis
    this.touch()
  }

  updatePriority(priority: Priority): void {
    this.priority = priority
    this.touch()
  }

  assignTo(userId: string): void {
    this.assignedTo = userId
    this.touch()
  }

  addNote(note: string): void {
    this.notes += `\n[${new Date().toISOString()}] ${note}`
    this.touch()
  }
}

export class Certificate extends Entity {
  public status: CertificateStatus

  constructor(
    id: string,
    public readonly certificateNumber: string,
    public readonly applicationId: string,
    public readonly clientId: string,
    public readonly productInfo: ProductInfo,
    public readonly analysisResult: AnalysisResult,
    public readonly issuedBy: string,
    public readonly expiryDate: Date,
    public readonly certificateType: CertificateType = CertificateType.STANDARD,
    createdAt?: Date
  ) {
    super(id, createdAt)
    this.status = CertificateStatus.ACTIVE
  }

  isExpired(): boolean {
    return new Date() > this.expiryDate
  }

  isValid(): boolean {
    return this.status === CertificateStatus.ACTIVE && !this.isExpired()
  }

  revoke(reason: string): void {
    this.status = CertificateStatus.REVOKED
    this.addRevocationNote(reason)
    this.touch()
  }

  private addRevocationNote(reason: string): void {
    // Implementation for adding revocation note
  }

  renew(newExpiryDate: Date): Certificate {
    // Create new certificate for renewal
    return new Certificate(
      this.generateRenewalId(),
      this.generateRenewalNumber(),
      this.applicationId,
      this.clientId,
      this.productInfo,
      this.analysisResult,
      this.issuedBy,
      newExpiryDate,
      this.certificateType
    )
  }

  private generateRenewalId(): string {
    return `${this.id}-renewal-${Date.now()}`
  }

  private generateRenewalNumber(): string {
    return `${this.certificateNumber}-R${new Date().getFullYear()}`
  }
}

export class Document extends Entity {
  constructor(
    id: string,
    public readonly fileName: string,
    public readonly filePath: string,
    public readonly mimeType: string,
    public readonly purpose: DocumentPurpose,
    public readonly uploadedBy: string,
    public readonly extractedData?: ExtractedDocumentData,
    createdAt?: Date
  ) {
    super(id, createdAt)
  }

  hasExtractedData(): boolean {
    return !!this.extractedData
  }

  isProcessed(): boolean {
    return this.hasExtractedData()
  }
}

// Enums and Types
export enum ApplicationStatus {
  NEW = 'new',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  CERTIFIED = 'certified',
  REJECTED = 'rejected',
  REVOKED = 'revoked'
}

export enum CertificateStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending'
}

export enum CertificateType {
  STANDARD = 'standard',
  PREMIUM = 'premium',
  EXPORT = 'export'
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum DocumentPurpose {
  INGREDIENT_LIST = 'ingredient-list',
  SUPPLIER_CERTIFICATE = 'supplier-certificate',
  MANUFACTURING_PROCESS = 'manufacturing-process',
  LAB_REPORT = 'lab-report',
  FACILITY_INSPECTION = 'facility-inspection',
  OTHER = 'other'
}

export enum IngredientStatus {
  HALAL = 'HALAL',
  HARAM = 'HARAM',
  MASHBOOH = 'MASHBOOH',
  VERIFY_SOURCE = 'VERIFY_SOURCE'
}

export enum RiskLevel {
  VERY_LOW = 'VERY_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

// Analysis Types
export interface IngredientClassification {
  name: string
  status: IngredientStatus
  category: string
  risk: RiskLevel
  reasoning: string
  islamicReferences: IslamicReference[]
  alternativeSuggestions?: string[]
  verificationRequirements?: string[]
  madhahib?: Record<string, string>
  contemporaryScholars?: string[]
}

export interface IslamicReference {
  source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa'
  reference: string
  arabic?: string
  transliteration?: string
  translation: string
  school?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General'
}

export interface AnalysisResult {
  overallStatus: 'APPROVED' | 'PROHIBITED' | 'QUESTIONABLE' | 'VERIFY_SOURCE'
  ingredients: IngredientClassification[]
  warnings: string[]
  recommendations: string[]
  manufacturingConcerns: string[]
  certificationNotes: string[]
  islamicCompliance: {
    totalIngredients: number
    halalCount: number
    haramCount: number
    questionableCount: number
    requiresVerification: number
  }
  organizationSpecific: {
    documentType: string
    nextSteps: string[]
    requiredDocumentation: string[]
  }
}

export interface ExtractedDocumentData {
  text: string
  ingredients?: string[]
  nutritionalInfo?: Record<string, any>
  certifications?: string[]
  supplierInfo?: Record<string, any>
  manufacturingDetails?: Record<string, any>
  confidence: number
  processingMethod: string
}

// Workflow Types
export interface WorkflowStage {
  id: string
  name: string
  description: string
  requirements: string[]
  estimatedDuration: number // hours
  requiredRoles: string[]
  automatable: boolean
}

export interface WorkflowProgress {
  applicationId: string
  currentStage: string
  stages: WorkflowStage[]
  completedStages: string[]
  estimatedCompletion?: Date
  actualDuration?: number
}

// Domain Events
export abstract class DomainEvent {
  public readonly id: string
  public readonly timestamp: Date
  public readonly aggregateId: string

  constructor(aggregateId: string) {
    this.id = this.generateEventId()
    this.timestamp = new Date()
    this.aggregateId = aggregateId
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export class ApplicationCreated extends DomainEvent {
  constructor(
    public readonly application: Application,
    public readonly clientId: string
  ) {
    super(application.id)
  }
}

export class AnalysisCompleted extends DomainEvent {
  constructor(
    public readonly applicationId: string,
    public readonly analysis: IngredientAnalysis
  ) {
    super(applicationId)
  }
}

export class CertificateIssued extends DomainEvent {
  constructor(
    public readonly certificate: Certificate,
    public readonly applicationId: string
  ) {
    super(certificate.id)
  }
}

export class ApplicationStatusChanged extends DomainEvent {
  constructor(
    public readonly applicationId: string,
    public readonly oldStatus: ApplicationStatus,
    public readonly newStatus: ApplicationStatus,
    public readonly reason?: string
  ) {
    super(applicationId)
  }
}

export class DocumentProcessed extends DomainEvent {
  constructor(
    public readonly document: Document,
    public readonly extractedData: ExtractedDocumentData
  ) {
    super(document.id)
  }
}

// Repository Interfaces (for dependency inversion)
export interface ClientRepository {
  save(client: Client): Promise<void>
  findById(id: string): Promise<Client | null>
  findByEmail(email: string): Promise<Client | null>
  findByOrganization(organizationType: OrganizationType): Promise<Client[]>
}

export interface ApplicationRepository {
  save(application: Application): Promise<void>
  findById(id: string): Promise<Application | null>
  findByClientId(clientId: string): Promise<Application[]>
  findByStatus(status: ApplicationStatus): Promise<Application[]>
  findByOrganizationType(type: OrganizationType): Promise<Application[]>
}

export interface CertificateRepository {
  save(certificate: Certificate): Promise<void>
  findById(id: string): Promise<Certificate | null>
  findByApplicationId(applicationId: string): Promise<Certificate | null>
  findByClientId(clientId: string): Promise<Certificate[]>
  findActiveByClientId(clientId: string): Promise<Certificate[]>
  findExpiringCertificates(days: number): Promise<Certificate[]>
}

export interface AnalysisRepository {
  save(analysis: IngredientAnalysis): Promise<void>
  findById(id: string): Promise<IngredientAnalysis | null>
  findByProductName(productName: string): Promise<IngredientAnalysis[]>
  findByIngredient(ingredient: string): Promise<IngredientAnalysis[]>
}

export interface DocumentRepository {
  save(document: Document): Promise<void>
  findById(id: string): Promise<Document | null>
  findByApplicationId(applicationId: string): Promise<Document[]>
  findByPurpose(purpose: DocumentPurpose): Promise<Document[]>
}

// Domain Services
export interface CertificationWorkflowService {
  initializeWorkflow(application: Application): Promise<WorkflowProgress>
  advanceWorkflow(applicationId: string): Promise<WorkflowProgress>
  getWorkflowProgress(applicationId: string): Promise<WorkflowProgress | null>
  canAdvanceWorkflow(applicationId: string): Promise<boolean>
}

export interface PricingService {
  calculateApplicationFee(application: Application): Promise<Money>
  calculateCertificationFee(application: Application): Promise<Money>
  calculateUrgentProcessingFee(application: Application): Promise<Money>
}

export interface NotificationService {
  sendApplicationConfirmation(client: Client, application: Application): Promise<void>
  sendStatusUpdate(client: Client, application: Application): Promise<void>
  sendCertificateReady(client: Client, certificate: Certificate): Promise<void>
  sendExpiryReminder(client: Client, certificate: Certificate): Promise<void>
}

export interface AnalysisService {
  analyzeIngredients(productInfo: ProductInfo, organizationType: OrganizationType): Promise<IngredientAnalysis>
  enhanceWithIslamicContext(analysis: IngredientAnalysis): Promise<IngredientAnalysis>
  validateAnalysisResults(analysis: IngredientAnalysis): Promise<boolean>
}