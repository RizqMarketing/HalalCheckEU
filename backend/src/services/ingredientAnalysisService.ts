/**
 * HalalCheck EU - Ingredient Analysis Service
 * 
 * Core AI-powered halal ingredient analysis using OpenAI GPT-4
 * Religious precision with expert-verified ingredient database
 */

import OpenAI from 'openai';
import { DatabaseService } from './databaseService';
import { logger } from '@/utils/logger';
import { 
  AnalysisRequest, 
  ProductAnalysis, 
  IngredientAnalysis, 
  HalalStatus, 
  RiskLevel 
} from '@/types/halal';
import { v4 as uuidv4 } from 'uuid';

export class IngredientAnalysisService {
  private openai: OpenAI;
  private db: DatabaseService;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.db = new DatabaseService();
  }

  /**
   * Analyze ingredients for halal compliance using AI + expert database
   */
  async analyzeIngredients(request: AnalysisRequest): Promise<ProductAnalysis> {
    const startTime = Date.now();
    const analysisId = uuidv4();

    try {
      logger.info('Starting ingredient analysis', {
        analysisId,
        productName: request.productName,
        userId: request.userId,
        organizationId: request.organizationId
      });

      // Step 1: Parse ingredient list using OpenAI
      const parsedIngredients = await this.parseIngredientList(request.ingredientText, request.language);

      // Step 2: Analyze each ingredient for halal compliance
      const ingredientAnalyses = await this.analyzeIndividualIngredients(
        parsedIngredients, 
        request.language,
        request.region,
        request.certificationStandard
      );

      // Step 3: Generate overall product assessment
      const overallAssessment = this.generateOverallAssessment(ingredientAnalyses);

      // Step 4: Generate recommendations
      const recommendations = this.generateRecommendations(ingredientAnalyses, request.language);

      // Step 5: Categorize critical findings
      const criticalFindings = this.categorizeCriticalFindings(ingredientAnalyses);

      // Step 6: Create comprehensive analysis result
      const analysis: ProductAnalysis = {
        id: analysisId,
        productName: request.productName,
        ingredientText: request.ingredientText,
        language: request.language,
        region: request.region,
        certificationStandard: request.certificationStandard,
        
        // Overall assessment
        overallStatus: overallAssessment.status,
        overallRiskLevel: overallAssessment.riskLevel,
        
        // Individual ingredient results
        ingredients: ingredientAnalyses,
        
        // Summary statistics
        summary: {
          total_ingredients: ingredientAnalyses.length,
          halal_count: ingredientAnalyses.filter(ing => ing.status === HalalStatus.HALAL).length,
          haram_count: ingredientAnalyses.filter(ing => ing.status === HalalStatus.HARAM).length,
          mashbooh_count: ingredientAnalyses.filter(ing => ing.status === HalalStatus.MASHBOOH).length,
          uncertain_count: ingredientAnalyses.filter(ing => ing.status === HalalStatus.UNCERTAIN).length
        },
        
        // Critical findings
        haram_ingredients: criticalFindings.haram,
        mashbooh_ingredients: criticalFindings.mashbooh,
        requires_expert_review: criticalFindings.requiresReview,
        
        // Recommendations and expert review
        recommendations,
        expertReviewRequired: overallAssessment.requiresExpertReview,
        
        // Metadata
        userId: request.userId,
        organizationId: request.organizationId,
        analyzedAt: new Date(),
        processingTimeMs: Date.now() - startTime
      };

      // Step 7: Save analysis to database
      await this.saveAnalysisToDatabase(analysis);

      logger.info('Ingredient analysis completed', {
        analysisId,
        overallStatus: analysis.overallStatus,
        processingTimeMs: analysis.processingTimeMs,
        totalIngredients: analysis.summary.total_ingredients,
        haramCount: analysis.summary.haram_count
      });

      return analysis;

    } catch (error) {
      logger.error('Ingredient analysis failed', {
        error: error.message,
        stack: error.stack,
        analysisId,
        productName: request.productName
      });
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Parse ingredient list using OpenAI GPT-4
   */
  private async parseIngredientList(ingredientText: string, language: string): Promise<string[]> {
    const systemPrompt = `You are an expert ingredient parser for halal food certification. Your task is to extract and standardize ingredient names from product labels.

INSTRUCTIONS:
1. Parse the ingredient list and extract individual ingredient names
2. Standardize ingredient names (e.g., "E471" not "emulsifier E471")
3. Separate compound ingredients when possible
4. Remove quantity indicators, percentages, and non-ingredient text
5. Return ONLY ingredient names, one per line
6. Use standard English names regardless of input language
7. If you see E-numbers, keep them as "E123" format

INPUT LANGUAGE: ${language}
REGION CONTEXT: Focus on ingredients commonly found in European/Middle Eastern products

Return ingredients separated by newlines, nothing else.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse these ingredients: ${ingredientText}` }
        ],
        temperature: 0.1,
        max_tokens: 1000
      });

      const parsedText = response.choices[0]?.message?.content?.trim();
      if (!parsedText) {
        throw new Error('No ingredients parsed from OpenAI response');
      }

      const ingredients = parsedText
        .split('\n')
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0 && !ing.match(/^\d+\.?\s*$/)) // Remove numbering
        .slice(0, 50); // Limit to 50 ingredients for safety

      logger.debug('Ingredients parsed by OpenAI', {
        originalText: ingredientText.substring(0, 200),
        parsedCount: ingredients.length,
        parsedIngredients: ingredients
      });

      return ingredients;

    } catch (error) {
      logger.error('OpenAI ingredient parsing failed', {
        error: error.message,
        ingredientText: ingredientText.substring(0, 200)
      });
      
      // Fallback: simple splitting
      return ingredientText
        .split(/[,;]/)
        .map(ing => ing.trim())
        .filter(ing => ing.length > 0)
        .slice(0, 50);
    }
  }

  /**
   * Analyze individual ingredients for halal compliance
   */
  private async analyzeIndividualIngredients(
    ingredients: string[], 
    language: string,
    region: string,
    certificationStandard: string
  ): Promise<IngredientAnalysis[]> {
    const analyses: IngredientAnalysis[] = [];

    for (const ingredient of ingredients) {
      try {
        // First check our expert database
        const dbResult = await this.checkIngredientDatabase(ingredient, language);
        
        if (dbResult) {
          analyses.push({
            detectedName: ingredient,
            standardName: dbResult.standard_name,
            status: dbResult.halal_status as HalalStatus,
            riskLevel: dbResult.risk_level as RiskLevel,
            confidence: dbResult.confidence,
            reasoning: dbResult.reasoning,
            requiresExpertReview: dbResult.requires_expert_review,
            warnings: dbResult.warnings || [],
            suggestions: dbResult.suggestions || [],
            source: 'database',
            eNumbers: dbResult.e_numbers || [],
            categories: dbResult.categories || []
          });
        } else {
          // Use AI analysis for unknown ingredients
          const aiAnalysis = await this.analyzeIngredientWithAI(
            ingredient, 
            language, 
            region, 
            certificationStandard
          );
          analyses.push(aiAnalysis);
        }

        // Add small delay to respect API limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.warn('Individual ingredient analysis failed', {
          ingredient,
          error: error.message
        });

        // Add fallback analysis for failed ingredients
        analyses.push({
          detectedName: ingredient,
          standardName: ingredient,
          status: HalalStatus.UNCERTAIN,
          riskLevel: RiskLevel.MEDIUM,
          confidence: 0.1,
          reasoning: `Analysis failed: ${error.message}`,
          requiresExpertReview: true,
          warnings: ['Analysis failed - expert review required'],
          suggestions: ['Contact halal certification expert'],
          source: 'fallback',
          eNumbers: [],
          categories: []
        });
      }
    }

    return analyses;
  }

  /**
   * Check ingredient against expert database
   */
  private async checkIngredientDatabase(ingredient: string, language: string): Promise<any> {
    try {
      // Try exact match first
      let query = `
        SELECT * FROM ingredients 
        WHERE standard_name ILIKE $1 
           OR common_names ? $2
           OR translations ? $3
        LIMIT 1
      `;

      let result = await this.db.query(query, [ingredient, ingredient.toLowerCase(), language]);

      if (result.rows.length > 0) {
        return result.rows[0];
      }

      // Try partial matching for E-numbers
      if (ingredient.match(/^E\d+/i)) {
        const eNumber = ingredient.toUpperCase().match(/E\d+/)[0];
        query = `
          SELECT * FROM ingredients 
          WHERE e_numbers ? $1
          LIMIT 1
        `;
        result = await this.db.query(query, [eNumber]);
        
        if (result.rows.length > 0) {
          return result.rows[0];
        }
      }

      // Try fuzzy matching for close matches
      query = `
        SELECT *, similarity(standard_name, $1) as sim 
        FROM ingredients 
        WHERE similarity(standard_name, $1) > 0.7
        ORDER BY sim DESC
        LIMIT 1
      `;
      result = await this.db.query(query, [ingredient]);

      return result.rows.length > 0 ? result.rows[0] : null;

    } catch (error) {
      logger.error('Database ingredient lookup failed', {
        ingredient,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Analyze ingredient using OpenAI when not in database
   */
  private async analyzeIngredientWithAI(
    ingredient: string, 
    language: string,
    region: string,
    certificationStandard: string
  ): Promise<IngredientAnalysis> {
    const systemPrompt = `You are a world-class halal food certification expert with deep knowledge of Islamic dietary laws and food science.

CERTIFICATION STANDARD: ${certificationStandard}
REGION: ${region}
LANGUAGE: ${language}

Your task: Analyze ingredients for halal compliance with absolute precision.

HALAL STATUS DEFINITIONS:
- HALAL: Completely permissible under Islamic law
- HARAM: Absolutely forbidden under Islamic law  
- MASHBOOH: Doubtful/questionable, avoid due to uncertainty
- UNCERTAIN: Cannot determine without more information

RISK LEVELS:
- LOW: No halal concerns
- MEDIUM: Minor concerns or sourcing dependent
- HIGH: Major concerns or likely problematic

CRITICAL RULES:
1. When in doubt, choose MASHBOOH or UNCERTAIN - never guess
2. Consider source, processing methods, cross-contamination
3. E-numbers: Many are synthetic and halal, but verify each
4. Animal-derived ingredients: Assume haram unless certified halal
5. Alcohol/wine-based ingredients: Always haram
6. Be extremely cautious with gelatin, enzymes, emulsifiers

Respond in JSON format:
{
  "status": "HALAL|HARAM|MASHBOOH|UNCERTAIN",
  "riskLevel": "LOW|MEDIUM|HIGH", 
  "confidence": 0.95,
  "reasoning": "Detailed Islamic ruling explanation",
  "requiresExpertReview": false,
  "warnings": ["warning1", "warning2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "eNumbers": ["E123"],
  "categories": ["emulsifier", "preservative"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this ingredient for halal compliance: ${ingredient}` }
        ],
        temperature: 0.1,
        max_tokens: 800
      });

      const analysisText = response.choices[0]?.message?.content?.trim();
      if (!analysisText) {
        throw new Error('No analysis returned from OpenAI');
      }

      const analysis = JSON.parse(analysisText);

      return {
        detectedName: ingredient,
        standardName: ingredient,
        status: analysis.status as HalalStatus,
        riskLevel: analysis.riskLevel as RiskLevel,
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.reasoning || 'AI analysis completed',
        requiresExpertReview: analysis.requiresExpertReview || false,
        warnings: analysis.warnings || [],
        suggestions: analysis.suggestions || [],
        source: 'ai',
        eNumbers: analysis.eNumbers || [],
        categories: analysis.categories || []
      };

    } catch (error) {
      logger.error('OpenAI ingredient analysis failed', {
        ingredient,
        error: error.message
      });

      // Return conservative fallback
      return {
        detectedName: ingredient,
        standardName: ingredient,
        status: HalalStatus.UNCERTAIN,
        riskLevel: RiskLevel.MEDIUM,
        confidence: 0.3,
        reasoning: `AI analysis failed. Manual review required for ingredient: ${ingredient}`,
        requiresExpertReview: true,
        warnings: ['AI analysis unavailable'],
        suggestions: ['Consult halal certification expert'],
        source: 'fallback',
        eNumbers: [],
        categories: []
      };
    }
  }

  /**
   * Generate overall product assessment
   */
  private generateOverallAssessment(ingredients: IngredientAnalysis[]): {
    status: HalalStatus;
    riskLevel: RiskLevel;
    requiresExpertReview: boolean;
  } {
    const haramCount = ingredients.filter(ing => ing.status === HalalStatus.HARAM).length;
    const mashboohCount = ingredients.filter(ing => ing.status === HalalStatus.MASHBOOH).length;
    const uncertainCount = ingredients.filter(ing => ing.status === HalalStatus.UNCERTAIN).length;
    const expertReviewCount = ingredients.filter(ing => ing.requiresExpertReview).length;

    // Determine overall status
    let status: HalalStatus;
    if (haramCount > 0) {
      status = HalalStatus.HARAM;
    } else if (mashboohCount > 0 || uncertainCount > 0) {
      status = HalalStatus.MASHBOOH;
    } else {
      status = HalalStatus.HALAL;
    }

    // Determine risk level
    let riskLevel: RiskLevel;
    if (haramCount > 0) {
      riskLevel = RiskLevel.HIGH;
    } else if (mashboohCount > 0 || uncertainCount > 1) {
      riskLevel = RiskLevel.MEDIUM;
    } else if (uncertainCount === 1) {
      riskLevel = RiskLevel.MEDIUM;
    } else {
      riskLevel = RiskLevel.LOW;
    }

    // Determine if expert review is required
    const requiresExpertReview = expertReviewCount > 0 || 
                                uncertainCount > 0 || 
                                mashboohCount > 2;

    return { status, riskLevel, requiresExpertReview };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(ingredients: IngredientAnalysis[], language: string): string[] {
    const recommendations: string[] = [];
    
    const haramIngredients = ingredients.filter(ing => ing.status === HalalStatus.HARAM);
    const mashboohIngredients = ingredients.filter(ing => ing.status === HalalStatus.MASHBOOH);
    const expertReviewIngredients = ingredients.filter(ing => ing.requiresExpertReview);

    if (haramIngredients.length > 0) {
      recommendations.push(
        `❌ AVOID: This product contains ${haramIngredients.length} haram ingredient(s): ${haramIngredients.map(ing => ing.detectedName).join(', ')}`
      );
      recommendations.push('🚫 This product is NOT suitable for halal consumption');
    }

    if (mashboohIngredients.length > 0) {
      recommendations.push(
        `⚠️ CAUTION: Contains ${mashboohIngredients.length} doubtful ingredient(s): ${mashboohIngredients.map(ing => ing.detectedName).join(', ')}`
      );
      recommendations.push('🤔 Consider avoiding due to uncertainty about halal status');
    }

    if (expertReviewIngredients.length > 0) {
      recommendations.push(
        `👨‍🔬 EXPERT REVIEW: ${expertReviewIngredients.length} ingredient(s) require expert verification`
      );
      recommendations.push('📞 Contact a qualified halal certification body for final determination');
    }

    if (haramIngredients.length === 0 && mashboohIngredients.length === 0) {
      recommendations.push('✅ All analyzed ingredients appear to be halal');
      recommendations.push('🌟 This product appears suitable for halal consumption');
    }

    // Add general recommendations
    recommendations.push('📋 Always verify with manufacturer about halal certification');
    recommendations.push('🏭 Check for cross-contamination with non-halal products during manufacturing');

    return recommendations;
  }

  /**
   * Categorize critical findings
   */
  private categorizeCriticalFindings(ingredients: IngredientAnalysis[]): {
    haram: IngredientAnalysis[];
    mashbooh: IngredientAnalysis[];
    requiresReview: IngredientAnalysis[];
  } {
    return {
      haram: ingredients.filter(ing => ing.status === HalalStatus.HARAM),
      mashbooh: ingredients.filter(ing => ing.status === HalalStatus.MASHBOOH),
      requiresReview: ingredients.filter(ing => ing.requiresExpertReview)
    };
  }

  /**
   * Save analysis results to database
   */
  private async saveAnalysisToDatabase(analysis: ProductAnalysis): Promise<void> {
    try {
      // Save main analysis record
      const analysisQuery = `
        INSERT INTO product_analyses (
          id, user_id, organization_id, product_name, ingredient_text,
          language, region, certification_standard, overall_status, overall_risk_level,
          total_ingredients, halal_count, haram_count, mashbooh_count,
          expert_review_required, processing_time_ms, recommendations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;

      await this.db.query(analysisQuery, [
        analysis.id,
        analysis.userId,
        analysis.organizationId,
        analysis.productName,
        analysis.ingredientText,
        analysis.language,
        analysis.region,
        analysis.certificationStandard,
        analysis.overallStatus,
        analysis.overallRiskLevel,
        analysis.summary.total_ingredients,
        analysis.summary.halal_count,
        analysis.summary.haram_count,
        analysis.summary.mashbooh_count,
        analysis.expertReviewRequired,
        analysis.processingTimeMs,
        JSON.stringify(analysis.recommendations)
      ]);

      // Save individual ingredient analyses
      for (const ingredient of analysis.ingredients) {
        const ingredientQuery = `
          INSERT INTO ingredient_analyses (
            analysis_id, ingredient_name, standard_name, halal_status, risk_level,
            confidence, reasoning, requires_expert_review, warnings, suggestions,
            source, e_numbers, categories
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `;

        await this.db.query(ingredientQuery, [
          analysis.id,
          ingredient.detectedName,
          ingredient.standardName,
          ingredient.status,
          ingredient.riskLevel,
          ingredient.confidence,
          ingredient.reasoning,
          ingredient.requiresExpertReview,
          JSON.stringify(ingredient.warnings),
          JSON.stringify(ingredient.suggestions),
          ingredient.source,
          JSON.stringify(ingredient.eNumbers),
          JSON.stringify(ingredient.categories)
        ]);
      }

      logger.info('Analysis saved to database', {
        analysisId: analysis.id,
        ingredientCount: analysis.ingredients.length
      });

    } catch (error) {
      logger.error('Failed to save analysis to database', {
        error: error.message,
        analysisId: analysis.id
      });
      // Don't throw here - analysis was successful, just saving failed
    }
  }
}