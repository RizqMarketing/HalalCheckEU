/**
 * Simple test script for the halal check functionality
 * This tests the server without requiring OpenAI
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testHalalCheck() {
  console.log('🧪 Testing HalalCheck Simple Server');
  console.log('====================================\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is healthy:', healthResponse.data.status);
    console.log();

    // Test 2: Halal ingredients database
    console.log('2. Testing halal ingredients database...');
    const ingredientsResponse = await axios.get(`${API_URL}/api/halal-ingredients?limit=10`);
    console.log('✅ Ingredients database working');
    console.log('Sample ingredients:', ingredientsResponse.data.data.slice(0, 3));
    console.log();

    // Test 3: Search functionality
    console.log('3. Testing ingredient search...');
    const searchResponse = await axios.get(`${API_URL}/api/halal-ingredients/search?q=pork`);
    console.log('✅ Search working');
    console.log('Search results for "pork":', searchResponse.data.data);
    console.log();

    // Test 4: Simple ingredient analysis (this will fail with current OpenAI setup)
    console.log('4. Testing ingredient analysis...');
    try {
      const analysisResponse = await axios.post(`${API_URL}/api/analysis/analyze`, {
        productName: 'Simple Test Product',
        ingredientList: 'wheat flour, sugar, salt',
        category: 'FOOD_BEVERAGE',
        region: 'EU'
      });
      console.log('✅ Analysis successful!');
      console.log('Result:', analysisResponse.data.data.overallStatus);
    } catch (analysisError) {
      console.log('⚠️  Analysis failed (expected due to OpenAI API key issue)');
      console.log('Error:', analysisError.response?.data?.error || analysisError.message);
    }

    console.log('\n🎉 Basic server functionality is working!');
    console.log('📋 To enable full AI analysis:');
    console.log('   1. Get a valid OpenAI API key from https://platform.openai.com/api-keys');
    console.log('   2. Replace the key in your .env file');
    console.log('   3. Restart the server');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Install axios if not present, then run tests
async function installAndTest() {
  const { spawn } = require('child_process');
  
  // Try to run the test
  try {
    await testHalalCheck();
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('axios')) {
      console.log('Installing axios for testing...');
      const install = spawn('npm', ['install', 'axios'], { stdio: 'inherit' });
      
      install.on('close', (code) => {
        if (code === 0) {
          console.log('Axios installed, running tests...');
          // Retry test
          delete require.cache[require.resolve('axios')];
          testHalalCheck();
        } else {
          console.error('Failed to install axios');
        }
      });
    } else {
      console.error('Error:', error.message);
    }
  }
}

installAndTest();