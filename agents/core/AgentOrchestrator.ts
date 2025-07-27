/**
 * Agent Orchestrator
 * 
 * Coordinates communication and workflows between multiple agents
 */

import { IAgent, AgentInput, AgentOutput, AgentOrchestrator as IAgentOrchestrator } from './IAgent';
import { AgentRegistry } from './AgentRegistry';
import { EventBus, Event } from './EventBus';
import { Logger } from './infrastructure/logging/Logger';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  errorHandling: ErrorHandlingStrategy;
  timeout?: number; // in milliseconds
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentCapability: string;
  input: Record<string, any> | ((context: WorkflowContext) => Record<string, any>);
  conditions?: WorkflowCondition[];
  retryPolicy?: RetryPolicy;
  timeout?: number;
  onSuccess?: string; // next step id
  onError?: string; // error handling step id
}

export interface WorkflowCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
  value: any;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number; // in milliseconds
  maxDelay?: number;
}

export interface ErrorHandlingStrategy {
  type: 'stop' | 'skip' | 'retry' | 'fallback';
  fallbackStep?: string;
  notifyOnError: boolean;
}

export interface WorkflowContext {
  workflowId: string;
  executionId: string;
  currentStep: string;
  data: Record<string, any>;
  results: Record<string, any>;
  startTime: Date;
  errors: Array<{ step: string; error: string; timestamp: Date }>;
  retryCount: Record<string, number>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  context: WorkflowContext;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  currentStepIndex: number;
  progress: number; // 0-100
}

export class AgentOrchestrator implements IAgentOrchestrator {
  private registry: AgentRegistry;
  private eventBus: EventBus;
  private logger: Logger;
  private workflows: Map<string, WorkflowDefinition>;
  private activeExecutions: Map<string, WorkflowExecution>;
  private completedExecutions: Map<string, WorkflowExecution>;
  private maxCompletedExecutions: number;

  constructor(registry: AgentRegistry, eventBus: EventBus, logger?: Logger) {
    this.registry = registry;
    this.eventBus = eventBus;
    this.logger = logger || new Logger('AgentOrchestrator');
    this.workflows = new Map();
    this.activeExecutions = new Map();
    this.completedExecutions = new Map();
    this.maxCompletedExecutions = 100;

    this.initialize();
  }

  private initialize(): void {
    this.logger.info('Initializing Agent Orchestrator');
    this.initializeDefaultWorkflows();
    this.subscribeToEvents();
  }

