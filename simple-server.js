const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { OpenAI } = require('openai');
const PDFDocument = require('pdfkit');
require('dotenv').config();

const app = express();
const port = 3003;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configure multer
const upload = multer({ dest: 'uploads/' });

// SIMPLE CSV PARSER
function parseCSVFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n').filter(line => line.trim());
    
    const products = [];
    for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i];
        // Simple parsing: split on comma, remove quotes
        const parts = line.split('","');
        if (parts.length >= 2) {
            const productName = parts[0].replace(/^"/, '');
            const ingredients = parts[1].replace(/"$/, '');
            products.push({ productName, ingredients });
        }
    }
    return products;
}

// SIMPLE INGREDIENT PARSER
function parseIngredients(rawText) {
    return rawText.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
}

// ROBUST AI RESPONSE PARSER
function parseAIResponse(responseText) {
    console.log('Raw AI response:', responseText.substring(0, 200) + '...');
    
    let cleanedResponse = responseText;
    
    // Handle markdown code blocks
    if (responseText.includes('```')) {
        // Extract content between ```json and ``` or just ```
        const patterns = [
            /```json\s*([\s\S]*?)\s*```/,
            /```\s*([\s\S]*?)\s*```/
        ];
        
        for (const pattern of patterns) {
            const match = responseText.match(pattern);
            if (match) {
                cleanedResponse = match[1].trim();
                break;
            }
        }
    }
    
    console.log('Cleaned response:', cleanedResponse.substring(0, 200) + '...');
    
    try {
        return JSON.parse(cleanedResponse);
    } catch (error) {
        console.error('JSON Parse Error:', error.message);
        console.error('Attempted to parse:', cleanedResponse);
        throw new Error('Failed to parse AI response as JSON');
    }
}

