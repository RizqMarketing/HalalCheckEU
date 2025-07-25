// HalalCheck AI - OpenAI Analysis Service
// Handles ingredient analysis using GPT-4o with structured responses

const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class AIAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.model = process.env.AI_MODEL || 'gpt-4o';
    this.loadIngredientDatabase();
  }

  async loadIngredientDatabase() {
    try {
      const dbPath = path.join(__dirname, '../data/ingredients-database.json');
      const data = await fs.readFile(dbPath, 'utf8');
      this.ingredientDB = JSON.parse(data);
    } catch (error) {
      console.error('Failed to load ingredient database:', error);
      this.ingredientDB = { ingredients: [], enumbers: [] };
    }
  }

  async analyzeIngredients(ingredientText, options = {}) {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(ingredientText, options);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const analysisResult = JSON.parse(response.choices[0].message.content);
      const processingTime = (Date.now() - startTime) / 1000;
      
      return {
        ...analysisResult,
        processingTimeSeconds: processingTime,
        tokenUsage: response.usage,
        modelVersion: this.model,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('AI Analysis Error:', error);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  buildSystemPrompt() {
    return `You are HalalCheck AI, an expert halal food certification assistant with deep knowledge of Islamic dietary laws and food ingredients.

Your expertise includes:
- Comprehensive knowledge of halal/haram ingredients according to Islamic law
- Understanding of E-numbers and food additives
- Recognition of ingredients that may have both halal and haram sources
- Knowledge of manufacturing processes that affect halal status
- Familiarity with certification requirements across different Islamic schools of thought

CRITICAL INSTRUCTIONS:
1. Always respond with valid JSON in the exact format specified
2. Be extremely accurate - certification professionals rely on this analysis
3. Flag ANY ingredient that could potentially be haram or questionable
4. Provide confidence scores based on certainty of halal status
5. Include detailed Islamic references when relevant
6. Give specific, actionable recommendations for certification

Islamic Principles:
- Default assumption: ingredients are halal unless proven otherwise
- Main prohibitions: pork, alcohol, certain animal derivatives
- Critical concerns: gelatin sources, alcohol-based extracts, non-halal slaughter
- Manufacturing: cross-contamination with haram substances

Response Format (JSON):
{
  "overallStatus": "HALAL|HARAM|MASHBOOH",
  "confidenceScore": 0.00-1.00,
  "ingredients": [
    {
      "name": "ingredient name",
      "status": "HALAL|HARAM|MASHBOOH", 
      "confidence": 0.00-1.00,
      "reasoning": "detailed explanation",
      "concerns": ["array of specific concerns"],
      "recommendations": ["specific actions needed"]
    }
  ],
  "highRiskIngredients": ["ingredients requiring attention"],
  "overallReasoning": "comprehensive analysis summary",
  "islamicReferences": "relevant Quran/Hadith citations",
  "certificationRecommendations": ["specific certification actions"],
  "costSavingsEstimate": estimated_euros_saved
}`;
  }

  buildUserPrompt(ingredientText, options) {
    const analysisType = options.analysisType || 'standard';
    const region = options.region || 'global';
    
    return `Please analyze these ingredients for halal certification:

INGREDIENTS TO ANALYZE:
${ingredientText}

ANALYSIS REQUIREMENTS:
- Analysis Type: ${analysisType}
- Regional Standards: ${region}
- Certification Level: Professional
- Target Audience: Halal certification bodies

For each ingredient:
1. Determine halal status with confidence level
2. Identify potential sources of concern
3. Provide specific verification recommendations
4. Estimate time savings vs manual review (€50/hour baseline)

Pay special attention to:
- E-numbers and additives that may have animal origins
- Alcohol-containing ingredients (vanilla extract, etc.)
- Emulsifiers and stabilizers (lecithin, mono/diglycerides)
- Natural flavors that could contain alcohol
- Processing aids that may not be listed

Provide a thorough, professional analysis suitable for certification documentation.`;
  }

  // Specialized analysis for different file types
  async analyzeFromOCR(ocrText, options = {}) {
    const cleanedText = this.cleanOCRText(ocrText);
    return await this.analyzeIngredients(cleanedText, {
      ...options,
      analysisType: 'ocr_enhanced'
    });
  }

  async analyzeBulkProducts(productList, options = {}) {
    const results = [];
    
    for (const product of productList) {
      try {
        const result = await this.analyzeIngredients(product.ingredients, {
          ...options,
          productName: product.name,
          analysisType: 'bulk'
        });
        
        results.push({
          productName: product.name,
          ...result
        });
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        results.push({
          productName: product.name,
          error: error.message,
          status: 'FAILED'
        });
      }
    }
    
    return results;
  }

  cleanOCRText(text) {
    return text
      .replace(/[^\w\s\(\)\[\]\{\}:;,.\-\/]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n+/g, ' ') // Remove line breaks
      .trim();
  }

  // Calculate cost savings based on analysis complexity
  calculateCostSavings(ingredientCount, analysisComplexity = 'medium') {
    const baseTimeMinutes = {
      simple: 30,
      medium: 45,
      complex: 90
    };
    
    const timeMinutes = baseTimeMinutes[analysisComplexity] + (ingredientCount * 2);
    const hourlyRate = parseFloat(process.env.COST_SAVINGS_PER_HOUR) || 50;
    
    return Math.round((timeMinutes / 60) * hourlyRate);
  }

  // Confidence scoring based on ingredient complexity
  calculateConfidence(ingredients) {
    let totalConfidence = 0;
    let criticalIssues = 0;
    
    ingredients.forEach(ingredient => {
      totalConfidence += ingredient.confidence || 0.8;
      if (ingredient.status === 'HARAM') criticalIssues++;
      if (ingredient.status === 'MASHBOOH') criticalIssues += 0.5;
    });
    
    const avgConfidence = totalConfidence / ingredients.length;
    const penaltyForIssues = criticalIssues * 0.1;
    
    return Math.max(0, Math.min(1, avgConfidence - penaltyForIssues));
  }

  // Generate analysis summary for dashboard
  generateSummary(analysis) {
    const summary = {
      status: analysis.overallStatus,
      confidence: analysis.confidenceScore,
      totalIngredients: analysis.ingredients.length,
      flaggedIngredients: analysis.highRiskIngredients.length,
      processingTime: analysis.processingTimeSeconds,
      costSavings: analysis.costSavingsEstimate
    };
    
    return summary;
  }
}

module.exports = AIAnalysisService;