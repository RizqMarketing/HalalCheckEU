/**
 * Certificate Generation Agent
 * 
 * Handles generation of halal certificates, PDFs, and digital verification
 */

import { IAgent, AgentInput, AgentOutput, AgentCapability } from '../core/IAgent';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/infrastructure/logging/Logger';

export interface CertificateGenerationInput extends AgentInput {
  certificateType: 'halal' | 'organic' | 'kosher' | 'quality';
  clientId: string;
  productName: string;
  productDetails: {
    category: string;
    description: string;
    ingredients: string[];
    manufacturingProcess?: string;
    packaging?: string;
    shelfLife?: string;
    storageConditions?: string;
  };
  certificationDetails: {
    standard: string; // e.g., 'GSO 993:2015', 'MS 1500:2019'
    scope: string;
    validFrom: Date;
    validUntil: Date;
    restrictions?: string[];
    conditions?: string[];
  };
  inspectionDetails?: {
    inspectorName: string;
    inspectionDate: Date;
    facilityAddress: string;
    inspectionNotes?: string;
  };
  issuingAuthority: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logo?: string;
    licenseNumber?: string;
  };
  signatories: Array<{
    name: string;
    title: string;
    signature?: string; // base64 encoded signature image
  }>;
  generateOptions?: {
    format: 'pdf' | 'png' | 'both';
    includeQRCode: boolean;
    includeWatermark: boolean;
    language: 'en' | 'ar' | 'both';
    template?: string;
  };
}

export interface CertificateGenerationOutput extends AgentOutput {
  certificateId: string;
  certificateNumber: string;
  files: Array<{
    type: 'pdf' | 'png';
    content: Buffer;
    filename: string;
    mimeType: string;
  }>;
  digitalSignature?: {
    hash: string;
    signature: string;
    publicKey: string;
  };
  qrCodeData?: {
    verificationUrl: string;
    qrCodeImage: Buffer;
  };
  metadata: {
    generatedAt: Date;
    template: string;
    fileSize: number;
    pages: number;
    securityFeatures: string[];
  };
}

export interface CertificateTemplate {
  id: string;
  name: string;
  type: string;
  layout: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: { top: number; right: number; bottom: number; left: number; };
  };
  elements: TemplateElement[];
  styles: Record<string, any>;
  languages: string[];
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'qr-code' | 'table' | 'signature' | 'watermark';
  position: { x: number; y: number; width?: number; height?: number; };
  content: string | Record<string, any>;
  styles?: Record<string, any>;
  conditions?: Array<{ field: string; operator: string; value: any; }>;
}

export class CertificateGenerationAgent implements IAgent {
  public readonly id = 'certificate-generation-agent';
  public readonly name = 'Certificate Generation Agent';
  public readonly version = '1.0.0';
  public readonly capabilities: AgentCapability[] = [
    {
      name: 'generate-halal-certificate',
      description: 'Generate halal certificates in PDF format',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'generate-qr-verification',
      description: 'Generate QR codes for certificate verification',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'digital-signature',
      description: 'Apply digital signatures to certificates',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'certificate-validation',
      description: 'Validate and verify certificates',
      inputSchema: {},
      outputSchema: {}
    }
  ];

  private logger: Logger;
  private eventBus: EventBus;
  private templates: Map<string, CertificateTemplate>;
  private certificateRegistry: Map<string, CertificateRecord>;
  private nextCertificateNumber: number;

