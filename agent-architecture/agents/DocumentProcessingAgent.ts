/**
 * Document Processing Agent
 * Handles OCR, PDF processing, Excel parsing, and document analysis
 */

import { IAgent, AgentCapability, AgentContext, AgentMessage, AgentResult } from '../core/IAgent'

export interface DocumentProcessingRequest {
  documentId: string
  filePath: string
  fileName: string
  mimeType: string
  purpose: 'ingredient-extraction' | 'certificate-verification' | 'supplier-documentation' | 'general-analysis'
  extractionConfig?: {
    targetLanguages?: string[]
    extractionPatterns?: string[]
    confidenceThreshold?: number
  }
}

export interface ProcessedDocument {
  documentId: string
  fileName: string
  processingTimestamp: Date
  extractedText: string
  extractedData: {
    ingredients?: string[]
    nutritionalInfo?: Record<string, any>
    certifications?: string[]
    supplierInfo?: Record<string, any>
    manufacturingDetails?: Record<string, any>
  }
  confidence: number
  processingMethod: 'ocr' | 'text-extraction' | 'structured-parsing'
  metadata: {
    pageCount?: number
    language?: string
    quality: 'high' | 'medium' | 'low'
    issues?: string[]
  }
}

export interface BulkProcessingRequest {
  documents: DocumentProcessingRequest[]
  processingMode: 'parallel' | 'sequential'
  outputFormat: 'individual' | 'consolidated'
}

export class DocumentProcessingAgent implements IAgent {
  public readonly id = 'document-processing-agent'
  public readonly name = 'Document Processing Agent'
  public readonly version = '1.0.0'
  public readonly capabilities: AgentCapability[] = [
    {
      name: 'document-ocr',
      description: 'Extract text from images and scanned documents using OCR',
      inputTypes: ['DocumentProcessingRequest'],
      outputTypes: ['ProcessedDocument'],
      dependencies: ['tesseract', 'image-processing']
    },
    {
      name: 'pdf-processing',
      description: 'Extract text and data from PDF documents',
      inputTypes: ['DocumentProcessingRequest'],
      outputTypes: ['ProcessedDocument'],
      dependencies: ['pdf-parser', 'image-conversion']
    },
    {
      name: 'excel-processing',
      description: 'Parse Excel and CSV files for ingredient lists',
      inputTypes: ['DocumentProcessingRequest'],
      outputTypes: ['ProcessedDocument'],
      dependencies: ['xlsx-parser']
    },
    {
      name: 'bulk-processing',
      description: 'Process multiple documents simultaneously',
      inputTypes: ['BulkProcessingRequest'],
      outputTypes: ['ProcessedDocument[]'],
      dependencies: ['parallel-processing', 'queue-management']
    },
    {
      name: 'smart-extraction',
      description: 'Intelligent data extraction with pattern recognition',
      inputTypes: ['DocumentProcessingRequest'],
      outputTypes: ['ProcessedDocument'],
      dependencies: ['ai-pattern-recognition', 'nlp-processing']
    }
  ]

  private messageHandlers: ((message: AgentMessage) => void)[] = []
  private ocrEngine: any = null
  private pdfProcessor: any = null
  private excelProcessor: any = null
  private aiExtractor: any = null
  private isInitialized = false

  // Language support for OCR
  private readonly supportedLanguages = [
    'eng', 'ara', 'urd', 'mal', 'fra', 'deu', 'spa', 'ita', 'nld', 'pol', 'tur'
  ]

  // Extraction patterns for different document types
  private readonly extractionPatterns = {
    ingredients: [
      /ingredients?[:\s]+(.*?)(?=\n|nutritional|allergen|contains|may contain|$)/i,
      /composition[:\s]+(.*?)(?=\n|nutritional|allergen|contains|may contain|$)/i,
      /contents?[:\s]+(.*?)(?=\n|nutritional|allergen|contains|may contain|$)/i,
      /مكونات[:\s]+(.*?)(?=\n|معلومات غذائية|$)/i, // Arabic
      /składniki[:\s]+(.*?)(?=\n|wartości odżywcze|$)/i, // Polish
      /ingrédients[:\s]+(.*?)(?=\n|valeurs nutritionnelles|$)/i, // French
      /ingredienti[:\s]+(.*?)(?=\n|valori nutrizionali|$)/i, // Italian
      /zutaten[:\s]+(.*?)(?=\n|nährwerte|$)/i // German
    ],
    nutritional: [
      /nutrition.*?facts?[:\s]+(.*?)(?=\n\n|ingredients|$)/i,
      /nutritional.*?information[:\s]+(.*?)(?=\n\n|ingredients|$)/i
    ],
    certifications: [
      /halal.*?certificate?[:\s]+(.*?)(?=\n|$)/i,
      /certified.*?by[:\s]+(.*?)(?=\n|$)/i,
      /certification.*?number[:\s]+(.*?)(?=\n|$)/i
    ]
  }

