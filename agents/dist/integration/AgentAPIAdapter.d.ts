/**
 * Agent API Adapter
 *
 * Provides compatibility layer between the existing API and the new agent system
 */
import { AgentSystem } from '../AgentSystem';
export interface LegacyAnalysisRequest {
    ingredients: string[];
    productName: string;
    clientId?: string;
    organizationType?: string;
    madhab?: string;
    strictnessLevel?: 'strict' | 'moderate' | 'lenient';
}
export interface LegacyDocumentRequest {
    filePath?: string;
    fileBuffer?: Buffer;
    documentType: string;
    extractIngredients?: boolean;
    extractNutritionalInfo?: boolean;
}
export interface LegacyCertificateRequest {
    clientId: string;
    productName: string;
    ingredients: string[];
    productDetails: any;
    organizationId: string;
}
export declare class AgentAPIAdapter {
    private agentSystem;
    private logger;
    constructor(agentSystem: AgentSystem);
    /**
     * Legacy ingredient analysis endpoint compatibility
     */
    analyzeIngredients(request: LegacyAnalysisRequest): Promise<any>;
    /**
     * Legacy document processing endpoint compatibility
     */
    processDocument(request: LegacyDocumentRequest): Promise<any>;
    /**
     * Legacy certificate generation endpoint compatibility
     */
    generateCertificate(request: LegacyCertificateRequest): Promise<any>;
    /**
     * Execute complete halal analysis workflow
     */
    executeHalalAnalysisWorkflow(data: any): Promise<any>;
    /**
     * Execute certificate generation workflow
     */
    executeCertificateWorkflow(data: any): Promise<any>;
    /**
     * Get organization configuration
     */
    getOrganizationConfig(organizationId: string): any;
    /**
     * Transform agent analysis response to legacy format
     */
    private transformAnalysisResponse;
    /**
     * Transform document processing response to legacy format
     */
    private transformDocumentResponse;
    /**
     * Transform certificate generation response to legacy format
     */
    private transformCertificateResponse;
    /**
     * Transform workflow execution response
     */
    private transformWorkflowResponse;
    /**
     * Transform organization configuration
     */
    private transformOrganizationConfig;
    /**
     * Get system health status
     */
    getSystemHealth(): any;
    /**
     * Legacy bulk analysis support
     */
    analyzeBulkIngredients(requests: LegacyAnalysisRequest[]): Promise<any[]>;
    /**
     * Legacy batch document processing
     */
    processBulkDocuments(requests: LegacyDocumentRequest[]): Promise<any[]>;
}
//# sourceMappingURL=AgentAPIAdapter.d.ts.map