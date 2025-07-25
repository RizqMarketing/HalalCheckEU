// Quick test of our parsing function
const testText = `Product 1: Chocolate Cookies | wheat flour, cocoa powder, sugar, butter, eggs, vanilla

ITEM#2 - Vanilla Cake
Ingredients: flour, sugar, eggs, milk, vanilla extract, baking powder

*** Halal Snack Mix ***
Contains: rice, corn, vegetable oil, salt, spices

Product Name: Organic Granola
Ingredient List: oats, honey, nuts, dried fruits, coconut oil

Another Product    almonds, dates, coconut, cinnamon`;

function parseTextManually(rawText) {
    console.log('🔧 Starting SIMPLE manual text parsing...');
    console.log('🔍 Input text:', rawText);
    const products = [];
    const lines = rawText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log(`🔍 Split into ${lines.length} lines:`);
    lines.forEach((line, i) => console.log(`  Line ${i + 1}: "${line}"`));
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`\n🔍 Processing line ${i + 1}: "${line}"`);
        
        // Handle "Product 1: Chocolate Cookies | wheat flour, cocoa powder, sugar, butter, eggs, vanilla"
        if (line.includes('|')) {
            const parts = line.split('|');
            if (parts.length === 2) {
                let productName = parts[0].trim();
                const ingredients = parts[1].trim();
                
                // Extract product name after colon
                if (productName.includes(':')) {
                    productName = productName.split(':')[1].trim();
                }
                
                if (productName && ingredients) {
                    products.push({ productName, ingredients });
                    console.log(`✅ Found product via | separator: "${productName}" -> "${ingredients}"`);
                    continue;
                }
            }
        }
        
        // Handle "ITEM#2 - Vanilla Cake" followed by "Ingredients: flour, sugar..."
        if (line.includes(' - ') && i + 1 < lines.length) {
            const parts = line.split(' - ');
            if (parts.length === 2) {
                const productName = parts[1].trim();
                const nextLine = lines[i + 1];
                
                if (nextLine.toLowerCase().includes('ingredient')) {
                    const ingredients = nextLine.replace(/^ingredients?:\s*/i, '').trim();
                    if (productName && ingredients) {
                        products.push({ productName, ingredients });
                        console.log(`✅ Found product via - separator: "${productName}" -> "${ingredients}"`);
                        i++; // Skip the ingredients line
                        continue;
                    }
                }
            }
        }
        
        // Handle "*** Halal Snack Mix ***" followed by "Contains: rice, corn..."
        if (line.includes('***') && i + 1 < lines.length) {
            const productName = line.replace(/\*+/g, '').trim();
            const nextLine = lines[i + 1];
            
            if (nextLine.toLowerCase().includes('contains')) {
                const ingredients = nextLine.replace(/^contains:\s*/i, '').trim();
                if (productName && ingredients) {
                    products.push({ productName, ingredients });
                    console.log(`✅ Found product via *** format: "${productName}" -> "${ingredients}"`);
                    i++; // Skip the ingredients line
                    continue;
                }
            }
        }
        
        // Handle "Product Name: Organic Granola" followed by "Ingredient List: oats..."
        if (line.toLowerCase().includes('product name:') && i + 1 < lines.length) {
            const productName = line.replace(/^product name:\s*/i, '').trim();
            const nextLine = lines[i + 1];
            
            if (nextLine.toLowerCase().includes('ingredient')) {
                const ingredients = nextLine.replace(/^ingredient list:\s*/i, '').trim();
                if (productName && ingredients) {
                    products.push({ productName, ingredients });
                    console.log(`✅ Found product via Product Name format: "${productName}" -> "${ingredients}"`);
                    i++; // Skip the ingredients line
                    continue;
                }
            }
        }
        
        // Handle "Another Product    almonds, dates, coconut, cinnamon" (multiple spaces)
        if (line.includes('  ') || line.includes('\t')) {
            // Split by multiple spaces or tabs
            const parts = line.split(/\s{2,}|\t/);
            if (parts.length === 2) {
                const productName = parts[0].trim();
                const ingredients = parts[1].trim();
                
                if (productName && ingredients && ingredients.includes(',')) {
                    products.push({ productName, ingredients });
                    console.log(`✅ Found product via multiple spaces: "${productName}" -> "${ingredients}"`);
                    continue;
                }
            }
        }
    }
    
    console.log(`🎯 Manual parsing found ${products.length} products total:`);
    products.forEach((p, i) => console.log(`  ${i + 1}. "${p.productName}" -> "${p.ingredients}"`));
    
    return products;
}

// Test it
const result = parseTextManually(testText);
console.log('\n🎯 FINAL RESULT:');
console.log(JSON.stringify(result, null, 2));