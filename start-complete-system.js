/**
 * Complete System Startup Script
 * 
 * Starts both the agent-based backend and the Next.js frontend
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Complete HalalCheck AI System');
console.log('=========================================');

let backendProcess = null;
let frontendProcess = null;

// Function to start the agent-based backend
function startBackend() {
    console.log('🔙 Starting agent-based backend server...');
    
    backendProcess = spawn('node', ['start-agent-system.js'], {
        stdio: 'inherit',
        shell: true,
        cwd: __dirname
    });

    backendProcess.on('error', (error) => {
        console.error('❌ Backend startup error:', error);
    });

    backendProcess.on('close', (code) => {
        console.log(`🔙 Backend exited with code ${code}`);
    });

    return new Promise((resolve) => {
        // Give backend time to start
        setTimeout(() => {
            console.log('✅ Backend startup initiated');
            resolve();
        }, 3000);
    });
}

// Function to start the Next.js frontend
function startFrontend() {
    console.log('🎨 Starting Next.js frontend...');
    
    const frontendDir = path.join(__dirname, 'halalcheck-app');
    
    frontendProcess = spawn('npm', ['run', 'dev', '--', '--port', '3007'], {
        stdio: 'inherit',
        shell: true,
        cwd: frontendDir
    });

    frontendProcess.on('error', (error) => {
        console.error('❌ Frontend startup error:', error);
    });

    frontendProcess.on('close', (code) => {
        console.log(`🎨 Frontend exited with code ${code}`);
    });

    return new Promise((resolve) => {
        // Give frontend time to start
        setTimeout(() => {
            console.log('✅ Frontend startup initiated');
            resolve();
        }, 5000);
    });
}

// Function to run tests after both services are up
async function runTests() {
    console.log('\\n🧪 Running system integration tests...');
    
    try {
        const { AgentSystemTester } = require('./test-agent-system.js');
        const tester = new AgentSystemTester();
        await tester.runAllTests();
    } catch (error) {
        console.error('❌ Tests failed:', error.message);
    }
}

// Function to display system information
function displaySystemInfo() {
    console.log('\\n📊 System Information');
    console.log('======================');
    console.log('🔙 Backend (Agent-Based): http://localhost:3003');
    console.log('🎨 Frontend (Next.js): http://localhost:3007');
    console.log('');
    console.log('📡 Available Endpoints:');
    console.log('  🔬 /api/analysis/analyze - Ingredient analysis');
    console.log('  📄 /api/analysis/analyze-file - Document processing');
    console.log('  📊 /api/analysis/bulk - Bulk analysis');
    console.log('  🔄 /api/workflows/execute - Workflow execution');
    console.log('  🏢 /api/organization/:id/config - Organization config');
    console.log('  📜 /api/certificates/generate - Certificate generation');
    console.log('  ❤️ /api/system/health - System health');
    console.log('');
    console.log('🎯 Agent Capabilities:');
    console.log('  🕌 Islamic Analysis - 200+ ingredient database with Quranic references');
    console.log('  📄 Document Processing - OCR, PDF, Excel processing');
    console.log('  🏢 Organization Workflow - Multi-org support with dynamic terminology');
    console.log('  📜 Certificate Generation - Professional PDF certificates');
    console.log('');
    console.log('⌨️ Controls:');
    console.log('  Press Ctrl+C to stop all services');
    console.log('  Press T to run integration tests');
    console.log('  Press H to display this help again');
}

// Handle user input
function setupKeyboardControls() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', async (key) => {
        if (key === '\\u0003') { // Ctrl+C
            console.log('\\n🛑 Shutting down system...');
            await shutdown();
            process.exit(0);
        } else if (key.toLowerCase() === 't') {
            await runTests();
        } else if (key.toLowerCase() === 'h') {
            displaySystemInfo();
        }
    });
}

// Graceful shutdown
async function shutdown() {
    console.log('🛑 Shutting down all services...');
    
    if (frontendProcess) {
        console.log('🎨 Stopping frontend...');
        frontendProcess.kill('SIGTERM');
    }
    
    if (backendProcess) {
        console.log('🔙 Stopping backend...');
        backendProcess.kill('SIGTERM');
    }
    
    // Give processes time to shut down gracefully
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ All services stopped');
}

// Main startup function
async function main() {
    try {
        // Start backend first
        await startBackend();
        
        // Start frontend
        await startFrontend();
        
        // Display system information
        displaySystemInfo();
        
        // Set up keyboard controls
        setupKeyboardControls();
        
        // Run initial tests
        setTimeout(runTests, 8000); // Wait 8 seconds for services to fully start
        
        console.log('\\n🎉 Complete system is now running!');
        console.log('Visit http://localhost:3007 to access the application');
        
    } catch (error) {
        console.error('❌ System startup failed:', error);
        await shutdown();
        process.exit(1);
    }
}

// Handle process termination
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Quick health check before starting
async function healthCheck() {
    console.log('🔍 Performing pre-startup checks...');
    
    // Check if required files exist
    const requiredFiles = [
        'start-agent-system.js',
        'halalcheck-app/package.json',
        'test-agent-system.js'
    ];
    
    for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
            throw new Error(`Required file missing: ${file}`);
        }
    }
    
    console.log('✅ Pre-startup checks passed');
}

// Start the complete system
async function startSystem() {
    try {
        await healthCheck();
        await main();
    } catch (error) {
        console.error('❌ System startup failed:', error.message);
        console.log('\\n🔧 Troubleshooting:');
        console.log('1. Make sure you are in the correct directory');
        console.log('2. Ensure Node.js and npm are installed');
        console.log('3. Check that all required files are present');
        console.log('4. Try running "npm install" in the halalcheck-app directory');
        process.exit(1);
    }
}

// Run if this script is executed directly
if (require.main === module) {
    startSystem();
}

module.exports = { startSystem, shutdown };