/**
 * Organization Workflow Agent
 *
 * Manages multi-organization workflows, dynamic terminology, and organization-specific processes
 */
import { IAgent, AgentInput, AgentOutput, AgentCapability } from '../core/IAgent';
import { EventBus } from '../core/EventBus';
import { Logger } from '../core/infrastructure/logging/Logger';
export interface OrganizationConfig {
    id: string;
    name: string;
    type: 'certification-body' | 'food-manufacturer';
    terminology: {
        primaryEntity: string;
        secondaryEntity: string;
        itemName: string;
        itemNamePlural: string;
        processName: string;
        statusTerminology: Record<string, string>;
    };
    workflows: WorkflowDefinition[];
    features: OrganizationFeatures;
    branding?: {
        primaryColor: string;
        logo?: string;
        customCSS?: string;
    };
}
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    stages: WorkflowStage[];
    triggers: WorkflowTrigger[];
    permissions: Record<string, string[]>;
}
export interface WorkflowStage {
    id: string;
    name: string;
    description: string;
    type: 'manual' | 'automated' | 'approval' | 'document-processing' | 'analysis';
    requiredFields?: string[];
    validationRules?: ValidationRule[];
    assignees?: string[];
    estimatedDuration?: number;
    nextStages: string[];
}
export interface WorkflowTrigger {
    event: string;
    condition?: string;
    action: 'advance-stage' | 'send-notification' | 'create-task' | 'run-analysis';
    parameters?: Record<string, any>;
}
export interface ValidationRule {
    field: string;
    type: 'required' | 'format' | 'custom';
    value?: any;
    message: string;
}
export interface OrganizationFeatures {
    clientManagement: boolean;
    applicationTracking: boolean;
    certificateGeneration: boolean;
    documentProcessing: boolean;
    islamicAnalysis: boolean;
    reportGeneration: boolean;
    bulkOperations: boolean;
    apiAccess: boolean;
    customFields: boolean;
    workflowAutomation: boolean;
}
export interface WorkflowExecutionInput extends AgentInput {
    organizationId: string;
    workflowId: string;
    action: 'create' | 'advance' | 'validate' | 'complete' | 'cancel';
    data: Record<string, any>;
    currentStage?: string;
    targetStage?: string;
    userId?: string;
    userRole?: string;
}
export interface WorkflowExecutionOutput extends AgentOutput {
    workflowInstanceId: string;
    currentStage: string;
    nextPossibleStages: string[];
    validationResults?: {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    stageProgress: {
        completed: string[];
        current: string;
        remaining: string[];
    };
    estimatedCompletion?: Date;
    assignedTo?: string[];
}
export declare class OrganizationWorkflowAgent implements IAgent {
    readonly id = "organization-workflow-agent";
    readonly name = "Organization Workflow Agent";
    readonly version = "1.0.0";
    readonly capabilities: AgentCapability[];
    private logger;
    private eventBus;
    private organizationConfigs;
    private workflowInstances;
    constructor(eventBus: EventBus, logger: Logger);
    private initialize;
    private initializeDefaultConfigurations;
    private createCertificationWorkflow;
    private createProductDevelopmentWorkflow;
    private subscribeToEvents;
    process(input: WorkflowExecutionInput): Promise<WorkflowExecutionOutput>;
    private getOrCreateWorkflowInstance;
    private createWorkflowInstance;
    private advanceWorkflow;
    private executeAutomatedStage;
    private validateWorkflowData;
    private getNextPossibleStages;
    private calculateStageProgress;
    private calculateEstimatedCompletion;
    private getAssignedUsers;
    private completeWorkflow;
    private cancelWorkflow;
    private handleWorkflowExecution;
    private handleOrganizationConfigRequest;
    private handleWorkflowValidation;
    getOrganizationConfig(organizationId: string): OrganizationConfig | null;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=OrganizationWorkflowAgent.d.ts.map