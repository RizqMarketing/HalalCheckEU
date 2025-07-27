/**
 * Agent-Based Backend Server
 * 
 * Replaces simple-server.js with the new agent system
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

// Import the TypeScript agent system (will need compilation)
// For now, let's create a bridge to demonstrate integration
const { AgentSystem } = require('./agents/dist/AgentSystem');
const { AgentAPIAdapter } = require('./agents/dist/integration/AgentAPIAdapter');

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

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/bmp',
        'application/pdf',
        'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/xml', 'application/xml', 'application/json'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25MB limit
    }
});

// Global variables for agent system
let agentSystem = null;
let apiAdapter = null;

// Initialize Agent System
async function initializeAgentSystem() {
    try {
        console.log('🚀 Initializing Agent-Based Backend...');
        
        // Initialize the agent system
        agentSystem = await AgentSystem.create({
            logLevel: 'INFO',
            enableMetrics: true,
            enableHealthChecks: true
        });
        
        // Create API adapter for legacy compatibility
        apiAdapter = new AgentAPIAdapter(agentSystem);
        
        console.log('✅ Agent system initialized successfully');
        console.log(`📊 Agents loaded: ${agentSystem.getSystemStatus().agentCount}`);
        console.log(`🔧 Capabilities: ${agentSystem.getSystemStatus().capabilities.join(', ')}`);
        
    } catch (error) {
        console.error('❌ Failed to initialize agent system:', error);
        // Fallback to basic functionality without agents
        console.log('⚠️ Running in fallback mode without agent system');
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    if (apiAdapter) {
        const health = apiAdapter.getSystemHealth();
        res.json({ 
            status: 'healthy', 
            version: '3.0-agent-based',
            agentSystem: health
        });
    } else {
        res.json({ 
            status: 'degraded', 
            version: '3.0-agent-based',
            message: 'Agent system not available'
        });
    }
});

// Legacy authentication endpoints (unchanged for compatibility)
app.post('/api/auth/register', (req, res) => {
    try {
        const { email, password, firstName, lastName, organizationName, organizationType, country, phone, acceptTerms } = req.body;
        
        if (!email || !password || !firstName || !acceptTerms) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        
        console.log('New user registration:', email);
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
                productName: 'Chocolate Cookies',
                status: 'APPROVED',
                createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                ingredients: ['wheat flour', 'sugar', 'vegetable oil', 'cocoa']
            },
            {
                id: '2', 
                productName: 'Fruit Gummies',
                status: 'QUESTIONABLE',
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                ingredients: ['glucose syrup', 'sugar', 'gelatin', 'citric acid']
            },
            {
                id: '3',
                productName: 'Organic Bread',
                status: 'APPROVED', 
                createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
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

// AGENT-BASED ENDPOINTS

// Single product analysis - now using agents
app.post('/api/analysis/analyze', async (req, res) => {
    console.log('🎯 Agent-based analysis endpoint hit:', req.body);
    
    try {
        if (!apiAdapter) {
            return res.status(503).json({ 
                error: 'Agent system not available',
                fallback: 'Please try again later'
            });
        }

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

        // Use agent system for analysis
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

// File analysis - now using agents
app.post('/api/analysis/analyze-file', upload.single('file'), async (req, res) => {
    console.log('📄 Agent-based file analysis endpoint hit');
    
    try {
        if (!apiAdapter) {
            return res.status(503).json({ 
                error: 'Agent system not available'
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { productName } = req.body;
        const filePath = req.file.path;
        const mimetype = req.file.mimetype;

        console.log(`📁 Processing file: ${req.file.originalname}, type: ${mimetype}`);

        // Use agent system for document processing
        const result = await apiAdapter.processDocument({
            filePath: filePath,
            documentType: getDocumentType(mimetype),
            extractIngredients: true,
            extractNutritionalInfo: true
        });

        // If ingredients were found, analyze them
        if (result.extractedData && result.extractedData.ingredients && result.extractedData.ingredients.length > 0) {
            console.log(`🔍 Found ${result.extractedData.ingredients.length} ingredients, analyzing...`);
            
            const analysisResult = await apiAdapter.analyzeIngredients({
                ingredients: result.extractedData.ingredients,
                productName: productName || result.extractedData.metadata?.documentTitle || 'Product from document',
                strictnessLevel: 'moderate'
            });

            // Combine document processing and analysis results
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

// Bulk analysis - now using agents
app.post('/api/analysis/bulk', upload.single('file'), async (req, res) => {
    console.log('📊 Agent-based bulk analysis endpoint hit');
    
    try {
        if (!apiAdapter) {
            return res.status(503).json({ 
                error: 'Agent system not available'
            });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Simple CSV parser (can be enhanced with agent system later)
        const products = parseCSVFile(req.file.path);
        
        // Prepare bulk analysis requests
        const requests = products
            .filter(product => product.ingredients && product.ingredients.trim() !== '')
            .map(product => ({
                ingredients: product.ingredients.split(',').map(ing => ing.trim()),
                productName: product.productName || 'Unknown Product',
                strictnessLevel: 'moderate'
            }));

        console.log(`🔄 Processing ${requests.length} products with agent system`);

        // Use agent system for bulk analysis
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

// NEW AGENT-SPECIFIC ENDPOINTS

// Execute workflow endpoint
app.post('/api/workflows/execute', async (req, res) => {
    try {
        if (!apiAdapter) {
            return res.status(503).json({ error: 'Agent system not available' });
        }

        const { workflowType, data } = req.body;
        
        console.log(`🔄 Executing workflow: ${workflowType}`);
        
        let result;
        if (workflowType === 'halal-analysis') {
            result = await apiAdapter.executeHalalAnalysisWorkflow(data);
        } else if (workflowType === 'certificate-generation') {
            result = await apiAdapter.executeCertificateWorkflow(data);
        } else {
            throw new Error(`Unknown workflow type: ${workflowType}`);
        }
        
        res.json({ success: true, data: result });
        
    } catch (error) {
        console.error('❌ Workflow execution error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Organization configuration endpoint
app.get('/api/organization/:id/config', (req, res) => {
    try {
        if (!apiAdapter) {
            return res.status(503).json({ error: 'Agent system not available' });
        }

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

// System health and metrics
app.get('/api/system/health', (req, res) => {
    try {
        if (!apiAdapter) {
            return res.status(503).json({ 
                status: 'degraded',
                error: 'Agent system not available' 
            });
        }

        const health = apiAdapter.getSystemHealth();
        res.json({ success: true, data: health });
        
    } catch (error) {
        console.error('❌ Health check error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Certificate generation endpoint
app.post('/api/certificates/generate', async (req, res) => {
    try {
        if (!apiAdapter) {
            return res.status(503).json({ error: 'Agent system not available' });
        }

        const certificateData = req.body;
        console.log(`📜 Generating certificate for: ${certificateData.productName}`);
        
        const result = await apiAdapter.generateCertificate(certificateData);
        
        res.json({ success: true, data: result });
        
    } catch (error) {
        console.error('❌ Certificate generation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// UTILITY FUNCTIONS

function parseCSVFile(filePath) {
    const text = fs.readFileSync(filePath, 'utf8');
    const lines = text.split('\\n').filter(line => line.trim());
    
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

function getDocumentType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype === 'application/pdf') return 'pdf';
    if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'excel';
    return 'text';
}

// Legacy endpoints for compatibility
app.get('/api/test-pdf', (req, res) => {
    res.json({ 
        message: 'Agent-based PDF processing available',
        agentSystemActive: !!apiAdapter
    });
});

app.get('/api/database/stats', (req, res) => {
    res.json({ 
        total: 'Unlimited (Agent-Based)',
        agentSystemActive: !!apiAdapter
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// Start server with agent system initialization
async function startServer() {
    try {
        // Initialize agent system first
        await initializeAgentSystem();
        
        // Start Express server
        app.listen(port, () => {
            console.log(`\\n🚀 AGENT-BASED SERVER RUNNING ON http://localhost:${port}`);
            console.log('✅ Backend powered by intelligent agents!');
            console.log('📊 Agent System Status:', agentSystem ? 'ACTIVE' : 'FALLBACK MODE');
            
            if (agentSystem) {
                const status = agentSystem.getSystemStatus();
                console.log(`🤖 Active Agents: ${status.agentCount}`);
                console.log(`⚡ Capabilities: ${status.capabilities.join(', ')}`);
            }
            
            console.log('\\n📡 Endpoints:');
            console.log('  🔬 /api/analysis/analyze - Agent-based ingredient analysis');
            console.log('  📄 /api/analysis/analyze-file - Agent-based document processing');
            console.log('  📊 /api/analysis/bulk - Agent-based bulk analysis');
            console.log('  🔄 /api/workflows/execute - Workflow execution');
            console.log('  🏢 /api/organization/:id/config - Organization configuration');
            console.log('  📜 /api/certificates/generate - Certificate generation');
            console.log('  ❤️ /api/system/health - System health check');
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    if (agentSystem) {
        await agentSystem.shutdown();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    if (agentSystem) {
        await agentSystem.shutdown();
    }
    process.exit(0);
});

// Start the server
startServer();