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
export declare class DocumentProcessingAgent implements IAgent {
    readonly id = "document-processing-agent";
    readonly name = "Document Processing Agent";
    readonly version = "1.0.0";
    readonly capabilities: AgentCapability[];
    private logger;
    private eventBus;
    constructor(eventBus: EventBus, logger: Logger);
    private initialize;
    private subscribeToEvents;
    process(input: DocumentProcessingInput): Promise<DocumentProcessingOutput>;
    private processPDF;
    private processImage;
    private processExcel;
    private processText;
    private performOCR;
    private extractDataFromText;
    private extractIngredients;
    private extractNutritionalInfo;
    private extractCertificates;
    private identifyIssuer;
    private extractDataFromSpreadsheet;
    private calculateConfidence;
    private handleDocumentProcessingRequest;
    private handleBulkProcessingRequest;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=DocumentProcessingAgent.d.ts.map