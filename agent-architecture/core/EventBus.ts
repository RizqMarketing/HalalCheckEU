/**
 * Event-Driven Communication System for Agent Coordination
 * Handles message routing, event distribution, and workflow orchestration
 */

import { EventEmitter } from 'events'
import { AgentMessage, AgentResult, IAgent } from './IAgent'

export interface EventPattern {
  type?: string
  source?: string
  target?: string
  priority?: string
}

export interface EventSubscription {
  id: string
  pattern: EventPattern
  handler: (message: AgentMessage) => Promise<void>
  agent: IAgent
}

export interface WorkflowStep {
  agentId: string
  operation: string
  input?: any
  condition?: (context: any) => boolean
  onSuccess?: string
  onFailure?: string
  timeout?: number
}

export interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  organizationType?: string[]
}

export class EventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription[]> = new Map()
  private messageHistory: AgentMessage[] = []
  private workflows: Map<string, Workflow> = new Map()
  private activeWorkflows: Map<string, WorkflowExecution> = new Map()

  constructor(private maxHistorySize: number = 1000) {
    super()
    this.setMaxListeners(100) // Support many agents
  }

  // Message routing and distribution
  async publish(message: AgentMessage): Promise<void> {
    this.addToHistory(message)
    
    const matchingSubscriptions = this.findMatchingSubscriptions(message)
    
    // Process subscriptions in priority order
    const prioritizedSubs = this.prioritizeSubscriptions(matchingSubscriptions, message)
    
    const results = await Promise.allSettled(
      prioritizedSubs.map(sub => this.deliverMessage(sub, message))
    )

    // Log any failed deliveries
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Message delivery failed to ${prioritizedSubs[index].agent.id}:`, result.reason)
      }
    })

    // Emit event for monitoring
    this.emit('message-published', { message, deliveries: results.length })
  }

  // Subscription management
  subscribe(agent: IAgent, pattern: EventPattern, handler: (message: AgentMessage) => Promise<void>): string {
    const subscriptionId = `${agent.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const subscription: EventSubscription = {
      id: subscriptionId,
      pattern,
      handler,
      agent
    }

    const key = this.getPatternKey(pattern)
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, [])
    }
    this.subscriptions.get(key)!.push(subscription)

    return subscriptionId
  }

  unsubscribe(subscriptionId: string): boolean {
    for (const [key, subs] of this.subscriptions.entries()) {
      const index = subs.findIndex(sub => sub.id === subscriptionId)
      if (index !== -1) {
        subs.splice(index, 1)
        if (subs.length === 0) {
          this.subscriptions.delete(key)
        }
        return true
      }
    }
    return false
  }

  // Workflow management
  registerWorkflow(workflow: Workflow): void {
    this.workflows.set(workflow.id, workflow)
  }

  async executeWorkflow(
    workflowId: string, 
    input: any, 
    context: any
  ): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`)
    }

    const executionId = `${workflowId}-${Date.now()}`
    const execution = new WorkflowExecution(executionId, workflow, this)
    
    this.activeWorkflows.set(executionId, execution)
    
    try {
      await execution.start(input, context)
      return execution
    } catch (error) {
      this.activeWorkflows.delete(executionId)
      throw error
    }
  }

  // Query and monitoring
  getMessageHistory(filter?: Partial<AgentMessage>): AgentMessage[] {
    if (!filter) return [...this.messageHistory]
    
    return this.messageHistory.filter(msg => 
      Object.entries(filter).every(([key, value]) => 
        (msg as any)[key] === value
      )
    )
  }

  getActiveWorkflows(): WorkflowExecution[] {
    return Array.from(this.activeWorkflows.values())
  }

  getWorkflowStatus(executionId: string): WorkflowExecution | undefined {
    return this.activeWorkflows.get(executionId)
  }

  // Private methods
  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message)
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift()
    }
  }

  private findMatchingSubscriptions(message: AgentMessage): EventSubscription[] {
    const matches: EventSubscription[] = []
    
    for (const [key, subs] of this.subscriptions.entries()) {
      for (const sub of subs) {
        if (this.matchesPattern(message, sub.pattern)) {
          matches.push(sub)
        }
      }
    }
    
    return matches
  }

  private matchesPattern(message: AgentMessage, pattern: EventPattern): boolean {
    return (
      (!pattern.type || pattern.type === message.type) &&
      (!pattern.source || pattern.source === message.metadata.source) &&
      (!pattern.target || pattern.target === message.metadata.target) &&
      (!pattern.priority || pattern.priority === message.metadata.priority)
    )
  }

  private prioritizeSubscriptions(
    subscriptions: EventSubscription[], 
    message: AgentMessage
  ): EventSubscription[] {
    return subscriptions.sort((a, b) => {
      // Exact target matches get highest priority
      if (message.metadata.target === a.agent.id) return -1
      if (message.metadata.target === b.agent.id) return 1
      
      // Then by message priority
      const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 }
      const aPriority = priorityOrder[message.metadata.priority] ?? 2
      const bPriority = priorityOrder[message.metadata.priority] ?? 2
      
      return aPriority - bPriority
    })
  }

  private async deliverMessage(subscription: EventSubscription, message: AgentMessage): Promise<void> {
    try {
      await subscription.handler(message)
      this.emit('message-delivered', { subscription: subscription.id, message: message.id })
    } catch (error) {
      this.emit('delivery-error', { subscription: subscription.id, message: message.id, error })
      throw error
    }
  }

  private getPatternKey(pattern: EventPattern): string {
    return `${pattern.type || '*'}-${pattern.source || '*'}-${pattern.target || '*'}`
  }
}

export class WorkflowExecution {
  public readonly id: string
  public readonly workflow: Workflow
  public status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' = 'pending'
  public currentStep: number = 0
  public context: any = {}
  public results: Map<string, AgentResult> = new Map()
  public startTime?: Date
  public endTime?: Date
  public error?: Error

  constructor(
    id: string,
    workflow: Workflow,
    private eventBus: EventBus
  ) {
    this.id = id
    this.workflow = workflow
  }

  async start(input: any, context: any): Promise<void> {
    this.status = 'running'
    this.startTime = new Date()
    this.context = { ...context, input, workflowId: this.id }

    try {
      await this.executeSteps()
      this.status = 'completed'
    } catch (error) {
      this.status = 'failed'
      this.error = error as Error
      throw error
    } finally {
      this.endTime = new Date()
    }
  }

  private async executeSteps(): Promise<void> {
    for (let i = 0; i < this.workflow.steps.length; i++) {
      this.currentStep = i
      const step = this.workflow.steps[i]
      
      // Check condition if specified
      if (step.condition && !step.condition(this.context)) {
        continue
      }

      const message: AgentMessage = {
        id: `${this.id}-step-${i}`,
        type: step.operation,
        payload: step.input || this.context,
        metadata: {
          timestamp: new Date(),
          source: 'workflow-orchestrator',
          target: step.agentId,
          correlationId: this.id,
          priority: 'normal'
        }
      }

      // Execute step with timeout
      const result = await this.executeStepWithTimeout(message, step.timeout || 30000)
      this.results.set(step.agentId, result)
      
      // Update context with result
      this.context[`step_${i}_result`] = result.data
      
      if (!result.success) {
        if (step.onFailure) {
          // Handle failure path
          this.handleStepFailure(step, result)
        } else {
          throw new Error(`Step ${i} failed: ${result.error?.message}`)
        }
      }
    }
  }

  private async executeStepWithTimeout(message: AgentMessage, timeout: number): Promise<AgentResult> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Step execution timeout after ${timeout}ms`))
      }, timeout)

      this.eventBus.publish(message).then(() => {
        // Listen for response
        const responseHandler = (responseMessage: AgentMessage) => {
          if (responseMessage.metadata.correlationId === message.id) {
            clearTimeout(timer)
            resolve(responseMessage.payload as AgentResult)
          }
        }

        this.eventBus.once('agent-response', responseHandler)
      }).catch(error => {
        clearTimeout(timer)
        reject(error)
      })
    })
  }

  private handleStepFailure(step: WorkflowStep, result: AgentResult): void {
    // Implementation for failure handling
    console.error(`Step failed for agent ${step.agentId}:`, result.error)
    // Could implement retry logic, alternative paths, etc.
  }

  cancel(): void {
    this.status = 'cancelled'
    this.endTime = new Date()
  }

  getProgress(): number {
    return this.workflow.steps.length > 0 ? (this.currentStep + 1) / this.workflow.steps.length : 0
  }

  getDuration(): number | undefined {
    if (!this.startTime) return undefined
    const endTime = this.endTime || new Date()
    return endTime.getTime() - this.startTime.getTime()
  }
}