/**
 * Islamic Jurisprudence Database for Backend
 * JavaScript version for use in simple-agent-server.js
 */

// Import the TypeScript data by converting it to JavaScript
const fs = require('fs');
const path = require('path');

// Load the TypeScript file and extract the data
function loadIslamicDatabase() {
    try {
        // Read the TypeScript file
        const tsFilePath = path.join(__dirname, 'halalcheck-app/src/lib/islamic-jurisprudence.ts');
        const tsContent = fs.readFileSync(tsFilePath, 'utf8');
        
        // Extract INGREDIENT_CLASSIFICATIONS array
        const classificationsMatch = tsContent.match(/export const INGREDIENT_CLASSIFICATIONS[^=]*=\s*\[([\s\S]*?)\n\]/);
        if (!classificationsMatch) {
            console.error('Could not extract INGREDIENT_CLASSIFICATIONS from TypeScript file');
            return [];
        }
        
        // Parse the array content
        const arrayContent = classificationsMatch[1];
        
        // Convert TypeScript object syntax to JavaScript
        // This is a simplified parser - in production, you'd want a proper TypeScript parser
        const jsContent = arrayContent
            .replace(/:\s*'HALAL'\s*\|/g, ': \'HALAL\',') // Fix union types
            .replace(/:\s*'HARAM'\s*\|/g, ': \'HARAM\',')
            .replace(/:\s*'MASHBOOH'\s*\|/g, ': \'MASHBOOH\',')
            .replace(/\?:/g, ':'); // Remove optional properties
        
        // Evaluate the JavaScript (be careful with eval in production!)
        // In production, use a proper parser or pre-compile the data
        const ingredients = [];
        
        // For now, return a hardcoded subset of the database
        // In production, you'd properly parse the TypeScript file
        return getHardcodedDatabase();
        
    } catch (error) {
        console.error('Error loading Islamic database:', error);
        return getHardcodedDatabase();
    }
}

