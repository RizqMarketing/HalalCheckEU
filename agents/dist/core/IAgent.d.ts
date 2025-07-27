/**
 * Core Agent Interface
 *
 * Defines the contract that all agents must implement in the system
 */
export interface AgentCapability {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    outputSchema: Record<string, any>;
}
export interface AgentInput {
    agentId?: string;
    requestId?: string;
    timestamp?: Date;
    context?: Record<string, any>;
}
export interface AgentOutput {
    agentId: string;
    requestId?: string;
    timestamp: Date;
    success: boolean;
    error?: string;
    data?: any;
}
export interface AgentMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    lastRequestTime?: Date;
}
export interface IAgent {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly capabilities: AgentCapability[];
    /**
     * Process a request and return a response
     */
    process(input: AgentInput): Promise<AgentOutput>;
    /**
     * Health check for the agent
     */
    healthCheck?(): Promise<boolean>;
    /**
     * Graceful shutdown of the agent
     */
    shutdown?(): Promise<void>;
    /**
     * Get agent metrics
     */
    getMetrics?(): AgentMetrics;
}
export interface AgentRegistry {
    register(agent: IAgent): void;
    unregister(agentId: string): void;
    get(agentId: string): IAgent | null;
    getAll(): IAgent[];
    getByCapability(capability: string): IAgent[];
}
export interface AgentOrchestrator {
    executeWorkflow(workflowId: string, input: any): Promise<any>;
    registerAgent(agent: IAgent): void;
    unregisterAgent(agentId: string): void;
    getAvailableAgents(): IAgent[];
    routeRequest(capability: string, input: AgentInput): Promise<AgentOutput>;
}
//# sourceMappingURL=IAgent.d.ts.map