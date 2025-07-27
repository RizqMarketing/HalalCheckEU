/**
 * Agent System Bootstrap
 * 
 * Main entry point for the agent-based architecture system
 */

import { EventBus } from './core/EventBus';
import { AgentRegistry } from './core/AgentRegistry';
import { AgentOrchestrator } from './core/AgentOrchestrator';
import { Logger, LogLevel } from './core/infrastructure/logging/Logger';

// Import all agents
import { IslamicAnalysisAgent } from './islamic-analysis/IslamicAnalysisAgent';
import { DocumentProcessingAgent } from './document-processing/DocumentProcessingAgent';
import { OrganizationWorkflowAgent } from './organization-workflow/OrganizationWorkflowAgent';
import { CertificateGenerationAgent } from './certificate-generation/CertificateGenerationAgent';

export interface AgentSystemConfig {
  logLevel?: LogLevel;
  enableMetrics?: boolean;
  enableHealthChecks?: boolean;
  maxEventHistory?: number;
  eventBusConfig?: {
    maxHistorySize?: number;
  };
}

export class AgentSystem {
  private eventBus: EventBus;
  private registry: AgentRegistry;
  private orchestrator: AgentOrchestrator;
  private logger: Logger;
  private agents: Map<string, any>;
  private isInitialized: boolean = false;
  private config: AgentSystemConfig;

  constructor(config: AgentSystemConfig = {}) {
    this.config = {
      logLevel: LogLevel.INFO,
      enableMetrics: true,
      enableHealthChecks: true,
      maxEventHistory: 1000,
      ...config
    };

    this.logger = new Logger('AgentSystem', { level: this.config.logLevel });
    this.eventBus = new EventBus(this.config.eventBusConfig?.maxHistorySize || 1000);
    this.registry = new AgentRegistry(this.logger);
    this.orchestrator = new AgentOrchestrator(this.registry, this.eventBus, this.logger);
    this.agents = new Map();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Agent system is already initialized');
      return;
    }

    this.logger.info('Initializing HalalCheck AI Agent System...');

