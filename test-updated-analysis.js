const axios = require('axios');

async function testVanillaExtract() {
    try {
        console.log('🧪 Testing vanilla extract classification...\n');
        
        const response = await axios.post('http://localhost:3003/api/analysis/analyze', {
            productName: "Test Product with Vanilla",
            ingredients: "vanilla extract"
        });
        
        console.log('📊 Analysis Result:');
        console.log('Overall Status:', response.data.overallStatus);
        console.log('\n📋 Ingredient Details:');
        
        response.data.analyzedIngredients.forEach(ing => {
            console.log(`\n🔍 ${ing.name}:`);
            console.log(`   Status: ${ing.status}`);
            console.log(`   Confidence: ${ing.confidence}%`);
            console.log(`   Reasoning: ${ing.reasoning}`);
            if (ing.requiresVerification) {
                console.log(`   ⚠️  Requires Verification: YES`);
            }
            if (ing.alternativeSuggestions && ing.alternativeSuggestions.length > 0) {
                console.log(`   💡 Alternatives: ${ing.alternativeSuggestions.join(', ')}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('\n⚠️  Make sure the backend is running on port 3003');
            console.log('Run: node simple-agent-server.js');
        }
    }
}

// Run the test
testVanillaExtract();