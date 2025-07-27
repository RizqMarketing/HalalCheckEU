/**
 * Migration Script to Agent-Based Architecture
 *
 * Demonstrates how to integrate the new agent system with existing backend
 */
import { AgentSystem } from '../AgentSystem';
import { AgentAPIAdapter } from './AgentAPIAdapter';
export declare function migrateToAgentSystem(): Promise<{
    agentSystem: AgentSystem;
    apiAdapter: AgentAPIAdapter;
    migrationReport: MigrationReport;
}>;
export declare function integrateWithExpress(app: any, apiAdapter: AgentAPIAdapter): void;
export interface MigrationReport {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    success: boolean;
    steps: Array<{
        name: string;
        status: 'completed' | 'failed' | 'warning';
        timestamp: Date;
        details: string;
    }>;
    errors: Array<{
        step: string;
        error: string;
        timestamp: Date;
    }>;
}
export declare function main(): Promise<void>;
//# sourceMappingURL=migrate-to-agents.d.ts.map