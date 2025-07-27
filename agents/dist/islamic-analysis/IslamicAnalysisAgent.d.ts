/**
 * Islamic Analysis Agent
 *
 * Core agent responsible for halal/haram ingredient analysis based on Islamic jurisprudence.
 * Preserves and enhances the 200+ ingredient database with Quranic references and scholarly consensus.
 */
import { IAgent, AgentInput, AgentOutput, AgentCapability } from '../../core/IAgent';
import { EventBus } from '../../core/EventBus';
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
export declare class IslamicAnalysisAgent implements IAgent {
    readonly id = "islamic-analysis-agent";
    readonly name = "Islamic Analysis Agent";
    readonly version = "1.0.0";
    readonly capabilities: AgentCapability[];
    private knowledgeBase;
    private ingredientAnalyzer;
    private verificationService;
    private consensusService;
    private logger;
    private eventBus;
    constructor(eventBus: EventBus, logger: Logger);
    private initialize;
    private subscribeToEvents;
    process(input: IslamicAnalysisInput): Promise<IslamicAnalysisOutput>;
    private analyzeIngredient;
    private calculateOverallStatus;
    private calculateConfidenceScore;
    private generateRecommendations;
    private getScholarlyNotes;
    private handleAnalysisRequest;
    private handleFatwaRequest;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=IslamicAnalysisAgent.d.ts.map