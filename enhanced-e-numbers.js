/**
 * HalalCheck EU - Complete E-Number Database for Demo
 * 
 * This file contains 200+ E-numbers with halal status for the enhanced demo
 * Covers E100-E1999 across all categories
 */

const E_NUMBERS_DATABASE = {
  // COLOURANTS (E100-E199)
  'E100': { name: 'Curcumin', status: 'HALAL', category: 'Colourant', description: 'Natural yellow from turmeric' },
  'E101': { name: 'Riboflavin', status: 'HALAL', category: 'Colourant', description: 'Vitamin B2, yellow color' },
  'E102': { name: 'Tartrazine', status: 'HALAL', category: 'Colourant', description: 'Synthetic yellow dye' },
  'E104': { name: 'Quinoline Yellow', status: 'HALAL', category: 'Colourant', description: 'Synthetic yellow dye' },
  'E110': { name: 'Sunset Yellow', status: 'HALAL', category: 'Colourant', description: 'Synthetic orange-yellow' },
  'E120': { name: 'Cochineal/Carmine', status: 'MASHBOOH', category: 'Colourant', description: 'From insects - requires review' },
  'E122': { name: 'Carmoisine', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye' },
  'E124': { name: 'Ponceau 4R', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye' },
  'E127': { name: 'Erythrosine', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye' },
  'E129': { name: 'Allura Red', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye' },
  'E131': { name: 'Patent Blue V', status: 'HALAL', category: 'Colourant', description: 'Synthetic blue dye' },
  'E132': { name: 'Indigotine', status: 'HALAL', category: 'Colourant', description: 'Synthetic blue dye' },
  'E133': { name: 'Brilliant Blue', status: 'HALAL', category: 'Colourant', description: 'Synthetic bright blue' },
  'E140': { name: 'Chlorophyll', status: 'HALAL', category: 'Colourant', description: 'Natural green from plants' },
  'E141': { name: 'Copper chlorophyll', status: 'HALAL', category: 'Colourant', description: 'Stabilized green color' },
  'E142': { name: 'Green S', status: 'HALAL', category: 'Colourant', description: 'Synthetic green dye' },
  'E150a': { name: 'Plain Caramel', status: 'HALAL', category: 'Colourant', description: 'Natural brown from sugar' },
  'E150b': { name: 'Caustic Sulfite Caramel', status: 'HALAL', category: 'Colourant', description: 'Caramel with sulfite' },
  'E150c': { name: 'Ammonia Caramel', status: 'HALAL', category: 'Colourant', description: 'Caramel with ammonia' },
  'E150d': { name: 'Sulfite Ammonia Caramel', status: 'HALAL', category: 'Colourant', description: 'Caramel with sulfite+ammonia' },
  'E153': { name: 'Carbon Black', status: 'HALAL', category: 'Colourant', description: 'Natural black from plants' },
  'E160a': { name: 'Alpha-carotene', status: 'HALAL', category: 'Colourant', description: 'Natural orange from carrots' },
  'E160b': { name: 'Annatto', status: 'HALAL', category: 'Colourant', description: 'Natural orange-red from seeds' },
  'E160c': { name: 'Paprika extract', status: 'HALAL', category: 'Colourant', description: 'Natural red from paprika' },
  'E160d': { name: 'Lycopene', status: 'HALAL', category: 'Colourant', description: 'Natural red from tomatoes' },
  'E160e': { name: 'Beta-apo-8-carotenal', status: 'HALAL', category: 'Colourant', description: 'Orange colorant' },
  'E160f': { name: 'Ethyl ester of beta-apo-8-carotenoic acid', status: 'HALAL', category: 'Colourant', description: 'Orange colorant' },

  // PRESERVATIVES (E200-E299)
  'E200': { name: 'Sorbic acid', status: 'HALAL', category: 'Preservative', description: 'Against molds and yeasts' },
  'E201': { name: 'Sodium sorbate', status: 'HALAL', category: 'Preservative', description: 'Sodium salt of sorbic acid' },
  'E202': { name: 'Potassium sorbate', status: 'HALAL', category: 'Preservative', description: 'Potassium salt of sorbic acid' },
  'E203': { name: 'Calcium sorbate', status: 'HALAL', category: 'Preservative', description: 'Calcium salt of sorbic acid' },
  'E210': { name: 'Benzoic acid', status: 'HALAL', category: 'Preservative', description: 'Against bacteria and molds' },
  'E211': { name: 'Sodium benzoate', status: 'HALAL', category: 'Preservative', description: 'Sodium salt of benzoic acid' },
  'E212': { name: 'Potassium benzoate', status: 'HALAL', category: 'Preservative', description: 'Potassium salt of benzoic acid' },
  'E213': { name: 'Calcium benzoate', status: 'HALAL', category: 'Preservative', description: 'Calcium salt of benzoic acid' },
  'E214': { name: 'Ethyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative' },
  'E215': { name: 'Sodium ethyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Sodium paraben' },
  'E216': { name: 'Propyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative' },
  'E217': { name: 'Sodium propyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Sodium paraben' },
  'E218': { name: 'Methyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative' },
  'E219': { name: 'Sodium methyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Sodium paraben' },
  'E220': { name: 'Sulfur dioxide', status: 'HALAL', category: 'Preservative', description: 'Antioxidant and preservative' },
  'E221': { name: 'Sodium sulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E222': { name: 'Sodium bisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E223': { name: 'Sodium metabisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E224': { name: 'Potassium metabisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E226': { name: 'Calcium sulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E227': { name: 'Calcium bisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E228': { name: 'Potassium bisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative' },
  'E230': { name: 'Biphenyl', status: 'HALAL', category: 'Preservative', description: 'Fruit preservative' },
  'E231': { name: 'Orthophenyl phenol', status: 'HALAL', category: 'Preservative', description: 'Fruit preservative' },
  'E232': { name: 'Sodium orthophenyl phenol', status: 'HALAL', category: 'Preservative', description: 'Fruit preservative' },
  'E233': { name: 'Thiabendazole', status: 'HALAL', category: 'Preservative', description: 'Fruit preservative' },
  'E234': { name: 'Nisin', status: 'HALAL', category: 'Preservative', description: 'Natural preservative' },
  'E235': { name: 'Natamycin', status: 'HALAL', category: 'Preservative', description: 'Natural antifungal' },
  'E239': { name: 'Hexamethylene tetramine', status: 'HALAL', category: 'Preservative', description: 'Formaldehyde releaser' },
  'E242': { name: 'Dimethyl dicarbonate', status: 'HALAL', category: 'Preservative', description: 'Beverage preservative' },
  'E249': { name: 'Potassium nitrite', status: 'HALAL', category: 'Preservative', description: 'Meat preservative' },
  'E250': { name: 'Sodium nitrite', status: 'HALAL', category: 'Preservative', description: 'Meat preservative' },
  'E251': { name: 'Sodium nitrate', status: 'HALAL', category: 'Preservative', description: 'Meat preservative' },
  'E252': { name: 'Potassium nitrate', status: 'HALAL', category: 'Preservative', description: 'Meat preservative' },

  // ANTIOXIDANTS (E300-E399)
  'E300': { name: 'Ascorbic acid', status: 'HALAL', category: 'Antioxidant', description: 'Vitamin C antioxidant' },
  'E301': { name: 'Sodium ascorbate', status: 'HALAL', category: 'Antioxidant', description: 'Sodium vitamin C' },
  'E302': { name: 'Calcium ascorbate', status: 'HALAL', category: 'Antioxidant', description: 'Calcium vitamin C' },
  'E304': { name: 'Ascorbyl palmitate', status: 'HALAL', category: 'Antioxidant', description: 'Fat-soluble vitamin C' },
  'E306': { name: 'Tocopherol extract', status: 'HALAL', category: 'Antioxidant', description: 'Natural vitamin E' },
  'E307': { name: 'Alpha-tocopherol', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic vitamin E' },
  'E308': { name: 'Gamma-tocopherol', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic vitamin E' },
  'E309': { name: 'Delta-tocopherol', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic vitamin E' },
  'E310': { name: 'Propyl gallate', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic antioxidant' },
  'E311': { name: 'Octyl gallate', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic antioxidant' },
  'E312': { name: 'Dodecyl gallate', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic antioxidant' },
  'E315': { name: 'Erythorbic acid', status: 'HALAL', category: 'Antioxidant', description: 'Vitamin C isomer' },
  'E316': { name: 'Sodium erythorbate', status: 'HALAL', category: 'Antioxidant', description: 'Sodium erythorbate' },
  'E320': { name: 'Butylated hydroxyanisole', status: 'HALAL', category: 'Antioxidant', description: 'BHA antioxidant' },
  'E321': { name: 'Butylated hydroxytoluene', status: 'HALAL', category: 'Antioxidant', description: 'BHT antioxidant' },

  // EMULSIFIERS (E400-E499)
  'E400': { name: 'Alginic acid', status: 'HALAL', category: 'Emulsifier', description: 'Seaweed thickener' },
  'E401': { name: 'Sodium alginate', status: 'HALAL', category: 'Emulsifier', description: 'Seaweed salt' },
  'E402': { name: 'Potassium alginate', status: 'HALAL', category: 'Emulsifier', description: 'Seaweed salt' },
  'E403': { name: 'Ammonium alginate', status: 'HALAL', category: 'Emulsifier', description: 'Seaweed salt' },
  'E404': { name: 'Calcium alginate', status: 'HALAL', category: 'Emulsifier', description: 'Seaweed salt' },
  'E405': { name: 'Propane-1,2-diol alginate', status: 'HALAL', category: 'Emulsifier', description: 'Modified alginate' },
  'E406': { name: 'Agar', status: 'HALAL', category: 'Emulsifier', description: 'Red seaweed gel' },
  'E407': { name: 'Carrageenan', status: 'HALAL', category: 'Emulsifier', description: 'Red seaweed thickener' },
  'E410': { name: 'Locust bean gum', status: 'HALAL', category: 'Emulsifier', description: 'Carob seed gum' },
  'E412': { name: 'Guar gum', status: 'HALAL', category: 'Emulsifier', description: 'Guar bean gum' },
  'E413': { name: 'Tragacanth', status: 'HALAL', category: 'Emulsifier', description: 'Plant gum' },
  'E414': { name: 'Acacia gum', status: 'HALAL', category: 'Emulsifier', description: 'Arabic gum' },
  'E415': { name: 'Xanthan gum', status: 'HALAL', category: 'Emulsifier', description: 'Bacterial fermentation' },
  'E416': { name: 'Karaya gum', status: 'HALAL', category: 'Emulsifier', description: 'Tree gum' },
  'E417': { name: 'Tara gum', status: 'HALAL', category: 'Emulsifier', description: 'Tara seed gum' },
  'E418': { name: 'Gellan gum', status: 'HALAL', category: 'Emulsifier', description: 'Bacterial fermentation' },
  'E420': { name: 'Sorbitol', status: 'HALAL', category: 'Emulsifier', description: 'Sugar alcohol' },
  'E421': { name: 'Mannitol', status: 'HALAL', category: 'Emulsifier', description: 'Sugar alcohol' },
  'E422': { name: 'Glycerol', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E440a': { name: 'Pectin', status: 'HALAL', category: 'Emulsifier', description: 'Fruit pectin' },
  'E440b': { name: 'Amidated pectin', status: 'HALAL', category: 'Emulsifier', description: 'Modified pectin' },
  'E441': { name: 'Gelatin', status: 'REQUIRES_REVIEW', category: 'Gelatin', description: 'Animal source must be verified' },
  'E450': { name: 'Diphosphates', status: 'HALAL', category: 'Emulsifier', description: 'Phosphate salts' },
  'E451': { name: 'Triphosphates', status: 'HALAL', category: 'Emulsifier', description: 'Phosphate salts' },
  'E452': { name: 'Polyphosphates', status: 'HALAL', category: 'Emulsifier', description: 'Phosphate polymers' },
  'E459': { name: 'Beta-cyclodextrin', status: 'HALAL', category: 'Emulsifier', description: 'Modified starch' },
  'E460': { name: 'Cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Plant fiber' },
  'E461': { name: 'Methyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E462': { name: 'Ethyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E463': { name: 'Hydroxypropyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E464': { name: 'Hydroxypropyl methyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E465': { name: 'Ethyl methyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E466': { name: 'Carboxy methyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E468': { name: 'Cross-linked sodium carboxy methyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E469': { name: 'Enzymatically hydrolysed carboxy methyl cellulose', status: 'HALAL', category: 'Emulsifier', description: 'Modified cellulose' },
  'E470a': { name: 'Sodium, potassium and calcium salts of fatty acids', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E470b': { name: 'Magnesium salts of fatty acids', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E471': { name: 'Mono- and diglycerides', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E472a': { name: 'Acetic acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E472b': { name: 'Lactic acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E472c': { name: 'Citric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E472d': { name: 'Tartaric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E472e': { name: 'Diacetyl tartaric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E472f': { name: 'Mixed acetic and tartaric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E473': { name: 'Sucrose esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E474': { name: 'Sucroglycerides', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E475': { name: 'Polyglycerol esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E476': { name: 'Polyglycerol polyricinoleate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E477': { name: 'Propylene glycol esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E479': { name: 'Thermally oxidized soy oil', status: 'HALAL', category: 'Emulsifier', description: 'Soy-derived emulsifier' },
  'E481': { name: 'Sodium stearoyl-2-lactylate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E482': { name: 'Calcium stearoyl-2-lactylate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E483': { name: 'Stearyl tartrate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E491': { name: 'Sorbitan monostearate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E492': { name: 'Sorbitan tristearate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E493': { name: 'Sorbitan monolaurate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E494': { name: 'Sorbitan monooleate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },
  'E495': { name: 'Sorbitan monopalmitate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Source must be verified' },

  // ACIDS & ACIDITY REGULATORS (E500-E599)
  'E500': { name: 'Sodium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Baking soda and washing soda' },
  'E501': { name: 'Potassium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Potassium salts' },
  'E503': { name: 'Ammonium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Ammonium salts' },
  'E504': { name: 'Magnesium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Magnesium salts' },
  'E507': { name: 'Hydrochloric acid', status: 'HALAL', category: 'Acidity Regulator', description: 'Food-grade acid' },
  'E508': { name: 'Potassium chloride', status: 'HALAL', category: 'Acidity Regulator', description: 'Salt substitute' },
  'E509': { name: 'Calcium chloride', status: 'HALAL', category: 'Acidity Regulator', description: 'Calcium salt' },
  'E510': { name: 'Ammonium chloride', status: 'HALAL', category: 'Acidity Regulator', description: 'Ammonium salt' },
  'E511': { name: 'Magnesium chloride', status: 'HALAL', category: 'Acidity Regulator', description: 'Magnesium salt' },
  'E512': { name: 'Stannous chloride', status: 'HALAL', category: 'Acidity Regulator', description: 'Tin salt' },
  'E513': { name: 'Sulfuric acid', status: 'HALAL', category: 'Acidity Regulator', description: 'Food-grade acid' },
  'E514': { name: 'Sodium sulfates', status: 'HALAL', category: 'Acidity Regulator', description: 'Sodium salts' },
  'E515': { name: 'Potassium sulfates', status: 'HALAL', category: 'Acidity Regulator', description: 'Potassium salts' },
  'E516': { name: 'Calcium sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Gypsum' },
  'E517': { name: 'Ammonium sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Ammonium salt' },
  'E518': { name: 'Magnesium sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Epsom salt' },
  'E519': { name: 'Copper sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Copper salt' },
  'E520': { name: 'Aluminum sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Aluminum salt' },
  'E521': { name: 'Aluminum sodium sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Aluminum sodium salt' },
  'E522': { name: 'Aluminum potassium sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Aluminum potassium salt' },
  'E523': { name: 'Aluminum ammonium sulfate', status: 'HALAL', category: 'Acidity Regulator', description: 'Aluminum ammonium salt' },
  'E524': { name: 'Sodium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Caustic soda' },
  'E525': { name: 'Potassium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Caustic potash' },
  'E526': { name: 'Calcium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Slaked lime' },
  'E527': { name: 'Ammonium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Ammonia solution' },
  'E528': { name: 'Magnesium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Magnesium hydroxide' },
  'E529': { name: 'Calcium oxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Quicklime' },
  'E530': { name: 'Magnesium oxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Magnesium oxide' },
  'E535': { name: 'Sodium ferrocyanide', status: 'HALAL', category: 'Acidity Regulator', description: 'Anti-caking agent' },
  'E536': { name: 'Potassium ferrocyanide', status: 'HALAL', category: 'Acidity Regulator', description: 'Anti-caking agent' },
  'E537': { name: 'Ferric ferrocyanide', status: 'HALAL', category: 'Acidity Regulator', description: 'Anti-caking agent' },
  'E538': { name: 'Calcium ferrocyanide', status: 'HALAL', category: 'Acidity Regulator', description: 'Anti-caking agent' },
  'E541': { name: 'Sodium aluminum phosphate', status: 'HALAL', category: 'Acidity Regulator', description: 'Leavening agent' },
  'E542': { name: 'Bone phosphate', status: 'REQUIRES_REVIEW', category: 'Anti-caking Agent', description: 'Animal source must be verified' },

  // FLAVOR ENHANCERS (E600-E699)
  'E620': { name: 'Glutamic acid', status: 'HALAL', category: 'Flavor Enhancer', description: 'Natural amino acid' },
  'E621': { name: 'Monosodium glutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'MSG - flavor enhancer' },
  'E622': { name: 'Monopotassium glutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Potassium glutamate' },
  'E623': { name: 'Calcium diglutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Calcium glutamate' },
  'E624': { name: 'Monoammonium glutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Ammonium glutamate' },
  'E625': { name: 'Magnesium diglutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Magnesium glutamate' },
  'E626': { name: 'Guanylic acid', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E627': { name: 'Disodium guanylate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E628': { name: 'Dipotassium guanylate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E629': { name: 'Calcium guanylate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E630': { name: 'Inosinic acid', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E631': { name: 'Disodium inosinate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E632': { name: 'Dipotassium inosinate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E633': { name: 'Calcium inosinate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E634': { name: 'Calcium 5-ribonucleotides', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E635': { name: 'Disodium 5-ribonucleotides', status: 'HALAL', category: 'Flavor Enhancer', description: 'Nucleotide flavor enhancer' },
  'E640': { name: 'Glycine', status: 'HALAL', category: 'Flavor Enhancer', description: 'Amino acid flavor enhancer' },
  'E650': { name: 'Zinc acetate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Zinc supplement' },

  // MISCELLANEOUS (E900-E999)
  'E900': { name: 'Dimethylpolysiloxane', status: 'HALAL', category: 'Anti-foaming Agent', description: 'Silicone anti-foam' },
  'E901': { name: 'Beeswax', status: 'HALAL', category: 'Glazing Agent', description: 'Natural bee wax' },
  'E902': { name: 'Candelilla wax', status: 'HALAL', category: 'Glazing Agent', description: 'Plant wax' },
  'E903': { name: 'Carnauba wax', status: 'HALAL', category: 'Glazing Agent', description: 'Palm leaf wax' },
  'E904': { name: 'Shellac', status: 'HALAL', category: 'Glazing Agent', description: 'Insect resin' },
  'E905': { name: 'Microcrystalline wax', status: 'HALAL', category: 'Glazing Agent', description: 'Petroleum wax' },
  'E907': { name: 'Refined microcrystalline wax', status: 'HALAL', category: 'Glazing Agent', description: 'Refined petroleum wax' },
  'E912': { name: 'Montan acid esters', status: 'HALAL', category: 'Glazing Agent', description: 'Plant wax esters' },
  'E914': { name: 'Oxidized polyethylene wax', status: 'HALAL', category: 'Glazing Agent', description: 'Synthetic wax' },
  'E920': { name: 'L-cysteine', status: 'REQUIRES_REVIEW', category: 'Flour Treatment Agent', description: 'Source must be verified' },
  'E925': { name: 'Chlorine', status: 'HALAL', category: 'Flour Treatment Agent', description: 'Flour bleaching' },
  'E926': { name: 'Chlorine dioxide', status: 'HALAL', category: 'Flour Treatment Agent', description: 'Flour bleaching' },
  'E927a': { name: 'Azodicarbonamide', status: 'HALAL', category: 'Flour Treatment Agent', description: 'Flour improver' },
  'E927b': { name: 'Urea', status: 'HALAL', category: 'Flour Treatment Agent', description: 'Yeast nutrient' },
  'E928': { name: 'Benzoyl peroxide', status: 'HALAL', category: 'Flour Treatment Agent', description: 'Flour bleaching' },
  'E938': { name: 'Argon', status: 'HALAL', category: 'Packaging Gas', description: 'Inert gas' },
  'E939': { name: 'Helium', status: 'HALAL', category: 'Packaging Gas', description: 'Inert gas' },
  'E940': { name: 'Dichlorodifluoromethane', status: 'HALAL', category: 'Propellant', description: 'Refrigerant gas' },
  'E941': { name: 'Nitrogen', status: 'HALAL', category: 'Packaging Gas', description: 'Inert gas' },
  'E942': { name: 'Nitrous oxide', status: 'HALAL', category: 'Propellant', description: 'Whipped cream propellant' },
  'E943a': { name: 'Butane', status: 'HALAL', category: 'Propellant', description: 'Propellant gas' },
  'E943b': { name: 'Isobutane', status: 'HALAL', category: 'Propellant', description: 'Propellant gas' },
  'E944': { name: 'Propane', status: 'HALAL', category: 'Propellant', description: 'Propellant gas' },
  'E948': { name: 'Oxygen', status: 'HALAL', category: 'Packaging Gas', description: 'Oxidizing gas' },
  'E949': { name: 'Hydrogen', status: 'HALAL', category: 'Packaging Gas', description: 'Reducing gas' },
  'E950': { name: 'Acesulfame K', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener' },
  'E951': { name: 'Aspartame', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener' },
  'E952': { name: 'Cyclamic acid', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener' },
  'E953': { name: 'Isomalt', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol' },
  'E954': { name: 'Saccharin', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener' },
  'E955': { name: 'Sucralose', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener' },
  'E956': { name: 'Alitame', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener' },
  'E957': { name: 'Thaumatin', status: 'HALAL', category: 'Sweetener', description: 'Natural protein sweetener' },
  'E958': { name: 'Glycyrrhizin', status: 'HALAL', category: 'Sweetener', description: 'Licorice extract' },
  'E959': { name: 'Neohesperidine DC', status: 'HALAL', category: 'Sweetener', description: 'Citrus sweetener' },
  'E965': { name: 'Maltitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol' },
  'E966': { name: 'Lactitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol' },
  'E967': { name: 'Xylitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol' },
  'E968': { name: 'Erythritol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol' },

  // ADDITIONAL CRITICAL E-NUMBERS
  'E1100': { name: 'Amylases', status: 'HALAL', category: 'Enzyme', description: 'Starch digesting enzymes' },
  'E1101': { name: 'Proteases', status: 'HALAL', category: 'Enzyme', description: 'Protein digesting enzymes' },
  'E1102': { name: 'Glucose oxidase', status: 'HALAL', category: 'Enzyme', description: 'Oxidizing enzyme' },
  'E1103': { name: 'Invertase', status: 'HALAL', category: 'Enzyme', description: 'Sugar splitting enzyme' },
  'E1105': { name: 'Lysozyme', status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Egg white enzyme - check source' },
  'E1200': { name: 'Polydextrose', status: 'HALAL', category: 'Bulking Agent', description: 'Synthetic polymer' },
  'E1201': { name: 'Polyvinylpyrrolidone', status: 'HALAL', category: 'Stabilizer', description: 'Synthetic polymer' },
  'E1202': { name: 'Polyvinylpolypyrrolidone', status: 'HALAL', category: 'Stabilizer', description: 'Synthetic polymer' },
  'E1400': { name: 'Dextrin', status: 'HALAL', category: 'Stabilizer', description: 'Starch derivative' },
  'E1401': { name: 'Acid-treated starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1402': { name: 'Alkaline-treated starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1403': { name: 'Bleached starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1404': { name: 'Oxidized starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1410': { name: 'Monostarch phosphate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1412': { name: 'Distarch phosphate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1413': { name: 'Phosphated distarch phosphate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1414': { name: 'Acetylated distarch phosphate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1420': { name: 'Acetylated starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1422': { name: 'Acetylated distarch adipate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1440': { name: 'Hydroxypropyl starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1442': { name: 'Hydroxypropyl distarch phosphate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1450': { name: 'Starch sodium octenyl succinate', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1451': { name: 'Acetylated oxidized starch', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch' },
  'E1505': { name: 'Triethyl citrate', status: 'HALAL', category: 'Stabilizer', description: 'Citrate ester' },
  'E1510': { name: 'Ethanol', status: 'MASHBOOH', category: 'Solvent', description: 'Alcohol - depends on source and quantity' },
  'E1518': { name: 'Glyceryl triacetate', status: 'HALAL', category: 'Stabilizer', description: 'Triacetin' },
  'E1520': { name: 'Propylene glycol', status: 'HALAL', category: 'Solvent', description: 'Synthetic solvent' },
  'E1600': { name: 'Polyvinylpyrrolidone', status: 'HALAL', category: 'Stabilizer', description: 'Synthetic polymer' },
  'E1601': { name: 'Polyvinylpolypyrrolidone', status: 'HALAL', category: 'Stabilizer', description: 'Synthetic polymer' },
  'E1602': { name: 'Polyethylene glycol', status: 'HALAL', category: 'Stabilizer', description: 'Synthetic polymer' },
  'E1603': { name: 'Polypropylene glycol', status: 'HALAL', category: 'Stabilizer', description: 'Synthetic polymer' }
};

// Statistics
const E_NUMBER_STATS = {
  total: Object.keys(E_NUMBERS_DATABASE).length,
  halal: Object.values(E_NUMBERS_DATABASE).filter(e => e.status === 'HALAL').length,
  haram: Object.values(E_NUMBERS_DATABASE).filter(e => e.status === 'HARAM').length,
  mashbooh: Object.values(E_NUMBERS_DATABASE).filter(e => e.status === 'MASHBOOH').length,
  requiresReview: Object.values(E_NUMBERS_DATABASE).filter(e => e.status === 'REQUIRES_REVIEW').length,
  categories: [...new Set(Object.values(E_NUMBERS_DATABASE).map(e => e.category))]
};

// Helper functions
function getENumberInfo(eNumber) {
  return E_NUMBERS_DATABASE[eNumber.toUpperCase()] || null;
}

function searchENumbers(query) {
  const results = [];
  const normalizedQuery = query.toLowerCase();
  
  for (const [code, info] of Object.entries(E_NUMBERS_DATABASE)) {
    if (
      code.toLowerCase().includes(normalizedQuery) ||
      info.name.toLowerCase().includes(normalizedQuery) ||
      info.description.toLowerCase().includes(normalizedQuery) ||
      info.category.toLowerCase().includes(normalizedQuery)
    ) {
      results.push({ code, ...info });
    }
  }
  
  return results;
}

function getENumbersByStatus(status) {
  return Object.entries(E_NUMBERS_DATABASE)
    .filter(([_, info]) => info.status === status)
    .map(([code, info]) => ({ code, ...info }));
}

function getENumbersByCategory(category) {
  return Object.entries(E_NUMBERS_DATABASE)
    .filter(([_, info]) => info.category.toLowerCase() === category.toLowerCase())
    .map(([code, info]) => ({ code, ...info }));
}

// Export for use in the demo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    E_NUMBERS_DATABASE,
    E_NUMBER_STATS,
    getENumberInfo,
    searchENumbers,
    getENumbersByStatus,
    getENumbersByCategory
  };
}

// For browser use
if (typeof window !== 'undefined') {
  window.E_NUMBERS_DATABASE = E_NUMBERS_DATABASE;
  window.E_NUMBER_STATS = E_NUMBER_STATS;
  window.getENumberInfo = getENumberInfo;
  window.searchENumbers = searchENumbers;
  window.getENumbersByStatus = getENumbersByStatus;
  window.getENumbersByCategory = getENumbersByCategory;
}

console.log(`🕌 HalalCheck E-Numbers Database Loaded`);
console.log(`📊 Total E-Numbers: ${E_NUMBER_STATS.total}`);
console.log(`✅ Halal: ${E_NUMBER_STATS.halal}`);
console.log(`⚠️ Requires Review: ${E_NUMBER_STATS.requiresReview}`);
console.log(`🔄 Mashbooh: ${E_NUMBER_STATS.mashbooh}`);
console.log(`❌ Haram: ${E_NUMBER_STATS.haram}`);
console.log(`📂 Categories: ${E_NUMBER_STATS.categories.join(', ')}`);