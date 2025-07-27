"use strict";
/**
 * Agent API Adapter
 *
 * Provides compatibility layer between the existing API and the new agent system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentAPIAdapter = void 0;
const Logger_1 = require("../core/infrastructure/logging/Logger");
class AgentAPIAdapter {
    constructor(agentSystem) {
        this.agentSystem = agentSystem;
        this.logger = new Logger_1.Logger('AgentAPIAdapter');
    }
    /**
     * Legacy ingredient analysis endpoint compatibility
     */
    async analyzeIngredients(request) {
        this.logger.info('Processing legacy ingredient analysis request', {
            productName: request.productName,
            ingredientCount: request.ingredients.length
        });
        try {
            const result = await this.agentSystem.analyzeIngredients(request.ingredients, request.productName, {
                madhab: request.madhab || 'General',
                strictnessLevel: request.strictnessLevel || 'moderate',
                includeScholarlyDifferences: true
            });
            // Transform agent response to legacy format
            return this.transformAnalysisResponse(result);
        }
        catch (error) {
            this.logger.error('Analysis request failed', undefined, error);
            throw error;
        }
    }
    /**
     * Legacy document processing endpoint compatibility
     */
    async processDocument(request) {
        this.logger.info('Processing legacy document request', {
            documentType: request.documentType
        });
        try {
            const result = await this.agentSystem.processDocument(request.documentType, request.filePath || '', {
                extractIngredients: request.extractIngredients !== false,
                extractNutritionalInfo: request.extractNutritionalInfo || false,
                extractCertificates: true,
                ocrLanguage: 'en',
                imagePreprocessing: true
            });
            return this.transformDocumentResponse(result);
        }
        catch (error) {
            this.logger.error('Document processing failed', undefined, error);
            throw error;
        }
    }
    /**
     * Legacy certificate generation endpoint compatibility
     */
    async generateCertificate(request) {
        this.logger.info('Processing legacy certificate request', {
            clientId: request.clientId,
            productName: request.productName
        });
        try {
            // First analyze ingredients to ensure they're halal
            const analysisResult = await this.analyzeIngredients({
                ingredients: request.ingredients,
                productName: request.productName,
                clientId: request.clientId,
                strictnessLevel: 'strict'
            });
            if (analysisResult.overallStatus !== 'HALAL') {
                throw new Error('Product contains non-halal ingredients and cannot be certified');
            }
            // Generate certificate
            const certificateData = {
                certificateType: 'halal',
                clientId: request.clientId,
                productName: request.productName,
                productDetails: {
                    category: request.productDetails.category || 'Food Product',
                    description: request.productDetails.description || '',
                    ingredients: request.ingredients,
                    manufacturingProcess: request.productDetails.manufacturingProcess,
                    packaging: request.productDetails.packaging,
                    shelfLife: request.productDetails.shelfLife,
                    storageConditions: request.productDetails.storageConditions
                },
                certificationDetails: {
                    standard: 'GSO 993:2015',
                    scope: 'Halal Food Certification',
                    validFrom: new Date(),
                    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
                    restrictions: [],
                    conditions: []
                },
                issuingAuthority: {
                    name: 'HalalCheck EU Certification',
                    address: 'European Union',
                    phone: '+31-XXX-XXXXXXX',
                    email: 'info@halalcheck.eu',
                    website: 'https://halalcheck.eu',
                    licenseNumber: 'HCE-2024-001'
                },
                signatories: [
                    {
                        name: 'Dr. Islamic Scholar',
                        title: 'Chief Islamic Scholar'
                    },
                    {
                        name: 'John Director',
                        title: 'Certification Director'
                    }
                ],
                generateOptions: {
                    format: 'pdf',
                    includeQRCode: true,
                    includeWatermark: true,
                    language: 'en'
                }
            };
            const result = await this.agentSystem.generateCertificate(certificateData);
            return this.transformCertificateResponse(result);
        }
        catch (error) {
            this.logger.error('Certificate generation failed', undefined, error);
            throw error;
        }
    }
    /**
     * Execute complete halal analysis workflow
     */
    async executeHalalAnalysisWorkflow(data) {
        this.logger.info('Executing halal analysis workflow');
        try {
            const execution = await this.agentSystem.executeWorkflow('halal-analysis-complete', data);
            return this.transformWorkflowResponse(execution);
        }
        catch (error) {
            this.logger.error('Workflow execution failed', undefined, error);
            throw error;
        }
    }
    /**
     * Execute certificate generation workflow
     */
    async executeCertificateWorkflow(data) {
        this.logger.info('Executing certificate generation workflow');
        try {
            const execution = await this.agentSystem.executeWorkflow('certificate-generation-complete', data);
            return this.transformWorkflowResponse(execution);
        }
        catch (error) {
            this.logger.error('Certificate workflow failed', undefined, error);
            throw error;
        }
    }
    /**
     * Get organization configuration
     */
    getOrganizationConfig(organizationId) {
        const config = this.agentSystem.getOrganizationConfig(organizationId);
        return config ? this.transformOrganizationConfig(config) : null;
    }
    /**
     * Transform agent analysis response to legacy format
     */
    transformAnalysisResponse(agentResult) {
        return {
            overallStatus: agentResult.overallStatus,
            confidenceScore: agentResult.confidenceScore,
            ingredients: agentResult.ingredients.map((ingredient) => ({
                name: ingredient.name,
                status: ingredient.status,
                confidence: ingredient.confidence,
                reasoning: ingredient.reasoning,
                references: ingredient.islamicReferences,
                alternatives: ingredient.alternativeSuggestions,
                requiresVerification: ingredient.requiresVerification
            })),
            recommendations: agentResult.recommendations,
            scholarlyNotes: agentResult.scholarlyNotes,
            timestamp: agentResult.timestamp,
            processingTime: Date.now() - agentResult.timestamp.getTime()
        };
    }
    /**
     * Transform document processing response to legacy format
     */
    transformDocumentResponse(agentResult) {
        return {
            extractedData: {
                ingredients: agentResult.extractedData.ingredients || [],
                nutritionalInfo: agentResult.extractedData.nutritionalInfo || {},
                certificates: agentResult.extractedData.certificates || [],
                metadata: agentResult.extractedData.metadata || {}
            },
            originalText: agentResult.originalText || '',
            confidence: agentResult.processingMetadata.confidence,
            processingTime: agentResult.processingMetadata.processingTime,
            documentType: agentResult.processingMetadata.documentType,
            errors: agentResult.processingMetadata.errors || [],
            warnings: agentResult.processingMetadata.warnings || []
        };
    }
    /**
     * Transform certificate generation response to legacy format
     */
    transformCertificateResponse(agentResult) {
        return {
            certificateId: agentResult.certificateId,
            certificateNumber: agentResult.certificateNumber,
            files: agentResult.files.map((file) => ({
                type: file.type,
                filename: file.filename,
                mimeType: file.mimeType,
                size: file.content.length,
                // Note: In production, you'd typically return a URL or store the file
                downloadUrl: `/api/certificates/${agentResult.certificateId}/download/${file.type}`
            })),
            qrCode: agentResult.qrCodeData ? {
                verificationUrl: agentResult.qrCodeData.verificationUrl,
                // QR code would be stored and URL returned
                qrCodeUrl: `/api/certificates/${agentResult.certificateId}/qr-code`
            } : null,
            digitalSignature: agentResult.digitalSignature,
            metadata: agentResult.metadata,
            generatedAt: agentResult.metadata.generatedAt
        };
    }
    /**
     * Transform workflow execution response
     */
    transformWorkflowResponse(execution) {
        return {
            executionId: execution.id,
            workflowId: execution.workflowId,
            status: execution.status,
            progress: execution.progress,
            currentStep: execution.context.currentStep,
            results: execution.context.results,
            startTime: execution.startTime,
            endTime: execution.endTime,
            duration: execution.duration,
            errors: execution.context.errors
        };
    }
    /**
     * Transform organization configuration
     */
    transformOrganizationConfig(config) {
        return {
            id: config.id,
            name: config.name,
            type: config.type,
            terminology: config.terminology,
            features: config.features,
            workflows: config.workflows.map((workflow) => ({
                id: workflow.id,
                name: workflow.name,
                description: workflow.description,
                stages: workflow.stages.map((stage) => ({
                    id: stage.id,
                    name: stage.name,
                    description: stage.description,
                    type: stage.type,
                    estimatedDuration: stage.estimatedDuration
                }))
            })),
            branding: config.branding
        };
    }
    /**
     * Get system health status
     */
    getSystemHealth() {
        const status = this.agentSystem.getSystemStatus();
        const metrics = this.agentSystem.getAgentMetrics();
        return {
            status: status.initialized ? 'healthy' : 'not_initialized',
            agentCount: status.agentCount,
            capabilities: status.capabilities,
            activeExecutions: status.activeExecutions,
            metrics: {
                totalEvents: status.eventBusStats.historySize,
                orchestrationStats: status.orchestrationStats
            },
            agents: metrics.map(metric => ({
                agentId: metric.agentId,
                metrics: metric.metrics
            }))
        };
    }
    /**
     * Legacy bulk analysis support
     */
    async analyzeBulkIngredients(requests) {
        this.logger.info(`Processing bulk analysis request with ${requests.length} items`);
        const results = await Promise.all(requests.map(request => this.analyzeIngredients(request)));
        return results;
    }
    /**
     * Legacy batch document processing
     */
    async processBulkDocuments(requests) {
        this.logger.info(`Processing bulk document request with ${requests.length} items`);
        const results = await Promise.all(requests.map(request => this.processDocument(request)));
        return results;
    }
}
exports.AgentAPIAdapter = AgentAPIAdapter;
//# sourceMappingURL=AgentAPIAdapter.js.map