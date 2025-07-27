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
        standard: string;
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
        signature?: string;
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
        margins: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
    };
    elements: TemplateElement[];
    styles: Record<string, any>;
    languages: string[];
}
export interface TemplateElement {
    id: string;
    type: 'text' | 'image' | 'qr-code' | 'table' | 'signature' | 'watermark';
    position: {
        x: number;
        y: number;
        width?: number;
        height?: number;
    };
    content: string | Record<string, any>;
    styles?: Record<string, any>;
    conditions?: Array<{
        field: string;
        operator: string;
        value: any;
    }>;
}
export declare class CertificateGenerationAgent implements IAgent {
    readonly id = "certificate-generation-agent";
    readonly name = "Certificate Generation Agent";
    readonly version = "1.0.0";
    readonly capabilities: AgentCapability[];
    private logger;
    private eventBus;
    private templates;
    private certificateRegistry;
    private nextCertificateNumber;
    constructor(eventBus: EventBus, logger: Logger);
    private initialize;
    private initializeTemplates;
    private subscribeToEvents;
    process(input: CertificateGenerationInput): Promise<CertificateGenerationOutput>;
    private generateCertificateId;
    private generateCertificateNumber;
    private prepareCertificateData;
    private generatePDF;
    private renderTemplate;
    private generatePNG;
    private generateQRCode;
    private shouldApplyDigitalSignature;
    private applyDigitalSignature;
    private getSecurityFeatures;
    verifyCertificate(certificateId: string): Promise<{
        isValid: boolean;
        certificate?: CertificateRecord;
        errors?: string[];
    }>;
    private handleCertificateGenerationRequest;
    private handleCertificateVerification;
    private handleBulkGeneration;
    getCertificateRegistry(): CertificateRecord[];
    shutdown(): Promise<void>;
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
export {};
//# sourceMappingURL=CertificateGenerationAgent.d.ts.map