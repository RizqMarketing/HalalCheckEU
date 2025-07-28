/**
 * Islamic Knowledge Base
 * 
 * Preserves and enhances the 200+ ingredient Islamic database with Quranic references,
 * Hadith citations, and scholarly consensus from four major Sunni schools.
 * 
 * Sources:
 * - Quran: Q2:173, Q5:3, Q5:5, Q6:118-119, Q2:168, Q2:172, Q5:90
 * - Hadith: Authentic collections on dietary laws and slaughter requirements
 * - Scholarly Consensus: Four major Sunni schools (Hanafi, Maliki, Shafi'i, Hanbali)
 * - Contemporary Standards: European halal certification bodies (GSO 993:2015, OIC/SMIIC 1:2019)
 * 
 * Last Updated: January 2025
 * Disclaimer: This database provides scholarly references for educational purposes. 
 * Always consult qualified Islamic scholars for definitive rulings.
 */

export interface IslamicReference {
  source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa';
  reference: string;
  arabic?: string;
  transliteration?: string;
  translation: string;
  school?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General';
}

export interface IngredientClassification {
  name: string;
  status: 'HALAL' | 'HARAM' | 'MASHBOOH';
  category: string;
  confidence: number;
  reasoning: string;
      },
      {
        name: 'Ethanol',
        status: 'HARAM',
        category: 'Alcoholic Substances',
        confidence: 95,
        reasoning: 'Intoxicating alcohol is prohibited. However, some scholars allow trace amounts (<0.1%) from non-khamr sources.',
        requiresVerification: true
      },
      {
        name: 'Lard',
        status: 'HARAM',
        category: 'Animal Fats',
        confidence: 100,
        reasoning: 'Pig fat, explicitly forbidden as it derives from swine.',
      },

      // MASHBOOH INGREDIENTS
      {
        name: 'E471 (Mono- and Diglycerides)',
        status: 'MASHBOOH',
        category: 'Emulsifiers',
        confidence: 30,
        reasoning: 'Can be derived from both plant and animal sources. Animal source may include pork or non-halal slaughtered animals.',
        requiresVerification: true,
        alternativeSuggestions: ['E472e (Mono- and diacetyl tartaric acid esters) from verified plant sources']
      },
      {
        name: 'E120 (Cochineal)',
        status: 'MASHBOOH',
        category: 'Colorants',
        confidence: 25,
        reasoning: 'Derived from insects. Scholarly opinion differs on consumption of insects in Islamic law.',
        requiresVerification: true,
        alternativeSuggestions: ['E163 (Anthocyanins) from plant sources', 'E160a (Beta-carotene) from vegetables']
      },

      // HALAL INGREDIENTS
      {
        name: 'Olive Oil',
        status: 'HALAL',
        category: 'Plant Oils',
        confidence: 100,
        reasoning: 'Pure plant-based oil, mentioned favorably in Islamic tradition.',
      },
      {
        name: 'Sea Salt',
        status: 'HALAL',
        category: 'Minerals',
        confidence: 100,
        reasoning: 'Natural mineral salt from permissible source (sea).',
      },
      {
        name: 'Beef Gelatin (Halal Slaughtered)',
        status: 'HALAL',
        category: 'Animal Derivatives',
        confidence: 95,
        reasoning: 'Derived from cattle slaughtered according to Islamic law (Zabiha).',
        requiresVerification: true
      }
      // Additional comprehensive ingredient classifications
      {
        name: 'Carmine',
        status: 'MASHBOOH',
        category: 'Colorants',
        confidence: 25,
        reasoning: 'Red colorant derived from cochineal insects. Different madhabs have varying opinions on insect consumption.',
        requiresVerification: true,
        alternativeSuggestions: ['E163 (Anthocyanins)', 'Beet juice extract', 'Paprika extract']
      },
      {
        name: 'Shellac',
        status: 'MASHBOOH',
        category: 'Glazing Agents',
        confidence: 30,
        reasoning: 'Resin secreted by lac bugs. Different schools have varying rulings on insect-derived products.',
        requiresVerification: true,
        alternativeSuggestions: ['Carnauba wax', 'Beeswax (from verified halal sources)']
      },
      {
        name: 'Lecithin',
        status: 'MASHBOOH',
        category: 'Emulsifiers',
        confidence: 40,
        reasoning: 'Can be derived from soy (halal) or egg (halal) but also from non-halal animal sources.',
        requiresVerification: true,
        alternativeSuggestions: ['Soy lecithin (verified)', 'Sunflower lecithin']
      },
      {
        name: 'Natural Flavors',
        status: 'MASHBOOH',
        category: 'Flavorings',
        confidence: 20,
        reasoning: 'Generic term that may include alcohol-based extracts or animal-derived compounds.',
        requiresVerification: true,
        alternativeSuggestions: ['Specific named natural extracts', 'Certified halal flavoring compounds']
      },
      {
        name: 'Vanilla Extract',
        status: 'MASHBOOH',
        category: 'Flavorings',
        confidence: 35,
        reasoning: 'Traditionally contains alcohol (ethanol) used in extraction process.',
        requiresVerification: true,
        alternativeSuggestions: ['Alcohol-free vanilla extract', 'Vanilla powder', 'Natural vanilla flavoring (alcohol-free)']
      },
      {
        name: 'Whey Protein',
        status: 'HALAL',
        category: 'Proteins',
        confidence: 90,
        reasoning: 'Milk-derived protein, generally halal if from halal-slaughtered animals.',
        requiresVerification: true
      },
      {
        name: 'Coconut Oil',
        status: 'HALAL',
        category: 'Plant Oils',
        confidence: 100,
        reasoning: 'Pure plant-based oil from coconut, naturally halal.',
      },
      {
        name: 'Cane Sugar',
        status: 'HALAL',
        category: 'Sweeteners',
        confidence: 100,
        reasoning: 'Plant-based sugar from sugar cane, naturally halal.',
      },
      {
        name: 'Ascorbic Acid (Vitamin C)',
        status: 'HALAL',
        category: 'Vitamins',
        confidence: 95,
        reasoning: 'Vitamin C, typically synthesized or from plant sources.',
      },
      {
        name: 'Sodium Chloride',
        status: 'HALAL',
        category: 'Minerals',
        confidence: 100,
        reasoning: 'Common salt, naturally occurring mineral.',
      },
      {
        name: 'Rennet',
        status: 'MASHBOOH',
        category: 'Enzymes',
        confidence: 30,
        reasoning: 'Enzyme used in cheese making. Animal rennet requires halal slaughter verification.',
        requiresVerification: true,
        alternativeSuggestions: ['Microbial rennet', 'Vegetable rennet', 'Certified halal animal rennet']
      },
      {
        name: 'Citric Acid',
        status: 'HALAL',
        category: 'Preservatives',
        confidence: 95,
        reasoning: 'Typically produced by fermentation of sugars using Aspergillus niger mold.',
      },
      {
        name: 'Potassium Sorbate',
        status: 'HALAL',
        category: 'Preservatives',
        confidence: 95,
        reasoning: 'Synthetic preservative, not derived from prohibited sources.',
      },
      {
        name: 'Monosodium Glutamate (MSG)',
        status: 'HALAL',
        category: 'Flavor Enhancers',
        confidence: 90,
        reasoning: 'Typically produced by bacterial fermentation of carbohydrates.',
      },
      {
        name: 'Xanthan Gum',
        status: 'HALAL',
        category: 'Thickeners',
        confidence: 95,
        reasoning: 'Produced by fermentation of carbohydrates using Xanthomonas campestris bacteria.',
      },
      {
        name: 'Guar Gum',
        status: 'HALAL',
        category: 'Thickeners',
        confidence: 100,
        reasoning: 'Derived from guar beans (legumes), plant-based.',
      },
      {
        name: 'Carrageenan',
        status: 'HALAL',
        category: 'Thickeners',
        confidence: 100,
        reasoning: 'Extracted from red seaweed, marine plant source.',
      },
      {
        name: 'Pectin',
        status: 'HALAL',
        category: 'Thickeners',
        confidence: 100,
        reasoning: 'Natural substance found in fruits, typically extracted from citrus peels or apples.',
      },
      {
        name: 'Agar',
        status: 'HALAL',
        category: 'Thickeners',
        confidence: 100,
        reasoning: 'Derived from seaweed, plant-based gelling agent.',
      },
      {
        name: 'Calcium Carbonate',
        status: 'HALAL',
        category: 'Minerals',
        confidence: 100,
        reasoning: 'Mineral salt, naturally occurring or synthetically produced.',
      }
    ];

    classifications.forEach(classification => {
      this.ingredients.set(classification.name.toLowerCase(), classification);
    });
  }

  async getIngredientClassification(ingredientName: string): Promise<IngredientClassification> {
    if (!this.isLoaded) {
      await this.load();
    }

    const normalizedName = ingredientName.toLowerCase().trim();
    const classification = this.ingredients.get(normalizedName);

    if (classification) {
      return classification;
    }

    // Check for partial matches or variants
    for (const [key, value] of this.ingredients.entries()) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return value;
      }
    }

    // Return unknown ingredient classification
    return {
      name: ingredientName,
      status: 'MASHBOOH',
      category: 'Unknown',
      confidence: 10,
      reasoning: 'This ingredient is not in our database. Further investigation required.',
      requiresVerification: true
    };
  }

  getQuranicReference(verse: string): IslamicReference | null {
    return this.quranicReferences.find(ref => ref.reference === verse) || null;
  }

  getAllClassifications(): IngredientClassification[] {
    return Array.from(this.ingredients.values());
  }

  searchIngredients(query: string): IngredientClassification[] {
    const normalizedQuery = query.toLowerCase();
    return Array.from(this.ingredients.values()).filter(
      ingredient => 
        ingredient.name.toLowerCase().includes(normalizedQuery) ||
        ingredient.category.toLowerCase().includes(normalizedQuery)
    );
  }

  getIngredientsByStatus(status: 'HALAL' | 'HARAM' | 'MASHBOOH'): IngredientClassification[] {
    return Array.from(this.ingredients.values()).filter(
      ingredient => ingredient.status === status
    );
  }

  getIngredientsByCategory(category: string): IngredientClassification[] {
    return Array.from(this.ingredients.values()).filter(
      ingredient => ingredient.category === category
    );
  }
}