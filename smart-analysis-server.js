/**
 * Smart Analysis Server - GPT-4 Powered Islamic Jurisprudence
 * Replaces simple pattern matching with intelligent AI analysis
 */

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors({
    origin: ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());
app.use(fileUpload());

console.log('🧠 SMART ANALYSIS SERVER STARTING - GPT-4 POWERED');

// OpenAI API call function
async function analyzeWithGPT4(ingredients) {
    const prompt = `You are an expert in Islamic dietary laws (halal/haram). Analyze each ingredient for halal compliance.

CRITICAL ISLAMIC JURISPRUDENCE RULES:
- ALL MEAT (beef, chicken, lamb, poultry) = MASHBOOH (requires halal slaughter verification)
- Vanilla/vanilla flavor = MASHBOOH (often contains alcohol)
- Natural flavors = MASHBOOH (source unknown)
- Gelatin = MASHBOOH (animal source unknown)
- Lecithin = MASHBOOH (may be from non-halal sources)
- Enzymes = MASHBOOH (source verification needed)
- E-numbers with animal origins = MASHBOOH
- Alcohol-derived ingredients = HARAM
- Pork products = HARAM
- Clear plant-based ingredients = HALAL

Ingredients to analyze: ${ingredients}

Return ONLY a JSON array with this exact format:
[
  {
    "name": "ingredient name",
    "status": "HALAL|HARAM|MASHBOOH",
    "confidence": 30-90,
    "reasoning": "Brief explanation why this classification",
    "category": "General",
    "requiresVerification": true/false
  }
]

Be conservative - when in doubt, use MASHBOOH. Meat products must always be MASHBOOH unless explicitly halal-certified.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an Islamic jurisprudence expert specializing in halal food analysis. Always prioritize accuracy and Islamic compliance.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No valid JSON found in response');
        }
    } catch (error) {
        console.error('GPT-4 Analysis Error:', error);
        
        // Fallback to conservative pattern matching if GPT-4 fails
        const ingredientsList = ingredients.split(',').map(ing => ing.trim());
        return ingredientsList.map(ingredient => {
            const name = ingredient.toLowerCase();
            
            // Conservative fallback patterns
            if (name.includes('pork') || name.includes('ham') || name.includes('bacon') || name.includes('lard')) {
                return {
                    name: ingredient,
                    status: 'HARAM',
                    confidence: 95,
                    reasoning: `${ingredient} is prohibited in Islamic dietary law.`,
                    category: 'General',
                    requiresVerification: false
                };
            }
            
            if (name.includes('beef') || name.includes('chicken') || name.includes('lamb') || 
                name.includes('meat') || name.includes('poultry') || name.includes('vanilla') ||
                name.includes('gelatin') || name.includes('lecithin') || name.includes('enzyme') ||
                name.includes('natural flavor') || name.includes('rennet')) {
                return {
                    name: ingredient,
                    status: 'MASHBOOH',
                    confidence: 30,
                    reasoning: `${ingredient} requires source verification to ensure halal compliance.`,
                    category: 'General',
                    requiresVerification: true
                };
            }
            
            return {
                name: ingredient,
                status: 'HALAL',
                confidence: 70,
                reasoning: `${ingredient} appears to be a standard food ingredient. Consider verification if unsure.`,
                category: 'General',
                requiresVerification: false
            };
        });
    }
}

// Single analysis endpoint
app.post('/api/analysis/analyze', async (req, res) => {
    console.log('🧠 SMART SERVER: GPT-4 Analysis request received');
    
    try {
        const { productName, ingredients } = req.body;
        
        console.log('📝 Analyzing ingredients with GPT-4:', ingredients);
        
        const analyzedIngredients = await analyzeWithGPT4(ingredients);
        
        // Determine overall status
        const hasHaram = analyzedIngredients.some(ing => ing.status === 'HARAM');
        const hasMashbooh = analyzedIngredients.some(ing => ing.status === 'MASHBOOH');
        
        let overallStatus = 'HALAL';
        if (hasHaram) overallStatus = 'HARAM';
        else if (hasMashbooh) overallStatus = 'MASHBOOH';
        
        const result = {
            overallStatus,
            confidenceScore: hasHaram ? 95 : hasMashbooh ? 60 : 85,
            ingredients: analyzedIngredients.map(ing => ({
                ...ing,
                islamicReferences: [], // Always empty as requested
            })),
            recommendations: hasHaram ? 
                ['This product contains prohibited ingredients and is not suitable for Muslim consumption.'] :
                hasMashbooh ?
                ['This product contains questionable ingredients requiring verification for halal certification.'] :
                ['This product appears to be halal and suitable for Muslim consumption.'],
            timestamp: new Date(),
            agentId: 'GPT4-ISLAMIC-ANALYSIS'
        };
        
        console.log('🧠 SMART SERVER: GPT-4 analysis complete');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Smart server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk analysis endpoint
app.post('/api/analysis/bulk', async (req, res) => {
    console.log('🧠 SMART SERVER: GPT-4 Bulk analysis request received');
    
    try {
        const { file } = req.files || {};
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        
        const content = file.data.toString('utf8');
        console.log('📄 Processing bulk content with GPT-4');
        
        const products = [];
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0) continue;
            
            // Use same parsing logic but with GPT-4 analysis
            let productName = '';
            let ingredients = '';
            let parsed = false;
            
            // Strategy 1: Look for common separators
            const separators = ['|', ':', '-', 'Ingredients:', 'Contains:', 'Ingredient List:'];
            
            for (const separator of separators) {
                if (trimmedLine.includes(separator)) {
                    const parts = trimmedLine.split(separator);
                    if (parts.length >= 2) {
                        productName = parts[0].trim()
                            .replace(/^(Product \d+|ITEM#\d+|Product Name|\*+|\d+\.?)/, '')
                            .replace(/^\s*[:\-\|]\s*/, '')
                            .trim();
                        ingredients = parts.slice(1).join(' ').trim();
                        parsed = true;
                        break;
                    }
                }
            }
            
            // Strategy 2: Multiple spaces pattern
            if (!parsed) {
                const match = trimmedLine.match(/^([^,]+?)\s{2,}(.+)$/);
                if (match) {
                    productName = match[1].trim()
                        .replace(/^(Product \d+|ITEM#\d+|Product Name|\*+|\d+\.?)/, '')
                        .trim();
                    ingredients = match[2].trim();
                    parsed = true;
                }
            }
            
            // Strategy 3: Colon/dash pattern
            if (!parsed) {
                const match = trimmedLine.match(/^(.+?)[\:\-]\s*(.+)$/);
                if (match && match[2].includes(',')) {
                    productName = match[1].trim()
                        .replace(/^(Product \d+|ITEM#\d+|Product Name|\*+|\d+\.?)/, '')
                        .trim();
                    ingredients = match[2].trim();
                    parsed = true;
                }
            }
            
            if (parsed && ingredients) {
                console.log(`✅ Parsed: "${productName}" -> analyzing with GPT-4`);
                
                // Use GPT-4 for analysis
                const analyzedIngredients = await analyzeWithGPT4(ingredients);
                
                // Determine overall status
                const hasHaram = analyzedIngredients.some(ing => ing.status === 'HARAM');
                const hasMashbooh = analyzedIngredients.some(ing => ing.status === 'MASHBOOH');
                
                let overallStatus = 'HALAL';
                if (hasHaram) overallStatus = 'HARAM';
                else if (hasMashbooh) overallStatus = 'MASHBOOH';
                
                products.push({
                    productName,
                    ingredients: analyzedIngredients.map(ing => ({
                        ...ing,
                        islamicReferences: [], // Always empty
                    })),
                    overallStatus,
                    timestamp: new Date()
                });
            }
        }
        
        console.log(`🧠 SMART SERVER: GPT-4 processed ${products.length} products`);
        res.json({
            products,
            totalProducts: products.length,
            agentId: 'GPT4-BULK-ISLAMIC-ANALYSIS'
        });
        
    } catch (error) {
        console.error('❌ Smart server bulk error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🧠 SMART ANALYSIS SERVER RUNNING ON http://localhost:${port}`);
    console.log('✅ GPT-4 POWERED ISLAMIC JURISPRUDENCE ANALYSIS');
});