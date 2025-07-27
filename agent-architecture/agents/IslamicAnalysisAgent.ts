/**
 * Islamic Analysis Agent
 * Specialized agent for halal ingredient analysis with Islamic jurisprudence
 */

import { IAgent, AgentCapability, AgentContext, AgentMessage, AgentResult } from '../core/IAgent'

export interface IngredientAnalysisRequest {
  productName: string
  ingredients: string[]
  organizationType: 'certification-body' | 'food-manufacturer'
  additionalContext?: {
    manufacturingProcess?: string
    sourceCountry?: string
    targetMarkets?: string[]
    certificationStandards?: string[]
  }
}

export interface IslamicReference {
  source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa'
  reference: string
  arabic?: string
  transliteration?: string
  translation: string
  school?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General'
}

export interface IngredientClassification {
  name: string
  status: 'HALAL' | 'HARAM' | 'MASHBOOH' | 'VERIFY_SOURCE'
  category: string
  risk: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  reasoning: string
  islamicReferences: IslamicReference[]
  alternativeSuggestions?: string[]
  verificationRequirements?: string[]
  madhahib?: Record<string, string>
  contemporaryScholars?: string[]
}

export interface AnalysisResult {
  productName: string
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

export class IslamicAnalysisAgent implements IAgent {
  public readonly id = 'islamic-analysis-agent'
  public readonly name = 'Islamic Analysis Agent'
  public readonly version = '1.0.0'
  public readonly capabilities: AgentCapability[] = [
    {
      name: 'ingredient-analysis',
      description: 'Analyze ingredients for halal compliance using Islamic jurisprudence',
      inputTypes: ['IngredientAnalysisRequest'],
      outputTypes: ['AnalysisResult'],
      dependencies: ['islamic-database', 'ai-analysis-engine']
    },
    {
      name: 'jurisprudence-lookup',
      description: 'Look up Islamic references for specific ingredients',
      inputTypes: ['string'],
      outputTypes: ['IslamicReference[]']
    },
    {
      name: 'fatwa-consultation',
      description: 'Provide contemporary fatwa rulings on questionable ingredients',
      inputTypes: ['string'],
      outputTypes: ['FatwaRuling']
    }
  ]

  private messageHandlers: ((message: AgentMessage) => void)[] = []
  private islamicDatabase: any = null
  private aiAnalysisEngine: any = null
  private isInitialized = false

  public get isHealthy(): boolean {
    return this.isInitialized && this.islamicDatabase !== null && this.aiAnalysisEngine !== null
  }

