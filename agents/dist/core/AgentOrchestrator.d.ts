/**
 * Agent Orchestrator
 *
 * Coordinates communication and workflows between multiple agents
 */
import { IAgent, AgentInput, AgentOutput, AgentOrchestrator as IAgentOrchestrator } from './IAgent';
import { AgentRegistry } from './AgentRegistry';
import { EventBus } from './EventBus';
import { Logger } from './infrastructure/logging/Logger';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    errorHandling: ErrorHandlingStrategy;
    timeout?: number;
}
export interface WorkflowStep {
    id: string;
    name: string;
    agentCapability: string;
    input: Record<string, any> | ((context: WorkflowContext) => Record<string, any>);
    conditions?: WorkflowCondition[];
    retryPolicy?: RetryPolicy;
    timeout?: number;
    onSuccess?: string;
    onError?: string;
}
export interface WorkflowCondition {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'contains';
    value: any;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential' | 'linear';
    baseDelay: number;
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
    errors: Array<{
        step: string;
        error: string;
        timestamp: Date;
    }>;
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
    progress: number;
}
export declare class AgentOrchestrator implements IAgentOrchestrator {
    private registry;
    private eventBus;
    private logger;
    private workflows;
    private activeExecutions;
    private completedExecutions;
    private maxCompletedExecutions;
    constructor(registry: AgentRegistry, eventBus: EventBus, logger?: Logger);
    private initialize;
    private initializeDefaultWorkflows;
    private subscribeToEvents;
    executeWorkflow(workflowId: string, input: any): Promise<WorkflowExecution>;
    private executeWorkflowSteps;
    private executeStep;
    private executeWithRetry;
    private evaluateConditions;
    private getValueFromContext;
    private evaluateCondition;
    private handleStepError;
    private moveToCompleted;
    private generateExecutionId;
    private sleep;
    registerAgent(agent: IAgent): void;
    unregisterAgent(agentId: string): void;
    getAvailableAgents(): IAgent[];
    routeRequest(capability: string, input: AgentInput): Promise<AgentOutput>;
    getWorkflowDefinitions(): WorkflowDefinition[];
    getActiveExecutions(): WorkflowExecution[];
    getCompletedExecutions(): WorkflowExecution[];
    cancelExecution(executionId: string): Promise<boolean>;
    private handleWorkflowExecutionRequest;
    private handleAgentResponse;
    getOrchestrationStats(): {
        activeExecutions: number;
        completedExecutions: number;
        totalWorkflows: number;
        averageExecutionTime: number;
        successRate: number;
    };
}
//# sourceMappingURL=AgentOrchestrator.d.ts.map