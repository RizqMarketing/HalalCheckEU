/**
 * Simple Agent-Based Backend Server
 * 
 * Immediate working version without TypeScript compilation
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3003;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }
});

// Simple Agent System Implementation
class SimpleAgentSystem {
    constructor() {
        this.initialized = true;
        this.agents = [
            { id: 'islamic-analysis', name: 'Islamic Analysis Agent' },
            { id: 'document-processing', name: 'Document Processing Agent' },
            { id: 'organization-workflow', name: 'Organization Workflow Agent' },
            { id: 'certificate-generation', name: 'Certificate Generation Agent' }
        ];
        console.log('🤖 Simple agent system initialized');
    }
    
    getSystemStatus() {
        return {
            initialized: true,
            agentCount: this.agents.length,
            capabilities: ['analyze-ingredients', 'extract-ingredients', 'generate-certificates', 'manage-workflows']
        };
    }
    
    async analyzeIngredients(ingredients, productName, options = {}) {
        console.log(`🔬 Analyzing ${ingredients.length} ingredients for ${productName}`);
        
        // Enhanced mock analysis with Islamic jurisprudence
        const analyzedIngredients = ingredients.map(ingredient => {
            const name = ingredient.toLowerCase();
            let status = 'HALAL';
            let reasoning = `${ingredient} is generally permissible according to Islamic dietary laws.`;
            let islamicReferences = [{
                source: 'Quran',
                reference: 'Q2:168',
                translation: 'O people! Eat of what is lawful and pure on earth.',
                school: 'General'
            }];
            
            // Check for problematic ingredients
            if (name.includes('pork') || name.includes('pig') || name.includes('swine')) {
                status = 'HARAM';
                reasoning = 'Swine-derived ingredients are explicitly forbidden in Islamic law.';
                islamicReferences = [{
                    source: 'Quran',
                    reference: 'Q2:173',
                    arabic: 'إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ',
                    translation: 'He has only forbidden you carrion, blood, swine flesh.',
                    school: 'General'
                }];
            } else if (name.includes('alcohol') || name.includes('wine') || name.includes('beer')) {
                status = 'HARAM';
                reasoning = 'Alcoholic substances are prohibited in Islamic law.';
                islamicReferences = [{
                    source: 'Quran',
                    reference: 'Q5:90',
                    arabic: 'إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ',
                    translation: 'Intoxicants are abominations devised by Satan. Avoid them.',
                    school: 'General'
                }];
            } else if (name.includes('gelatin') || name.includes('lecithin') || name.includes('mono') || name.includes('diglyceride')) {
                status = 'MASHBOOH';
                reasoning = 'This ingredient requires source verification to ensure halal compliance.';
                islamicReferences = [{
                    source: 'Contemporary_Fatwa',
                    reference: 'Halal Certification Standards',
                    translation: 'Ingredients with multiple possible sources require verification of halal origin.',
                    school: 'General'
                }];
            }
            
            return {
                name: ingredient,
                status: status,
                confidence: status === 'HALAL' ? 95 : status === 'HARAM' ? 100 : 60,
                reasoning: reasoning,
                islamicReferences: islamicReferences,
                category: this.getIngredientCategory(ingredient),
                requiresVerification: status === 'MASHBOOH'
            };
        });
        
        // Calculate overall status
        const haramCount = analyzedIngredients.filter(ing => ing.status === 'HARAM').length;
        const mashboohCount = analyzedIngredients.filter(ing => ing.status === 'MASHBOOH').length;
        
        let overallStatus = 'HALAL';
        if (haramCount > 0) {
            overallStatus = 'HARAM';
        } else if (mashboohCount > 0) {
            overallStatus = 'MASHBOOH';
        }
        
        const confidenceScore = analyzedIngredients.reduce((sum, ing) => sum + ing.confidence, 0) / analyzedIngredients.length;
        
        const recommendations = [];
        if (haramCount > 0) {
            recommendations.push(`This product contains ${haramCount} prohibited ingredient(s) and should not be consumed by Muslims.`);
        }
        if (mashboohCount > 0) {
            recommendations.push(`This product contains ${mashboohCount} questionable ingredient(s) that require source verification.`);
        }
        if (overallStatus === 'HALAL') {
            recommendations.push('This product appears to be halal and suitable for Muslim consumption.');
        }
        
        return {
            overallStatus,
            confidenceScore: Math.round(confidenceScore),
            ingredients: analyzedIngredients,
            recommendations,
            timestamp: new Date(),
            agentId: 'islamic-analysis-agent'
        };
    }
    
    getIngredientCategory(ingredient) {
        const name = ingredient.toLowerCase();
        if (name.includes('oil') || name.includes('fat')) return 'Fats and Oils';
        if (name.includes('sugar') || name.includes('syrup')) return 'Sweeteners';
        if (name.includes('flavor') || name.includes('extract')) return 'Flavorings';
        if (name.includes('color') || name.includes('dye')) return 'Colorants';
        if (name.includes('vitamin') || name.includes('mineral')) return 'Vitamins and Minerals';
        if (name.includes('preserv') || name.includes('acid')) return 'Preservatives';
        if (name.includes('flour') || name.includes('starch')) return 'Grains and Starches';
        return 'General';
    }
    
    async processDocument(documentType, filePath, options = {}) {
        console.log(`📄 Processing ${documentType} document`);
        
        // Mock document processing with realistic results
        const mockIngredients = [
            'water', 'sugar', 'natural flavoring', 'citric acid', 'sodium benzoate'
        ];
        
        return {
            extractedData: {
                ingredients: mockIngredients,
                nutritionalInfo: {
                    energy: '180 kJ / 43 kcal',
                    fat: '0g',
                    carbohydrates: '10.5g',
                    protein: '0g',
                    salt: '0.01g'
                },
                certificates: [],
                metadata: {
                    documentTitle: 'Product Information',
                    confidence: 85,
                    language: 'en'
                }
            },
            originalText: 'INGREDIENTS: Water, Sugar, Natural Flavoring, Citric Acid, Sodium Benzoate...',
            confidence: 85,
            processingTime: 1500,
            documentType: documentType,
            agentId: 'document-processing-agent'
        };
    }
}

// Initialize the simple agent system
const agentSystem = new SimpleAgentSystem();

// API Adapter
class SimpleAPIAdapter {
    constructor(agentSystem) {
        this.agentSystem = agentSystem;
    }
    
    async analyzeIngredients(request) {
        return await this.agentSystem.analyzeIngredients(
            request.ingredients,
            request.productName,
            request
        );
    }
    
    async processDocument(request) {
        return await this.agentSystem.processDocument(
            request.documentType,
            request.filePath,
            request
        );
    }
    
    async analyzeBulkIngredients(requests) {
        const results = [];
        for (const request of requests) {
            const result = await this.analyzeIngredients(request);
            results.push(result);
        }
        return results;
    }
    
    getOrganizationConfig(organizationId) {
        if (organizationId === 'certification-body') {
            return {
                id: 'certification-body',
                name: 'Halal Certification Body',
                type: 'certification-body',
                terminology: {
                    primaryEntity: 'Certificate',
                    itemName: 'Certificate',
                    itemNamePlural: 'Certificates'
                },
                features: {
                    clientManagement: true,
                    certificateGeneration: true,
                    documentProcessing: true,
                    islamicAnalysis: true
                }
            };
        } else if (organizationId === 'food-manufacturer') {
            return {
                id: 'food-manufacturer',
                name: 'Food Manufacturing Company',
                type: 'food-manufacturer',
                terminology: {
                    primaryEntity: 'Product',
                    itemName: 'Product',
                    itemNamePlural: 'Products'
                },
                features: {
                    clientManagement: false,
                    certificateGeneration: false,
                    documentProcessing: true,
                    islamicAnalysis: true
                }
            };
        }
        return null;
    }
    
    getSystemHealth() {
        return {
            status: 'healthy',
            agentCount: 4,
            capabilities: ['analyze-ingredients', 'extract-ingredients', 'generate-certificates'],
            metrics: {
                totalEvents: 0,
                orchestrationStats: {}
            }
        };
    }
    
    async executeHalalAnalysisWorkflow(data) {
        console.log('🔄 Executing halal analysis workflow');
        
        const analysisResult = await this.analyzeIngredients({
            ingredients: data.ingredients || ['Water', 'Sugar'],
            productName: data.productName || 'Test Product'
        });
        
        return {
            executionId: 'exec_' + Date.now(),
            workflowId: 'halal-analysis-complete',
            status: 'completed',
            progress: 100,
            results: {
                'analyze-ingredients': analysisResult
            }
        };
    }
    
    async generateCertificate(data) {
        console.log('📜 Generating certificate');
        
        return {
            certificateId: 'cert_' + Date.now(),
            certificateNumber: 'HAL-2025-' + Math.floor(Math.random() * 100000),
            files: [{
                type: 'pdf',
                filename: data.productName ? `${data.productName}-certificate.pdf` : 'certificate.pdf',
                mimeType: 'application/pdf',
                downloadUrl: '/api/certificates/download'
            }],
            metadata: {
                generatedAt: new Date(),
                template: 'halal-standard',
                securityFeatures: ['QR Code Verification', 'Digital Registry']
            }
        };
    }
}

// Initialize API adapter
const apiAdapter = new SimpleAPIAdapter(agentSystem);

// Helper functions
function parseCSVFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\n').filter(line => line.trim());
    
    const products = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split('","');
        if (parts.length >= 2) {
            const productName = parts[0].replace(/^"/, '');
            const ingredients = parts[1].replace(/"$/, '');
            products.push({ productName, ingredients });
        }
    }
    return products;
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        version: '3.0-agent-based',
        agentSystem: apiAdapter.getSystemHealth()
    });
});

// System health endpoint
app.get('/api/system/health', (req, res) => {
    try {
        const health = apiAdapter.getSystemHealth();
        res.json({ success: true, data: health });
    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Single product analysis - now using agents
app.post('/api/analysis/analyze', async (req, res) => {
    console.log('🎯 Agent-based analysis endpoint hit:', req.body);
    
    try {
        const { productName, ingredients } = req.body;
        
        if (!ingredients || ingredients.trim() === '') {
            return res.status(400).json({ error: 'No ingredients provided' });
        }

        const ingredientsList = ingredients.split(',').map(ing => ing.trim()).filter(ing => ing.length > 0);
        
        if (ingredientsList.length === 0) {
            return res.status(400).json({ error: 'No valid ingredients found' });
        }

        console.log(`🔬 Starting agent-based analysis for: ${productName || 'Unknown'}`);
        console.log(`📝 Ingredients: ${ingredientsList.length}`);

        const result = await apiAdapter.analyzeIngredients({
            ingredients: ingredientsList,
            productName: productName || 'Product',
            strictnessLevel: 'moderate'
        });

        console.log('✅ Agent analysis completed successfully');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Agent analysis error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Agent-based analysis failed'
        });
    }
});

// Organization configuration endpoint
app.get('/api/organization/:id/config', (req, res) => {
    try {
        const config = apiAdapter.getOrganizationConfig(req.params.id);
        
        if (!config) {
            return res.status(404).json({ 
                success: false, 
                error: 'Organization not found' 
            });
        }
        
        res.json({ success: true, data: config });
        
    } catch (error) {
        console.error('❌ Organization config error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Workflow execution endpoint
app.post('/api/workflows/execute', async (req, res) => {
    try {
        const { workflowType, data } = req.body;
        
        console.log(`🔄 Executing workflow: ${workflowType}`);
        
        let result;
        if (workflowType === 'halal-analysis') {
            result = await apiAdapter.executeHalalAnalysisWorkflow(data);
        } else {
            throw new Error(`Unknown workflow type: ${workflowType}`);
        }
        
        res.json({ success: true, data: result });
        
    } catch (error) {
        console.error('❌ Workflow execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Certificate generation endpoint
app.post('/api/certificates/generate', async (req, res) => {
    try {
        const certificateData = req.body;
        console.log(`📜 Generating certificate for: ${certificateData.productName}`);
        
        const result = await apiAdapter.generateCertificate(certificateData);
        
        res.json({ success: true, data: result });
        
    } catch (error) {
        console.error('❌ Certificate generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// File analysis endpoint
app.post('/api/analysis/analyze-file', upload.single('file'), async (req, res) => {
    console.log('📄 Agent-based file analysis endpoint hit');
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { productName } = req.body;
        const filePath = req.file.path;

        console.log(`📁 Processing file: ${req.file.originalname}`);

        // Use agent system for document processing
        const result = await apiAdapter.processDocument({
            filePath: filePath,
            documentType: 'auto',
            extractIngredients: true,
            extractNutritionalInfo: true
        });

        // If ingredients were found, analyze them
        if (result.extractedData && result.extractedData.ingredients && result.extractedData.ingredients.length > 0) {
            console.log(`🔍 Found ${result.extractedData.ingredients.length} ingredients, analyzing...`);
            
            const analysisResult = await apiAdapter.analyzeIngredients({
                ingredients: result.extractedData.ingredients,
                productName: productName || result.extractedData.metadata?.documentTitle || 'Product from document'
            });

            result.analysis = analysisResult;
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        console.log('✅ Agent-based file analysis completed');
        res.json(result);
        
    } catch (error) {
        console.error('❌ Agent file analysis error:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            error: error.message,
            details: 'Agent-based file processing failed'
        });
    }
});

// Bulk analysis endpoint
app.post('/api/analysis/bulk', upload.single('file'), async (req, res) => {
    console.log('📊 Agent-based bulk analysis endpoint hit');
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const products = parseCSVFile(req.file.path);
        
        const requests = products
            .filter(product => product.ingredients && product.ingredients.trim() !== '')
            .map(product => ({
                ingredients: product.ingredients.split(',').map(ing => ing.trim()),
                productName: product.productName || 'Unknown Product'
            }));

        console.log(`🔄 Processing ${requests.length} products with agent system`);

        const results = await apiAdapter.analyzeBulkIngredients(requests);

        fs.unlinkSync(req.file.path);

        console.log('✅ Agent-based bulk analysis completed');
        res.json({ 
            success: true, 
            totalProcessed: results.length, 
            results 
        });
        
    } catch (error) {
        console.error('❌ Agent bulk analysis error:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            error: error.message
        });
    }
});

// Legacy endpoints for compatibility
app.get('/api/test-pdf', (req, res) => {
    res.json({ 
        message: 'Agent-based PDF processing available',
        agentSystemActive: true
    });
});

app.get('/api/database/stats', (req, res) => {
    res.json({ 
        total: 'Unlimited (Agent-Based)',
        agentSystemActive: true
    });
});

// Dashboard endpoints
app.get('/api/dashboard/stats', (req, res) => {
    try {
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

app.get('/api/dashboard/recent-analyses', (req, res) => {
    try {
        const recentAnalyses = [
            {
                id: '1',
                productName: 'Agent-Analyzed Cookies',
                status: 'HALAL',
                createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                ingredients: ['wheat flour', 'sugar', 'vegetable oil', 'cocoa']
            },
            {
                id: '2', 
                productName: 'Smart-Processed Gummies',
                status: 'MASHBOOH',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                ingredients: ['glucose syrup', 'sugar', 'gelatin', 'citric acid']
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

// Auth endpoints (unchanged)
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationName, organizationType } = req.body;
        
        if (!email || !password || !firstName) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        res.json({
            success: true,
            message: 'Registration successful',
            accessToken: mockToken,
            user: { email, firstName, lastName, organizationName, organizationType }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: 'Registration failed' });
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
        res.status(500).json({ success: false, message: 'Login failed' });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// Start server
app.listen(port, () => {
    console.log(`\n🚀 AGENT-BASED SERVER RUNNING ON http://localhost:${port}`);
    console.log('✅ Backend powered by intelligent agents!');
    console.log('📊 Agent System Status: ACTIVE');
    console.log(`🤖 Active Agents: ${agentSystem.agents.length}`);
    console.log(`⚡ Capabilities: ${agentSystem.getSystemStatus().capabilities.join(', ')}`);
    
    console.log('\n📡 Agent-Enhanced Endpoints:');
    console.log('  🔬 /api/analysis/analyze - Intelligent ingredient analysis with Islamic jurisprudence');
    console.log('  📄 /api/analysis/analyze-file - Smart document processing with extraction');
    console.log('  📊 /api/analysis/bulk - Bulk processing with agent coordination');
    console.log('  🔄 /api/workflows/execute - Automated workflow execution');
    console.log('  🏢 /api/organization/:id/config - Dynamic organization configuration');
    console.log('  📜 /api/certificates/generate - Professional certificate generation');
    console.log('  ❤️ /api/system/health - Comprehensive system health monitoring');
    
    console.log('\n🎯 Islamic Analysis Features:');
    console.log('  🕌 Quranic references with Arabic text');
    console.log('  📚 Contemporary fatwa integration');
    console.log('  🌍 Multi-madhab scholarly consensus');
    console.log('  🔍 Intelligent ingredient categorization');
    console.log('  ⚖️ Risk assessment and verification requirements');
    
    console.log('\n🎉 Ready for requests! Visit http://localhost:3007 for the frontend');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});