  public get isHealthy(): boolean {
    return this.isInitialized && 
           this.ocrEngine !== null && 
           this.pdfProcessor !== null && 
           this.excelProcessor !== null
  }

  async initialize(context: AgentContext): Promise<void> {
    try {
      // Initialize OCR engine
      this.ocrEngine = await this.initializeOCREngine()
      
      // Initialize PDF processor
      this.pdfProcessor = await this.initializePDFProcessor()
      
      // Initialize Excel processor
      this.excelProcessor = await this.initializeExcelProcessor()
      
      // Initialize AI extractor
      this.aiExtractor = await this.initializeAIExtractor()
      
      this.isInitialized = true
      console.log('Document Processing Agent initialized successfully')
    } catch (error) {
      console.error('Failed to initialize Document Processing Agent:', error)
      throw error
    }
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false
    this.messageHandlers = []
    
    // Cleanup resources
    await this.ocrEngine?.cleanup?.()
    await this.pdfProcessor?.cleanup?.()
    
    console.log('Document Processing Agent shut down')
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test OCR engine
      const ocrStatus = await this.ocrEngine?.healthCheck?.()
      
      // Test PDF processor
      const pdfStatus = await this.pdfProcessor?.healthCheck?.()
      
      // Test Excel processor
      const excelStatus = await this.excelProcessor?.healthCheck?.()
      
      return this.isHealthy && ocrStatus && pdfStatus && excelStatus
    } catch {
      return false
    }
  }

  canHandle(message: AgentMessage): boolean {
    const supportedTypes = [
      'process-document',
      'extract-ingredients',
      'verify-certificate',
      'bulk-process-documents',
      'smart-extract-data'
    ]
    return supportedTypes.includes(message.type)
  }

  async process(message: AgentMessage, context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now()
    
    try {
      let result: any

      switch (message.type) {
        case 'process-document':
          result = await this.processDocument(message.payload as DocumentProcessingRequest, context)
          break
        
        case 'extract-ingredients':
          result = await this.extractIngredients(message.payload as DocumentProcessingRequest, context)
          break
        
        case 'verify-certificate':
          result = await this.verifyCertificate(message.payload as DocumentProcessingRequest, context)
          break
        
        case 'bulk-process-documents':
          result = await this.bulkProcessDocuments(message.payload as BulkProcessingRequest, context)
          break
        
        case 'smart-extract-data':
          result = await this.smartExtractData(message.payload as DocumentProcessingRequest, context)
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
          code: 'DOCUMENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown document processing error',
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
    if (config.ocrLanguages) {
      await this.updateOCRLanguages(config.ocrLanguages)
    }
    if (config.extractionPatterns) {
      await this.updateExtractionPatterns(config.extractionPatterns)
    }
    if (config.qualityThreshold) {
      await this.setQualityThreshold(config.qualityThreshold)
    }
  }

  async getMetrics(): Promise<Record<string, any>> {
    return {
      documentsProcessed: await this.getTotalDocumentsProcessed(),
      averageProcessingTime: await this.getAverageProcessingTime(),
      accuracyRates: await this.getAccuracyRates(),
      languageDistribution: await this.getLanguageDistribution()
    }
  }

  // Core Processing Methods
  private async processDocument(
    request: DocumentProcessingRequest, 
    context: AgentContext
  ): Promise<ProcessedDocument> {
    const { mimeType, filePath, fileName } = request
    
    let extractedText = ''
    let processingMethod: 'ocr' | 'text-extraction' | 'structured-parsing' = 'text-extraction'
    let metadata: any = {}

    try {
      if (mimeType.startsWith('image/')) {
        // Process image with OCR
        const ocrResult = await this.processImageWithOCR(filePath, request.extractionConfig)
        extractedText = ocrResult.text
        processingMethod = 'ocr'
        metadata = { ...ocrResult.metadata, quality: ocrResult.confidence > 0.8 ? 'high' : 'medium' }
      } 
      else if (mimeType === 'application/pdf') {
        // Process PDF
        const pdfResult = await this.processPDF(filePath)
        extractedText = pdfResult.text
        processingMethod = pdfResult.method
        metadata = pdfResult.metadata
      }
      else if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType === 'text/csv') {
        // Process Excel/CSV
        const excelResult = await this.processExcel(filePath)
        extractedText = excelResult.text
        processingMethod = 'structured-parsing'
        metadata = excelResult.metadata
      }
      else if (mimeType.startsWith('text/')) {
        // Process plain text
        const fs = await import('fs')
        extractedText = fs.readFileSync(filePath, 'utf8')
        processingMethod = 'text-extraction'
        metadata = { quality: 'high' }
      }
      else {
        throw new Error(`Unsupported file type: ${mimeType}`)
      }

      // Extract structured data
      const extractedData = await this.extractStructuredData(extractedText, request.purpose)
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(extractedText, extractedData, processingMethod)

      const processedDocument: ProcessedDocument = {
        documentId: request.documentId,
        fileName,
        processingTimestamp: new Date(),
        extractedText,
        extractedData,
        confidence,
        processingMethod,
        metadata: {
          ...metadata,
          language: await this.detectLanguage(extractedText),
          issues: this.identifyIssues(extractedText, confidence)
        }
      }

      return processedDocument
    } catch (error) {
      throw new Error(`Document processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async processImageWithOCR(
    filePath: string, 
    config?: any
  ): Promise<{ text: string; confidence: number; metadata: any }> {
    try {
      // Preprocess image for better OCR accuracy
      const preprocessedPath = await this.preprocessImage(filePath)
      
      // Configure OCR languages
      const languages = config?.targetLanguages?.join('+') || this.supportedLanguages.join('+')
      
      // Run OCR
      const result = await this.ocrEngine.recognize(preprocessedPath, languages, {
        tessedit_pageseg_mode: 'SINGLE_BLOCK',
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789()[]{}،,.:;-+/\\%&*|!@#$^_=~`"\' \n\tأبتثجحخدذرزسشصضطظعغفقكلمنهويىءآإؤئ',
        preserve_interword_spaces: '1'
      })

      // Clean up preprocessed image
      await this.cleanupFile(preprocessedPath)

      return {
        text: result.data.text,
        confidence: result.data.confidence / 100, // Convert to 0-1 scale
        metadata: {
          meanConfidence: result.data.confidence,
          symbols: result.data.symbols?.length || 0,
          words: result.data.words?.length || 0
        }
      }
    } catch (error) {
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async processPDF(filePath: string): Promise<{ text: string; method: any; metadata: any }> {
    try {
      // Try text extraction first (for text-based PDFs)
      const textResult = await this.pdfProcessor.extractText(filePath)
      
      if (textResult.text && textResult.text.length > 100) {
        return {
          text: textResult.text,
          method: 'text-extraction' as any,
          metadata: {
            pageCount: textResult.pageCount,
            quality: 'high'
          }
        }
      }

      // Fallback to OCR for image-based PDFs
      const ocrResult = await this.pdfProcessor.convertToImagesAndOCR(filePath)
      
      return {
        text: ocrResult.text,
        method: 'ocr' as any,
        metadata: {
          pageCount: ocrResult.pageCount,
          quality: ocrResult.confidence > 0.7 ? 'medium' : 'low'
        }
      }
    } catch (error) {
      throw new Error(`PDF processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async processExcel(filePath: string): Promise<{ text: string; metadata: any }> {
    try {
      const workbook = await this.excelProcessor.readFile(filePath)
      let extractedText = ''
      let sheetCount = 0
      
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName]
        const csvData = this.excelProcessor.utils.sheet_to_csv(worksheet)
        extractedText += `Sheet: ${sheetName}\n${csvData}\n\n`
        sheetCount++
      }
      
      return {
        text: extractedText,
        metadata: {
          sheetCount,
          quality: 'high'
        }
      }
    } catch (error) {
      throw new Error(`Excel processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async extractStructuredData(text: string, purpose: string): Promise<any> {
    const extractedData: any = {}
    
    switch (purpose) {
      case 'ingredient-extraction':
        extractedData.ingredients = this.extractIngredientsList(text)
        extractedData.nutritionalInfo = this.extractNutritionalInfo(text)
        break
      
      case 'certificate-verification':
        extractedData.certifications = this.extractCertifications(text)
        extractedData.issuingAuthority = this.extractIssuingAuthority(text)
        extractedData.validityPeriod = this.extractValidityPeriod(text)
        break
      
      case 'supplier-documentation':
        extractedData.supplierInfo = this.extractSupplierInfo(text)
        extractedData.manufacturingDetails = this.extractManufacturingDetails(text)
        break
      
      case 'general-analysis':
        extractedData.ingredients = this.extractIngredientsList(text)
        extractedData.certifications = this.extractCertifications(text)
        extractedData.supplierInfo = this.extractSupplierInfo(text)
        break
    }
    
    return extractedData
  }

  private extractIngredientsList(text: string): string[] {
    for (const pattern of this.extractionPatterns.ingredients) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return this.parseIngredients(match[1])
      }
    }
    
    // Fallback: look for comma-separated lists
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.includes(',') && line.length > 20 && line.length < 500) {
        const commaCount = (line.match(/,/g) || []).length
        if (commaCount >= 3) {
          return this.parseIngredients(line)
        }
      }
    }
    
    return []
  }

  private parseIngredients(rawText: string): string[] {
    return rawText
      .split(',')
      .map(ingredient => ingredient.trim())
      .filter(ingredient => ingredient.length > 0 && ingredient.length < 100)
      .slice(0, 50) // Limit to reasonable number
  }

  private extractNutritionalInfo(text: string): Record<string, any> {
    const nutritionalInfo: Record<string, any> = {}
    
    // Extract common nutritional values
    const patterns = {
      calories: /calories?[:\s]+(\d+)/i,
      protein: /protein[:\s]+(\d+(?:\.\d+)?)\s*g/i,
      fat: /(?:total\s+)?fat[:\s]+(\d+(?:\.\d+)?)\s*g/i,
      carbs: /carbohydrate[s]?[:\s]+(\d+(?:\.\d+)?)\s*g/i,
      sodium: /sodium[:\s]+(\d+(?:\.\d+)?)\s*mg/i
    }
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match) {
        nutritionalInfo[key] = parseFloat(match[1])
      }
    }
    
    return nutritionalInfo
  }

  private extractCertifications(text: string): string[] {
    const certifications: string[] = []
    
    for (const pattern of this.extractionPatterns.certifications) {
      const match = text.match(pattern)
      if (match && match[1]) {
        certifications.push(match[1].trim())
      }
    }
    
    return certifications
  }

  private extractIssuingAuthority(text: string): string | undefined {
    const patterns = [
      /issued\s+by[:\s]+([^\n]+)/i,
      /certifying\s+body[:\s]+([^\n]+)/i,
      /authority[:\s]+([^\n]+)/i
    ]
    
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match[1]) {
        return match[1].trim()
      }
    }
    
    return undefined
  }

  private extractValidityPeriod(text: string): { from?: string; to?: string } | undefined {
    const validityPattern = /valid\s+from[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\s+to[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i
    const match = text.match(validityPattern)
    
    if (match) {
      return {
        from: match[1],
        to: match[2]
      }
    }
    
    return undefined
  }

  private extractSupplierInfo(text: string): Record<string, any> {
    const supplierInfo: Record<string, any> = {}
    
    const patterns = {
      name: /supplier[:\s]+([^\n]+)/i,
      address: /address[:\s]+([^\n]+)/i,
      contact: /contact[:\s]+([^\n]+)/i,
      email: /email[:\s]+([^\s@]+@[^\s@]+\.[^\s@]+)/i,
      phone: /phone[:\s]+([\+]?[\d\s\-\(\)]+)/i
    }
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match && match[1]) {
        supplierInfo[key] = match[1].trim()
      }
    }
    
    return supplierInfo
  }

  private extractManufacturingDetails(text: string): Record<string, any> {
    const manufacturingDetails: Record<string, any> = {}
    
    const patterns = {
      facility: /manufactured\s+(?:at|by)[:\s]+([^\n]+)/i,
      process: /process[:\s]+([^\n]+)/i,
      standards: /standards?[:\s]+([^\n]+)/i
    }
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = text.match(pattern)
      if (match && match[1]) {
        manufacturingDetails[key] = match[1].trim()
      }
    }
    
    return manufacturingDetails
  }

  // Helper Methods
  private async preprocessImage(filePath: string): Promise<string> {
    // Implement image preprocessing for better OCR accuracy
    const sharp = await import('sharp')
    const outputPath = `${filePath}_preprocessed.png`
    
    await sharp.default(filePath)
      .resize(null, 1200, { withoutEnlargement: true })
      .sharpen()
      .normalize()
      .threshold(128)
      .png()
      .toFile(outputPath)
    
    return outputPath
  }

  private async cleanupFile(filePath: string): Promise<void> {
    try {
      const fs = await import('fs')
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      console.warn(`Failed to cleanup file ${filePath}:`, error)
    }
  }

  private async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on character patterns
    if (/[\u0600-\u06FF]/.test(text)) return 'arabic'
    if (/[\u0750-\u077F]/.test(text)) return 'urdu'
    if (/[ąćęłńóśźż]/.test(text)) return 'polish'
    if (/[àáâãäåæçèéêëìíîïñòóôõöùúûüý]/.test(text)) return 'french'
    if (/[äöüß]/.test(text)) return 'german'
    if (/[áéíóúüñ]/.test(text)) return 'spanish'
    return 'english'
  }

  private calculateConfidence(
    extractedText: string, 
    extractedData: any, 
    method: string
  ): number {
    let confidence = 0.5 // Base confidence
    
    // Adjust based on processing method
    if (method === 'text-extraction') confidence += 0.3
    if (method === 'structured-parsing') confidence += 0.4
    if (method === 'ocr') confidence += 0.1
    
    // Adjust based on text length and quality
    if (extractedText.length > 100) confidence += 0.1
    if (extractedText.length > 500) confidence += 0.1
    
    // Adjust based on extracted data richness
    const dataKeys = Object.keys(extractedData).length
    confidence += Math.min(dataKeys * 0.05, 0.2)
    
    return Math.min(confidence, 1.0)
  }

  private identifyIssues(text: string, confidence: number): string[] {
    const issues: string[] = []
    
    if (confidence < 0.5) issues.push('Low confidence extraction')
    if (text.length < 50) issues.push('Very little text extracted')
    if (/[^\x00-\x7F]/.test(text) && !/[\u0600-\u06FF]/.test(text)) {
      issues.push('Potential character encoding issues')
    }
    
    return issues
  }

  // Initialization methods
  private async initializeOCREngine(): Promise<any> {
    // Mock OCR engine initialization
    return {
      recognize: async (imagePath: string, languages: string, options: any) => ({
        data: {
          text: 'Mock OCR text extraction',
          confidence: 85,
          symbols: [],
          words: []
        }
      }),
      healthCheck: async () => true,
      cleanup: async () => {}
    }
  }

  private async initializePDFProcessor(): Promise<any> {
    return {
      extractText: async (pdfPath: string) => ({
        text: 'Mock PDF text extraction',
        pageCount: 1
      }),
      convertToImagesAndOCR: async (pdfPath: string) => ({
        text: 'Mock PDF OCR text',
        pageCount: 1,
        confidence: 0.8
      }),
      healthCheck: async () => true,
      cleanup: async () => {}
    }
  }

  private async initializeExcelProcessor(): Promise<any> {
    return {
      readFile: async (filePath: string) => ({
        SheetNames: ['Sheet1'],
        Sheets: {
          'Sheet1': {}
        }
      }),
      utils: {
        sheet_to_csv: (worksheet: any) => 'Mock CSV data'
      },
      healthCheck: async () => true
    }
  }

  private async initializeAIExtractor(): Promise<any> {
    return {
      extractWithAI: async (text: string, purpose: string) => ({}),
      healthCheck: async () => true
    }
  }

  // Additional processing methods
  private async extractIngredients(
    request: DocumentProcessingRequest, 
    context: AgentContext
  ): Promise<ProcessedDocument> {
    const processedDoc = await this.processDocument(request, context)
    
    // Focus specifically on ingredient extraction
    if (!processedDoc.extractedData.ingredients || processedDoc.extractedData.ingredients.length === 0) {
      // Try alternative extraction methods
      const alternativeIngredients = await this.tryAlternativeIngredientExtraction(processedDoc.extractedText)
      processedDoc.extractedData.ingredients = alternativeIngredients
    }
    
    return processedDoc
  }

  private async tryAlternativeIngredientExtraction(text: string): Promise<string[]> {
    // Implement alternative extraction strategies
    const lines = text.split('\n')
    const potentialIngredients: string[] = []
    
    for (const line of lines) {
      // Look for lines with multiple commas (likely ingredient lists)
      if ((line.match(/,/g) || []).length >= 2) {
        potentialIngredients.push(...this.parseIngredients(line))
      }
    }
    
    return potentialIngredients.slice(0, 30) // Limit results
  }

  private async verifyCertificate(
    request: DocumentProcessingRequest, 
    context: AgentContext
  ): Promise<ProcessedDocument> {
    const processedDoc = await this.processDocument(request, context)
    
    // Enhanced certificate verification logic
    const certificationData = processedDoc.extractedData.certifications || []
    const issuingAuthority = processedDoc.extractedData.issuingAuthority
    const validityPeriod = processedDoc.extractedData.validityPeriod
    
    // Add verification status
    processedDoc.extractedData.verificationStatus = {
      hasCertifications: certificationData.length > 0,
      hasIssuingAuthority: !!issuingAuthority,
      hasValidityPeriod: !!validityPeriod,
      overallValidity: certificationData.length > 0 && issuingAuthority && validityPeriod ? 'valid' : 'incomplete'
    }
    
    return processedDoc
  }

  private async bulkProcessDocuments(
    request: BulkProcessingRequest, 
    context: AgentContext
  ): Promise<ProcessedDocument[]> {
    const results: ProcessedDocument[] = []
    
    if (request.processingMode === 'parallel') {
      // Process documents in parallel
      const promises = request.documents.map(doc => this.processDocument(doc, context))
      const parallelResults = await Promise.allSettled(promises)
      
      for (const result of parallelResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value)
        } else {
          console.error('Bulk processing error:', result.reason)
        }
      }
    } else {
      // Process documents sequentially
      for (const doc of request.documents) {
        try {
          const processedDoc = await this.processDocument(doc, context)
          results.push(processedDoc)
        } catch (error) {
          console.error('Sequential processing error:', error)
        }
      }
    }
    
    return results
  }

  private async smartExtractData(
    request: DocumentProcessingRequest, 
    context: AgentContext
  ): Promise<ProcessedDocument> {
    // Process document with AI-enhanced extraction
    const processedDoc = await this.processDocument(request, context)
    
    // Enhance with AI extraction for complex cases
    const aiEnhancedData = await this.aiExtractor.extractWithAI(
      processedDoc.extractedText, 
      request.purpose
    )
    
    // Merge AI insights with pattern-based extraction
    processedDoc.extractedData = {
      ...processedDoc.extractedData,
      ...aiEnhancedData,
      aiEnhanced: true
    }
    
    return processedDoc
  }

  // Configuration and metrics methods
  private async updateOCRLanguages(languages: string[]): Promise<void> {
    // Update supported OCR languages
    console.log('Updating OCR languages:', languages)
  }

  private async updateExtractionPatterns(patterns: Record<string, RegExp[]>): Promise<void> {
    // Update extraction patterns
    Object.assign(this.extractionPatterns, patterns)
  }

  private async setQualityThreshold(threshold: number): Promise<void> {
    // Set quality threshold for processing
    console.log('Setting quality threshold:', threshold)
  }

  private async getTotalDocumentsProcessed(): Promise<number> {
    return 0 // Implementation needed
  }

  private async getAverageProcessingTime(): Promise<number> {
    return 0 // Implementation needed
  }

  private async getAccuracyRates(): Promise<Record<string, number>> {
    return {} // Implementation needed
  }

  private async getLanguageDistribution(): Promise<Record<string, number>> {
    return {} // Implementation needed
  }
}