// ANALYZE WITH GPT-4O
async function analyzeWithGPT4(productName, ingredientsList) {
    console.log('Making OpenAI API call...');
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a halal certification expert. Analyze EVERY ingredient individually.

Respond ONLY with valid JSON, no markdown formatting:
{
  "product": "name",
  "overall": "APPROVED/PROHIBITED/QUESTIONABLE/VERIFY_SOURCE",
  "confidence": 85,
  "ingredients": [
    {
      "name": "ingredient name",
      "status": "APPROVED/PROHIBITED/QUESTIONABLE/VERIFY_SOURCE",
      "reason": "explanation",
      "risk": "VERY_LOW/LOW/MEDIUM/HIGH/VERY_HIGH",
      "category": "type"
    }
  ],
  "warnings": [],
  "recommendations": []
}`
                },
                {
                    role: "user",
                    content: `Analyze ALL ingredients for ${productName}:

${ingredientsList.map((ing, i) => `${i+1}. ${ing}`).join('\n')}

Return ONLY JSON, no code blocks or markdown.`
                }
            ],
            max_tokens: 2000,
            temperature: 0.1
        });

        console.log('OpenAI API call completed');
        const responseText = completion.choices[0].message.content;
        console.log('Raw response length:', responseText.length);
        
        const response = parseAIResponse(responseText);
        
        // Force add missing ingredients if GPT-4o didn't analyze all
        if (response.ingredients.length < ingredientsList.length) {
            for (let i = response.ingredients.length; i < ingredientsList.length; i++) {
                response.ingredients.push({
                    name: ingredientsList[i],
                    status: 'VERIFY_SOURCE',
                    reason: 'Analysis incomplete - manual review needed',
                    risk: 'MEDIUM',
                    category: 'Unanalyzed'
                });
            }
        }
        
        console.log('Analysis processing completed');
        return response;
        
    } catch (error) {
        console.error('Error in analyzeWithGPT4:', error);
        throw error;
    }
}

// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', version: '2.0-with-pdf' });
});

// Simple authentication endpoints for demo
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationName, organizationType, country, phone, acceptTerms } = req.body;
        
        // Basic validation
        if (!email || !password || !firstName || !acceptTerms) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        // Mock successful registration
        console.log('New user registration:', email);
        
        // Generate a simple mock token
        const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        res.json({
            success: true,
            message: 'Registration successful',
            accessToken: mockToken,
            user: {
                email,
                firstName,
                lastName,
                organizationName,
                organizationType,
                country
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        // Mock successful login
        console.log('User login:', email);
        
        const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        res.json({
            success: true,
            message: 'Login successful',
            accessToken: mockToken,
            user: {
                email,
                firstName: 'Demo',
                lastName: 'User',
                organizationName: 'Demo Organization'
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', (req, res) => {
    try {
        // Mock dashboard statistics
        const stats = {
            totalAnalyses: Math.floor(Math.random() * 100) + 50,
            halalCount: Math.floor(Math.random() * 60) + 30,
            haramCount: Math.floor(Math.random() * 15) + 5,
            mashboohCount: Math.floor(Math.random() * 25) + 10,
            costSavings: Math.floor(Math.random() * 5000) + 2000,
            avgProcessingTime: Math.floor(Math.random() * 30) + 15
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get dashboard statistics'
        });
    }
});

// Recent analyses endpoint
app.get('/api/dashboard/recent-analyses', (req, res) => {
    try {
        // Mock recent analyses
        const recentAnalyses = [
            {
                id: '1',
                productName: 'Chocolate Cookies',
                status: 'APPROVED',
                createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
                ingredients: ['wheat flour', 'sugar', 'vegetable oil', 'cocoa']
            },
            {
                id: '2', 
                productName: 'Fruit Gummies',
                status: 'QUESTIONABLE',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                ingredients: ['glucose syrup', 'sugar', 'gelatin', 'citric acid']
            },
            {
                id: '3',
                productName: 'Organic Bread',
                status: 'APPROVED', 
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
                ingredients: ['organic wheat flour', 'water', 'yeast', 'salt']
            }
        ];
        
        res.json({
            success: true,
            data: recentAnalyses
        });
    } catch (error) {
        console.error('Recent analyses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent analyses'
        });
    }
});

// Test endpoint to verify server is updated
app.get('/api/test-pdf', (req, res) => {
    res.json({ message: 'PDF endpoint is available' });
});

app.get('/api/database/stats', (req, res) => {
    res.json({ total: 'Unlimited' });
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        const products = parseCSVFile(req.file.path);
        fs.unlinkSync(req.file.path);
        res.json({ 
            success: true, 
            totalProducts: products.length, 
            products: products,
            message: `Successfully parsed ${products.length} products from uploaded document`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/analysis/bulk', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const products = parseCSVFile(req.file.path);
        const results = [];
        
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            
            try {
                // Skip products without ingredients
                if (!product.ingredients || product.ingredients.trim() === '') {
                    console.log(`Skipping product ${product.productName || 'Unknown'}: No ingredients`);
                    results.push({
                        product: product.productName || 'Unknown Product',
                        status: 'ERROR',
                        error: 'No ingredients provided',
                        ingredients: []
                    });
                    continue;
                }
                
                const ingredientsList = parseIngredients(product.ingredients);
                
                // Skip if no valid ingredients after parsing
                if (ingredientsList.length === 0) {
                    console.log(`Skipping product ${product.productName}: No valid ingredients after parsing`);
                    results.push({
                        product: product.productName || 'Unknown Product',
                        status: 'ERROR',
                        error: 'No valid ingredients found',
                        ingredients: []
                    });
                    continue;
                }
                
                console.log(`Analyzing product ${i + 1}/${products.length}: ${product.productName}`);
                const analysis = await analyzeWithGPT4(product.productName, ingredientsList);
                results.push(analysis);
                
            } catch (productError) {
                console.error(`Error analyzing product ${product.productName}:`, productError);
                results.push({
                    product: product.productName || 'Unknown Product',
                    status: 'ERROR',
                    error: productError.message,
                    ingredients: []
                });
            }
        }
        
        fs.unlinkSync(req.file.path);
        res.json({ success: true, totalProcessed: results.length, results });
    } catch (error) {
        console.error('Bulk analysis error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message });
    }
});

// Single product analysis endpoint
app.post('/api/analysis/analyze', async (req, res) => {
    console.log('API endpoint hit:', req.body);
    try {
        const { productName, ingredients } = req.body;
        
        if (!ingredients || ingredients.trim() === '') {
            console.log('No ingredients provided');
            return res.status(400).json({ error: 'No ingredients provided' });
        }
        
        const ingredientsList = parseIngredients(ingredients);
        console.log('Parsed ingredients:', ingredientsList);
        
        if (ingredientsList.length === 0) {
            console.log('No valid ingredients after parsing');
            return res.status(400).json({ error: 'No valid ingredients found' });
        }
        
        console.log(`Starting AI analysis for product: ${productName || 'Unknown'}`);
        console.log(`Ingredients count: ${ingredientsList.length}`);
        
        const analysis = await analyzeWithGPT4(productName || 'Product', ingredientsList);
        
        console.log('Analysis completed successfully');
        res.json(analysis);
    } catch (error) {
        console.error('DETAILED Single analysis error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: error.message,
            details: 'Check server logs for more information'
        });
    }
});

// PDF Generation endpoint
app.post('/api/analysis/generate-pdf', (req, res) => {
    try {
        const { analysisData } = req.body;
        
        if (!analysisData) {
            return res.status(400).json({ error: 'No analysis data provided' });
        }

        console.log('Generating PDF for:', analysisData.product);

        // Create PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="halal-analysis-${analysisData.product || 'report'}.pdf"`);
        
        // Pipe PDF to response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('HalalCheck EU - Professional Analysis Report', 50, 50);
        doc.fontSize(12).text('AI-Powered Halal Certification Analysis', 50, 80);
        
        doc.moveDown(2);
        doc.fontSize(16).text(`Product: ${analysisData.product || 'Unknown Product'}`, 50, doc.y);
        doc.fontSize(14).text(`Overall Status: ${analysisData.overall || 'Unknown'}`, 50, doc.y + 20);
        doc.fontSize(12).text(`Confidence Level: ${analysisData.confidence || 'N/A'}%`, 50, doc.y + 20);
        
        doc.moveDown(2);
        doc.fontSize(14).text('Ingredient Analysis:', 50, doc.y);
        doc.moveDown();
        
        // Add ingredients
        if (analysisData.ingredients && analysisData.ingredients.length > 0) {
            analysisData.ingredients.forEach((ingredient, index) => {
                doc.fontSize(12);
                doc.text(`${index + 1}. ${ingredient.name}`, 70, doc.y + 10);
                doc.text(`   Status: ${ingredient.status}`, 90, doc.y + 5);
                doc.text(`   Risk Level: ${ingredient.risk}`, 90, doc.y + 5);
                doc.text(`   Reason: ${ingredient.reason}`, 90, doc.y + 5);
                doc.moveDown(0.5);
            });
        }

        // Add warnings
        if (analysisData.warnings && analysisData.warnings.length > 0) {
            doc.moveDown(2);
            doc.fontSize(14).text('Warnings:', 50, doc.y);
            analysisData.warnings.forEach((warning, index) => {
                doc.fontSize(12).text(`• ${warning}`, 70, doc.y + 10);
            });
        }

        // Add recommendations
        if (analysisData.recommendations && analysisData.recommendations.length > 0) {
            doc.moveDown(2);
            doc.fontSize(14).text('Recommendations:', 50, doc.y);
            analysisData.recommendations.forEach((rec, index) => {
                doc.fontSize(12).text(`• ${rec}`, 70, doc.y + 10);
            });
        }

        // Add footer
        doc.moveDown(3);
        doc.fontSize(10).text('Generated by HalalCheck EU - Professional Halal Analysis Platform', 50, doc.y);
        doc.text(`Report generated on: ${new Date().toLocaleString()}`, 50, doc.y + 15);
        doc.text('This report is for informational purposes only. Consult certified halal authorities for official certification.', 50, doc.y + 15);

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

app.listen(port, () => {
    console.log(`🚀 SIMPLE SERVER RUNNING ON http://localhost:${port}`);
    console.log('✅ This version will show ALL ingredients!');
});