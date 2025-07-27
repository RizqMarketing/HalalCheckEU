/**
 * Ingredient Analyzer Service
 *
 * Provides intelligent ingredient analysis with fuzzy matching and contextual understanding
 */
import { IslamicKnowledgeBase, IngredientClassification } from '../domain/IslamicKnowledgeBase';
import { Logger } from '../../../core/infrastructure/logging/Logger';
export interface AnalysisContext {
    productType?: string;
    manufacturingProcess?: string;
    sourceCountry?: string;
    certificationRequired?: boolean;
    madhab?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General';
}
export interface EnhancedClassification extends IngredientClassification {
    matchType: 'exact' | 'partial' | 'fuzzy' | 'category' | 'unknown';
    similarIngredients?: string[];
    contextualNotes?: string[];
}
export declare class IngredientAnalyzer {
    private knowledgeBase;
    private logger;
    constructor(knowledgeBase: IslamicKnowledgeBase, logger?: Logger);
    analyzeIngredient(ingredientName: string, context?: AnalysisContext): Promise<EnhancedClassification>;
    private normalizeIngredientName;
    private findExactMatch;
    private findPartialMatch;
    private findFuzzyMatch;
    private findCategoryMatch;
    private createUnknownClassification;
    private calculateSimilarity;
    private levenshteinDistance;
    private getMajorityStatus;
    private generateContextualNotes;
    analyzeBulkIngredients(ingredients: string[], context?: AnalysisContext): Promise<EnhancedClassification[]>;
    getSimilarIngredients(ingredientName: string, limit?: number): string[];
}
//# sourceMappingURL=IngredientAnalyzer.d.ts.map