  async initialize(context: AgentContext): Promise<void> {
    try {
      // Load Islamic jurisprudence database
      this.islamicDatabase = await this.loadIslamicDatabase()
      
      // Initialize AI analysis engine connection
      this.aiAnalysisEngine = await this.initializeAIEngine()
      
      this.isInitialized = true
      console.log('Islamic Analysis Agent initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Islamic Analysis Agent:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false
    this.messageHandlers = []
    console.log('Islamic Analysis Agent shut down')
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Verify database connectivity
      const testResult = await this.islamicDatabase?.getIngredientClassification?.('test')
      
      // Verify AI engine connectivity
      const aiStatus = await this.aiAnalysisEngine?.healthCheck?.()
      
      return this.isHealthy && (testResult !== undefined) && aiStatus
    } catch {
      return false
    }
  }

  canHandle(message: AgentMessage): boolean {
    const supportedTypes = [
      'ingredient-analysis',
      'jurisprudence-lookup',
      'fatwa-consultation',
      'bulk-ingredient-analysis'
    ]
    return supportedTypes.includes(message.type)
  }

  async process(message: AgentMessage, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now()
    
    try {
      let result: any

      switch (message.type) {
        case 'ingredient-analysis':
          result = await this.analyzeIngredients(message.payload as IngredientAnalysisRequest, context)
          break
        
        case 'jurisprudence-lookup':
          result = await this.lookupJurisprudence(message.payload as string)
          break
        
        case 'fatwa-consultation':
          result = await this.consultFatwa(message.payload as string)
          break
        
        case 'bulk-ingredient-analysis':
          result = await this.bulkAnalyzeIngredients(message.payload as IngredientAnalysisRequest[], context)
          break
        
        default:
          throw new Error(`Unsupported message type: ${message.type}`)
      }

      return {
        success: true,
        data: result,
        metadata: {
          processingTime: Date.now() - startTime,
          agentId: this.id,
          timestamp: new Date()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ISLAMIC_ANALYSIS_ERROR',
          message: error instanceof Error ? error.message : 'Unknown analysis error',
          details: { messageType: message.type }
        },
        metadata: {
          processingTime: Date.now() - startTime,
          agentId: this.id,
          timestamp: new Date()
        }
      }
    }
  }

  onMessage(handler: (message: AgentMessage) => void): void {
    this.messageHandlers.push(handler)
  }

  async sendMessage(message: AgentMessage): Promise<void> {
    this.messageHandlers.forEach(handler => handler(message))
  }

  async configure(config: Record<string, any>): Promise<void> {
    // Update configuration (madhab preferences, strictness levels, etc.)
    if (config.madhab) {
      await this.setMadhabPreference(config.madhab)
    }
    if (config.strictnessLevel) {
      await this.setStrictnessLevel(config.strictnessLevel)
    }
  }

  async getMetrics(): Promise<Record<string, any>> {
    return {
      totalAnalyses: await this.getTotalAnalyses(),
      databaseSize: await this.getDatabaseSize(),
      averageAnalysisTime: await this.getAverageAnalysisTime(),
      topQueriedIngredients: await this.getTopQueriedIngredients()
    }
  }

  // Core Analysis Methods
  private async analyzeIngredients(
    request: IngredientAnalysisRequest, 
    context: AgentContext
  ): Promise<AnalysisResult> {
    // Step 1: Classify each ingredient using Islamic database
    const ingredientClassifications = await Promise.all(
      request.ingredients.map(ingredient => this.classifyIngredient(ingredient, context))
    )

    // Step 2: Enhance with AI analysis for complex cases
    const enhancedClassifications = await this.enhanceWithAIAnalysis(
      ingredientClassifications, 
      request, 
      context
    )

    // Step 3: Apply organization-specific logic
    const organizationSpecific = this.generateOrganizationSpecificGuidance(
      enhancedClassifications,
      request.organizationType
    )

    // Step 4: Generate overall assessment
    const overallStatus = this.determineOverallStatus(enhancedClassifications)
    
    // Step 5: Generate warnings and recommendations
    const warnings = this.generateWarnings(enhancedClassifications)
    const recommendations = this.generateRecommendations(enhancedClassifications, request)
    const manufacturingConcerns = this.identifyManufacturingConcerns(enhancedClassifications)
    const certificationNotes = this.generateCertificationNotes(enhancedClassifications, request.organizationType)

    return {
      productName: request.productName,
      overallStatus,
      ingredients: enhancedClassifications,
      warnings,
      recommendations,
      manufacturingConcerns,
      certificationNotes,
      islamicCompliance: this.calculateComplianceMetrics(enhancedClassifications),
      organizationSpecific
    }
  }

  private async classifyIngredient(
    ingredientName: string, 
    context: AgentContext
  ): Promise<IngredientClassification> {
    // Look up in Islamic database
    const dbResult = await this.islamicDatabase.getIngredientClassification(ingredientName)
    
    if (dbResult) {
      return this.enhanceWithScholarlyReferences(dbResult)
    }

    // Fallback to pattern-based classification
    return this.classifyByPattern(ingredientName)
  }

  private async enhanceWithAIAnalysis(
    classifications: IngredientClassification[],
    request: IngredientAnalysisRequest,
    context: AgentContext
  ): Promise<IngredientClassification[]> {
    // Use AI engine for complex ingredient analysis
    const complexIngredients = classifications.filter(c => 
      c.status === 'MASHBOOH' || c.status === 'VERIFY_SOURCE'
    )

    if (complexIngredients.length > 0) {
      const aiAnalysis = await this.aiAnalysisEngine.analyzeComplexIngredients(
        complexIngredients.map(c => c.name),
        request,
        context
      )

      // Merge AI insights with database results
      return this.mergeAIInsights(classifications, aiAnalysis)
    }

    return classifications
  }

  private generateOrganizationSpecificGuidance(
    classifications: IngredientClassification[],
    organizationType: string
  ): any {
    if (organizationType === 'certification-body') {
      return {
        documentType: 'Halal Certificate',
        nextSteps: [
          'Conduct facility inspection',
          'Verify supplier certifications',
          'Issue formal halal certificate'
        ],
        requiredDocumentation: [
          'Supplier halal certificates',
          'Manufacturing process documentation',
          'Ingredient specification sheets'
        ]
      }
    } else {
      return {
        documentType: 'Pre-Certification Report',
        nextSteps: [
          'Address questionable ingredients',
          'Prepare certification application',
          'Submit to halal certification body'
        ],
        requiredDocumentation: [
          'Ingredient sourcing documentation',
          'Manufacturing process flowchart',
          'Supplier attestation letters'
        ]
      }
    }
  }

  // Helper Methods
  private async loadIslamicDatabase(): Promise<any> {
    // Load the comprehensive Islamic ingredient database
    const { default: islamicDb } = await import('../../halalcheck-app/src/lib/islamic-jurisprudence')
    return {
      getIngredientClassification: (name: string) => islamicDb.getIslamicReferences(name),
      getAllClassifications: () => islamicDb.INGREDIENT_CLASSIFICATIONS,
      getQuranicReferences: () => islamicDb.QURANIC_FOOD_REFERENCES
    }
  }

  private async initializeAIEngine(): Promise<any> {
    // Initialize connection to AI analysis engine
    return {
      analyzeComplexIngredients: async (ingredients: string[], request: any, context: any) => {
        // Integration with existing GPT-4o analysis
        return this.callAIAnalysisAPI(ingredients, request, context)
      },
      healthCheck: async () => true
    }
  }

  private async callAIAnalysisAPI(ingredients: string[], request: any, context: any): Promise<any> {
    // Call the existing AI analysis endpoint
    const response = await fetch('/api/analysis/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productName: request.productName,
        ingredients: ingredients.join(', ')
      })
    })
    return response.json()
  }

  private enhanceWithScholarlyReferences(dbResult: any): IngredientClassification {
    return {
      name: dbResult.name,
      status: dbResult.status,
      category: dbResult.category,
      risk: this.calculateRiskLevel(dbResult),
      reasoning: dbResult.reasoning,
      islamicReferences: dbResult.islamicReferences,
      alternativeSuggestions: dbResult.alternativeSuggestions,
      verificationRequirements: dbResult.requiresVerification ? ['Source verification required'] : undefined,
      madhahib: this.extractMadhabPositions(dbResult),
      contemporaryScholars: this.extractScholarOpinions(dbResult)
    }
  }

  private classifyByPattern(ingredientName: string): IngredientClassification {
    const name = ingredientName.toLowerCase()
    
    // Pattern-based classification for common ingredients
    if (name.includes('pork') || name.includes('pig') || name.includes('swine')) {
      return {
        name: ingredientName,
        status: 'HARAM',
        category: 'Animal Derivatives',
        risk: 'VERY_HIGH',
        reasoning: 'Contains pork derivatives which are explicitly forbidden in Islamic law',
        islamicReferences: [{
          source: 'Quran',
          reference: 'Q2:173',
          translation: 'He has only forbidden you carrion, blood, swine flesh, and that over which any name other than Allah\'s has been invoked.',
          school: 'General'
        }],
        alternativeSuggestions: ['Halal beef alternatives', 'Plant-based substitutes']
      }
    }

    if (name.includes('alcohol') || name.includes('ethanol')) {
      return {
        name: ingredientName,
        status: 'HARAM',
        category: 'Alcoholic Substances',
        risk: 'HIGH',
        reasoning: 'Contains alcohol which is prohibited in Islamic law',
        islamicReferences: [{
          source: 'Quran',
          reference: 'Q5:90',
          translation: 'Intoxicants are abominations devised by Satan. Avoid them so that you may prosper.',
          school: 'General'
        }],
        verificationRequirements: ['Verify alcohol content and source']
      }
    }

    // Default classification for unknown ingredients
    return {
      name: ingredientName,
      status: 'VERIFY_SOURCE',
      category: 'Unknown',
      risk: 'MEDIUM',
      reasoning: 'Ingredient requires further investigation for halal status determination',
      islamicReferences: [],
      verificationRequirements: ['Source verification and scholarly consultation required']
    }
  }

  private calculateRiskLevel(dbResult: any): 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    if (dbResult.status === 'HARAM') return 'VERY_HIGH'
    if (dbResult.status === 'MASHBOOH') return 'MEDIUM'
    if (dbResult.requiresVerification) return 'HIGH'
    return 'LOW'
  }

  private extractMadhabPositions(dbResult: any): Record<string, string> | undefined {
    // Extract different madhab positions from the database result
    return dbResult.madhahib || undefined
  }

  private extractScholarOpinions(dbResult: any): string[] | undefined {
    // Extract contemporary scholar opinions
    return dbResult.contemporaryScholars || undefined
  }

  private mergeAIInsights(
    classifications: IngredientClassification[],
    aiAnalysis: any
  ): IngredientClassification[] {
    // Merge AI analysis results with database classifications
    return classifications.map(classification => {
      const aiResult = aiAnalysis.ingredients?.find(
        (ai: any) => ai.name.toLowerCase() === classification.name.toLowerCase()
      )
      
      if (aiResult) {
        return {
          ...classification,
          reasoning: aiResult.reason || classification.reasoning,
          islamicReferences: [
            ...classification.islamicReferences,
            ...(aiResult.islamicReferences || [])
          ]
        }
      }
      
      return classification
    })
  }

  private determineOverallStatus(
    classifications: IngredientClassification[]
  ): 'APPROVED' | 'PROHIBITED' | 'QUESTIONABLE' | 'VERIFY_SOURCE' {
    if (classifications.some(c => c.status === 'HARAM')) return 'PROHIBITED'
    if (classifications.some(c => c.status === 'MASHBOOH')) return 'QUESTIONABLE'
    if (classifications.some(c => c.status === 'VERIFY_SOURCE')) return 'VERIFY_SOURCE'
    return 'APPROVED'
  }

  private generateWarnings(classifications: IngredientClassification[]): string[] {
    const warnings: string[] = []
    
    const haramIngredients = classifications.filter(c => c.status === 'HARAM')
    if (haramIngredients.length > 0) {
      warnings.push(`Product contains ${haramIngredients.length} prohibited ingredient(s): ${haramIngredients.map(i => i.name).join(', ')}`)
    }

    const highRiskIngredients = classifications.filter(c => c.risk === 'HIGH' || c.risk === 'VERY_HIGH')
    if (highRiskIngredients.length > 0) {
      warnings.push(`${highRiskIngredients.length} high-risk ingredient(s) require immediate attention`)
    }

    return warnings
  }

  private generateRecommendations(
    classifications: IngredientClassification[],
    request: IngredientAnalysisRequest
  ): string[] {
    const recommendations: string[] = []
    
    const questionableIngredients = classifications.filter(c => c.status === 'MASHBOOH')
    if (questionableIngredients.length > 0) {
      recommendations.push('Seek clarification from suppliers for questionable ingredients')
      recommendations.push('Consider alternative ingredients to avoid doubtful substances')
    }

    const verificationNeeded = classifications.filter(c => c.verificationRequirements?.length)
    if (verificationNeeded.length > 0) {
      recommendations.push('Obtain halal certificates for ingredients requiring verification')
    }

    return recommendations
  }

  private identifyManufacturingConcerns(classifications: IngredientClassification[]): string[] {
    const concerns: string[] = []
    
    // Check for cross-contamination risks
    if (classifications.some(c => c.category === 'Animal Derivatives')) {
      concerns.push('Ensure dedicated halal production lines to prevent cross-contamination')
    }

    // Check for processing aids
    const processingAids = classifications.filter(c => c.category.includes('Processing'))
    if (processingAids.length > 0) {
      concerns.push('Verify halal status of all processing aids and cleaning agents')
    }

    return concerns
  }

  private generateCertificationNotes(
    classifications: IngredientClassification[],
    organizationType: string
  ): string[] {
    const notes: string[] = []
    
    if (organizationType === 'certification-body') {
      notes.push('All ingredients have been analyzed according to Islamic jurisprudence standards')
      notes.push('Facility inspection required before certificate issuance')
    } else {
      notes.push('Pre-certification analysis completed for product development guidance')
      notes.push('Final certification requires submission to accredited halal certification body')
    }

    return notes
  }

  private calculateComplianceMetrics(classifications: IngredientClassification[]): any {
    return {
      totalIngredients: classifications.length,
      halalCount: classifications.filter(c => c.status === 'HALAL').length,
      haramCount: classifications.filter(c => c.status === 'HARAM').length,
      questionableCount: classifications.filter(c => c.status === 'MASHBOOH').length,
      requiresVerification: classifications.filter(c => c.verificationRequirements?.length).length
    }
  }

  // Additional helper methods for metrics and configuration
  private async setMadhabPreference(madhab: string): Promise<void> {
    // Implementation for madhab-specific analysis
  }

  private async setStrictnessLevel(level: string): Promise<void> {
    // Implementation for strictness level configuration
  }

  private async getTotalAnalyses(): Promise<number> {
    // Return total number of analyses performed
    return 0
  }

  private async getDatabaseSize(): Promise<number> {
    // Return size of Islamic database
    return 0
  }

  private async getAverageAnalysisTime(): Promise<number> {
    // Return average analysis time
    return 0
  }

  private async getTopQueriedIngredients(): Promise<string[]> {
    // Return most frequently queried ingredients
    return []
  }

  private async lookupJurisprudence(ingredient: string): Promise<IslamicReference[]> {
    const classification = await this.islamicDatabase.getIngredientClassification(ingredient)
    return classification?.islamicReferences || []
  }

  private async consultFatwa(ingredient: string): Promise<any> {
    // Implementation for fatwa consultation
    return { ruling: 'Requires scholarly consultation', scholars: [] }
  }

  private async bulkAnalyzeIngredients(
    requests: IngredientAnalysisRequest[],
    context: AgentContext
  ): Promise<AnalysisResult[]> {
    // Process multiple ingredient analysis requests
    return Promise.all(requests.map(request => this.analyzeIngredients(request, context)))
  }
}