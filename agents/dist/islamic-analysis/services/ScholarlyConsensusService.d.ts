/**
 * Scholarly Consensus Service
 *
 * Provides madhab-specific rulings and scholarly consensus on ingredient permissibility
 */
import { IslamicReference } from '../domain/IslamicKnowledgeBase';
import { Logger } from '../../../core/infrastructure/logging/Logger';
export interface MadhabRuling {
    madhab: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali';
    ruling: 'HALAL' | 'HARAM' | 'MASHBOOH';
    confidence: number;
    reasoning: string;
    references: IslamicReference[];
    scholars?: string[];
}
export interface ConsensusAnalysis {
    ingredient: string;
    consensusLevel: 'unanimous' | 'majority' | 'divided' | 'unclear';
    madhabRulings: MadhabRuling[];
    recommendedApproach: string;
    alternativeOpinions?: string[];
}
export declare class ScholarlyConsensusService {
    private logger;
    private madhabRulings;
    constructor(logger?: Logger);
    private initializeMadhabRulings;
    private addMadhabRulings;
    getMadhabSpecificRuling(ingredient: string, madhab: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali'): Promise<IslamicReference | null>;
    getConsensusAnalysis(ingredient: string): Promise<ConsensusAnalysis>;
    private findCategoryMatch;
    private isIngredientInCategory;
    private determineConsensusLevel;
    private generateRecommendedApproach;
    private getMajorityRuling;
    private getAlternativeOpinions;
    getScholarlyDifferences(ingredient: string): string[];
    generateMadhabComparison(ingredient: string): Promise<string>;
}
//# sourceMappingURL=ScholarlyConsensusService.d.ts.map