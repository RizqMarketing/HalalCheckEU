/**
 * Agent Orchestrator - Central coordination and management system
 * Handles agent lifecycle, message routing, and workflow execution
 */

import { 
  IAgent, 
  AgentMessage, 
  AgentResult, 
  AgentContext, 
  AgentOrchestrator as IAgentOrchestrator,
  AgentCapability 
} from './IAgent'
import { EventBus, Workflow, WorkflowExecution } from './EventBus'

export interface OrchestrationConfig {
  maxConcurrentWorkflows: number
  defaultTimeout: number
  enableMetrics: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface AgentMetrics {
  agentId: string
  messagesProcessed: number
  averageProcessingTime: number
  successRate: number
  lastActive: Date
  errors: number
}

export class AgentOrchestrator implements IAgentOrchestrator {
  private agents: Map<string, IAgent> = new Map()
  private eventBus: EventBus
  private metrics: Map<string, AgentMetrics> = new Map()
  private config: OrchestrationConfig

  constructor(config: Partial<OrchestrationConfig> = {}) {
    this.config = {
      maxConcurrentWorkflows: 10,
      defaultTimeout: 30000,
      enableMetrics: true,
      logLevel: 'info',
      ...config
    }
    
    this.eventBus = new EventBus()
    this.setupEventHandlers()
  }

  // Agent Management
  async registerAgent(agent: IAgent): Promise<void> {
    if (this.agents.has(agent.id)) {
      throw new Error(`Agent with ID ${agent.id} is already registered`)
    }

    // Initialize the agent
    await agent.initialize({} as AgentContext) // Will be properly set per request
    
    // Set up message handling
    agent.onMessage(async (message: AgentMessage) => {
      await this.eventBus.publish(message)
    })

    // Subscribe agent to relevant messages
    this.subscribeAgentToMessages(agent)

    this.agents.set(agent.id, agent)
    
    // Initialize metrics
    if (this.config.enableMetrics) {
      this.metrics.set(agent.id, {
        agentId: agent.id,
        messagesProcessed: 0,
        averageProcessingTime: 0,
        successRate: 100,
        lastActive: new Date(),
        errors: 0
      })
    }

    this.log('info', `Agent registered: ${agent.id} (${agent.name})`)
  }