    try {
      // Initialize and register all agents
      await this.initializeAgents();

      // Set up system-level event handlers
      this.setupSystemEventHandlers();

      // Start health checks if enabled
      if (this.config.enableHealthChecks) {
        this.startHealthChecks();
      }

      this.isInitialized = true;
      this.logger.info('Agent system initialized successfully', {
        agentCount: this.registry.getAll().length,
        capabilities: this.registry.getCapabilities().length
      });

      // Emit system ready event
      this.eventBus.emit('agent-system-ready', {
        timestamp: new Date(),
        agentCount: this.registry.getAll().length,
        capabilities: this.registry.getCapabilities()
      });

    } catch (error) {
      this.logger.error('Failed to initialize agent system', undefined, error);
      throw error;
    }
  }

  private async initializeAgents(): Promise<void> {
    this.logger.info('Initializing agents...');

    // Islamic Analysis Agent
    const islamicAnalysisAgent = new IslamicAnalysisAgent(this.eventBus, this.logger.createChildLogger('IslamicAnalysis'));
    this.registry.register(islamicAnalysisAgent);
    this.agents.set('islamic-analysis', islamicAnalysisAgent);

    // Document Processing Agent
    const documentProcessingAgent = new DocumentProcessingAgent(this.eventBus, this.logger.createChildLogger('DocumentProcessing'));
    this.registry.register(documentProcessingAgent);
    this.agents.set('document-processing', documentProcessingAgent);

    // Organization Workflow Agent
    const organizationWorkflowAgent = new OrganizationWorkflowAgent(this.eventBus, this.logger.createChildLogger('OrganizationWorkflow'));
    this.registry.register(organizationWorkflowAgent);
    this.agents.set('organization-workflow', organizationWorkflowAgent);

    // Certificate Generation Agent
    const certificateGenerationAgent = new CertificateGenerationAgent(this.eventBus, this.logger.createChildLogger('CertificateGeneration'));
    this.registry.register(certificateGenerationAgent);
    this.agents.set('certificate-generation', certificateGenerationAgent);

    this.logger.info(`Initialized ${this.agents.size} agents`);
  }

  private setupSystemEventHandlers(): void {
    // Handle system-wide events
    this.eventBus.subscribe('agent-error', (event) => {
      this.logger.error(`Agent error from ${event.source}`, { error: event.data });
    });

    this.eventBus.subscribe('workflow-completed', (event) => {
      this.logger.info('Workflow completed', { 
        executionId: event.data.executionId,
        workflowId: event.data.workflowId,
        duration: event.data.duration 
      });
    });

    this.eventBus.subscribe('workflow-failed', (event) => {
      this.logger.error('Workflow failed', { 
        executionId: event.data.executionId,
        workflowId: event.data.workflowId,
        error: event.data.error 
      });
    });

    // Set up cross-agent communication handlers
    this.setupCrossAgentCommunication();
  }

  private setupCrossAgentCommunication(): void {
    // Islamic Analysis completed -> potentially trigger certificate generation
    this.eventBus.subscribe('islamic-analysis-completed', async (event) => {
      const { result } = event.data;
      
      if (result.overallStatus === 'HALAL' && result.confidenceScore > 80) {
        this.logger.info('High-confidence halal analysis completed, potential for auto-certification');
        
        // Emit event for potential certificate generation
        this.eventBus.emit('halal-analysis-approved', {
          analysisResult: result,
          autoEligible: true
        });
      }
    });

    // Document processing completed -> trigger analysis
    this.eventBus.subscribe('document-processing-completed', async (event) => {
      const { result } = event.data;
      
      if (result.extractedData.ingredients && result.extractedData.ingredients.length > 0) {
        this.logger.info('Ingredients extracted from document, triggering analysis');
        
        // Automatically trigger Islamic analysis
        this.eventBus.emit('ingredient-analysis-requested', {
          ingredients: result.extractedData.ingredients,
          productName: result.extractedData.metadata?.documentTitle || 'Unknown Product',
          extractedFrom: 'document'
        });
      }
    });

    // Workflow updates -> organization notifications
    this.eventBus.subscribe('workflow-updated', async (event) => {
      const { organizationId, workflowInstanceId, currentStage } = event.data;
      
      this.logger.debug('Workflow updated', { 
        organizationId, 
        workflowInstanceId, 
        currentStage 
      });

      // Emit notification for workflow progress
      this.eventBus.emit('workflow-progress-notification', {
        organizationId,
        workflowInstanceId,
        currentStage,
        timestamp: new Date()
      });
    });
  }

  private startHealthChecks(): void {
    const healthCheckInterval = 60000; // 1 minute
    
    setInterval(async () => {
      try {
        const healthResults = await this.registry.healthCheck();
        const unhealthyAgents = healthResults.filter(r => !r.healthy);
        
        if (unhealthyAgents.length > 0) {
          this.logger.warn('Unhealthy agents detected', { 
            unhealthyCount: unhealthyAgents.length,
            unhealthyAgents: unhealthyAgents.map(a => a.agentId)
          });
          
          this.eventBus.emit('agents-unhealthy', {
            unhealthyAgents,
            timestamp: new Date()
          });
        }
      } catch (error) {
        this.logger.error('Health check failed', undefined, error);
      }
    }, healthCheckInterval);
  }

  // Public API methods
  public async analyzeIngredients(ingredients: string[], productName: string, options?: any): Promise<any> {
    this.ensureInitialized();
    
    return await this.orchestrator.routeRequest('analyze-ingredients', {
      ingredients,
      productName,
      context: options
    });
  }

  public async processDocument(documentType: string, filePath: string, options?: any): Promise<any> {
    this.ensureInitialized();
    
    return await this.orchestrator.routeRequest('extract-ingredients', {
      documentType,
      filePath,
      extractionOptions: options
    });
  }

  public async executeWorkflow(workflowId: string, input: any): Promise<any> {
    this.ensureInitialized();
    
    return await this.orchestrator.executeWorkflow(workflowId, input);
  }

  public async generateCertificate(certificateData: any): Promise<any> {
    this.ensureInitialized();
    
    return await this.orchestrator.routeRequest('generate-halal-certificate', certificateData);
  }

  public getOrganizationConfig(organizationId: string): any {
    this.ensureInitialized();
    
    const agent = this.agents.get('organization-workflow');
    return agent?.getOrganizationConfig(organizationId);
  }

  // System management methods
  public getSystemStatus(): {
    initialized: boolean;
    agentCount: number;
    capabilities: string[];
    activeExecutions: number;
    eventBusStats: any;
    orchestrationStats: any;
  } {
    return {
      initialized: this.isInitialized,
      agentCount: this.registry.getAll().length,
      capabilities: this.registry.getCapabilities(),
      activeExecutions: this.orchestrator.getActiveExecutions().length,
      eventBusStats: this.eventBus.getStats(),
      orchestrationStats: this.orchestrator.getOrchestrationStats()
    };
  }

  public getAgentMetrics(): any[] {
    return this.registry.getMetrics();
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down agent system...');
    
    try {
      // Cancel active executions
      const activeExecutions = this.orchestrator.getActiveExecutions();
      for (const execution of activeExecutions) {
        await this.orchestrator.cancelExecution(execution.id);
      }

      // Shutdown all agents
      await this.registry.shutdownAll();

      // Clear event bus
      this.eventBus.clearHistory();

      this.isInitialized = false;
      this.logger.info('Agent system shut down successfully');
    } catch (error) {
      this.logger.error('Error during shutdown', undefined, error);
      throw error;
    }
  }

  // Event system access
  public getEventBus(): EventBus {
    return this.eventBus;
  }

  public getOrchestrator(): AgentOrchestrator {
    return this.orchestrator;
  }

  public getRegistry(): AgentRegistry {
    return this.registry;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Agent system is not initialized. Call initialize() first.');
    }
  }

  // Factory method for easy setup
  public static async create(config?: AgentSystemConfig): Promise<AgentSystem> {
    const system = new AgentSystem(config);
    await system.initialize();
    return system;
  }
}