  private initializeDefaultWorkflows(): void {
    // Halal Analysis Workflow
    const halalAnalysisWorkflow: WorkflowDefinition = {
      id: 'halal-analysis-complete',
      name: 'Complete Halal Analysis',
      description: 'Full halal analysis including document processing, ingredient analysis, and report generation',
      steps: [
        {
          id: 'extract-ingredients',
          name: 'Extract Ingredients from Documents',
          agentCapability: 'extract-ingredients',
          input: (context) => ({
            documentType: context.data.documentType || 'pdf',
            filePath: context.data.filePath,
            extractionOptions: {
              extractIngredients: true,
              extractNutritionalInfo: true,
              extractCertificates: true
            }
          }),
          onSuccess: 'analyze-ingredients'
        },
        {
          id: 'analyze-ingredients',
          name: 'Analyze Ingredients for Halal Compliance',
          agentCapability: 'analyze-ingredients',
          input: (context) => ({
            ingredients: context.results['extract-ingredients']?.extractedData?.ingredients || context.data.ingredients,
            productName: context.data.productName,
            context: {
              madhab: context.data.madhab || 'General',
              strictnessLevel: context.data.strictnessLevel || 'moderate'
            }
          }),
          onSuccess: 'generate-report'
        },
        {
          id: 'generate-report',
          name: 'Generate Analysis Report',
          agentCapability: 'generate-analysis-report',
          input: (context) => ({
            analysisResults: context.results['analyze-ingredients'],
            documentData: context.results['extract-ingredients'],
            reportFormat: context.data.reportFormat || 'comprehensive'
          })
        }
      ],
      errorHandling: {
        type: 'retry',
        notifyOnError: true
      },
      timeout: 300000 // 5 minutes
    };

    // Certificate Generation Workflow
    const certificateWorkflow: WorkflowDefinition = {
      id: 'certificate-generation-complete',
      name: 'Complete Certificate Generation',
      description: 'Generate halal certificate with validation and verification features',
      steps: [
        {
          id: 'validate-application',
          name: 'Validate Application Data',
          agentCapability: 'validate-workflow-data',
          input: (context) => ({
            organizationId: context.data.organizationId,
            workflowId: 'halal-certification',
            data: context.data
          }),
          onSuccess: 'analyze-ingredients',
          onError: 'validation-failed'
        },
        {
          id: 'analyze-ingredients',
          name: 'Perform Ingredient Analysis',
          agentCapability: 'analyze-ingredients',
          input: (context) => ({
            ingredients: context.data.ingredients,
            productName: context.data.productName,
            context: { strictnessLevel: 'strict' }
          }),
          conditions: [
            { field: 'overallStatus', operator: 'eq', value: 'HALAL' }
          ],
          onSuccess: 'generate-certificate',
          onError: 'analysis-failed'
        },
        {
          id: 'generate-certificate',
          name: 'Generate Certificate',
          agentCapability: 'generate-halal-certificate',
          input: (context) => ({
            certificateType: 'halal',
            clientId: context.data.clientId,
            productName: context.data.productName,
            productDetails: context.data.productDetails,
            certificationDetails: context.data.certificationDetails,
            issuingAuthority: context.data.issuingAuthority,
            signatories: context.data.signatories,
            generateOptions: {
              format: 'pdf',
              includeQRCode: true,
              includeWatermark: true,
              language: 'en'
            }
          })
        },
        {
          id: 'validation-failed',
          name: 'Handle Validation Failure',
          agentCapability: 'send-notification',
          input: (context) => ({
            type: 'validation_failed',
            message: 'Application validation failed',
            errors: context.results['validate-application']?.validationResults?.errors
          })
        },
        {
          id: 'analysis-failed',
          name: 'Handle Analysis Failure',
          agentCapability: 'send-notification',
          input: (context) => ({
            type: 'analysis_failed',
            message: 'Ingredient analysis found non-halal components',
            analysisResults: context.results['analyze-ingredients']
          })
        }
      ],
      errorHandling: {
        type: 'fallback',
        notifyOnError: true
      }
    };

    this.workflows.set('halal-analysis-complete', halalAnalysisWorkflow);
    this.workflows.set('certificate-generation-complete', certificateWorkflow);
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe('workflow-execution-requested', this.handleWorkflowExecutionRequest.bind(this));
    this.eventBus.subscribe('agent-response', this.handleAgentResponse.bind(this));
  }

  public async executeWorkflow(workflowId: string, input: any): Promise<WorkflowExecution> {
    this.logger.info(`Starting workflow execution: ${workflowId}`);

    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'running',
      context: {
        workflowId,
        executionId,
        currentStep: workflow.steps[0].id,
        data: input,
        results: {},
        startTime: new Date(),
        errors: [],
        retryCount: {}
      },
      startTime: new Date(),
      currentStepIndex: 0,
      progress: 0
    };

    this.activeExecutions.set(executionId, execution);

