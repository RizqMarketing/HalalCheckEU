/**
 * Islamic Analysis Agent
 * 
 * Core agent responsible for halal/haram ingredient analysis based on Islamic jurisprudence.
 * Preserves and enhances the 200+ ingredient database with Quranic references and scholarly consensus.
 */

import { IAgent, AgentInput, AgentOutput, AgentCapability } from '../../core/IAgent';
import { EventBus } from '../../core/EventBus';
import { IslamicKnowledgeBase } from './domain/IslamicKnowledgeBase';
import { IngredientAnalyzer } from './services/IngredientAnalyzer';
import { HalalVerificationService } from './services/HalalVerificationService';
import { ScholarlyConsensusService } from './services/ScholarlyConsensusService';
import { Logger } from '../../core/infrastructure/logging/Logger';

export interface IslamicAnalysisInput extends AgentInput {
  ingredients: string[];
  productName: string;
  context?: {
    madhab?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General';
    strictnessLevel?: 'strict' | 'moderate' | 'lenient';
    includeScholarlyDifferences?: boolean;
  };
}

export interface IslamicAnalysisOutput extends AgentOutput {
  overallStatus: 'HALAL' | 'HARAM' | 'MASHBOOH';
  confidenceScore: number;
  ingredients: Array<{
    name: string;
    status: 'HALAL' | 'HARAM' | 'MASHBOOH';
    confidence: number;
    reasoning: string;
    islamicReferences: Array<{
      source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa';
      reference: string;
      arabic?: string;
      translation: string;
      school?: string;
    }>;
    alternativeSuggestions?: string[];
    requiresVerification?: boolean;
  }>;
  recommendations: string[];
  scholarlyNotes?: string[];
}

export class IslamicAnalysisAgent implements IAgent {
  public readonly id = 'islamic-analysis-agent';
  public readonly name = 'Islamic Analysis Agent';
  public readonly version = '1.0.0';
  public readonly capabilities: AgentCapability[] = [
    {
      name: 'analyze-ingredients',
      description: 'Analyze ingredients for halal compliance',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'provide-islamic-references',
      description: 'Provide Quranic and Hadith references for rulings',
      inputSchema: {},
      outputSchema: {}
    },
    {
      name: 'madhab-specific-analysis',
      description: 'Provide analysis according to specific Islamic schools',
      inputSchema: {},
      outputSchema: {}
    }
  ];

  private knowledgeBase: IslamicKnowledgeBase;
  private ingredientAnalyzer: IngredientAnalyzer;
  private verificationService: HalalVerificationService;
  private consensusService: ScholarlyConsensusService;
  private logger: Logger;
  private eventBus: EventBus;

  constructor(eventBus: EventBus, logger: Logger) {
    this.eventBus = eventBus;
    this.logger = logger;
    this.knowledgeBase = new IslamicKnowledgeBase();
    this.ingredientAnalyzer = new IngredientAnalyzer(this.knowledgeBase, this.logger);
    this.verificationService = new HalalVerificationService(this.logger);
    this.consensusService = new ScholarlyConsensusService(this.logger);
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.logger.info(`Initializing ${this.name} v${this.version}`);
    await this.knowledgeBase.load();
    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.eventBus.subscribe('ingredient-analysis-requested', this.handleAnalysisRequest.bind(this));
    this.eventBus.subscribe('fatwa-consultation-requested', this.handleFatwaRequest.bind(this));
  }

  public async process(input: IslamicAnalysisInput): Promise<IslamicAnalysisOutput> {
    this.logger.info(`Processing Islamic analysis for product: ${input.productName}`);
    
    try {
      // Analyze each ingredient
      const analyzedIngredients = await Promise.all(
        input.ingredients.map(ingredient => 
          this.analyzeIngredient(ingredient, input.context)
        )
      );

      // Calculate overall status
      const overallStatus = this.calculateOverallStatus(analyzedIngredients);
      const confidenceScore = this.calculateConfidenceScore(analyzedIngredients);

      // Generate recommendations
      const recommendations = this.generateRecommendations(analyzedIngredients, input.context);

      // Get scholarly notes if requested
      const scholarlyNotes = input.context?.includeScholarlyDifferences
        ? this.getScholarlyNotes(analyzedIngredients)
        : undefined;

      const output: IslamicAnalysisOutput = {
        agentId: this.id,
        timestamp: new Date(),
        success: true,
        overallStatus,
        confidenceScore,
        ingredients: analyzedIngredients,
        recommendations,
        scholarlyNotes
      };

      // Emit analysis completed event
      this.eventBus.emit('islamic-analysis-completed', {
        productName: input.productName,
        result: output
      });

      return output;
    } catch (error) {
      this.logger.error(`Error in Islamic analysis: ${error}`);
      throw error;
    }
  }

