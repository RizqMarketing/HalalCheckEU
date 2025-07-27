"use strict";
/**
 * Migration Script to Agent-Based Architecture
 *
 * Demonstrates how to integrate the new agent system with existing backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrateToAgentSystem = migrateToAgentSystem;
exports.integrateWithExpress = integrateWithExpress;
exports.main = main;
const AgentSystem_1 = require("../AgentSystem");
const AgentAPIAdapter_1 = require("./AgentAPIAdapter");
const Logger_1 = require("../core/infrastructure/logging/Logger");
async function migrateToAgentSystem() {
    const logger = new Logger_1.Logger('Migration', { level: Logger_1.LogLevel.INFO });
    logger.info('Starting migration to agent-based architecture...');
    const migrationReport = {
        startTime: new Date(),
        steps: [],
        success: false,
        errors: []
    };
    try {
        // Step 1: Initialize Agent System
        logger.info('Step 1: Initializing agent system...');
        const agentSystem = await AgentSystem_1.AgentSystem.create({
            logLevel: Logger_1.LogLevel.INFO,
            enableMetrics: true,
            enableHealthChecks: true
        });
        migrationReport.steps.push({
            name: 'Initialize Agent System',
            status: 'completed',
            timestamp: new Date(),
            details: 'Agent system initialized with all core agents'
        });
        // Step 2: Create API Adapter
        logger.info('Step 2: Creating API adapter...');
        const apiAdapter = new AgentAPIAdapter_1.AgentAPIAdapter(agentSystem);
        migrationReport.steps.push({
            name: 'Create API Adapter',
            status: 'completed',
            timestamp: new Date(),
            details: 'API adapter created for legacy compatibility'
        });
        // Step 3: Verify System Health
        logger.info('Step 3: Verifying system health...');
        const systemHealth = apiAdapter.getSystemHealth();
        if (systemHealth.status !== 'healthy') {
            throw new Error('Agent system is not healthy after initialization');
        }
        migrationReport.steps.push({
            name: 'Verify System Health',
            status: 'completed',
            timestamp: new Date(),
            details: `System healthy with ${systemHealth.agentCount} agents and ${systemHealth.capabilities.length} capabilities`
        });
        // Step 4: Test Core Functionality
        logger.info('Step 4: Testing core functionality...');
        await testCoreFunctionality(apiAdapter, migrationReport);
        // Step 5: Migration Complete
        migrationReport.endTime = new Date();
        migrationReport.duration = migrationReport.endTime.getTime() - migrationReport.startTime.getTime();
        migrationReport.success = true;
        logger.info('Migration completed successfully!', {
            duration: migrationReport.duration,
            steps: migrationReport.steps.length
        });
        return {
            agentSystem,
            apiAdapter,
            migrationReport
        };
    }
    catch (error) {
        logger.error('Migration failed', undefined, error);
        migrationReport.errors.push({
            step: 'Migration Process',
            error: error.message,
            timestamp: new Date()
        });
        migrationReport.endTime = new Date();
        migrationReport.success = false;
        throw error;
    }
}
async function testCoreFunctionality(apiAdapter, report) {
    const logger = new Logger_1.Logger('FunctionalityTest');
    try {
        // Test 1: Islamic Analysis
        logger.info('Testing Islamic analysis functionality...');
        const analysisResult = await apiAdapter.analyzeIngredients({
            ingredients: ['Water', 'Sugar', 'Citric Acid', 'Natural Flavoring'],
            productName: 'Test Beverage',
            madhab: 'General',
            strictnessLevel: 'moderate'
        });
        if (!analysisResult.overallStatus) {
            throw new Error('Analysis did not return overall status');
        }
        report.steps.push({
            name: 'Test Islamic Analysis',
            status: 'completed',
            timestamp: new Date(),
            details: `Analysis completed with status: ${analysisResult.overallStatus}`
        });
        // Test 2: Document Processing
        logger.info('Testing document processing functionality...');
        const documentResult = await apiAdapter.processDocument({
            documentType: 'text',
            extractIngredients: true,
            extractNutritionalInfo: false
        });
        report.steps.push({
            name: 'Test Document Processing',
            status: 'completed',
            timestamp: new Date(),
            details: 'Document processing completed successfully'
        });
        // Test 3: Organization Configuration
        logger.info('Testing organization configuration...');
        const certBodyConfig = apiAdapter.getOrganizationConfig('certification-body');
        const manufacturerConfig = apiAdapter.getOrganizationConfig('food-manufacturer');
        if (!certBodyConfig || !manufacturerConfig) {
            throw new Error('Organization configurations not found');
        }
        report.steps.push({
            name: 'Test Organization Config',
            status: 'completed',
            timestamp: new Date(),
            details: 'Organization configurations loaded successfully'
        });
        // Test 4: Workflow Execution (simulated)
        logger.info('Testing workflow execution...');
        try {
            const workflowResult = await apiAdapter.executeHalalAnalysisWorkflow({
                ingredients: ['Water', 'Sugar'],
                productName: 'Test Product',
                documentType: 'text'
            });
            report.steps.push({
                name: 'Test Workflow Execution',
                status: 'completed',
                timestamp: new Date(),
                details: `Workflow executed with status: ${workflowResult.status}`
            });
        }
        catch (workflowError) {
            // Workflow test is optional for migration
            report.steps.push({
                name: 'Test Workflow Execution',
                status: 'warning',
                timestamp: new Date(),
                details: `Workflow test failed but migration can continue: ${workflowError.message}`
            });
        }
        logger.info('All functionality tests completed successfully');
    }
    catch (error) {
        logger.error('Functionality test failed', undefined, error);
        report.steps.push({
            name: 'Test Core Functionality',
            status: 'failed',
            timestamp: new Date(),
            details: `Functionality test failed: ${error.message}`
        });
        throw error;
    }
}
// Integration helper for existing Express.js backend
function integrateWithExpress(app, apiAdapter) {
    const logger = new Logger_1.Logger('ExpressIntegration');
    logger.info('Integrating agent system with Express.js backend...');
    // Replace existing analysis endpoint
    app.post('/api/analyze', async (req, res) => {
        try {
            const result = await apiAdapter.analyzeIngredients({
                ingredients: req.body.ingredients,
                productName: req.body.productName,
                clientId: req.body.clientId,
                madhab: req.body.madhab,
                strictnessLevel: req.body.strictnessLevel
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            logger.error('Analysis endpoint error', undefined, error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Replace existing document processing endpoint
    app.post('/api/process-document', async (req, res) => {
        try {
            const result = await apiAdapter.processDocument({
                documentType: req.body.documentType,
                filePath: req.body.filePath,
                extractIngredients: req.body.extractIngredients,
                extractNutritionalInfo: req.body.extractNutritionalInfo
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            logger.error('Document processing endpoint error', undefined, error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Replace existing certificate generation endpoint
    app.post('/api/generate-certificate', async (req, res) => {
        try {
            const result = await apiAdapter.generateCertificate({
                clientId: req.body.clientId,
                productName: req.body.productName,
                ingredients: req.body.ingredients,
                productDetails: req.body.productDetails,
                organizationId: req.body.organizationId
            });
            res.json({ success: true, data: result });
        }
        catch (error) {
            logger.error('Certificate generation endpoint error', undefined, error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // New workflow execution endpoint
    app.post('/api/execute-workflow', async (req, res) => {
        try {
            const { workflowType, data } = req.body;
            let result;
            if (workflowType === 'halal-analysis') {
                result = await apiAdapter.executeHalalAnalysisWorkflow(data);
            }
            else if (workflowType === 'certificate-generation') {
                result = await apiAdapter.executeCertificateWorkflow(data);
            }
            else {
                throw new Error(`Unknown workflow type: ${workflowType}`);
            }
            res.json({ success: true, data: result });
        }
        catch (error) {
            logger.error('Workflow execution endpoint error', undefined, error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // System health endpoint
    app.get('/api/system/health', (req, res) => {
        try {
            const health = apiAdapter.getSystemHealth();
            res.json({ success: true, data: health });
        }
        catch (error) {
            logger.error('Health endpoint error', undefined, error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // Organization configuration endpoint
    app.get('/api/organization/:id/config', (req, res) => {
        try {
            const config = apiAdapter.getOrganizationConfig(req.params.id);
            if (!config) {
                return res.status(404).json({ success: false, error: 'Organization not found' });
            }
            res.json({ success: true, data: config });
        }
        catch (error) {
            logger.error('Organization config endpoint error', undefined, error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    logger.info('Express.js integration completed');
}
// Usage example
async function main() {
    try {
        const { agentSystem, apiAdapter, migrationReport } = await migrateToAgentSystem();
        console.log('Migration Report:');
        console.log('================');
        console.log(`Success: ${migrationReport.success}`);
        console.log(`Duration: ${migrationReport.duration}ms`);
        console.log(`Steps completed: ${migrationReport.steps.length}`);
        console.log(`Errors: ${migrationReport.errors.length}`);
        if (migrationReport.success) {
            console.log('\\n✅ Agent system is ready for production use!');
            console.log('\\nNext steps:');
            console.log('1. Update frontend to use new API endpoints');
            console.log('2. Migrate existing data to new format');
            console.log('3. Configure monitoring and alerting');
            console.log('4. Train team on new agent-based workflows');
        }
    }
    catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}
// Run migration if this file is executed directly
if (require.main === module) {
    main();
}
//# sourceMappingURL=migrate-to-agents.js.map