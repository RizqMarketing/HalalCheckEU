// Test confidence calculation function
function calculateRealisticConfidence(analysisResult) {
    console.log('🔍 Calculating realistic confidence...');
    
    if (!analysisResult.ingredients || !Array.isArray(analysisResult.ingredients)) {
        console.log('❌ No ingredients array found');
        return null;
    }
    
    const ingredients = analysisResult.ingredients;
    const totalIngredients = ingredients.length;
    console.log(`📊 Total ingredients: ${totalIngredients}`);
    
    if (totalIngredients === 0) return null;
    
    // Count ingredients by status and risk
    const approved = ingredients.filter(ing => ing.status === 'APPROVED');
    const prohibited = ingredients.filter(ing => ing.status === 'PROHIBITED');
    const questionable = ingredients.filter(ing => ing.status === 'QUESTIONABLE');
    const verifySource = ingredients.filter(ing => ing.status === 'VERIFY_SOURCE');
    
    console.log(`📈 Approved: ${approved.length}, Prohibited: ${prohibited.length}, Questionable: ${questionable.length}, Verify: ${verifySource.length}`);
    
    // If any prohibited ingredients, high confidence it's haram
    if (prohibited.length > 0) {
        const confidence = Math.floor(Math.random() * 6) + 95;
        console.log(`🚫 Prohibited ingredients found → ${confidence}% confidence`);
        return confidence;
    }
    
    // If all approved, check risk levels
    if (approved.length === totalIngredients) {
        const veryLowRisk = approved.filter(ing => ing.risk === 'VERY_LOW').length;
        const lowRisk = approved.filter(ing => ing.risk === 'LOW').length;
        
        console.log(`🔍 Risk levels - Very Low: ${veryLowRisk}, Low: ${lowRisk}`);
        
        if (veryLowRisk === totalIngredients) {
            // All approved with very low risk = 95-100%
            const confidence = Math.floor(Math.random() * 6) + 95;
            console.log(`✅ All APPROVED + VERY_LOW risk → ${confidence}% confidence`);
            return confidence;
        } else if (veryLowRisk + lowRisk === totalIngredients) {
            // All approved with very low or low risk = 90-95%
            const confidence = Math.floor(Math.random() * 6) + 90;
            console.log(`✅ All APPROVED + VERY_LOW/LOW risk → ${confidence}% confidence`);
            return confidence;
        } else {
            // Some approved with higher risk = 85-90%
            const confidence = Math.floor(Math.random() * 6) + 85;
            console.log(`⚠️ All APPROVED but higher risk → ${confidence}% confidence`);
            return confidence;
        }
    }
    
    // Mixed results
    const approvedPercent = (approved.length / totalIngredients) * 100;
    console.log(`📊 Approved percentage: ${approvedPercent.toFixed(1)}%`);
    
    if (approvedPercent >= 80) {
        // Mostly approved = 75-85%
        const confidence = Math.floor(Math.random() * 11) + 75;
        console.log(`🟡 Mostly approved → ${confidence}% confidence`);
        return confidence;
    } else if (approvedPercent >= 60) {
        // Moderate approval = 65-75%
        const confidence = Math.floor(Math.random() * 11) + 65;
        console.log(`🟠 Moderate approval → ${confidence}% confidence`);
        return confidence;
    } else {
        // Low approval = 60-70%
        const confidence = Math.floor(Math.random() * 11) + 60;
        console.log(`🔴 Low approval → ${confidence}% confidence`);
        return confidence;
    }
}

// Test cases
console.log('=== TEST 1: Single salt ingredient ===');
const test1 = {
    ingredients: [
        {"name":"salt","status":"APPROVED","reason":"Salt is a mineral","risk":"VERY_LOW","category":"mineral"}
    ]
};
const result1 = calculateRealisticConfidence(test1);
console.log(`Result: ${result1}%\n`);

console.log('=== TEST 2: All approved with very low risk ===');
const test2 = {
    ingredients: [
        {"name":"wheat flour","status":"APPROVED","risk":"VERY_LOW","category":"grain"},
        {"name":"salt","status":"APPROVED","risk":"VERY_LOW","category":"mineral"},
        {"name":"yeast","status":"APPROVED","risk":"VERY_LOW","category":"microorganism"}
    ]
};
const result2 = calculateRealisticConfidence(test2);
console.log(`Result: ${result2}%\n`);

console.log('=== TEST 3: Mix of VERY_LOW and LOW risk ===');
const test3 = {
    ingredients: [
        {"name":"wheat flour","status":"APPROVED","risk":"VERY_LOW","category":"grain"},
        {"name":"palm oil","status":"APPROVED","risk":"LOW","category":"oil"},
        {"name":"salt","status":"APPROVED","risk":"VERY_LOW","category":"mineral"}
    ]
};
const result3 = calculateRealisticConfidence(test3);
console.log(`Result: ${result3}%`);