/**
 * Simple Reliable Server - Back to Basics
 * No complex GPT-4, just smart pattern matching that works
 */

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
require('dotenv').config();

const app = express();
const port = 6000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

console.log('🟢 SIMPLE RELIABLE SERVER STARTING');

// Smart analysis function with proper Islamic jurisprudence
function analyzeIngredient(ingredient) {
    const name = ingredient.toLowerCase().trim();
    
    // HARAM - Clearly prohibited
    if (name.includes('pork') || name.includes('ham') || name.includes('bacon') || 
        name.includes('lard') || name.includes('wine') || name.includes('beer') ||
        name.includes('alcohol') || name.includes('ethanol')) {
        return {
            name: ingredient,
            status: 'HARAM',
            confidence: 95,
            reasoning: `${ingredient} is prohibited in Islamic dietary law.`,
            category: 'General',
            requiresVerification: false
        };
    }
    
    // MASHBOOH - Requires verification (MOST IMPORTANT FIXES)
    if (
        // ALL MEAT requires halal slaughter verification
        name.includes('beef') || name.includes('chicken') || name.includes('lamb') || 
        name.includes('meat') || name.includes('poultry') || name.includes('turkey') ||
        name.includes('duck') || name.includes('goat') || name.includes('mutton') ||
        
        // Vanilla often contains alcohol
        name.includes('vanilla') || 
        
        // Natural flavors - source unknown
        name.includes('natural flavor') || name.includes('natural flavoring') ||
        
        // Animal-derived or source-questionable ingredients
        name.includes('gelatin') || name.includes('lecithin') || name.includes('enzyme') ||
        name.includes('rennet') || name.includes('whey') || name.includes('casein') ||
        
        // E-numbers that can be animal-derived
        name.includes('e471') || name.includes('e472') || name.includes('e481') ||
        name.includes('e482') || name.includes('e631') || name.includes('e627') ||
        
        // Other questionable
        name.includes('mono') && name.includes('diglyceride') ||
        name.includes('glycerin') || name.includes('glycerol') ||
        name.includes('shortening') || name.includes('margarine')
    ) {
        return {
            name: ingredient,
            status: 'MASHBOOH',
            confidence: 40,
            reasoning: `${ingredient} requires source verification to ensure halal compliance.`,
            category: 'General',
            requiresVerification: true
        };
    }
    
    // HALAL - Generally accepted
    return {
        name: ingredient,
        status: 'HALAL',
        confidence: 80,
        reasoning: `${ingredient} appears to be permissible. Consider verification if unsure.`,
        category: 'General',
        requiresVerification: false
    };
}

// Single analysis endpoint
app.post('/api/analysis/analyze', async (req, res) => {
    console.log('🟢 SIMPLE SERVER: Analysis request received');
    
    try {
        const { productName, ingredients } = req.body;
        
        const ingredientsList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
        
        const analyzedIngredients = ingredientsList.map(ingredient => {
            const result = analyzeIngredient(ingredient);
            return {
                ...result,
                islamicReferences: [] // Always empty as requested
            };
        });
        
        // Determine overall status
        const hasHaram = analyzedIngredients.some(ing => ing.status === 'HARAM');
        const hasMashbooh = analyzedIngredients.some(ing => ing.status === 'MASHBOOH');
        
        let overallStatus = 'HALAL';
        if (hasHaram) overallStatus = 'HARAM';
        else if (hasMashbooh) overallStatus = 'MASHBOOH';
        
        const result = {
            overallStatus,
            confidenceScore: hasHaram ? 95 : hasMashbooh ? 60 : 85,
            ingredients: analyzedIngredients,
            recommendations: hasHaram ? 
                ['This product contains prohibited ingredients and is not suitable for Muslim consumption.'] :
                hasMashbooh ?
                ['This product contains questionable ingredients requiring verification for halal certification.'] :
                ['This product appears to be halal and suitable for Muslim consumption.'],
            timestamp: new Date(),
            agentId: 'SIMPLE-RELIABLE-ANALYSIS'
        };
        
        console.log('🟢 SIMPLE SERVER: Analysis complete');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Simple server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk analysis endpoint
app.post('/api/analysis/bulk', async (req, res) => {
    console.log('🟢 SIMPLE SERVER: Bulk analysis request received');
    
    try {
        const { file } = req.files || {};
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        
        const content = file.data.toString('utf8');
        const products = [];
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0) continue;
            
            let productName = '';
            let ingredients = '';
            let parsed = false;
            
            // Strategy 1: Common separators
            const separators = ['|', ':', '-', 'Ingredients:', 'Contains:', 'Ingredient List:'];
            for (const separator of separators) {
                if (trimmedLine.includes(separator)) {
                    const parts = trimmedLine.split(separator);
                    if (parts.length >= 2) {
                        productName = parts[0].trim()
                            .replace(/^(Product \d+|ITEM#\d+|Product Name|\*+|\d+\.?)/, '')
                            .trim();
                        ingredients = parts.slice(1).join(' ').trim();
                        parsed = true;
                        break;
                    }
                }
            }
            
            // Strategy 2: Multiple spaces
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
            
            if (parsed && ingredients) {
                const ingredientsList = ingredients.split(',').map(ing => ing.trim());
                const analyzedIngredients = ingredientsList.map(ingredient => {
                    const result = analyzeIngredient(ingredient);
                    return {
                        ...result,
                        islamicReferences: []
                    };
                });
                
                const hasHaram = analyzedIngredients.some(ing => ing.status === 'HARAM');
                const hasMashbooh = analyzedIngredients.some(ing => ing.status === 'MASHBOOH');
                
                let overallStatus = 'HALAL';
                if (hasHaram) overallStatus = 'HARAM';
                else if (hasMashbooh) overallStatus = 'MASHBOOH';
                
                products.push({
                    productName,
                    ingredients: analyzedIngredients,
                    overallStatus,
                    timestamp: new Date()
                });
            }
        }
        
        console.log(`🟢 SIMPLE SERVER: Processed ${products.length} products`);
        res.json({
            products,
            totalProducts: products.length,
            agentId: 'SIMPLE-RELIABLE-BULK'
        });
        
    } catch (error) {
        console.error('❌ Simple server bulk error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🟢 SIMPLE RELIABLE SERVER RUNNING ON http://localhost:${port}`);
    console.log('✅ SMART PATTERN MATCHING - NO COMPLICATIONS');
});