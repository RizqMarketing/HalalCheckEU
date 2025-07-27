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
    primaryEntity: string;         // 'Certificate' or 'Product'
    secondaryEntity: string;       // 'Application' or 'Recipe'
    itemName: string;             // 'Certificate' or 'Product'
    itemNamePlural: string;       // 'Certificates' or 'Products'
    processName: string;          // 'Certification' or 'Development'
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
  permissions: Record<string, string[]>; // role -> allowed actions
}

export interface WorkflowStage {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'approval' | 'document-processing' | 'analysis';
  requiredFields?: string[];
  validationRules?: ValidationRule[];
  assignees?: string[]; // roles that can handle this stage
  estimatedDuration?: number; // in hours
  nextStages: string[]; // possible next stages
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

export class OrganizationWorkflowAgent implements IAgent {
  public readonly id = 'organization-workflow-agent';
  public readonly name = 'Organization Workflow Agent';
  public readonly version = '1.0.0';
  public readonly capabilities: AgentCapability[] = [
    {
      name: 'manage-workflows',
      description: 'Create and manage organization-specific workflows',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'execute-workflow',
      description: 'Execute workflow stages and transitions',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'validate-workflow-data',
      description: 'Validate data according to workflow rules',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'adapt-terminology',
      description: 'Adapt UI and processes to organization terminology',
      inputSchema: {},
      outputSchema: {}
    }
  ];

  private logger: Logger;
  private eventBus: EventBus;
  private organizationConfigs: Map<string, OrganizationConfig>;
  private workflowInstances: Map<string, WorkflowInstance>;

