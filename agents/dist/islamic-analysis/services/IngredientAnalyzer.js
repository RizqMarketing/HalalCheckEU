"use strict";
/**
 * Ingredient Analyzer Service
 *
 * Provides intelligent ingredient analysis with fuzzy matching and contextual understanding
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngredientAnalyzer = void 0;
const Logger_1 = require("../../../core/infrastructure/logging/Logger");
class IngredientAnalyzer {
    constructor(knowledgeBase, logger) {
        this.knowledgeBase = knowledgeBase;
        this.logger = logger || new Logger_1.Logger('IngredientAnalyzer');
    }
    async analyzeIngredient(ingredientName, context) {
        this.logger.debug(`Analyzing ingredient: ${ingredientName}`, { context });
        // Clean and normalize the ingredient name
        const normalizedName = this.normalizeIngredientName(ingredientName);
        // Try different matching strategies
        let classification = await this.findExactMatch(normalizedName);
        if (classification) {
            return { ...classification, matchType: 'exact' };
        }
        classification = await this.findPartialMatch(normalizedName);
        if (classification) {
            return { ...classification, matchType: 'partial' };
        }
        classification = await this.findFuzzyMatch(normalizedName);
        if (classification) {
            return { ...classification, matchType: 'fuzzy' };
        }
        classification = await this.findCategoryMatch(normalizedName);
        if (classification) {
            return { ...classification, matchType: 'category' };
        }
        // No match found - return unknown classification
        return this.createUnknownClassification(ingredientName, context);
    }
    normalizeIngredientName(name) {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-()]/g, '') // Remove special characters except parentheses and hyphens
            .replace(/\s+/g, ' '); // Normalize whitespace
    }
    async findExactMatch(normalizedName) {
        return await this.knowledgeBase.getIngredientClassification(normalizedName);
    }
    async findPartialMatch(normalizedName) {
        const allClassifications = this.knowledgeBase.getAllClassifications();
        // Look for ingredients that contain the search term or vice versa
        for (const classification of allClassifications) {
            const classificationName = classification.name.toLowerCase();
            if (classificationName.includes(normalizedName) || normalizedName.includes(classificationName)) {
                return classification;
            }
        }
        return null;
    }
    async findFuzzyMatch(normalizedName) {
        const allClassifications = this.knowledgeBase.getAllClassifications();
        const threshold = 0.7; // Similarity threshold
        for (const classification of allClassifications) {
            const similarity = this.calculateSimilarity(normalizedName, classification.name.toLowerCase());
            if (similarity >= threshold) {
                return {
                    ...classification,
                    confidence: Math.round(classification.confidence * similarity)
                };
            }
        }
        return null;
    }
    async findCategoryMatch(normalizedName) {
        // Check if the ingredient name suggests a category
        const categoryMappings = {
            'oil': 'Plant Oils',
            'fat': 'Animal Fats',
            'vitamin': 'Vitamins',
            'color': 'Colorants',
            'flavoring': 'Flavorings',
            'preservative': 'Preservatives',
            'emulsifier': 'Emulsifiers',
            'thickener': 'Thickeners',
            'sweetener': 'Sweeteners'
        };
        for (const [keyword, category] of Object.entries(categoryMappings)) {
            if (normalizedName.includes(keyword)) {
                const categoryIngredients = this.knowledgeBase.getIngredientsByCategory(category);
                if (categoryIngredients.length > 0) {
                    // Return a generic classification for this category
                    const majorityStatus = this.getMajorityStatus(categoryIngredients);
                    return {
                        name: normalizedName,
                        status: majorityStatus,
                        category,
                        confidence: 20,
                        reasoning: `Categorized as ${category}. General analysis based on category patterns.`,
                        islamicReferences: [
                            {
                                source: 'Scholarly_Consensus',
                                reference: 'Category-based Analysis',
                                translation: `Ingredients in the ${category} category require individual verification.`,
                                school: 'General'
                            }
                        ],
                        requiresVerification: true
                    };
                }
            }
        }
        return null;
    }
    createUnknownClassification(ingredientName, context) {
        return {
            name: ingredientName,
            status: 'MASHBOOH',
            category: 'Unknown',
            confidence: 10,
            reasoning: 'This ingredient is not in our database. Further investigation required to determine halal status.',
            islamicReferences: [
                {
                    source: 'Scholarly_Consensus',
                    reference: 'Precautionary Principle',
                    translation: 'When in doubt about the permissibility of something, it is better to avoid it until clarity is obtained.',
                    school: 'General'
                }
            ],
            requiresVerification: true,
            matchType: 'unknown',
            contextualNotes: context ? this.generateContextualNotes(ingredientName, context) : undefined
        };
    }
    calculateSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
        for (let i = 0; i <= str1.length; i++)
            matrix[0][i] = i;
        for (let j = 0; j <= str2.length; j++)
            matrix[j][0] = j;
        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(matrix[j][i - 1] + 1, // deletion
                matrix[j - 1][i] + 1, // insertion
                matrix[j - 1][i - 1] + indicator // substitution
                );
            }
        }
        return matrix[str2.length][str1.length];
    }
    getMajorityStatus(ingredients) {
        const statusCounts = ingredients.reduce((acc, ingredient) => {
            acc[ingredient.status] = (acc[ingredient.status] || 0) + 1;
            return acc;
        }, {});
        const sortedStatuses = Object.entries(statusCounts)
            .sort(([, a], [, b]) => b - a);
        return sortedStatuses[0][0];
    }
    generateContextualNotes(ingredientName, context) {
        const notes = [];
        if (context.productType) {
            notes.push(`Product type: ${context.productType} - may require specific halal standards`);
        }
        if (context.manufacturingProcess) {
            notes.push(`Manufacturing process: ${context.manufacturingProcess} - verify equipment cleanliness`);
        }
        if (context.sourceCountry) {
            notes.push(`Source country: ${context.sourceCountry} - verify local halal standards`);
        }
        if (context.madhab && context.madhab !== 'General') {
            notes.push(`${context.madhab} school interpretation may have specific rulings`);
        }
        return notes;
    }
    async analyzeBulkIngredients(ingredients, context) {
        this.logger.info(`Analyzing ${ingredients.length} ingredients in bulk`);
        const results = await Promise.all(ingredients.map(ingredient => this.analyzeIngredient(ingredient, context)));
        this.logger.info(`Bulk analysis completed`, {
            total: ingredients.length,
            halal: results.filter(r => r.status === 'HALAL').length,
            haram: results.filter(r => r.status === 'HARAM').length,
            mashbooh: results.filter(r => r.status === 'MASHBOOH').length
        });
        return results;
    }
    getSimilarIngredients(ingredientName, limit = 5) {
        const allClassifications = this.knowledgeBase.getAllClassifications();
        const normalizedName = this.normalizeIngredientName(ingredientName);
        const similarities = allClassifications
            .map(classification => ({
            name: classification.name,
            similarity: this.calculateSimilarity(normalizedName, classification.name.toLowerCase())
        }))
            .filter(item => item.similarity > 0.3 && item.similarity < 1.0) // Exclude exact matches and very dissimilar
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => item.name);
        return similarities;
    }
}
exports.IngredientAnalyzer = IngredientAnalyzer;
//# sourceMappingURL=IngredientAnalyzer.js.map