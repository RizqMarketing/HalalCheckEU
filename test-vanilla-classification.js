const { findIngredient, getHardcodedDatabase } = require('./islamic-database');

// Test vanilla extract classification
console.log('Testing vanilla extract classification...\n');

// Test direct lookup
const vanillaResult = findIngredient('vanilla extract');
console.log('Direct lookup for "vanilla extract":', vanillaResult ? vanillaResult.status : 'NOT FOUND');

// Test case insensitive
const vanillaResult2 = findIngredient('Vanilla Extract');
console.log('Case insensitive lookup for "Vanilla Extract":', vanillaResult2 ? vanillaResult2.status : 'NOT FOUND');

// Test partial match
const vanillaResult3 = findIngredient('vanilla');
console.log('Partial match for "vanilla":', vanillaResult3 ? vanillaResult3.status : 'NOT FOUND');

// Show the full vanilla entry if found
if (vanillaResult) {
    console.log('\nFull vanilla extract entry:');
    console.log(JSON.stringify(vanillaResult, null, 2));
}

// List all ingredients in the database
const db = getHardcodedDatabase();
console.log('\n\nAll ingredients in database:');
db.forEach((ingredient, index) => {
    console.log(`${index + 1}. ${ingredient.name} - ${ingredient.status}`);
});