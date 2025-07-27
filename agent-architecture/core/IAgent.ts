/**
 * Core Agent Interface for HalalCheck AI Agent-Based Architecture
 * Defines the contract that all domain agents must implement
 */

export interface AgentCapability {
  name: string
  description: string
  inputTypes: string[]
  outputTypes: string[]
  dependencies?: string[]
}

export interface AgentContext {
  userId: string
  organizationType: 'certification-body' | 'food-manufacturer'
  sessionId: string
  permissions: string[]
  preferences: Record<string, any>
}

export interface AgentMessage {
  id: string
  type: string
  payload: any
  metadata: {
    timestamp: Date
    source: string
    target?: string
    correlationId?: string
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }
}

export interface AgentResult<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata: {
    processingTime: number
    agentId: string
    timestamp: Date
  }
}

export interface IAgent {
  readonly id: string
  readonly name: string
  readonly version: string
  readonly capabilities: AgentCapability[]
  readonly isHealthy: boolean

  // Lifecycle management
  initialize(context: AgentContext): Promise<void>
  shutdown(): Promise<void>
  healthCheck(): Promise<boolean>

  // Core processing
  canHandle(message: AgentMessage): boolean
  process(message: AgentMessage, context: AgentContext): Promise<AgentResult>

  // Event handling for agent coordination
  onMessage(handler: (message: AgentMessage) => void): void
  sendMessage(message: AgentMessage): Promise<void>

  // Configuration and adaptation
  configure(config: Record<string, any>): Promise<void>
  getMetrics(): Promise<Record<string, any>>
}

export interface AgentFactory {
  createAgent(type: string, config?: Record<string, any>): Promise<IAgent>
  getAvailableAgentTypes(): string[]
}

export interface AgentOrchestrator {
  registerAgent(agent: IAgent): Promise<void>
  unregisterAgent(agentId: string): Promise<void>
  routeMessage(message: AgentMessage): Promise<AgentResult[]>
  getAgentById(agentId: string): IAgent | undefined
  getAgentsByCapability(capability: string): IAgent[]
  executeWorkflow(workflowId: string, input: any, context: AgentContext): Promise<AgentResult>
}