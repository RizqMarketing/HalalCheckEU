"use strict";
/**
 * Agent Registry
 *
 * Manages registration and discovery of agents in the system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRegistry = void 0;
const Logger_1 = require("./infrastructure/logging/Logger");
class AgentRegistry {
    constructor(logger) {
        this.agents = new Map();
        this.logger = logger || new Logger_1.Logger('AgentRegistry');
    }
    register(agent) {
        if (this.agents.has(agent.id)) {
            this.logger.warn(`Agent ${agent.id} is already registered. Replacing existing registration.`);
        }
        this.agents.set(agent.id, agent);
        this.logger.info(`Registered agent: ${agent.id} (${agent.name} v${agent.version})`, {
            agentId: agent.id,
            capabilities: agent.capabilities.map(c => c.name)
        });
    }
    unregister(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            this.agents.delete(agentId);
            this.logger.info(`Unregistered agent: ${agentId}`);
            // Graceful shutdown if supported
            if (agent.shutdown) {
                agent.shutdown().catch(error => {
                    this.logger.error(`Error during agent shutdown: ${agentId}`, undefined, error);
                });
            }
        }
        else {
            this.logger.warn(`Attempted to unregister unknown agent: ${agentId}`);
        }
    }
    get(agentId) {
        return this.agents.get(agentId) || null;
    }
    getAll() {
        return Array.from(this.agents.values());
    }
    getByCapability(capability) {
        return Array.from(this.agents.values()).filter(agent => agent.capabilities.some(cap => cap.name === capability));
    }
    getCapabilities() {
        const capabilities = new Set();
        for (const agent of this.agents.values()) {
            for (const capability of agent.capabilities) {
                capabilities.add(capability.name);
            }
        }
        return Array.from(capabilities);
    }
    async healthCheck() {
        const results = await Promise.all(Array.from(this.agents.entries()).map(async ([agentId, agent]) => {
            try {
                if (agent.healthCheck) {
                    const healthy = await agent.healthCheck();
                    return { agentId, healthy };
                }
                else {
                    // If no health check method, assume healthy
                    return { agentId, healthy: true };
                }
            }
            catch (error) {
                this.logger.error(`Health check failed for agent ${agentId}`, undefined, error);
                return {
                    agentId,
                    healthy: false,
                    error: error.message || 'Unknown error'
                };
            }
        }));
        const unhealthyAgents = results.filter(r => !r.healthy);
        if (unhealthyAgents.length > 0) {
            this.logger.warn(`Found ${unhealthyAgents.length} unhealthy agents`, {
                unhealthyAgents: unhealthyAgents.map(a => a.agentId)
            });
        }
        return results;
    }
    getMetrics() {
        return Array.from(this.agents.entries()).map(([agentId, agent]) => ({
            agentId,
            metrics: agent.getMetrics ? agent.getMetrics() : null
        }));
    }
    getRegistryStats() {
        const capabilities = this.getCapabilities();
        const agentsByCapability = {};
        // Count agents by capability
        capabilities.forEach(capability => {
            agentsByCapability[capability] = this.getByCapability(capability).length;
        });
        const agentsList = Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            name: agent.name,
            version: agent.version,
            capabilities: agent.capabilities.map(c => c.name)
        }));
        return {
            totalAgents: this.agents.size,
            totalCapabilities: capabilities.length,
            agentsByCapability,
            agentsList
        };
    }
    async shutdownAll() {
        this.logger.info('Shutting down all agents...');
        const shutdownPromises = Array.from(this.agents.values()).map(async (agent) => {
            try {
                if (agent.shutdown) {
                    await agent.shutdown();
                }
                this.logger.debug(`Agent ${agent.id} shut down successfully`);
            }
            catch (error) {
                this.logger.error(`Error shutting down agent ${agent.id}`, undefined, error);
            }
        });
        await Promise.all(shutdownPromises);
        this.agents.clear();
        this.logger.info('All agents shut down');
    }
    findBestAgent(capability, criteria) {
        const candidateAgents = this.getByCapability(capability);
        if (candidateAgents.length === 0) {
            return null;
        }
        // If only one candidate, return it
        if (candidateAgents.length === 1) {
            return candidateAgents[0];
        }
        // Apply filtering and selection logic
        let bestAgent = candidateAgents[0];
        // Prefer specific version if requested
        if (criteria?.preferVersion) {
            const versionMatch = candidateAgents.find(agent => agent.version === criteria.preferVersion);
            if (versionMatch) {
                bestAgent = versionMatch;
            }
        }
        // Could add more sophisticated selection logic here
        // For now, just return the first match or version preference
        return bestAgent;
    }
    /**
     * Subscribe to agent registration/unregistration events
     */
    onAgentRegistered(callback) {
        // This would typically integrate with the EventBus
        // For now, return a no-op unsubscribe function
        return () => { };
    }
    onAgentUnregistered(callback) {
        // This would typically integrate with the EventBus
        // For now, return a no-op unsubscribe function
        return () => { };
    }
}
exports.AgentRegistry = AgentRegistry;
//# sourceMappingURL=AgentRegistry.js.map