/**
 * Agent Registry
 *
 * Manages registration and discovery of agents in the system
 */
import { IAgent, AgentRegistry as IAgentRegistry, AgentMetrics } from './IAgent';
import { Logger } from './infrastructure/logging/Logger';
export declare class AgentRegistry implements IAgentRegistry {
    private agents;
    private logger;
    constructor(logger?: Logger);
    register(agent: IAgent): void;
    unregister(agentId: string): void;
    get(agentId: string): IAgent | null;
    getAll(): IAgent[];
    getByCapability(capability: string): IAgent[];
    getCapabilities(): string[];
    healthCheck(): Promise<{
        agentId: string;
        healthy: boolean;
        error?: string;
    }[]>;
    getMetrics(): {
        agentId: string;
        metrics: AgentMetrics | null;
    }[];
    getRegistryStats(): {
        totalAgents: number;
        totalCapabilities: number;
        agentsByCapability: Record<string, number>;
        agentsList: Array<{
            id: string;
            name: string;
            version: string;
            capabilities: string[];
        }>;
    };
    shutdownAll(): Promise<void>;
    findBestAgent(capability: string, criteria?: {
        preferVersion?: string;
        requireHealthy?: boolean;
    }): IAgent | null;
    /**
     * Subscribe to agent registration/unregistration events
     */
    onAgentRegistered(callback: (agent: IAgent) => void): () => void;
    onAgentUnregistered(callback: (agentId: string) => void): () => void;
}
//# sourceMappingURL=AgentRegistry.d.ts.map