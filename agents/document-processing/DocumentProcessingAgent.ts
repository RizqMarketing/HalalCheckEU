/**
 * Document Processing Agent
 * 
 * Handles OCR, PDF processing, Excel parsing, and intelligent data extraction
 */

import { IAgent, AgentInput, AgentOutput, AgentCapability } from '../core/IAgent';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/infrastructure/logging/Logger';

export interface DocumentProcessingInput extends AgentInput {
  documentType: 'pdf' | 'image' | 'excel' | 'text';
  filePath?: string;
  fileBuffer?: Buffer;
  extractionOptions?: {
    extractIngredients?: boolean;
    extractNutritionalInfo?: boolean;
    extractCertificates?: boolean;
    ocrLanguage?: string;
    imagePreprocessing?: boolean;
  };
}

export interface ExtractedData {
  ingredients?: string[];
  nutritionalInfo?: Record<string, any>;
  certificates?: Array<{
    type: string;
    issuer: string;
    validUntil?: Date;
    certificateNumber?: string;
  }>;
  metadata?: {
    documentTitle?: string;
    language?: string;
    confidence?: number;
    processingTime?: number;
  };
}

export interface DocumentProcessingOutput extends AgentOutput {
  extractedData: ExtractedData;
  originalText?: string;
  processingMetadata: {
    documentType: string;
    fileSize?: number;
    processingTime: number;
    confidence: number;
    errors?: string[];
    warnings?: string[];
  };
}

export class DocumentProcessingAgent implements IAgent {
  public readonly id = 'document-processing-agent';
  public readonly name = 'Document Processing Agent';
  public readonly version = '1.0.0';
  public readonly capabilities: AgentCapability[] = [
    {
      name: 'extract-ingredients',
      description: 'Extract ingredient lists from documents',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'extract-nutritional-info',
      description: 'Extract nutritional information from labels',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'extract-certificates',
      description: 'Extract halal certificates and related information',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'ocr-processing',
      description: 'Optical Character Recognition for images',
      inputSchema: {},
      outputSchema: {}
    }
  ];