    try {
      await this.executeWorkflowSteps(execution, workflow);
      return execution;
    } catch (error) {
      this.logger.error(`Workflow execution failed: ${workflowId}`, { executionId, error: error.message });
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      
      this.moveToCompleted(execution);
      throw error;
    }
  }

  private async executeWorkflowSteps(execution: WorkflowExecution, workflow: WorkflowDefinition): Promise<void> {
    let currentStepIndex = execution.currentStepIndex;

    while (currentStepIndex < workflow.steps.length) {
      const step = workflow.steps[currentStepIndex];
      execution.context.currentStep = step.id;
      execution.currentStepIndex = currentStepIndex;
      execution.progress = Math.round((currentStepIndex / workflow.steps.length) * 100);

      this.logger.debug(`Executing step: ${step.id}`, { executionId: execution.id });

      try {
        const shouldExecute = await this.evaluateConditions(step, execution.context);
        if (!shouldExecute) {
          this.logger.debug(`Skipping step due to unmet conditions: ${step.id}`);
          currentStepIndex++;
          continue;
        }

        const stepResult = await this.executeStep(step, execution.context);
        execution.context.results[step.id] = stepResult;

        // Determine next step
        const nextStepId = step.onSuccess || (currentStepIndex + 1 < workflow.steps.length ? workflow.steps[currentStepIndex + 1].id : null);
        
        if (nextStepId) {
          const nextStepIndex = workflow.steps.findIndex(s => s.id === nextStepId);
          if (nextStepIndex !== -1) {
            currentStepIndex = nextStepIndex;
          } else {
            currentStepIndex++;
          }
        } else {
          currentStepIndex++;
        }

      } catch (error) {
        this.logger.error(`Step execution failed: ${step.id}`, { 
          executionId: execution.id, 
          error: error.message 
        });

        execution.context.errors.push({
          step: step.id,
          error: error.message,
          timestamp: new Date()
        });

        const handled = await this.handleStepError(step, execution, workflow, error);
        if (!handled) {
          throw error;
        }

        // Move to error handling step if specified
        if (step.onError) {
          const errorStepIndex = workflow.steps.findIndex(s => s.id === step.onError);
          if (errorStepIndex !== -1) {
            currentStepIndex = errorStepIndex;
          } else {
            currentStepIndex++;
          }
        } else {
          currentStepIndex++;
        }
      }
    }

    // Mark as completed
    execution.status = 'completed';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    execution.progress = 100;

    this.logger.info(`Workflow completed successfully: ${workflow.id}`, { 
      executionId: execution.id,
      duration: execution.duration
    });

    this.moveToCompleted(execution);
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // Find agent with required capability
    const agents = this.registry.getByCapability(step.agentCapability);
    if (agents.length === 0) {
      throw new Error(`No agent found with capability: ${step.agentCapability}`);
    }

    const agent = agents[0]; // Use first available agent

    // Prepare input
    const input: AgentInput = {
      agentId: agent.id,
      requestId: `${context.executionId}_${step.id}`,
      timestamp: new Date(),
      context: typeof step.input === 'function' ? step.input(context) : step.input
    };

    // Execute with timeout and retry logic
    return await this.executeWithRetry(agent, input, step.retryPolicy);
  }

  private async executeWithRetry(agent: IAgent, input: AgentInput, retryPolicy?: RetryPolicy): Promise<any> {
    const maxAttempts = retryPolicy?.maxAttempts || 1;
    const baseDelay = retryPolicy?.baseDelay || 1000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await agent.process(input);
        if (result.success) {
          return result;
        } else {
          throw new Error(result.error || 'Agent execution failed');
        }
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }

        // Calculate delay based on strategy
        let delay = baseDelay;
        if (retryPolicy?.backoffStrategy === 'exponential') {
          delay = baseDelay * Math.pow(2, attempt - 1);
        } else if (retryPolicy?.backoffStrategy === 'linear') {
          delay = baseDelay * attempt;
        }

        if (retryPolicy?.maxDelay) {
          delay = Math.min(delay, retryPolicy.maxDelay);
        }

        this.logger.warn(`Step failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
        await this.sleep(delay);
      }
    }
  }

  private async evaluateConditions(step: WorkflowStep, context: WorkflowContext): Promise<boolean> {
    if (!step.conditions || step.conditions.length === 0) {
      return true;
    }

    for (const condition of step.conditions) {
      const value = this.getValueFromContext(context, condition.field);
      const conditionMet = this.evaluateCondition(value, condition.operator, condition.value);
      
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  private getValueFromContext(context: WorkflowContext, field: string): any {
    const parts = field.split('.');
    let value: any = context;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private evaluateCondition(value: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'eq':
        return value === expectedValue;
      case 'ne':
        return value !== expectedValue;
      case 'gt':
        return value > expectedValue;
      case 'lt':
        return value < expectedValue;
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(value);
      case 'contains':
        return typeof value === 'string' && value.includes(expectedValue);
      default:
        this.logger.warn(`Unknown condition operator: ${operator}`);
        return false;
    }
  }

  private async handleStepError(
    step: WorkflowStep,
    execution: WorkflowExecution,
    workflow: WorkflowDefinition,
    error: Error
  ): Promise<boolean> {
    switch (workflow.errorHandling.type) {
      case 'retry':
        const retryCount = execution.context.retryCount[step.id] || 0;
        const maxRetries = step.retryPolicy?.maxAttempts || 3;
        
        if (retryCount < maxRetries) {
          execution.context.retryCount[step.id] = retryCount + 1;
          this.logger.info(`Retrying step: ${step.id} (attempt ${retryCount + 1}/${maxRetries})`);
          return true;
        }
        return false;

      case 'skip':
        this.logger.warn(`Skipping failed step: ${step.id}`);
        return true;

      case 'fallback':
        if (workflow.errorHandling.fallbackStep) {
          this.logger.info(`Using fallback step: ${workflow.errorHandling.fallbackStep}`);
          return true;
        }
        return false;

      case 'stop':
      default:
        return false;
    }
  }

  private moveToCompleted(execution: WorkflowExecution): void {
    this.activeExecutions.delete(execution.id);
    this.completedExecutions.set(execution.id, execution);

    // Maintain size limit
    if (this.completedExecutions.size > this.maxCompletedExecutions) {
      const oldestExecution = Array.from(this.completedExecutions.values())
        .sort((a, b) => a.endTime!.getTime() - b.endTime!.getTime())[0];
      this.completedExecutions.delete(oldestExecution.id);
    }

    // Emit completion event
    this.eventBus.emit('workflow-completed', {
      executionId: execution.id,
      workflowId: execution.workflowId,
      status: execution.status,
      duration: execution.duration,
      results: execution.context.results
    });
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public registerAgent(agent: IAgent): void {
    this.registry.register(agent);
  }

  public unregisterAgent(agentId: string): void {
    this.registry.unregister(agentId);
  }

  public getAvailableAgents(): IAgent[] {
    return this.registry.getAll();
  }

  public async routeRequest(capability: string, input: AgentInput): Promise<AgentOutput> {
    const agent = this.registry.findBestAgent(capability);
    if (!agent) {
      throw new Error(`No agent available for capability: ${capability}`);
    }

    return await agent.process(input);
  }

  public getWorkflowDefinitions(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  public getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.activeExecutions.values());
  }

  public getCompletedExecutions(): WorkflowExecution[] {
    return Array.from(this.completedExecutions.values());
  }

  public async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.activeExecutions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      
      this.moveToCompleted(execution);
      this.logger.info(`Workflow execution cancelled: ${executionId}`);
      return true;
    }
    return false;
  }

  private async handleWorkflowExecutionRequest(event: Event): Promise<void> {
    try {
      const { workflowId, input } = event.data;
      const execution = await this.executeWorkflow(workflowId, input);
      
      this.eventBus.emit('workflow-execution-response', {
        requestId: event.data.requestId,
        execution
      });
    } catch (error) {
      this.eventBus.emit('workflow-execution-error', {
        requestId: event.data.requestId,
        error: error.message
      });
    }
  }

  private async handleAgentResponse(event: Event): Promise<void> {
    // Handle responses from agents in workflow context
    this.logger.debug('Received agent response', { 
      agentId: event.source,
      requestId: event.data.requestId 
    });
  }

  public getOrchestrationStats(): {
    activeExecutions: number;
    completedExecutions: number;
    totalWorkflows: number;
    averageExecutionTime: number;
    successRate: number;
  } {
    const completed = Array.from(this.completedExecutions.values());
    const successful = completed.filter(e => e.status === 'completed');
    const totalDuration = completed.reduce((sum, e) => sum + (e.duration || 0), 0);

    return {
      activeExecutions: this.activeExecutions.size,
      completedExecutions: this.completedExecutions.size,
      totalWorkflows: this.workflows.size,
      averageExecutionTime: completed.length > 0 ? totalDuration / completed.length : 0,
      successRate: completed.length > 0 ? (successful.length / completed.length) * 100 : 0
    };
  }
}