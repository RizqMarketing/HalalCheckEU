/**
 * Agent System Bootstrap
 *
 * Main entry point for the agent-based architecture system
 */
import { EventBus } from './core/EventBus';
import { AgentRegistry } from './core/AgentRegistry';
import { AgentOrchestrator } from './core/AgentOrchestrator';
import { LogLevel } from './core/infrastructure/logging/Logger';
export interface AgentSystemConfig {
    logLevel?: LogLevel;
    enableMetrics?: boolean;
    enableHealthChecks?: boolean;
    maxEventHistory?: number;
    eventBusConfig?: {
        maxHistorySize?: number;
    };
}
export declare class AgentSystem {
    private eventBus;
    private registry;
    private orchestrator;
    private logger;
    private agents;
    private isInitialized;
    private config;
    constructor(config?: AgentSystemConfig);
    initialize(): Promise<void>;
    private initializeAgents;
    private setupSystemEventHandlers;
    private setupCrossAgentCommunication;
    private startHealthChecks;
    analyzeIngredients(ingredients: string[], productName: string, options?: any): Promise<any>;
    processDocument(documentType: string, filePath: string, options?: any): Promise<any>;
    executeWorkflow(workflowId: string, input: any): Promise<any>;
    generateCertificate(certificateData: any): Promise<any>;
    getOrganizationConfig(organizationId: string): any;
    getSystemStatus(): {
        initialized: boolean;
        agentCount: number;
        capabilities: string[];
        activeExecutions: number;
        eventBusStats: any;
        orchestrationStats: any;
    };
    getAgentMetrics(): any[];
    shutdown(): Promise<void>;
    getEventBus(): EventBus;
    getOrchestrator(): AgentOrchestrator;
    getRegistry(): AgentRegistry;
    private ensureInitialized;
    static create(config?: AgentSystemConfig): Promise<AgentSystem>;
}
//# sourceMappingURL=AgentSystem.d.ts.map