  constructor(eventBus: EventBus, logger: Logger) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.templates = new Map();
    this.certificateRegistry = new Map();
    this.nextCertificateNumber = 100001;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.name} v${this.version}`);
    this.initializeTemplates();
    this.subscribeToEvents();
  }

  private initializeTemplates(): void {
    // Halal Certificate Template
    const halalTemplate: CertificateTemplate = {
      id: 'halal-standard',
      name: 'Standard Halal Certificate',
      type: 'halal',
      layout: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 50, right: 50, bottom: 50, left: 50 }
      },
      elements: [
        {
          id: 'header-logo',
          type: 'image',
          position: { x: 50, y: 50, width: 150, height: 75 },
          content: '{{issuingAuthority.logo}}',
          styles: { border: 'none' }
        },
        {
          id: 'title',
          type: 'text',
          position: { x: 250, y: 50, width: 300 },
          content: 'HALAL CERTIFICATE',
          styles: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#2D5A27' }
        },
        {
          id: 'certificate-number',
          type: 'text',
          position: { x: 400, y: 100 },
          content: 'Certificate No: {{certificateNumber}}',
          styles: { fontSize: 12, fontWeight: 'bold' }
        },
        {
          id: 'authority-info',
          type: 'text',
          position: { x: 50, y: 150, width: 500 },
          content: `{{issuingAuthority.name}}\n{{issuingAuthority.address}}\nPhone: {{issuingAuthority.phone}}\nEmail: {{issuingAuthority.email}}`,
          styles: { fontSize: 10, lineHeight: 1.5 }
        },
        {
          id: 'certification-statement',
          type: 'text',
          position: { x: 50, y: 250, width: 500 },
          content: `This is to certify that the product described below has been inspected and found to comply with the requirements of {{certificationDetails.standard}} and is hereby certified as HALAL.`,
          styles: { fontSize: 12, lineHeight: 1.8, textAlign: 'justify' }
        },
        {
          id: 'product-details-table',
          type: 'table',
          position: { x: 50, y: 320, width: 500 },
          content: {
            headers: ['Field', 'Details'],
            rows: [
              ['Product Name', '{{productName}}'],
              ['Manufacturer', '{{clientName}}'],
              ['Category', '{{productDetails.category}}'],
              ['Description', '{{productDetails.description}}'],
              ['Standards', '{{certificationDetails.standard}}'],
              ['Valid From', '{{certificationDetails.validFrom}}'],
              ['Valid Until', '{{certificationDetails.validUntil}}']
            ]
          },
          styles: { fontSize: 10, cellPadding: 5, borderWidth: 1 }
        },
        {
          id: 'ingredients-section',
          type: 'text',
          position: { x: 50, y: 500, width: 500 },
          content: `INGREDIENTS:\n{{productDetails.ingredients}}`,
          styles: { fontSize: 10, lineHeight: 1.5 }
        },
        {
          id: 'conditions',
          type: 'text',
          position: { x: 50, y: 580, width: 500 },
          content: `CONDITIONS:\n• This certificate is valid only for the product and premises specified above\n• Any changes in ingredients, processing, or location must be reported immediately\n• This certificate may be revoked if conditions are not maintained`,
          styles: { fontSize: 9, lineHeight: 1.4 }
        },
        {
          id: 'signatures',
          type: 'signature',
          position: { x: 50, y: 680, width: 500 },
          content: '{{signatories}}',
          styles: { fontSize: 10 }
        },
        {
          id: 'qr-code',
          type: 'qr-code',
          position: { x: 450, y: 720, width: 80, height: 80 },
          content: '{{verificationUrl}}',
          styles: { border: 'none' }
        },
        {
          id: 'watermark',
          type: 'watermark',
          position: { x: 200, y: 400 },
          content: 'HALAL CERTIFIED',
          styles: { fontSize: 48, opacity: 0.1, rotation: -45, color: '#2D5A27' }
        }
      ],
      styles: {
        fontFamily: 'Arial, sans-serif',
        defaultFontSize: 12,
        primaryColor: '#2D5A27',
        secondaryColor: '#666666'
      },
      languages: ['en', 'ar']
    };

    this.templates.set('halal-standard', halalTemplate);
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe('certificate-generation-requested', this.handleCertificateGenerationRequest.bind(this));
    this.eventBus.subscribe('certificate-verification-requested', this.handleCertificateVerification.bind(this));
    this.eventBus.subscribe('bulk-certificate-generation-requested', this.handleBulkGeneration.bind(this));
  }

  public async process(input: CertificateGenerationInput): Promise<CertificateGenerationOutput> {
    this.logger.info(`Generating ${input.certificateType} certificate for product: ${input.productName}`);
    
    const startTime = Date.now();
    
    try {
      // Generate certificate ID and number
      const certificateId = this.generateCertificateId();
      const certificateNumber = this.generateCertificateNumber(input.certificateType);

      // Get template
      const templateId = input.generateOptions?.template || `${input.certificateType}-standard`;
      const template = this.templates.get(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Prepare certificate data
      const certificateData = this.prepareCertificateData(input, certificateId, certificateNumber);

      // Generate PDF
      const pdfBuffer = await this.generatePDF(template, certificateData, input.generateOptions);

      // Generate PNG if requested
      let pngBuffer: Buffer | undefined;
      if (input.generateOptions?.format === 'png' || input.generateOptions?.format === 'both') {
        pngBuffer = await this.generatePNG(pdfBuffer);
      }

      // Generate QR code if requested
      let qrCodeData: CertificateGenerationOutput['qrCodeData'];
      if (input.generateOptions?.includeQRCode !== false) {
        qrCodeData = await this.generateQRCode(certificateId);
      }

      // Apply digital signature if configured
      let digitalSignature: CertificateGenerationOutput['digitalSignature'];
      if (this.shouldApplyDigitalSignature()) {
        digitalSignature = await this.applyDigitalSignature(pdfBuffer);
      }

      // Prepare file outputs
      const files: CertificateGenerationOutput['files'] = [];
      
      if (pdfBuffer) {
        files.push({
          type: 'pdf',
          content: pdfBuffer,
          filename: `${certificateNumber}.pdf`,
          mimeType: 'application/pdf'
        });
      }

      if (pngBuffer) {
        files.push({
          type: 'png',
          content: pngBuffer,
          filename: `${certificateNumber}.png`,
          mimeType: 'image/png'
        });
      }

      // Store certificate record
      const certificateRecord: CertificateRecord = {
        id: certificateId,
        number: certificateNumber,
        type: input.certificateType,
        clientId: input.clientId,
        productName: input.productName,
        issuedAt: new Date(),
        validFrom: input.certificationDetails.validFrom,
        validUntil: input.certificationDetails.validUntil,
        status: 'active',
        data: certificateData
      };
      
      this.certificateRegistry.set(certificateId, certificateRecord);

      const processingTime = Date.now() - startTime;

      const output: CertificateGenerationOutput = {
        agentId: this.id,
        timestamp: new Date(),
        success: true,
        certificateId,
        certificateNumber,
        files,
        digitalSignature,
        qrCodeData,
        metadata: {
          generatedAt: new Date(),
          template: templateId,
          fileSize: pdfBuffer?.length || 0,
          pages: 1,
          securityFeatures: this.getSecurityFeatures(input.generateOptions)
        }
      };

      // Emit certificate generated event
      this.eventBus.emit('certificate-generated', {
        certificateId,
        certificateNumber,
        clientId: input.clientId,
        productName: input.productName,
        type: input.certificateType
      });

      this.logger.info(`Certificate generated successfully: ${certificateNumber} (${processingTime}ms)`);
      
      return output;
    } catch (error) {
      this.logger.error(`Error generating certificate: ${error.message}`, undefined, error);
      
      return {
        agentId: this.id,
        timestamp: new Date(),
        success: false,
        error: error.message,
        certificateId: '',
        certificateNumber: '',
        files: [],
        metadata: {
          generatedAt: new Date(),
          template: '',
          fileSize: 0,
          pages: 0,
          securityFeatures: []
        }
      };
    }
  }

  private generateCertificateId(): string {
    return `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCertificateNumber(type: string): string {
    const prefix = type.toUpperCase().substr(0, 3);
    const year = new Date().getFullYear();
    const number = (this.nextCertificateNumber++).toString().padStart(6, '0');
    return `${prefix}-${year}-${number}`;
  }

  private prepareCertificateData(
    input: CertificateGenerationInput, 
    certificateId: string, 
    certificateNumber: string
  ): Record<string, any> {
    return {
      certificateId,
      certificateNumber,
      productName: input.productName,
      clientName: `Client ${input.clientId}`, // Would normally fetch from client database
      productDetails: input.productDetails,
      certificationDetails: {
        ...input.certificationDetails,
        validFrom: input.certificationDetails.validFrom.toLocaleDateString(),
        validUntil: input.certificationDetails.validUntil.toLocaleDateString()
      },
      issuingAuthority: input.issuingAuthority,
      signatories: input.signatories,
      verificationUrl: `https://halalcheck.eu/verify/${certificateId}`,
      generatedAt: new Date().toLocaleDateString()
    };
  }

  private async generatePDF(
    template: CertificateTemplate, 
    data: Record<string, any>,
    options?: CertificateGenerationInput['generateOptions']
  ): Promise<Buffer> {
    // Simulated PDF generation - in real implementation would use libraries like PDFKit, jsPDF, or Puppeteer
    this.logger.debug('Generating PDF certificate');
    
    // Create a simple PDF representation as buffer
    const pdfContent = this.renderTemplate(template, data);
    
    // In real implementation, this would return actual PDF buffer
    return Buffer.from(pdfContent, 'utf8');
  }

  private renderTemplate(template: CertificateTemplate, data: Record<string, any>): string {
    // Simple template rendering - replace placeholders with actual data
    let content = `CERTIFICATE: ${data.certificateNumber}\n\n`;
    content += `Product: ${data.productName}\n`;
    content += `Client: ${data.clientName}\n`;
    content += `Valid From: ${data.certificationDetails.validFrom}\n`;
    content += `Valid Until: ${data.certificationDetails.validUntil}\n\n`;
    content += `Ingredients: ${data.productDetails.ingredients.join(', ')}\n\n`;
    content += `Issued by: ${data.issuingAuthority.name}\n`;
    content += `Generated: ${data.generatedAt}\n`;
    
    return content;
  }

  private async generatePNG(pdfBuffer: Buffer): Promise<Buffer> {
    this.logger.debug('Converting PDF to PNG');
    
    // Simulated PNG generation - in real implementation would convert PDF to image
    return Buffer.from('PNG_IMAGE_DATA', 'utf8');
  }

  private async generateQRCode(certificateId: string): Promise<{ verificationUrl: string; qrCodeImage: Buffer }> {
    const verificationUrl = `https://halalcheck.eu/verify/${certificateId}`;
    
    // Simulated QR code generation - in real implementation would use qrcode library
    const qrCodeImage = Buffer.from('QR_CODE_IMAGE_DATA', 'utf8');
    
    return { verificationUrl, qrCodeImage };
  }

  private shouldApplyDigitalSignature(): boolean {
    // Check if digital signature is configured and required
    return false; // Simplified for now
  }

  private async applyDigitalSignature(pdfBuffer: Buffer): Promise<{ hash: string; signature: string; publicKey: string }> {
    // Simulated digital signature - in real implementation would use crypto libraries
    return {
      hash: 'document_hash',
      signature: 'digital_signature',
      publicKey: 'public_key'
    };
  }

  private getSecurityFeatures(options?: CertificateGenerationInput['generateOptions']): string[] {
    const features: string[] = [];
    
    if (options?.includeQRCode) features.push('QR Code Verification');
    if (options?.includeWatermark) features.push('Security Watermark');
    features.push('Unique Certificate Number');
    features.push('Digital Registry');
    
    return features;
  }

  public async verifyCertificate(certificateId: string): Promise<{
    isValid: boolean;
    certificate?: CertificateRecord;
    errors?: string[];
  }> {
    const certificate = this.certificateRegistry.get(certificateId);
    
    if (!certificate) {
      return {
        isValid: false,
        errors: ['Certificate not found']
      };
    }

    const errors: string[] = [];
    
    // Check if certificate is expired
    if (certificate.validUntil < new Date()) {
      errors.push('Certificate has expired');
    }

    // Check if certificate is revoked
    if (certificate.status === 'revoked') {
      errors.push('Certificate has been revoked');
    }

    return {
      isValid: errors.length === 0,
      certificate,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private async handleCertificateGenerationRequest(event: any): Promise<void> {
    const result = await this.process(event.data);
    this.eventBus.emit('certificate-generation-response', { 
      requestId: event.requestId, 
      result 
    });
  }

  private async handleCertificateVerification(event: any): Promise<void> {
    const { certificateId } = event.data;
    const result = await this.verifyCertificate(certificateId);
    this.eventBus.emit('certificate-verification-response', { 
      requestId: event.requestId, 
      result 
    });
  }

  private async handleBulkGeneration(event: any): Promise<void> {
    const { requests } = event.data;
    const results = await Promise.all(
      requests.map((request: CertificateGenerationInput) => this.process(request))
    );
    
    this.eventBus.emit('bulk-certificate-generation-response', { 
      requestId: event.requestId, 
      results 
    });
  }

  public getCertificateRegistry(): CertificateRecord[] {
    return Array.from(this.certificateRegistry.values());
  }

  public async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.name}`);
    // Save certificate registry if needed
    // Cleanup resources
  }
}

interface CertificateRecord {
  id: string;
  number: string;
  type: string;
  clientId: string;
  productName: string;
  issuedAt: Date;
  validFrom: Date;
  validUntil: Date;
  status: 'active' | 'revoked' | 'expired';
  data: Record<string, any>;
}