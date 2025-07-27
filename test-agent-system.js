/**
 * Test Agent System Integration
 * 
 * Comprehensive test to verify the agent system is working correctly
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3003';

class AgentSystemTester {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    async runTest(name, testFn) {
        console.log(`🧪 Testing: ${name}`);
        try {
            await testFn();
            console.log(`✅ ${name} - PASSED`);
            this.passed++;
        } catch (error) {
            console.error(`❌ ${name} - FAILED:`, error.message);
            this.failed++;
        }
        console.log('');
    }

    async testHealthCheck() {
        const response = await fetch(`${BASE_URL}/health`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Health check failed: ${response.status}`);
        }
        
        if (data.version !== '3.0-agent-based') {
            throw new Error(`Expected agent-based version, got: ${data.version}`);
        }
        
        console.log(`📊 Server Status: ${data.status}`);
        if (data.agentSystem) {
            console.log(`🤖 Agent System: ${data.agentSystem.status}`);
            console.log(`📈 Agent Count: ${data.agentSystem.agentCount}`);
        }
    }

    async testSystemHealth() {
        const response = await fetch(`${BASE_URL}/api/system/health`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`System health check failed: ${response.status}`);
        }
        
        if (!data.success) {
            throw new Error('System health check returned failure');
        }
        
        console.log(`🏥 System Health: ${data.data.status}`);
        console.log(`🔧 Capabilities: ${data.data.capabilities.length}`);
    }

    async testIngredientAnalysis() {
        const testData = {
            productName: 'Test Cookie',
            ingredients: 'wheat flour, sugar, vegetable oil, vanilla extract, salt'
        };

        const response = await fetch(`${BASE_URL}/api/analysis/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status} - ${data.error}`);
        }
        
        if (!data.overallStatus) {
            throw new Error('Analysis did not return overall status');
        }
        
        if (!Array.isArray(data.ingredients)) {
            throw new Error('Analysis did not return ingredients array');
        }
        
        console.log(`📊 Overall Status: ${data.overallStatus}`);
        console.log(`🎯 Confidence: ${data.confidenceScore}%`);
        console.log(`📝 Ingredients Analyzed: ${data.ingredients.length}`);
    }

    async testOrganizationConfig() {
        const response = await fetch(`${BASE_URL}/api/organization/certification-body/config`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Organization config failed: ${response.status}`);
        }
        
        if (!data.success || !data.data) {
            throw new Error('Organization config did not return data');
        }
        
        const config = data.data;
        if (config.type !== 'certification-body') {
            throw new Error(`Expected certification-body, got: ${config.type}`);
        }
        
        console.log(`🏢 Organization: ${config.name}`);
        console.log(`📋 Type: ${config.type}`);
        console.log(`🔧 Features: ${Object.keys(config.features).length}`);
    }

    async testWorkflowExecution() {
        const testData = {
            workflowType: 'halal-analysis',
            data: {
                ingredients: ['water', 'sugar', 'citric acid'],
                productName: 'Test Beverage'
            }
        };

        const response = await fetch(`${BASE_URL}/api/workflows/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Workflow execution failed: ${response.status} - ${data.error}`);
        }
        
        if (!data.success || !data.data) {
            throw new Error('Workflow execution did not return success');
        }
        
        console.log(`🔄 Workflow Status: ${data.data.status}`);
        console.log(`📊 Progress: ${data.data.progress}%`);
        console.log(`⏱️ Execution ID: ${data.data.executionId}`);
    }

    async testCertificateGeneration() {
        const testData = {
            clientId: 'test-client-123',
            productName: 'Test Product',
            ingredients: ['water', 'sugar', 'natural flavoring'],
            productDetails: {
                category: 'Beverage',
                description: 'Test beverage product'
            },
            organizationId: 'certification-body'
        };

        const response = await fetch(`${BASE_URL}/api/certificates/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Certificate generation failed: ${response.status} - ${data.error}`);
        }
        
        if (!data.success || !data.data) {
            throw new Error('Certificate generation did not return success');
        }
        
        console.log(`📜 Certificate ID: ${data.data.certificateId}`);
        console.log(`🔢 Certificate Number: ${data.data.certificateNumber}`);
        console.log(`📄 Files Generated: ${data.data.files.length}`);
    }

    async testBulkAnalysis() {
        // Create a simple CSV content for testing
        const csvContent = `Product Name,Ingredients
Test Cookies,"wheat flour, sugar, butter, vanilla"
Test Juice,"water, apple juice concentrate, vitamin C"
Test Bread,"wheat flour, water, yeast, salt"`;
        
        // Create a simple blob to simulate file upload
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('file', blob, 'test-products.csv');

        const response = await fetch(`${BASE_URL}/api/analysis/bulk`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`Bulk analysis failed: ${response.status} - ${data.error}`);
        }
        
        if (!data.success || !Array.isArray(data.results)) {
            throw new Error('Bulk analysis did not return results array');
        }
        
        console.log(`📊 Products Processed: ${data.totalProcessed}`);
        console.log(`✅ Successful Analyses: ${data.results.filter(r => r.overallStatus).length}`);
    }

    async runAllTests() {
        console.log('🚀 Starting Agent System Integration Tests');
        console.log('==========================================\\n');

        await this.runTest('Health Check', () => this.testHealthCheck());
        await this.runTest('System Health', () => this.testSystemHealth());
        await this.runTest('Ingredient Analysis', () => this.testIngredientAnalysis());
        await this.runTest('Organization Config', () => this.testOrganizationConfig());
        await this.runTest('Workflow Execution', () => this.testWorkflowExecution());
        await this.runTest('Certificate Generation', () => this.testCertificateGeneration());
        
        // Skip bulk analysis test in browser environment
        if (typeof FormData !== 'undefined') {
            await this.runTest('Bulk Analysis', () => this.testBulkAnalysis());
        }

        console.log('==========================================');
        console.log('🏁 Test Results Summary');
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📊 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);
        
        if (this.failed === 0) {
            console.log('\\n🎉 All tests passed! Agent system is working correctly.');
        } else {
            console.log(`\\n⚠️ ${this.failed} test(s) failed. Check the logs above for details.`);
        }
    }
}

// Function to check if server is running
async function checkServerStatus() {
    try {
        const response = await fetch(`${BASE_URL}/health`);
        if (response.ok) {
            console.log('✅ Server is running');
            return true;
        }
    } catch (error) {
        console.log('❌ Server is not running');
        console.log('🔧 Please start the server with: node start-agent-system.js');
        return false;
    }
}

// Main execution
async function main() {
    console.log('🔍 Checking server status...');
    
    const serverRunning = await checkServerStatus();
    if (!serverRunning) {
        process.exit(1);
    }
    
    const tester = new AgentSystemTester();
    await tester.runAllTests();
}

// Add FormData polyfill for Node.js
if (typeof FormData === 'undefined') {
    const FormData = require('form-data');
    global.FormData = FormData;
}

// Run tests if this script is executed directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { AgentSystemTester };