  constructor(eventBus: EventBus, logger: Logger) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.organizationConfigs = new Map();
    this.workflowInstances = new Map();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.name} v${this.version}`);
    this.initializeDefaultConfigurations();
    this.subscribeToEvents();
  }

  private initializeDefaultConfigurations(): void {
    // Certification Body Configuration
    const certificationBodyConfig: OrganizationConfig = {
      id: 'certification-body',
      name: 'Halal Certification Body',
      type: 'certification-body',
      terminology: {
        primaryEntity: 'Certificate',
        secondaryEntity: 'Application',
        itemName: 'Certificate',
        itemNamePlural: 'Certificates',
        processName: 'Certification',
        statusTerminology: {
          'draft': 'Under Review',
          'in-progress': 'Processing',
          'approved': 'Certified',
          'rejected': 'Declined',
          'pending': 'Awaiting Documentation'
        }
      },
      workflows: [this.createCertificationWorkflow()],
      features: {
        clientManagement: true,
        applicationTracking: true,
        certificateGeneration: true,
        documentProcessing: true,
        islamicAnalysis: true,
        reportGeneration: true,
        bulkOperations: true,
        apiAccess: true,
        customFields: true,
        workflowAutomation: true
      },
      branding: {
        primaryColor: '#2D5A27',
        logo: '/images/certification-logo.png'
      }
    };

    // Food Manufacturer Configuration
    const foodManufacturerConfig: OrganizationConfig = {
      id: 'food-manufacturer',
      name: 'Food Manufacturing Company',
      type: 'food-manufacturer',
      terminology: {
        primaryEntity: 'Product',
        secondaryEntity: 'Recipe',
        itemName: 'Product',
        itemNamePlural: 'Products',
        processName: 'Development',
        statusTerminology: {
          'draft': 'In Development',
          'in-progress': 'Testing',
          'approved': 'Production Ready',
          'rejected': 'Reformulation Needed',
          'pending': 'Awaiting Approval'
        }
      },
      workflows: [this.createProductDevelopmentWorkflow()],
      features: {
        clientManagement: false,
        applicationTracking: true,
        certificateGeneration: false,
        documentProcessing: true,
        islamicAnalysis: true,
        reportGeneration: true,
        bulkOperations: true,
        apiAccess: true,
        customFields: true,
        workflowAutomation: true
      },
      branding: {
        primaryColor: '#1E40AF',
        logo: '/images/manufacturer-logo.png'
      }
    };

    this.organizationConfigs.set('certification-body', certificationBodyConfig);
    this.organizationConfigs.set('food-manufacturer', foodManufacturerConfig);
  }

  private createCertificationWorkflow(): WorkflowDefinition {
    return {
      id: 'halal-certification',
      name: 'Halal Certification Process',
      description: 'Complete halal certification workflow from application to certificate issuance',
      stages: [
        {
          id: 'application-submitted',
          name: 'Application Submitted',
          description: 'Initial application has been submitted',
          type: 'manual',
          requiredFields: ['clientId', 'productName', 'ingredients'],
          nextStages: ['document-review']
        },
        {
          id: 'document-review',
          name: 'Document Review',
          description: 'Review submitted documentation',
          type: 'manual',
          assignees: ['reviewer', 'manager'],
          estimatedDuration: 24,
          nextStages: ['islamic-analysis', 'request-additional-docs']
        },
        {
          id: 'request-additional-docs',
          name: 'Request Additional Documentation',
          description: 'Request missing or additional documents from client',
          type: 'manual',
          nextStages: ['document-review']
        },
        {
          id: 'islamic-analysis',
          name: 'Islamic Analysis',
          description: 'Perform Islamic jurisprudence analysis of ingredients',
          type: 'automated',
          estimatedDuration: 1,
          nextStages: ['facility-inspection', 'analysis-review']
        },
        {
          id: 'analysis-review',
          name: 'Analysis Review',
          description: 'Review automated analysis results',
          type: 'approval',
          assignees: ['islamic-scholar', 'senior-reviewer'],
          estimatedDuration: 8,
          nextStages: ['facility-inspection', 'request-clarification']
        },
        {
          id: 'facility-inspection',
          name: 'Facility Inspection',
          description: 'On-site or virtual facility inspection',
          type: 'manual',
          assignees: ['inspector'],
          estimatedDuration: 72,
          nextStages: ['final-review']
        },
        {
          id: 'final-review',
          name: 'Final Review',
          description: 'Final review before certificate issuance',
          type: 'approval',
          assignees: ['manager', 'director'],
          estimatedDuration: 16,
          nextStages: ['certificate-generation', 'application-rejected']
        },
        {
          id: 'certificate-generation',
          name: 'Certificate Generation',
          description: 'Generate and issue halal certificate',
          type: 'automated',
          estimatedDuration: 1,
          nextStages: ['completed']
        },
        {
          id: 'application-rejected',
          name: 'Application Rejected',
          description: 'Application has been rejected',
          type: 'manual',
          nextStages: ['completed']
        },
        {
          id: 'completed',
          name: 'Process Completed',
          description: 'Certification process completed',
          type: 'manual',
          nextStages: []
        }
      ],
      triggers: [
        {
          event: 'application-submitted',
          action: 'advance-stage',
          parameters: { targetStage: 'document-review' }
        },
        {
          event: 'documents-approved',
          action: 'advance-stage',
          parameters: { targetStage: 'islamic-analysis' }
        },
        {
          event: 'islamic-analysis-completed',
          action: 'advance-stage',
          parameters: { targetStage: 'analysis-review' }
        }
      ],
      permissions: {
        'admin': ['create', 'read', 'update', 'delete', 'approve'],
        'manager': ['create', 'read', 'update', 'approve'],
        'reviewer': ['read', 'update'],
        'client': ['read']
      }
    };
  }

  private createProductDevelopmentWorkflow(): WorkflowDefinition {
    return {
      id: 'product-development',
      name: 'Product Development Process',
      description: 'Product development workflow from concept to production',
      stages: [
        {
          id: 'concept',
          name: 'Product Concept',
          description: 'Initial product concept and idea',
          type: 'manual',
          requiredFields: ['productName', 'category', 'targetMarket'],
          nextStages: ['recipe-development']
        },
        {
          id: 'recipe-development',
          name: 'Recipe Development',
          description: 'Develop product recipe and formulation',
          type: 'manual',
          requiredFields: ['ingredients', 'quantities', 'process'],
          estimatedDuration: 168, // 1 week
          nextStages: ['halal-analysis']
        },
        {
          id: 'halal-analysis',
          name: 'Halal Compliance Analysis',
          description: 'Analyze recipe for halal compliance',
          type: 'automated',
          estimatedDuration: 1,
          nextStages: ['compliance-review']
        },
        {
          id: 'compliance-review',
          name: 'Compliance Review',
          description: 'Review halal compliance analysis',
          type: 'approval',
          assignees: ['qa-manager', 'halal-coordinator'],
          estimatedDuration: 8,
          nextStages: ['prototype-testing', 'recipe-revision']
        },
        {
          id: 'recipe-revision',
          name: 'Recipe Revision',
          description: 'Revise recipe based on compliance feedback',
          type: 'manual',
          nextStages: ['halal-analysis']
        },
        {
          id: 'prototype-testing',
          name: 'Prototype Testing',
          description: 'Create and test product prototype',
          type: 'manual',
          estimatedDuration: 336, // 2 weeks
          nextStages: ['production-planning']
        },
        {
          id: 'production-planning',
          name: 'Production Planning',
          description: 'Plan production process and scale-up',
          type: 'manual',
          estimatedDuration: 168, // 1 week
          nextStages: ['certification-application', 'production-ready']
        },
        {
          id: 'certification-application',
          name: 'Certification Application',
          description: 'Apply for halal certification',
          type: 'manual',
          nextStages: ['production-ready']
        },
        {
          id: 'production-ready',
          name: 'Production Ready',
          description: 'Product ready for production',
          type: 'approval',
          assignees: ['production-manager', 'director'],
          nextStages: ['completed']
        },
        {
          id: 'completed',
          name: 'Development Completed',
          description: 'Product development completed',
          type: 'manual',
          nextStages: []
        }
      ],
      triggers: [
        {
          event: 'recipe-completed',
          action: 'advance-stage',
          parameters: { targetStage: 'halal-analysis' }
        },
        {
          event: 'halal-analysis-completed',
          action: 'advance-stage',
          parameters: { targetStage: 'compliance-review' }
        }
      ],
      permissions: {
        'admin': ['create', 'read', 'update', 'delete', 'approve'],
        'product-manager': ['create', 'read', 'update', 'approve'],
        'developer': ['read', 'update'],
        'qa-manager': ['read', 'update', 'approve']
      }
    };
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe('workflow-execution-requested', this.handleWorkflowExecution.bind(this));
    this.eventBus.subscribe('organization-config-requested', this.handleOrganizationConfigRequest.bind(this));
    this.eventBus.subscribe('workflow-validation-requested', this.handleWorkflowValidation.bind(this));
  }

  public async process(input: WorkflowExecutionInput): Promise<WorkflowExecutionOutput> {
    this.logger.info(`Processing workflow execution for organization: ${input.organizationId}`);
    
    try {
      const orgConfig = this.organizationConfigs.get(input.organizationId);
      if (!orgConfig) {
        throw new Error(`Unknown organization: ${input.organizationId}`);
      }

      const workflow = orgConfig.workflows.find(w => w.id === input.workflowId);
      if (!workflow) {
        throw new Error(`Unknown workflow: ${input.workflowId}`);
      }

      let workflowInstance = this.getOrCreateWorkflowInstance(input, workflow);

      switch (input.action) {
        case 'create':
          workflowInstance = this.createWorkflowInstance(input, workflow);
          break;
        case 'advance':
          workflowInstance = await this.advanceWorkflow(workflowInstance, input);
          break;
        case 'validate':
          return await this.validateWorkflowData(workflowInstance, input);
        case 'complete':
          workflowInstance = this.completeWorkflow(workflowInstance);
          break;
        case 'cancel':
          workflowInstance = this.cancelWorkflow(workflowInstance);
          break;
      }

      const output: WorkflowExecutionOutput = {
        agentId: this.id,
        timestamp: new Date(),
        success: true,
        workflowInstanceId: workflowInstance.id,
        currentStage: workflowInstance.currentStage,
        nextPossibleStages: this.getNextPossibleStages(workflow, workflowInstance.currentStage),
        stageProgress: this.calculateStageProgress(workflow, workflowInstance),
        estimatedCompletion: this.calculateEstimatedCompletion(workflow, workflowInstance),
        assignedTo: this.getAssignedUsers(workflow, workflowInstance.currentStage)
      };

      // Emit workflow updated event
      this.eventBus.emit('workflow-updated', {
        organizationId: input.organizationId,
        workflowInstanceId: workflowInstance.id,
        currentStage: workflowInstance.currentStage,
        data: workflowInstance.data
      });

      return output;
    } catch (error) {
      this.logger.error(`Error processing workflow: ${error.message}`, undefined, error);
      
      return {
        agentId: this.id,
        timestamp: new Date(),
        success: false,
        error: error.message,
        workflowInstanceId: '',
        currentStage: '',
        nextPossibleStages: [],
        stageProgress: { completed: [], current: '', remaining: [] }
      };
    }
  }

  private getOrCreateWorkflowInstance(input: WorkflowExecutionInput, workflow: WorkflowDefinition): WorkflowInstance {
    const instanceId = input.context?.instanceId || `${input.organizationId}-${input.workflowId}-${Date.now()}`;
    
    let instance = this.workflowInstances.get(instanceId);
    if (!instance) {
      instance = this.createWorkflowInstance(input, workflow);
    }
    
    return instance;
  }

  private createWorkflowInstance(input: WorkflowExecutionInput, workflow: WorkflowDefinition): WorkflowInstance {
    const instanceId = `${input.organizationId}-${input.workflowId}-${Date.now()}`;
    
    const instance: WorkflowInstance = {
      id: instanceId,
      workflowId: workflow.id,
      organizationId: input.organizationId,
      currentStage: workflow.stages[0].id,
      data: input.data,
      history: [{
        stage: workflow.stages[0].id,
        timestamp: new Date(),
        userId: input.userId,
        action: 'created'
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflowInstances.set(instanceId, instance);
    return instance;
  }

  private async advanceWorkflow(instance: WorkflowInstance, input: WorkflowExecutionInput): Promise<WorkflowInstance> {
    const orgConfig = this.organizationConfigs.get(input.organizationId)!;
    const workflow = orgConfig.workflows.find(w => w.id === input.workflowId)!;
    const currentStage = workflow.stages.find(s => s.id === instance.currentStage)!;

    // Validate that the target stage is allowed
    if (input.targetStage && !currentStage.nextStages.includes(input.targetStage)) {
      throw new Error(`Invalid stage transition from ${instance.currentStage} to ${input.targetStage}`);
    }

    const targetStage = input.targetStage || currentStage.nextStages[0];
    
    // Update instance
    instance.currentStage = targetStage;
    instance.data = { ...instance.data, ...input.data };
    instance.updatedAt = new Date();
    instance.history.push({
      stage: targetStage,
      timestamp: new Date(),
      userId: input.userId,
      action: 'advanced'
    });

    // Trigger automated actions if the new stage is automated
    const newStage = workflow.stages.find(s => s.id === targetStage)!;
    if (newStage.type === 'automated') {
      await this.executeAutomatedStage(instance, newStage);
    }

    return instance;
  }

  private async executeAutomatedStage(instance: WorkflowInstance, stage: WorkflowStage): Promise<void> {
    this.logger.info(`Executing automated stage: ${stage.id}`);
    
    // Trigger appropriate agent based on stage type
    switch (stage.id) {
      case 'islamic-analysis':
      case 'halal-analysis':
        await this.eventBus.emit('ingredient-analysis-requested', {
          instanceId: instance.id,
          ingredients: instance.data.ingredients || [],
          productName: instance.data.productName
        });
        break;
      
      case 'certificate-generation':
        await this.eventBus.emit('certificate-generation-requested', {
          instanceId: instance.id,
          clientId: instance.data.clientId,
          productName: instance.data.productName,
          certificationType: 'halal'
        });
        break;
    }
  }

  private async validateWorkflowData(instance: WorkflowInstance, input: WorkflowExecutionInput): Promise<WorkflowExecutionOutput> {
    const orgConfig = this.organizationConfigs.get(input.organizationId)!;
    const workflow = orgConfig.workflows.find(w => w.id === input.workflowId)!;
    const currentStage = workflow.stages.find(s => s.id === instance.currentStage)!;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (currentStage.requiredFields) {
      for (const field of currentStage.requiredFields) {
        if (!instance.data[field]) {
          errors.push(`Required field missing: ${field}`);
        }
      }
    }

    // Apply validation rules
    if (currentStage.validationRules) {
      for (const rule of currentStage.validationRules) {
        const fieldValue = instance.data[rule.field];
        
        switch (rule.type) {
          case 'required':
            if (!fieldValue) {
              errors.push(rule.message);
            }
            break;
          case 'format':
            // Add format validation logic
            break;
          case 'custom':
            // Add custom validation logic
            break;
        }
      }
    }

    return {
      agentId: this.id,
      timestamp: new Date(),
      success: true,
      workflowInstanceId: instance.id,
      currentStage: instance.currentStage,
      nextPossibleStages: this.getNextPossibleStages(workflow, instance.currentStage),
      validationResults: {
        isValid: errors.length === 0,
        errors,
        warnings
      },
      stageProgress: this.calculateStageProgress(workflow, instance)
    };
  }

  private getNextPossibleStages(workflow: WorkflowDefinition, currentStageId: string): string[] {
    const currentStage = workflow.stages.find(s => s.id === currentStageId);
    return currentStage ? currentStage.nextStages : [];
  }

  private calculateStageProgress(workflow: WorkflowDefinition, instance: WorkflowInstance): { completed: string[]; current: string; remaining: string[] } {
    const allStages = workflow.stages.map(s => s.id);
    const currentIndex = allStages.indexOf(instance.currentStage);
    
    return {
      completed: allStages.slice(0, currentIndex),
      current: instance.currentStage,
      remaining: allStages.slice(currentIndex + 1)
    };
  }

  private calculateEstimatedCompletion(workflow: WorkflowDefinition, instance: WorkflowInstance): Date | undefined {
    const currentStage = workflow.stages.find(s => s.id === instance.currentStage);
    if (!currentStage) return undefined;

    let totalHours = 0;
    const currentIndex = workflow.stages.findIndex(s => s.id === instance.currentStage);
    
    for (let i = currentIndex; i < workflow.stages.length; i++) {
      const stage = workflow.stages[i];
      if (stage.estimatedDuration) {
        totalHours += stage.estimatedDuration;
      }
    }

    if (totalHours > 0) {
      const completion = new Date();
      completion.setTime(completion.getTime() + (totalHours * 60 * 60 * 1000));
      return completion;
    }

    return undefined;
  }

  private getAssignedUsers(workflow: WorkflowDefinition, stageId: string): string[] | undefined {
    const stage = workflow.stages.find(s => s.id === stageId);
    return stage?.assignees;
  }

  private completeWorkflow(instance: WorkflowInstance): WorkflowInstance {
    instance.currentStage = 'completed';
    instance.updatedAt = new Date();
    instance.history.push({
      stage: 'completed',
      timestamp: new Date(),
      action: 'completed'
    });
    return instance;
  }

  private cancelWorkflow(instance: WorkflowInstance): WorkflowInstance {
    instance.currentStage = 'cancelled';
    instance.updatedAt = new Date();
    instance.history.push({
      stage: 'cancelled',
      timestamp: new Date(),
      action: 'cancelled'
    });
    return instance;
  }

  private async handleWorkflowExecution(event: any): Promise<void> {
    const result = await this.process(event.data);
    this.eventBus.emit('workflow-execution-response', { 
      requestId: event.requestId, 
      result 
    });
  }

  private async handleOrganizationConfigRequest(event: any): Promise<void> {
    const { organizationId } = event.data;
    const config = this.organizationConfigs.get(organizationId);
    
    this.eventBus.emit('organization-config-response', { 
      requestId: event.requestId, 
      config 
    });
  }

  private async handleWorkflowValidation(event: any): Promise<void> {
    const result = await this.validateWorkflowData(event.data.instance, event.data.input);
    this.eventBus.emit('workflow-validation-response', { 
      requestId: event.requestId, 
      result 
    });
  }

  public getOrganizationConfig(organizationId: string): OrganizationConfig | null {
    return this.organizationConfigs.get(organizationId) || null;
  }

  public async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.name}`);
    // Save workflow instances if needed
    // Cleanup resources
  }
}

interface WorkflowInstance {
  id: string;
  workflowId: string;
  organizationId: string;
  currentStage: string;
  data: Record<string, any>;
  history: Array<{
    stage: string;
    timestamp: Date;
    userId?: string;
    action: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}