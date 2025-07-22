/**
 * HalalCheck EU - Advanced AI Halal Analysis Server
 * Maximum accuracy through AI expertise - no database limitations
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const XLSX = require('xlsx');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'application/pdf',
            'text/csv',
            'text/plain',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('File type not supported. Please upload Excel, PDF, CSV, or Word documents.'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ADVANCED AI ANALYSIS FUNCTION - Maximum accuracy
async function analyzeWithAI(productName, ingredientsList) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('AI API key not configured');
    }

    try {
        const prompt = `CRITICAL: You MUST analyze EVERY SINGLE ingredient in this list. Do NOT skip any ingredients.

PRODUCT: ${productName}
TOTAL INGREDIENTS TO ANALYZE: ${ingredientsList.length}

INGREDIENT LIST (analyze each one individually):
${ingredientsList.map((ing, i) => `${i+1}. ${ing}`).join('\n')}

MANDATORY REQUIREMENTS:
- Your JSON response must contain exactly ${ingredientsList.length} ingredient objects in the "ingredients" array
- Analyze each numbered ingredient above individually  
- Do not combine or skip any ingredients
- Each ingredient gets its own analysis object

Respond with comprehensive analysis for all ${ingredientsList.length} ingredients.`;

        console.log(`\n=== FULL PROMPT BEING SENT TO AI MODEL ===`);
        console.log(prompt);
        console.log(`\n=== END PROMPT ===`);

        const completion = await openai.chat.completions.create({
            model: process.env.AI_MODEL || "gpt-4o",  // Ultra-smart AI model
            messages: [
                {
                    role: "system",
                    content: `You are a world-class halal certification expert. Analyze ingredients with maximum precision.

CLASSIFICATION FRAMEWORK:
• APPROVED: Clearly permissible ingredients with verified halal sources
• PROHIBITED: Explicitly forbidden ingredients (pork, alcohol, non-halal meat)
• QUESTIONABLE: Ingredients with scholarly debate or uncertain permissibility
• VERIFY_SOURCE: Requires supplier verification (animal-derived, enzymes, emulsifiers)

Respond with ONLY a JSON object in this exact format:

{
  "product": "product name",
  "overall": "APPROVED/PROHIBITED/QUESTIONABLE/VERIFY_SOURCE",
  "confidence": 85,
  "ingredients": [
    {
      "name": "ingredient name",
      "status": "APPROVED/PROHIBITED/QUESTIONABLE/VERIFY_SOURCE", 
      "reason": "detailed Islamic jurisprudence explanation",
      "risk": "VERY_LOW/LOW/MEDIUM/HIGH/VERY_HIGH",
      "category": "ingredient type"
    }
  ],
  "warnings": ["critical compliance warnings"],
  "recommendations": ["expert certification recommendations"],
  "timestamp": "${new Date().toISOString()}"
}`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 3000,
            temperature: 0.1
        });

        console.log(`\n=== RAW AI RESPONSE ===`);
        console.log(completion.choices[0].message.content);
        console.log(`\n=== END RESPONSE ===`);

        // Clean the response to handle markdown code blocks
        function parseAIResponse(content) {
            try {
                // First try direct JSON parsing
                return JSON.parse(content);
            } catch (error) {
                // If that fails, try to extract JSON from markdown code blocks
                const jsonMatch = content.match(/```(?:json)?\s*({[\s\S]*?})\s*```/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1]);
                }
                
                // If no code blocks found, try to find JSON object directly
                const jsonObjectMatch = content.match(/({[\s\S]*})/);
                if (jsonObjectMatch) {
                    return JSON.parse(jsonObjectMatch[1]);
                }
                
                throw new Error('Could not extract valid JSON from AI response');
            }
        }

        const gptResponse = parseAIResponse(completion.choices[0].message.content);
        
        // VALIDATION: Ensure all ingredients were analyzed
        const expectedCount = ingredientsList.length;
        const actualCount = gptResponse.ingredients ? gptResponse.ingredients.length : 0;
        
        console.log(`\n=== ANALYSIS VALIDATION ===`);
        console.log(`Expected ingredients: ${expectedCount}`);
        console.log(`Actual ingredients analyzed: ${actualCount}`);
        console.log(`AI analyzed ingredients:`, gptResponse.ingredients?.map(ing => ing.name));
        
        if (actualCount < expectedCount) {
            console.log(`❌ WARNING: AI only analyzed ${actualCount}/${expectedCount} ingredients!`);
            console.log(`Missing ingredients might be:`, ingredientsList.slice(actualCount));
            
            // Add missing ingredients with a warning status
            for (let i = actualCount; i < expectedCount; i++) {
                gptResponse.ingredients.push({
                    name: ingredientsList[i],
                    status: 'VERIFY_SOURCE',
                    reason: `Analysis incomplete - requires manual review`,
                    risk: 'MEDIUM',
                    category: 'Incomplete Analysis'
                });
            }
        }
        
        // Add metadata
        gptResponse.aiPowered = true;
        gptResponse.analysisMethod = 'Advanced AI Expert Analysis';
        gptResponse.processingTime = new Date().toISOString();
        gptResponse.apiVersion = 'Ultra-Smart AI';
        gptResponse.databaseFree = true;
        gptResponse.ingredientValidation = {
            expected: expectedCount,
            analyzed: actualCount,
            complete: actualCount >= expectedCount
        };
        
        return gptResponse;

    } catch (error) {
        console.error('AI analysis error:', error.message);
        console.error('Error details:', error.response?.data || error.cause || 'No additional details');
        throw error;
    }
}

// DOCUMENT PARSING FUNCTIONS
async function parseExcelFile(filePath) {
    try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const products = [];
        let headers = null;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            // First non-empty row is headers
            if (!headers) {
                headers = row.map(h => String(h).toLowerCase().trim());
                continue;
            }
            
            // Find product name and ingredients columns
            const productNameCol = headers.findIndex(h => 
                h.includes('product') || h.includes('name') || h.includes('title')
            );
            const ingredientsCol = headers.findIndex(h => 
                h.includes('ingredient') || h.includes('composition') || h.includes('formula')
            );
            
            if (productNameCol >= 0 && ingredientsCol >= 0 && row[productNameCol] && row[ingredientsCol]) {
                products.push({
                    productName: String(row[productNameCol]).trim(),
                    ingredients: String(row[ingredientsCol]).trim()
                });
            }
        }
        
        return products;
    } catch (error) {
        throw new Error(`Excel parsing failed: ${error.message}`);
    }
}

async function parsePDFFile(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        const text = data.text;
        
        // Look for ingredient lists in PDF text
        const products = [];
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentProduct = null;
        let currentIngredients = '';
        
        for (const line of lines) {
            // Product detection patterns
            if (line.toLowerCase().includes('product:') || 
                line.toLowerCase().includes('item:') ||
                /^[A-Z][a-zA-Z\s]+:/.test(line)) {
                
                // Save previous product if exists
                if (currentProduct && currentIngredients) {
                    products.push({
                        productName: currentProduct,
                        ingredients: currentIngredients.trim()
                    });
                }
                
                currentProduct = line.replace(/^[^:]*:/, '').trim();
                currentIngredients = '';
            }
            // Ingredient detection patterns
            else if (line.toLowerCase().includes('ingredient') || 
                     line.toLowerCase().includes('composition') ||
                     line.toLowerCase().includes('contains')) {
                currentIngredients += ' ' + line;
            }
            // Continue collecting ingredients if we're in an ingredient section
            else if (currentProduct && (line.includes(',') || line.includes(';'))) {
                currentIngredients += ' ' + line;
            }
        }
        
        // Add last product
        if (currentProduct && currentIngredients) {
            products.push({
                productName: currentProduct,
                ingredients: currentIngredients.trim()
            });
        }
        
        return products;
    } catch (error) {
        throw new Error(`PDF parsing failed: ${error.message}`);
    }
}

async function parseCSVFile(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf8');
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) {
            throw new Error('CSV file is empty');
        }
        
        // Proper CSV parsing that handles quoted fields with commas
        function parseCSVLine(line) {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        }
        
        const headers = parseCSVLine(lines[0]).map(h => h.replace(/['"]/g, '').toLowerCase().trim());
        const products = [];
        
        const productNameCol = headers.findIndex(h => 
            h.includes('product') || h.includes('name') || h.includes('title')
        );
        const ingredientsCol = headers.findIndex(h => 
            h.includes('ingredient') || h.includes('composition') || h.includes('formula')
        );
        
        if (productNameCol === -1 || ingredientsCol === -1) {
            throw new Error('CSV must contain product name and ingredients columns');
        }
        
        for (let i = 1; i < lines.length; i++) {
            const row = parseCSVLine(lines[i]).map(cell => cell.replace(/^["']|["']$/g, '').trim());
            
            if (row[productNameCol] && row[ingredientsCol]) {
                products.push({
                    productName: row[productNameCol],
                    ingredients: row[ingredientsCol]
                });
            }
        }
        
        return products;
    } catch (error) {
        throw new Error(`CSV parsing failed: ${error.message}`);
    }
}

// INTELLIGENT INGREDIENT PARSING - FIXED VERSION
function parseIngredients(rawText) {
    console.log('PARSING RAW TEXT:', rawText);
    
    // Simple comma-based splitting first
    const ingredients = rawText
        .toLowerCase()
        .split(',')  // Split only on commas
        .map(ingredient => ingredient.trim())
        .filter(ingredient => 
            ingredient && 
            ingredient.length > 1 && 
            ingredient.length < 100 &&
            !/^\d+$/.test(ingredient) &&
            !/^and$|^or$|^etc$/i.test(ingredient)
        );
    
    console.log('PARSED INGREDIENTS:', ingredients);
    console.log('INGREDIENT COUNT:', ingredients.length);
    
    return ingredients;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ 
        status: 'healthy',
        method: 'Advanced AI Analysis',
        coverage: 'Unlimited ingredients',
        accuracy: 'Expert-level with context',
        timestamp: new Date().toISOString()
    });
});

// Main analysis endpoint - Advanced AI
app.post('/api/analysis/analyze', async (req, res) => {
    try {
        const { productName, ingredients } = req.body;
        
        if (!productName || !ingredients) {
            return res.status(400).json({ error: 'Product name and ingredients are required' });
        }

        const ingredientsList = parseIngredients(ingredients);

        // ADVANCED AI ANALYSIS - Maximum accuracy
        try {
            const analysis = await analyzeWithAI(productName, ingredientsList);
            res.json(analysis);
        } catch (error) {
            console.error('AI analysis failed:', error);
            res.status(500).json({ 
                error: 'Analysis failed', 
                details: 'AI analysis unavailable. Please check API configuration.',
                message: 'This demo requires advanced AI for accurate halal analysis.'
            });
        }
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

// Stats endpoint
app.get('/api/stats', (req, res) => {
    res.json({
        message: 'Advanced AI Powered Halal Analysis',
        method: 'AI Expert Analysis',
        coverage: 'Unlimited ingredients',
        accuracy: 'Maximum - no database limitations',
        features: [
            'Comprehensive ingredient knowledge',
            'Real-time context analysis',
            'Global certification standards',
            'Supply chain expertise',
            'Alternative ingredient suggestions'
        ],
        timestamp: new Date().toISOString()
    });
});

// Database stats endpoint (for frontend compatibility)
app.get('/api/database/stats', (req, res) => {
    res.json({
        total: 'Unlimited',
        halal: '∞',
        haram: 'All known',
        mashbooh: 'All known',
        requiresReview: 'AI powered',
        eNumbers: 'Complete',
        additional: 'Unlimited',
        categories: ['All food categories']
    });
});

// DEBUG ENDPOINT - Test ingredient parsing
app.get('/api/debug/parse', (req, res) => {
    const testIngredients = "wheat flour, sugar, palm oil, cocoa powder, E471 mono and diglycerides, E322 lecithin, E500 sodium bicarbonate, salt, vanilla flavor";
    const parsed = parseIngredients(testIngredients);
    
    res.json({
        originalText: testIngredients,
        parsedIngredients: parsed,
        count: parsed.length,
        message: 'This shows how ingredient parsing works'
    });
});

// File upload and processing endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const mimeType = req.file.mimetype;
        
        let products = [];
        
        try {
            // Parse based on file type
            if (mimeType.includes('spreadsheet') || originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
                products = await parseExcelFile(filePath);
            } else if (mimeType === 'application/pdf') {
                products = await parsePDFFile(filePath);
            } else if (mimeType === 'text/csv' || originalName.endsWith('.csv')) {
                products = await parseCSVFile(filePath);
            } else if (mimeType === 'text/plain') {
                // Handle plain text files
                const text = fs.readFileSync(filePath, 'utf8');
                const lines = text.split('\n').filter(line => line.trim());
                
                // Simple format: each line is "Product Name: ingredients"
                for (const line of lines) {
                    if (line.includes(':')) {
                        const [productName, ingredients] = line.split(':', 2);
                        if (productName.trim() && ingredients.trim()) {
                            products.push({
                                productName: productName.trim(),
                                ingredients: ingredients.trim()
                            });
                        }
                    }
                }
            }
            
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            
            if (products.length === 0) {
                return res.status(400).json({ 
                    error: 'No valid products found in file',
                    message: 'Please ensure your file contains product names and ingredients in the expected format'
                });
            }

            // Return summary with option to analyze
            res.json({
                success: true,
                count: products.length,
                products: products.slice(0, 5), // Return first 5 as preview
                message: `Successfully extracted ${products.length} products. Ready for analysis.`,
                totalProducts: products.length
            });
            
        } catch (parseError) {
            // Clean up file on error
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw parseError;
        }
        
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ 
            error: 'File processing failed', 
            details: error.message 
        });
    }
});

// Bulk analysis endpoint for uploaded files
app.post('/api/analysis/bulk', upload.single('file'), async (req, res) => {
    console.log('\n🚀 BULK ANALYSIS REQUEST RECEIVED!');
    console.log('File:', req.file?.originalname);
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const mimeType = req.file.mimetype;
        
        let products = [];
        
        try {
            // Parse the file
            if (mimeType.includes('spreadsheet') || originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
                products = await parseExcelFile(filePath);
            } else if (mimeType === 'application/pdf') {
                products = await parsePDFFile(filePath);
            } else if (mimeType === 'text/csv' || originalName.endsWith('.csv')) {
                products = await parseCSVFile(filePath);
            } else {
                throw new Error('Unsupported file format for bulk analysis');
            }
            
            // Limit bulk processing to prevent API overuse
            const maxBulkProducts = 10;
            if (products.length > maxBulkProducts) {
                products = products.slice(0, maxBulkProducts);
            }
            
            // Process each product with GPT-4
            const results = [];
            
            for (const product of products) {
                try {
                    const ingredientsList = parseIngredients(product.ingredients);
                    
                    // Add debugging info that will be visible in browser
                    const debugInfo = {
                        productName: product.productName,
                        rawIngredients: product.ingredients,
                        parsedIngredients: ingredientsList,
                        ingredientCount: ingredientsList.length
                    };
                    
                    const analysis = await analyzeWithAI(product.productName, ingredientsList);
                    
                    // Add debugging info to the analysis result
                    analysis.debugInfo = debugInfo;
                    analysis.expectedIngredients = ingredientsList.length;
                    analysis.actualIngredients = analysis.ingredients ? analysis.ingredients.length : 0;
                    
                    results.push(analysis);
                    
                    // Small delay to respect API limits
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (err) {
                    results.push({
                        product: product.productName,
                        error: 'Analysis failed',
                        details: err.message,
                        debugInfo: {
                            productName: product.productName,
                            rawIngredients: product.ingredients,
                            errorMessage: err.message
                        }
                    });
                }
            }
            
            // Clean up uploaded file
            fs.unlinkSync(filePath);
            
            res.json({
                success: true,
                totalProcessed: results.length,
                results: results,
                message: `Bulk analysis completed for ${results.length} products`
            });
            
        } catch (parseError) {
            // Clean up file on error
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            throw parseError;
        }
        
    } catch (error) {
        console.error('Bulk analysis error:', error);
        res.status(500).json({ 
            error: 'Bulk analysis failed', 
            details: error.message 
        });
    }
});

// Email capture for feedback
app.post('/api/capture-email', async (req, res) => {
    try {
        const { email, feedback, source } = req.body;
        
        // Save to simple JSON file
        const emailData = {
            email,
            feedback: feedback || '',
            source: source || 'unknown',
            timestamp: new Date().toISOString(),
            type: 'feedback'
        };

        // Append to emails file
        let emails = [];
        
        try {
            const data = fs.readFileSync('emails.json', 'utf8');
            emails = JSON.parse(data);
        } catch (err) {
            // File doesn't exist yet
        }
        
        emails.push(emailData);
        fs.writeFileSync('emails.json', JSON.stringify(emails, null, 2));
        
        res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
        console.error('Email capture error:', error);
        res.status(500).json({ error: 'Failed to capture email' });
    }
});

// Serve the demo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// Start server
app.listen(port, () => {
    console.log('🤖 HalalCheck EU - Advanced AI Analysis Server');
    console.log(`🚀 Running on http://localhost:${port}`);
    console.log('💡 Method: Ultra-Smart AI - Maximum accuracy, unlimited coverage');
    console.log('🎯 Perfect for client demos - analyzes ANY ingredient');
    console.log('⚡ No database limitations, expert-level context awareness');
});