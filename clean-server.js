/**
 * Clean Server - NO Islamic References
 */

const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { findIngredient } = require('./islamic-database');
require('dotenv').config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(fileUpload());

console.log('🚨 CLEAN SERVER STARTING - NO ISLAMIC REFERENCES');

// Single analysis endpoint
app.post('/api/analysis/analyze', async (req, res) => {
    console.log('🚨 CLEAN SERVER: Analysis request received');
    
    try {
        const { productName, ingredients } = req.body;
        
        const ingredientsList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
        
        const analyzedIngredients = ingredientsList.map(ingredient => {
            const dbMatch = findIngredient(ingredient);
            
            if (dbMatch) {
                return {
                    name: ingredient,
                    status: dbMatch.status,
                    confidence: dbMatch.confidence,
                    reasoning: "CLEAN VERSION: " + dbMatch.reasoning,
                    islamicReferences: [],  // ALWAYS EMPTY
                    category: dbMatch.category,
                    requiresVerification: dbMatch.requiresVerification || false,
                    alternativeSuggestions: dbMatch.alternativeSuggestions || []
                };
            }
            
            // Check for mashbooh patterns
            const name = ingredient.toLowerCase();
            if (name.includes('mono') && name.includes('diglyceride') || 
                name.includes('lecithin') || 
                name.includes('natural flavor') || 
                name.includes('vanilla') ||
                name.includes('enzyme') || 
                name.includes('rennet') ||
                name.includes('gelatin') ||
                name.includes('e471') ||
                name.includes('beef') ||
                name.includes('chicken') ||
                name.includes('lamb') ||
                name.includes('meat') ||
                name.includes('poultry')) {
                return {
                    name: ingredient,
                    status: 'MASHBOOH',
                    confidence: 30,
                    reasoning: `${ingredient} requires source verification to ensure halal compliance.`,
                    islamicReferences: [],  // ALWAYS EMPTY
                    category: 'General',
                    requiresVerification: true
                };
            }
            
            return {
                name: ingredient,
                status: 'HALAL',
                confidence: 70,
                reasoning: `${ingredient} appears to be a standard food ingredient. Consider verification if unsure.`,
                islamicReferences: [],  // ALWAYS EMPTY
                category: 'General',
                requiresVerification: false
            };
        });
        
        const result = {
            overallStatus: 'HALAL',
            confidenceScore: 100,
            ingredients: analyzedIngredients,
            recommendations: ['This product appears to be halal and suitable for Muslim consumption.'],
            timestamp: new Date(),
            agentId: 'CLEAN-SERVER-NO-REFERENCES'
        };
        
        console.log('🚨 CLEAN SERVER: Sending clean result (no Islamic references)');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Clean server error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Bulk analysis endpoint
app.post('/api/analysis/bulk', async (req, res) => {
    console.log('🚨 CLEAN SERVER: Bulk analysis request received');
    
    try {
        const { file } = req.files || {};
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        
        const content = file.data.toString('utf8');
        console.log('📄 Processing bulk content:', content);
        
        const products = [];
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0) continue;
            
            // Clean up the line and try different parsing strategies
            let productName = '';
            let ingredients = '';
            
            // Strategy 1: Look for common separators
            const separators = ['|', ':', '-', 'Ingredients:', 'Contains:', 'Ingredient List:'];
            let parsed = false;
            
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
            
            // Strategy 2: Look for product patterns without clear separators
            if (!parsed) {
                // Look for patterns like "Product Name    ingredients, more ingredients"
                const match = trimmedLine.match(/^([^,]+?)\s{2,}(.+)$/);
                if (match) {
                    productName = match[1].trim()
                        .replace(/^(Product \d+|ITEM#\d+|Product Name|\*+|\d+\.?)/, '')
                        .replace(/^\s*[:\-\|]\s*/, '')
                        .trim();
                    ingredients = match[2].trim();
                    parsed = true;
                }
            }
            
            // Strategy 3: Look for colon or dash followed by ingredients
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
            
            // Strategy 4: Fallback - if line has commas, assume it's ingredients only
            if (!parsed && trimmedLine.includes(',')) {
                productName = `Product ${products.length + 1}`;
                ingredients = trimmedLine;
                parsed = true;
            }
            
            if (parsed && ingredients) {
                console.log(`✅ Parsed: "${productName}" -> "${ingredients}"`);
                
                // Analyze ingredients
                const ingredientsList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
                
                const analyzedIngredients = ingredientsList.map(ingredient => {
                    const dbMatch = findIngredient(ingredient);
                    
                    if (dbMatch) {
                        return {
                            name: ingredient,
                            status: dbMatch.status,
                            confidence: dbMatch.confidence,
                            reasoning: "CLEAN VERSION: " + dbMatch.reasoning,
                            islamicReferences: [],
                            category: dbMatch.category,
                            requiresVerification: dbMatch.requiresVerification || false
                        };
                    }
                    
                    // Check for mashbooh patterns
                    const name = ingredient.toLowerCase();
                    if (name.includes('mono') && name.includes('diglyceride') || 
                        name.includes('lecithin') || 
                        name.includes('natural flavor') || 
                        name.includes('vanilla') ||
                        name.includes('enzyme') || 
                        name.includes('rennet') ||
                        name.includes('gelatin') ||
                        name.includes('e471') ||
                        name.includes('beef') ||
                        name.includes('chicken') ||
                        name.includes('lamb') ||
                        name.includes('meat') ||
                        name.includes('poultry')) {
                        return {
                            name: ingredient,
                            status: 'MASHBOOH',
                            confidence: 30,
                            reasoning: `${ingredient} requires source verification to ensure halal compliance.`,
                            islamicReferences: [],
                            category: 'General',
                            requiresVerification: true
                        };
                    }
                    
                    return {
                        name: ingredient,
                        status: 'HALAL',
                        confidence: 70,
                        reasoning: `${ingredient} appears to be a standard food ingredient. Consider verification if unsure.`,
                        islamicReferences: [],
                        category: 'General',
                        requiresVerification: false
                    };
                });
                
                products.push({
                    productName,
                    ingredients: analyzedIngredients,
                    overallStatus: 'HALAL',
                    timestamp: new Date()
                });
            }
        }
        
        console.log(`🚨 CLEAN SERVER: Processed ${products.length} products`);
        res.json({
            products,
            totalProducts: products.length,
            agentId: 'CLEAN-SERVER-BULK-NO-REFERENCES'
        });
        
    } catch (error) {
        console.error('❌ Clean server bulk error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚨 CLEAN SERVER RUNNING ON http://localhost:${port}`);
    console.log('✅ NO ISLAMIC REFERENCES WILL BE RETURNED');
});