// Hardcoded database with key ingredients for immediate functionality
function getHardcodedDatabase() {
    return [
        // HARAM INGREDIENTS
        {
            name: 'Pork',
            status: 'HARAM',
            category: 'Animal Derivatives',
            confidence: 100,
            reasoning: 'Pork and all its derivatives are explicitly forbidden in Islamic law.'
        },
        {
            name: 'Pork Gelatin',
            status: 'HARAM',
            category: 'Animal Derivatives',
            confidence: 100,
            reasoning: 'Derived from pork, which is explicitly forbidden in Islamic law.',
        },
        {
            name: 'Alcohol',
            status: 'HARAM',
            category: 'Beverages',
            confidence: 100,
            reasoning: 'Intoxicants are explicitly forbidden in Islamic law.',
        },
        {
            name: 'Wine',
            status: 'HARAM',
            category: 'Beverages',
            confidence: 100,
            reasoning: 'Wine is an intoxicant and explicitly forbidden.',
        },
        {
            name: 'E120 (Carmine)',
            status: 'HARAM',
            category: 'Food Colorings',
            confidence: 95,
            reasoning: 'Derived from crushed cochineal insects. According to scholarly consensus, insects are generally prohibited except locusts.',
        },
        
        // MASHBOOH INGREDIENTS
        {
            name: 'E631 (Disodium Inosinate)',
            status: 'MASHBOOH',
            category: 'Flavor Enhancers',
            confidence: 30,
            reasoning: 'Can be produced synthetically (halal) or extracted from fish/meat sources. Source verification required.',
            requiresVerification: true,
            alternativeSuggestions: ['E621 (MSG - synthetic)', 'Natural yeast extracts']
        },
        {
            name: 'E627 (Disodium Guanylate)',
            status: 'MASHBOOH',
            category: 'Flavor Enhancers',
            confidence: 30,
            reasoning: 'Often paired with E631. Can be synthetic or derived from fish/meat. Requires source verification.',
            requiresVerification: true
        },
        {
            name: 'Vanilla Extract',
            status: 'MASHBOOH',
            category: 'Natural Flavors',
            confidence: 30,
            reasoning: 'Traditional vanilla extract contains 35-40% ethanol. Requires verification of alcohol content.',
            requiresVerification: true,
            alternativeSuggestions: ['Alcohol-free vanilla extract', 'Vanilla powder']
        },
        {
            name: 'Gelatin',
            status: 'MASHBOOH',
            category: 'Animal Derivatives',
            confidence: 20,
            reasoning: 'Can be from pork (haram), non-halal beef, or halal sources. Source verification critical.',
            requiresVerification: true,
            alternativeSuggestions: ['Fish gelatin', 'Plant-based alternatives (agar, carrageenan)']
        },
        {
            name: 'Mono and Diglycerides',
            status: 'MASHBOOH',
            category: 'Emulsifiers',
            confidence: 30,
            reasoning: 'Can be from plant or animal sources. Animal-derived require halal verification.',
            requiresVerification: true
        },
        {
            name: 'Natural Flavors',
            status: 'MASHBOOH',
            category: 'Natural Flavors',
            confidence: 20,
            reasoning: 'Umbrella term that can include both halal and haram sources. Requires detailed verification.',
            requiresVerification: true
        },
        {
            name: 'Vitamin D3',
            status: 'MASHBOOH',
            category: 'Vitamins and Minerals',
            confidence: 30,
            reasoning: 'Often derived from lanolin (sheep wool) or fish. Requires source verification.',
            requiresVerification: true
        },
        
        // HALAL INGREDIENTS
        {
            name: 'Water',
            status: 'HALAL',
            category: 'Basic Ingredients',
            confidence: 100,
            reasoning: 'Pure water is explicitly mentioned as permissible in Islamic sources.',
        },
        {
            name: 'Salt',
            status: 'HALAL',
            category: 'Basic Ingredients',
            confidence: 100,
            reasoning: 'Natural mineral, permissible in Islamic law according to general principles of halal.',
        },
        {
            name: 'Sugar',
            status: 'HALAL',
            category: 'Sweeteners',
            confidence: 95,
            reasoning: 'Plant-derived sweetener, generally permissible unless processed with bone char.',
        },
        {
            name: 'Wheat Flour',
            status: 'HALAL',
            category: 'Grains and Starches',
            confidence: 100,
            reasoning: 'Plant-based grain, explicitly mentioned as permissible.',
        },
        {
            name: 'Citric Acid',
            status: 'HALAL',
            category: 'Preservatives',
            confidence: 95,
            reasoning: 'Usually derived from citrus fruits or fermentation of halal sources.',
        },
        {
            name: 'Olive Oil',
            status: 'HALAL',
            category: 'Fats and Oils',
            confidence: 100,
            reasoning: 'Blessed oil mentioned in Quran, completely permissible.',
        },
        {
            name: 'Palm Oil',
            status: 'HALAL',
            category: 'Fats and Oils',
            confidence: 100,
            reasoning: 'Plant-derived oil, permissible in Islamic law.',
        },
        {
            name: 'E621 (MSG)',
            status: 'HALAL',
            category: 'Flavor Enhancers',
            confidence: 90,
            reasoning: 'When produced through bacterial fermentation or synthetic means, it is halal.',
        },
        {
            name: 'Pectin',
            status: 'HALAL',
            category: 'Gelling Agents',
            confidence: 100,
            reasoning: 'Derived from fruits, particularly citrus peels and apples.',
        },
        {
            name: 'Xanthan Gum',
            status: 'HALAL',
            category: 'Thickeners',
            confidence: 95,
            reasoning: 'Produced by bacterial fermentation of glucose or sucrose.',
        },
        
        // Additional clearly halal E-numbers
        {
            name: 'E300 (Ascorbic Acid)',
            status: 'HALAL',
            category: 'Antioxidants',
            confidence: 100,
            reasoning: 'Vitamin C, synthetic or derived from plants. Universally halal.',
        },
        {
            name: 'E322 (Lecithin)',
            status: 'HALAL',
            category: 'Emulsifiers',
            confidence: 90,
            reasoning: 'Usually derived from soybeans or sunflower, plant-based lecithin is halal.',
        },
        {
            name: 'E330 (Citric Acid)',
            status: 'HALAL',
            category: 'Preservatives',
            confidence: 100,
            reasoning: 'Derived from citrus fruits or produced by fermentation, universally halal.',
        },
        {
            name: 'E440 (Pectin)',
            status: 'HALAL',
            category: 'Gelling Agents',
            confidence: 100,
            reasoning: 'Derived from fruits, particularly citrus and apples, universally halal.',
        },
        {
            name: 'E415 (Xanthan Gum)',
            status: 'HALAL',
            category: 'Thickeners',
            confidence: 95,
            reasoning: 'Produced by bacterial fermentation, halal when using halal media.',
        },
        
        // COMMON HALAL INGREDIENTS TO REDUCE FALSE MASHBOOH
        {
            name: 'Baking Powder',
            status: 'HALAL',
            category: 'Leavening Agents',
            confidence: 95,
            reasoning: 'Usually contains sodium bicarbonate, cream of tartar, and cornstarch - all plant-based.',
        },
        {
            name: 'Cocoa Powder',
            status: 'HALAL',
            category: 'Natural Flavors',
            confidence: 100,
            reasoning: 'Derived from cocoa beans, plant-based and permissible.',
        },
        {
            name: 'Cocoa',
            status: 'HALAL',
            category: 'Natural Flavors',
            confidence: 100,
            reasoning: 'Plant-based ingredient from cocoa beans.',
        },
        {
            name: 'Milk',
            status: 'HALAL',
            category: 'Dairy',
            confidence: 100,
            reasoning: 'Milk from halal animals is explicitly permissible.',
        },
        {
            name: 'Eggs',
            status: 'HALAL',
            category: 'Animal Products',
            confidence: 100,
            reasoning: 'Eggs from halal birds are permissible according to Islamic law.',
        },
        {
            name: 'Honey',
            status: 'HALAL',
            category: 'Sweeteners',
            confidence: 100,
            reasoning: 'Mentioned in Quran as healing and blessed.',
        }
    ];
}

// Helper function to find ingredient in database
function findIngredient(ingredientName) {
    const database = loadIslamicDatabase();
    const normalizedName = ingredientName.toLowerCase().trim();
    
    // Try exact match first
    let match = database.find(item => 
        item.name.toLowerCase() === normalizedName
    );
    
    // If no exact match, try partial match
    if (!match) {
        match = database.find(item => 
            item.name.toLowerCase().includes(normalizedName) ||
            normalizedName.includes(item.name.toLowerCase())
        );
    }
    
    // Try E-number match with improved logic
    if (!match && normalizedName.match(/^e\d+/i)) {
        const eNumber = normalizedName.match(/^e\d+/i)[0].toUpperCase();
        match = database.find(item => 
            item.name.toUpperCase().includes(eNumber)
        );
    }
    
    // Try E-number with text match (e.g., "E322 lecithin" should match "E322 (Lecithin)")
    if (!match) {
        const eNumberMatch = normalizedName.match(/^e\d+/i);
        if (eNumberMatch) {
            const eNumber = eNumberMatch[0].toUpperCase();
            match = database.find(item => 
                item.name.toUpperCase().includes(eNumber)
            );
        }
    }
    
    return match;
}

// Export the functions
module.exports = {
    loadIslamicDatabase,
    findIngredient,
    getHardcodedDatabase
};