  async unregisterAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`)
    }

    await agent.shutdown()
    this.agents.delete(agentId)
    this.metrics.delete(agentId)
    
    this.log('info', `Agent unregistered: ${agentId}`)
  }

  // Message Routing
  async routeMessage(message: AgentMessage): Promise<AgentResult[]> {
    const startTime = Date.now()
    
    try {
      // Find capable agents
      const capableAgents = this.findCapableAgents(message)
      
      if (capableAgents.length === 0) {
        this.log('warn', `No capable agents found for message type: ${message.type}`)
        return [{
          success: false,
          error: {
            code: 'NO_CAPABLE_AGENT',
            message: `No agent can handle message type: ${message.type}`
          },
          metadata: {
            processingTime: Date.now() - startTime,
            agentId: 'orchestrator',
            timestamp: new Date()
          }
        }]
      }

      // Route to specific agent if target is specified
      if (message.metadata.target) {
        const targetAgent = capableAgents.find(a => a.id === message.metadata.target)
        if (targetAgent) {
          return [await this.processWithAgent(targetAgent, message)]
        }
      }

      // Otherwise, process with all capable agents (parallel processing)
      const results = await Promise.all(
        capableAgents.map(agent => this.processWithAgent(agent, message))
      )

      return results
    } catch (error) {
      this.log('error', `Message routing failed:`, error)
      return [{
        success: false,
        error: {
          code: 'ROUTING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown routing error'
        },
        metadata: {
          processingTime: Date.now() - startTime,
          agentId: 'orchestrator',
          timestamp: new Date()
        }
      }]
    }
  }

  // Workflow Execution
  async executeWorkflow(
    workflowId: string, 
    input: any, 
    context: AgentContext
  ): Promise<AgentResult> {
    const startTime = Date.now()
    
    try {
      const execution = await this.eventBus.executeWorkflow(workflowId, input, context)
      
      // Wait for completion or timeout
      await this.waitForWorkflowCompletion(execution)
      
      if (execution.status === 'completed') {
        return {
          success: true,
          data: {
            executionId: execution.id,
            results: Object.fromEntries(execution.results),
            context: execution.context
          },
          metadata: {
            processingTime: Date.now() - startTime,
            agentId: 'orchestrator',
            timestamp: new Date()
          }
        }
      } else {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_FAILED',
            message: execution.error?.message || `Workflow ended with status: ${execution.status}`,
            details: { executionId: execution.id, status: execution.status }
          },
          metadata: {
            processingTime: Date.now() - startTime,
            agentId: 'orchestrator',
            timestamp: new Date()
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_ERROR',
          message: error instanceof Error ? error.message : 'Unknown workflow error'
        },
        metadata: {
          processingTime: Date.now() - startTime,
          agentId: 'orchestrator',
          timestamp: new Date()
        }
      }
    }
  }

  // Query Methods
  getAgentById(agentId: string): IAgent | undefined {
    return this.agents.get(agentId)
  }

  getAgentsByCapability(capability: string): IAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.capabilities.some(cap => cap.name === capability)
    )
  }

  getAllAgents(): IAgent[] {
    return Array.from(this.agents.values())
  }

  getAgentMetrics(): AgentMetrics[] {
    return Array.from(this.metrics.values())
  }

  // Workflow Management
  registerWorkflow(workflow: Workflow): void {
    this.eventBus.registerWorkflow(workflow)
    this.log('info', `Workflow registered: ${workflow.id}`)
  }

  getActiveWorkflows(): WorkflowExecution[] {
    return this.eventBus.getActiveWorkflows()
  }

  // Health and Monitoring
  async healthCheck(): Promise<boolean> {
    const healthChecks = await Promise.allSettled(
      Array.from(this.agents.values()).map(agent => agent.healthCheck())
    )
    
    const unhealthyAgents = healthChecks
      .map((result, index) => ({ result, agent: Array.from(this.agents.values())[index] }))
      .filter(({ result }) => result.status === 'rejected' || result.value === false)
    
    if (unhealthyAgents.length > 0) {
      this.log('warn', `Unhealthy agents detected:`, unhealthyAgents.map(({ agent }) => agent.id))
    }
    
    return unhealthyAgents.length === 0
  }

  // Private Methods
  private setupEventHandlers(): void {
    this.eventBus.on('message-published', (data) => {
      this.log('debug', `Message published:`, data.message.id)
    })

    this.eventBus.on('delivery-error', (data) => {
      this.log('error', `Message delivery failed:`, data)
      this.updateAgentMetrics(data.subscription, false, 0)
    })
  }

  private subscribeAgentToMessages(agent: IAgent): void {
    // Subscribe agent to messages it can handle
    agent.capabilities.forEach(capability => {
      this.eventBus.subscribe(
        agent,
        { type: capability.name },
        async (message: AgentMessage) => {
          const context: AgentContext = {
            userId: message.metadata.source,
            organizationType: 'certification-body', // Will be extracted from message
            sessionId: message.metadata.correlationId || '',
            permissions: [],
            preferences: {}
          }
          
          await this.processWithAgent(agent, message, context)
        }
      )
    })
  }

  private findCapableAgents(message: AgentMessage): IAgent[] {
    return Array.from(this.agents.values()).filter(agent => 
      agent.canHandle(message) && agent.isHealthy
    )
  }

  private async processWithAgent(
    agent: IAgent, 
    message: AgentMessage, 
    context?: AgentContext
  ): Promise<AgentResult> {
    const startTime = Date.now()
    
    try {
      const defaultContext: AgentContext = {
        userId: message.metadata.source,
        organizationType: 'certification-body',
        sessionId: message.metadata.correlationId || '',
        permissions: [],
        preferences: {}
      }
      
      const result = await agent.process(message, context || defaultContext)
      
      const processingTime = Date.now() - startTime
      this.updateAgentMetrics(agent.id, result.success, processingTime)
      
      return result
    } catch (error) {
      const processingTime = Date.now() - startTime
      this.updateAgentMetrics(agent.id, false, processingTime)
      
      return {
        success: false,
        error: {
          code: 'AGENT_PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown processing error',
          details: { agentId: agent.id }
        },
        metadata: {
          processingTime,
          agentId: agent.id,
          timestamp: new Date()
        }
      }
    }
  }

  private async waitForWorkflowCompletion(execution: WorkflowExecution): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (execution.status === 'completed' || execution.status === 'failed' || execution.status === 'cancelled') {
          clearInterval(checkInterval)
          resolve()
        }
      }, 100)

      // Timeout after configured time
      setTimeout(() => {
        clearInterval(checkInterval)
        execution.cancel()
        reject(new Error('Workflow execution timeout'))
      }, this.config.defaultTimeout)
    })
  }

  private updateAgentMetrics(agentId: string, success: boolean, processingTime: number): void {
    if (!this.config.enableMetrics) return
    
    const metrics = this.metrics.get(agentId)
    if (!metrics) return

    metrics.messagesProcessed++
    metrics.lastActive = new Date()
    
    // Update average processing time
    metrics.averageProcessingTime = 
      (metrics.averageProcessingTime * (metrics.messagesProcessed - 1) + processingTime) / 
      metrics.messagesProcessed

    // Update success rate
    if (!success) {
      metrics.errors++
    }
    metrics.successRate = ((metrics.messagesProcessed - metrics.errors) / metrics.messagesProcessed) * 100
  }

  private log(level: string, message: string, ...args: any[]): void {
    const logLevels = { debug: 0, info: 1, warn: 2, error: 3 }
    const currentLevel = logLevels[this.config.logLevel]
    const messageLevel = logLevels[level as keyof typeof logLevels]
    
    if (messageLevel >= currentLevel) {
      console[level as 'log'](`[AgentOrchestrator] ${message}`, ...args)
    }
  }
}