  private logger: Logger;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, logger: Logger) {
    this.eventBus = eventBus;
    this.logger = logger;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.name} v${this.version}`);
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe('document-processing-requested', this.handleDocumentProcessingRequest.bind(this));
    this.eventBus.subscribe('bulk-document-processing-requested', this.handleBulkProcessingRequest.bind(this));
  }

  public async process(input: DocumentProcessingInput): Promise<DocumentProcessingOutput> {
    this.logger.info(`Processing document of type: ${input.documentType}`);
    
    const startTime = Date.now();
    
    try {
      let extractedData: ExtractedData = {};
      let originalText = '';
      const errors: string[] = [];
      const warnings: string[] = [];

      switch (input.documentType) {
        case 'pdf':
          ({ extractedData, originalText } = await this.processPDF(input));
          break;
        case 'image':
          ({ extractedData, originalText } = await this.processImage(input));
          break;
        case 'excel':
          ({ extractedData, originalText } = await this.processExcel(input));
          break;
        case 'text':
          ({ extractedData, originalText } = await this.processText(input));
          break;
        default:
          throw new Error(`Unsupported document type: ${input.documentType}`);
      }

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(extractedData, originalText);

      const output: DocumentProcessingOutput = {
        agentId: this.id,
        timestamp: new Date(),
        success: true,
        extractedData,
        originalText,
        processingMetadata: {
          documentType: input.documentType,
          processingTime,
          confidence,
          errors,
          warnings
        }
      };

      // Emit processing completed event
      this.eventBus.emit('document-processing-completed', {
        result: output,
        documentType: input.documentType
      });

      return output;
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, undefined, error);
      
      return {
        agentId: this.id,
        timestamp: new Date(),
        success: false,
        error: error.message,
        extractedData: {},
        processingMetadata: {
          documentType: input.documentType,
          processingTime: Date.now() - startTime,
          confidence: 0,
          errors: [error.message]
        }
      };
    }
  }

  private async processPDF(input: DocumentProcessingInput): Promise<{ extractedData: ExtractedData; originalText: string }> {
    this.logger.debug('Processing PDF document');
    
    // Simulated PDF processing - in real implementation would use libraries like pdf-parse
    const originalText = `
    INGREDIENTS: Water, Sugar, Citric Acid, Natural Flavoring, Sodium Benzoate (Preservative), 
    Ascorbic Acid (Vitamin C), Beta Carotene (Color).
    
    NUTRITIONAL INFORMATION (per 100ml):
    Energy: 180 kJ / 43 kcal
    Fat: 0g
    Carbohydrates: 10.5g
    - of which sugars: 10.5g
    Protein: 0g
    Salt: 0.01g
    
    HALAL CERTIFICATE: HFA-UK-2024-001234
    Certified by: Halal Food Authority
    Valid until: 31/12/2024
    `;

    const extractedData = await this.extractDataFromText(originalText, input.extractionOptions);
    
    return { extractedData, originalText };
  }

  private async processImage(input: DocumentProcessingInput): Promise<{ extractedData: ExtractedData; originalText: string }> {
    this.logger.debug('Processing image document with OCR');
    
    // Simulated OCR processing - in real implementation would use Tesseract.js or similar
    const originalText = await this.performOCR(input);
    const extractedData = await this.extractDataFromText(originalText, input.extractionOptions);
    
    return { extractedData, originalText };
  }

  private async processExcel(input: DocumentProcessingInput): Promise<{ extractedData: ExtractedData; originalText: string }> {
    this.logger.debug('Processing Excel document');
    
    // Simulated Excel processing - in real implementation would use xlsx library
    const originalText = `
    Product Name,Ingredients,Halal Status,Certificate Number
    Orange Juice,Water; Orange Concentrate; Vitamin C,Halal,HFA-2024-001
    Apple Juice,Water; Apple Concentrate; Citric Acid,Halal,HFA-2024-002
    Mixed Fruit,Water; Mixed Fruit Concentrate; Natural Flavoring,Under Review,
    `;

    const extractedData = await this.extractDataFromSpreadsheet(originalText);
    
    return { extractedData, originalText };
  }

  private async processText(input: DocumentProcessingInput): Promise<{ extractedData: ExtractedData; originalText: string }> {
    this.logger.debug('Processing text document');
    
    // For text input, assume the text is provided in the input
    const originalText = input.context?.text || '';
    const extractedData = await this.extractDataFromText(originalText, input.extractionOptions);
    
    return { extractedData, originalText };
  }

  private async performOCR(input: DocumentProcessingInput): Promise<string> {
    // Simulated OCR - in real implementation would integrate with Tesseract.js
    this.logger.debug('Performing OCR on image');
    
    // Return simulated extracted text
    return `
    INGREDIENTS: Wheat Flour, Sugar, Vegetable Oil (Palm), 
    Cocoa Powder, Salt, Baking Powder, Natural Vanilla Flavoring.
    
    ALLERGENS: Contains Gluten
    
    HALAL CERTIFIED
    Certificate No: JAKIM-123456789
    `;
  }

  private async extractDataFromText(text: string, options?: DocumentProcessingInput['extractionOptions']): Promise<ExtractedData> {
    const extractedData: ExtractedData = {};

    if (options?.extractIngredients !== false) {
      extractedData.ingredients = this.extractIngredients(text);
    }

    if (options?.extractNutritionalInfo) {
      extractedData.nutritionalInfo = this.extractNutritionalInfo(text);
    }

    if (options?.extractCertificates) {
      extractedData.certificates = this.extractCertificates(text);
    }

    return extractedData;
  }

  private extractIngredients(text: string): string[] {
    const ingredients: string[] = [];
    
    // Look for ingredient sections
    const ingredientPatterns = [
      /INGREDIENTS?\s*:?\s*([^\.]+)/i,
      /COMPOSITION\s*:?\s*([^\.]+)/i,
      /CONTAINS?\s*:?\s*([^\.]+)/i
    ];

    for (const pattern of ingredientPatterns) {
      const match = text.match(pattern);
      if (match) {
        const ingredientText = match[1];
        // Split by common separators and clean up
        const foundIngredients = ingredientText
          .split(/[,;]/)
          .map(ingredient => ingredient.trim())
          .filter(ingredient => ingredient.length > 0)
          .map(ingredient => ingredient.replace(/\([^)]*\)/g, '').trim()) // Remove parenthetical notes
          .filter(ingredient => ingredient.length > 0);
        
        ingredients.push(...foundIngredients);
        break; // Use the first match found
      }
    }

    return [...new Set(ingredients)]; // Remove duplicates
  }

  private extractNutritionalInfo(text: string): Record<string, any> {
    const nutritionalInfo: Record<string, any> = {};
    
    // Extract energy/calories
    const energyMatch = text.match(/(?:ENERGY|CALORIES?)\s*:?\s*(\d+(?:\.\d+)?)\s*(?:kJ|kcal|cal)/i);
    if (energyMatch) {
      nutritionalInfo.energy = energyMatch[1];
    }

    // Extract macronutrients
    const macroPatterns = {
      fat: /FAT\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
      carbohydrates: /CARBOHYDRATES?\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
      protein: /PROTEIN\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
      salt: /SALT\s*:?\s*(\d+(?:\.\d+)?)\s*g/i,
      sugar: /(?:SUGAR|of which sugars)\s*:?\s*(\d+(?:\.\d+)?)\s*g/i
    };

    for (const [nutrient, pattern] of Object.entries(macroPatterns)) {
      const match = text.match(pattern);
      if (match) {
        nutritionalInfo[nutrient] = parseFloat(match[1]);
      }
    }

    return nutritionalInfo;
  }

  private extractCertificates(text: string): Array<{ type: string; issuer: string; validUntil?: Date; certificateNumber?: string }> {
    const certificates: Array<{ type: string; issuer: string; validUntil?: Date; certificateNumber?: string }> = [];
    
    // Look for halal certificates
    const halalPatterns = [
      /HALAL\s+CERTIFIED?\s*(?:BY)?\s*:?\s*([^\n]+)/i,
      /CERTIFICATE\s+(?:NO|NUMBER)\s*:?\s*([A-Z0-9\-]+)/i,
      /(HFA|JAKIM|ISNA|MUI)\s*[:-]?\s*([A-Z0-9\-]+)/i
    ];

    for (const pattern of halalPatterns) {
      const match = text.match(pattern);
      if (match) {
        certificates.push({
          type: 'Halal',
          issuer: this.identifyIssuer(match[1] || match[0]),
          certificateNumber: match[2] || match[1]
        });
      }
    }

    // Look for validity dates
    const datePattern = /(?:VALID\s+UNTIL|EXPIRES?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
    const dateMatch = text.match(datePattern);
    if (dateMatch && certificates.length > 0) {
      const dateParts = dateMatch[1].split(/[\/\-]/);
      certificates[0].validUntil = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
    }

    return certificates;
  }

  private identifyIssuer(text: string): string {
    const issuers = {
      'HFA': 'Halal Food Authority',
      'JAKIM': 'Department of Islamic Development Malaysia',
      'ISNA': 'Islamic Society of North America',
      'MUI': 'Indonesian Ulema Council',
      'ESMA': 'Emirates Authority for Standardization and Metrology'
    };

    for (const [code, fullName] of Object.entries(issuers)) {
      if (text.toUpperCase().includes(code)) {
        return fullName;
      }
    }

    return text.trim();
  }

  private async extractDataFromSpreadsheet(csvText: string): Promise<ExtractedData> {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const products = [];
    const allIngredients = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const product: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        product[header] = values[index] || '';
      });

      if (product['Ingredients']) {
        const ingredients = product['Ingredients'].split(';').map(ing => ing.trim());
        ingredients.forEach(ing => allIngredients.add(ing));
      }

      products.push(product);
    }

    return {
      ingredients: Array.from(allIngredients),
      metadata: {
        documentTitle: 'Product Spreadsheet',
        language: 'en',
        confidence: 85
      }
    };
  }

  private calculateConfidence(extractedData: ExtractedData, originalText: string): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on successful extractions
    if (extractedData.ingredients && extractedData.ingredients.length > 0) {
      confidence += 20;
    }

    if (extractedData.certificates && extractedData.certificates.length > 0) {
      confidence += 15;
    }

    if (extractedData.nutritionalInfo && Object.keys(extractedData.nutritionalInfo).length > 0) {
      confidence += 10;
    }

    // Decrease confidence for very short text
    if (originalText.length < 100) {
      confidence -= 20;
    }

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(100, confidence));
  }

  private async handleDocumentProcessingRequest(event: any): Promise<void> {
    const result = await this.process(event.data);
    this.eventBus.emit('document-processing-response', { 
      requestId: event.requestId, 
      result 
    });
  }

  private async handleBulkProcessingRequest(event: any): Promise<void> {
    const { documents } = event.data;
    const results = await Promise.all(
      documents.map((doc: DocumentProcessingInput) => this.process(doc))
    );
    
    this.eventBus.emit('bulk-document-processing-response', { 
      requestId: event.requestId, 
      results 
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.name}`);
    // Cleanup resources
  }
}