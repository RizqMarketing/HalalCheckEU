/**
 * Islamic Knowledge Base
 *
 * Preserves and enhances the 200+ ingredient Islamic database with Quranic references,
 * Hadith citations, and scholarly consensus from four major Sunni schools.
 *
 * Sources:
 * - Quran: Q2:173, Q5:3, Q5:5, Q6:118-119, Q2:168, Q2:172, Q5:90
 * - Hadith: Authentic collections on dietary laws and slaughter requirements
 * - Scholarly Consensus: Four major Sunni schools (Hanafi, Maliki, Shafi'i, Hanbali)
 * - Contemporary Standards: European halal certification bodies (GSO 993:2015, OIC/SMIIC 1:2019)
 *
 * Last Updated: January 2025
 * Disclaimer: This database provides scholarly references for educational purposes.
 * Always consult qualified Islamic scholars for definitive rulings.
 */
export interface IslamicReference {
    source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa';
    reference: string;
    arabic?: string;
    transliteration?: string;
    translation: string;
    school?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General';
}
export interface IngredientClassification {
    name: string;
    status: 'HALAL' | 'HARAM' | 'MASHBOOH';
    category: string;
    confidence: number;
    reasoning: string;
    islamicReferences: IslamicReference[];
    alternativeSuggestions?: string[];
    requiresVerification?: boolean;
}
export declare class IslamicKnowledgeBase {
    private ingredients;
    private quranicReferences;
    private isLoaded;
    constructor();
    load(): Promise<void>;
    private loadQuranicReferences;
    private loadIngredientClassifications;
    getIngredientClassification(ingredientName: string): Promise<IngredientClassification>;
    getQuranicReference(verse: string): IslamicReference | null;
    getAllClassifications(): IngredientClassification[];
    searchIngredients(query: string): IngredientClassification[];
    getIngredientsByStatus(status: 'HALAL' | 'HARAM' | 'MASHBOOH'): IngredientClassification[];
    getIngredientsByCategory(category: string): IngredientClassification[];
}
//# sourceMappingURL=IslamicKnowledgeBase.d.ts.map