  private async analyzeIngredient(
    ingredientName: string, 
    context?: IslamicAnalysisInput['context']
  ): Promise<IslamicAnalysisOutput['ingredients'][0]> {
    // Get base classification from knowledge base
    const classification = await this.knowledgeBase.getIngredientClassification(ingredientName);
    
    // Apply madhab-specific rules if requested
    if (context?.madhab && context.madhab !== 'General') {
      const madhabRuling = await this.consensusService.getMadhabSpecificRuling(
        ingredientName, 
        context.madhab
      );
      if (madhabRuling) {
        classification.islamicReferences.push(madhabRuling);
      }
    }

    // Verify with contemporary sources if needed
    if (classification.requiresVerification) {
      const verification = await this.verificationService.verifyIngredient(ingredientName);
      if (verification) {
        classification.confidence = verification.confidence;
        classification.islamicReferences.push(...verification.references);
      }
    }

    return {
      name: ingredientName,
      status: classification.status,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      islamicReferences: classification.islamicReferences,
      alternativeSuggestions: classification.alternativeSuggestions,
      requiresVerification: classification.requiresVerification
    };
  }

  private calculateOverallStatus(
    ingredients: IslamicAnalysisOutput['ingredients']
  ): 'HALAL' | 'HARAM' | 'MASHBOOH' {
    // If any ingredient is HARAM, the product is HARAM
    if (ingredients.some(ing => ing.status === 'HARAM')) {
      return 'HARAM';
    }
    
    // If any ingredient is MASHBOOH, the product is MASHBOOH
    if (ingredients.some(ing => ing.status === 'MASHBOOH')) {
      return 'MASHBOOH';
    }
    
    // All ingredients are HALAL
    return 'HALAL';
  }

  private calculateConfidenceScore(
    ingredients: IslamicAnalysisOutput['ingredients']
  ): number {
    if (ingredients.length === 0) return 0;
    
    const totalConfidence = ingredients.reduce(
      (sum, ing) => sum + ing.confidence, 
      0
    );
    
    return totalConfidence / ingredients.length;
  }

  private generateRecommendations(
    ingredients: IslamicAnalysisOutput['ingredients'],
    context?: IslamicAnalysisInput['context']
  ): string[] {
    const recommendations: string[] = [];

    // Check for HARAM ingredients
    const haramIngredients = ingredients.filter(ing => ing.status === 'HARAM');
    if (haramIngredients.length > 0) {
      recommendations.push(
        `This product contains ${haramIngredients.length} haram ingredient(s): ${
          haramIngredients.map(ing => ing.name).join(', ')
        }. It should not be consumed by Muslims.`
      );
    }

    // Check for MASHBOOH ingredients
    const mashboohIngredients = ingredients.filter(ing => ing.status === 'MASHBOOH');
    if (mashboohIngredients.length > 0) {
      recommendations.push(
        `This product contains ${mashboohIngredients.length} doubtful ingredient(s): ${
          mashboohIngredients.map(ing => ing.name).join(', ')
        }. Further verification from the manufacturer is recommended.`
      );

      // Add specific verification suggestions
      mashboohIngredients.forEach(ing => {
        if (ing.requiresVerification) {
          recommendations.push(
            `For ${ing.name}: Request source certification from manufacturer.`
          );
        }
      });
    }

    // Add alternatives if available
    ingredients.forEach(ing => {
      if (ing.alternativeSuggestions && ing.alternativeSuggestions.length > 0) {
        recommendations.push(
          `Consider alternatives to ${ing.name}: ${ing.alternativeSuggestions.join(', ')}`
        );
      }
    });

    return recommendations;
  }

  private getScholarlyNotes(
    ingredients: IslamicAnalysisOutput['ingredients']
  ): string[] {
    const notes: string[] = [];
    
    ingredients.forEach(ing => {
      const scholarlyDifferences = ing.islamicReferences
        .filter(ref => ref.school && ref.school !== 'General')
        .map(ref => `${ref.school}: ${ref.translation}`)
        .join('; ');
      
      if (scholarlyDifferences) {
        notes.push(`${ing.name} - ${scholarlyDifferences}`);
      }
    });

    return notes;
  }

  private async handleAnalysisRequest(event: any): Promise<void> {
    const result = await this.process(event.data);
    this.eventBus.emit('analysis-response', { 
      requestId: event.requestId, 
      result 
    });
  }

  private async handleFatwaRequest(event: any): Promise<void> {
    const { ingredient, madhab } = event.data;
    const ruling = await this.consensusService.getMadhabSpecificRuling(ingredient, madhab);
    this.eventBus.emit('fatwa-response', { 
      requestId: event.requestId, 
      ruling 
    });
  }

  public async shutdown(): Promise<void> {
    this.logger.info(`Shutting down ${this.name}`);
    // Cleanup resources
  }
}