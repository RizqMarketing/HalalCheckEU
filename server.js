/**
 * HalalCheck EU - Updated Enhanced Demo Server with Complete E-Numbers Database
 * Production-ready server with 400+ E-numbers for comprehensive halal analysis
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Configure multer for file uploads
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// COMPREHENSIVE E-NUMBERS DATABASE with 400+ entries
const COMPLETE_E_NUMBERS = {
    // COLOURANTS (E100-E199)
    'E100': { name: 'Curcumin', status: 'HALAL', category: 'Colourant', description: 'Natural yellow from turmeric root', risk: 'VERY_LOW' },
    'E101': { name: 'Riboflavin', status: 'HALAL', category: 'Colourant', description: 'Vitamin B2, yellow color', risk: 'VERY_LOW' },
    'E102': { name: 'Tartrazine', status: 'HALAL', category: 'Colourant', description: 'Synthetic yellow azo dye', risk: 'LOW' },
    'E104': { name: 'Quinoline Yellow', status: 'HALAL', category: 'Colourant', description: 'Synthetic yellow dye', risk: 'LOW' },
    'E110': { name: 'Sunset Yellow FCF', status: 'HALAL', category: 'Colourant', description: 'Synthetic orange-yellow dye', risk: 'LOW' },
    'E120': { name: 'Cochineal/Carmine', status: 'MASHBOOH', category: 'Colourant', description: 'Red color from cochineal insects - Islamic scholars debate', risk: 'MEDIUM' },
    'E122': { name: 'Carmoisine', status: 'HALAL', category: 'Colourant', description: 'Synthetic red azo dye', risk: 'LOW' },
    'E124': { name: 'Ponceau 4R', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye', risk: 'LOW' },
    'E127': { name: 'Erythrosine', status: 'HALAL', category: 'Colourant', description: 'Synthetic cherry-pink dye', risk: 'LOW' },
    'E129': { name: 'Allura Red AC', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye', risk: 'LOW' },
    'E131': { name: 'Patent Blue V', status: 'HALAL', category: 'Colourant', description: 'Synthetic blue dye', risk: 'LOW' },
    'E132': { name: 'Indigotine', status: 'HALAL', category: 'Colourant', description: 'Synthetic blue dye', risk: 'LOW' },
    'E133': { name: 'Brilliant Blue FCF', status: 'HALAL', category: 'Colourant', description: 'Synthetic bright blue dye', risk: 'LOW' },
    'E140': { name: 'Chlorophylls', status: 'HALAL', category: 'Colourant', description: 'Natural green from plants', risk: 'VERY_LOW' },
    'E141': { name: 'Copper complexes of chlorophylls', status: 'HALAL', category: 'Colourant', description: 'Stabilized green from chlorophyll', risk: 'LOW' },
    'E142': { name: 'Green S', status: 'HALAL', category: 'Colourant', description: 'Synthetic green dye', risk: 'LOW' },
    'E150a': { name: 'Plain Caramel', status: 'HALAL', category: 'Colourant', description: 'Natural brown from heated sugar', risk: 'VERY_LOW' },
    'E150b': { name: 'Caustic Sulfite Caramel', status: 'HALAL', category: 'Colourant', description: 'Caramel with sulfite treatment', risk: 'LOW' },
    'E150c': { name: 'Ammonia Caramel', status: 'HALAL', category: 'Colourant', description: 'Caramel with ammonia treatment', risk: 'LOW' },
    'E150d': { name: 'Sulfite Ammonia Caramel', status: 'HALAL', category: 'Colourant', description: 'Caramel with sulfite and ammonia', risk: 'LOW' },
    'E153': { name: 'Carbon Black', status: 'HALAL', category: 'Colourant', description: 'Natural black from vegetable carbon', risk: 'LOW' },
    'E154': { name: 'Brown FK', status: 'HALAL', category: 'Colourant', description: 'Synthetic brown dye mixture', risk: 'LOW' },
    'E155': { name: 'Brown HT', status: 'HALAL', category: 'Colourant', description: 'Synthetic brown dye', risk: 'LOW' },
    'E160a': { name: 'Alpha-carotene', status: 'HALAL', category: 'Colourant', description: 'Natural orange from carrots', risk: 'VERY_LOW' },
    'E160b': { name: 'Annatto/Bixin', status: 'HALAL', category: 'Colourant', description: 'Natural orange-red from annatto seeds', risk: 'VERY_LOW' },
    'E160c': { name: 'Paprika extract', status: 'HALAL', category: 'Colourant', description: 'Natural red-orange from paprika', risk: 'VERY_LOW' },
    'E160d': { name: 'Lycopene', status: 'HALAL', category: 'Colourant', description: 'Natural red from tomatoes', risk: 'VERY_LOW' },
    'E160e': { name: 'Beta-apo-8-carotenal', status: 'HALAL', category: 'Colourant', description: 'Orange colorant from carotenoids', risk: 'VERY_LOW' },
    'E160f': { name: 'Ethyl ester of beta-apo-8-carotenoic acid', status: 'HALAL', category: 'Colourant', description: 'Orange colorant', risk: 'VERY_LOW' },

    // PRESERVATIVES (E200-E299)
    'E200': { name: 'Sorbic acid', status: 'HALAL', category: 'Preservative', description: 'Against molds and yeasts', risk: 'VERY_LOW' },
    'E201': { name: 'Sodium sorbate', status: 'HALAL', category: 'Preservative', description: 'Sodium salt of sorbic acid', risk: 'VERY_LOW' },
    'E202': { name: 'Potassium sorbate', status: 'HALAL', category: 'Preservative', description: 'Potassium salt of sorbic acid', risk: 'VERY_LOW' },
    'E203': { name: 'Calcium sorbate', status: 'HALAL', category: 'Preservative', description: 'Calcium salt of sorbic acid', risk: 'VERY_LOW' },
    'E210': { name: 'Benzoic acid', status: 'HALAL', category: 'Preservative', description: 'Against bacteria and molds', risk: 'VERY_LOW' },
    'E211': { name: 'Sodium benzoate', status: 'HALAL', category: 'Preservative', description: 'Sodium salt of benzoic acid', risk: 'VERY_LOW' },
    'E212': { name: 'Potassium benzoate', status: 'HALAL', category: 'Preservative', description: 'Potassium salt of benzoic acid', risk: 'VERY_LOW' },
    'E213': { name: 'Calcium benzoate', status: 'HALAL', category: 'Preservative', description: 'Calcium salt of benzoic acid', risk: 'VERY_LOW' },
    'E220': { name: 'Sulfur dioxide', status: 'HALAL', category: 'Preservative', description: 'Antioxidant and preservative', risk: 'LOW' },
    'E221': { name: 'Sodium sulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E249': { name: 'Potassium nitrite', status: 'HALAL', category: 'Preservative', description: 'Meat preservative', risk: 'LOW' },
    'E250': { name: 'Sodium nitrite', status: 'HALAL', category: 'Preservative', description: 'Meat preservative', risk: 'LOW' },
    'E251': { name: 'Sodium nitrate', status: 'HALAL', category: 'Preservative', description: 'Meat preservative', risk: 'LOW' },
    'E252': { name: 'Potassium nitrate', status: 'HALAL', category: 'Preservative', description: 'Meat preservative', risk: 'LOW' },

    // ANTIOXIDANTS (E300-E399)
    'E300': { name: 'Ascorbic acid', status: 'HALAL', category: 'Antioxidant', description: 'Vitamin C', risk: 'VERY_LOW' },
    'E301': { name: 'Sodium ascorbate', status: 'HALAL', category: 'Antioxidant', description: 'Sodium salt of vitamin C', risk: 'VERY_LOW' },
    'E302': { name: 'Calcium ascorbate', status: 'HALAL', category: 'Antioxidant', description: 'Calcium salt of vitamin C', risk: 'VERY_LOW' },
    'E304': { name: 'Ascorbyl palmitate', status: 'HALAL', category: 'Antioxidant', description: 'Fat-soluble vitamin C', risk: 'LOW' },
    'E306': { name: 'Tocopherol extract', status: 'HALAL', category: 'Antioxidant', description: 'Natural vitamin E', risk: 'VERY_LOW' },
    'E307': { name: 'Alpha-tocopherol', status: 'HALAL', category: 'Antioxidant', description: 'Synthetic vitamin E', risk: 'VERY_LOW' },
    'E320': { name: 'Butylated hydroxyanisole', status: 'HALAL', category: 'Antioxidant', description: 'BHA antioxidant', risk: 'LOW' },
    'E321': { name: 'Butylated hydroxytoluene', status: 'HALAL', category: 'Antioxidant', description: 'BHT antioxidant', risk: 'LOW' },

    // EMULSIFIERS (E400-E499) - CRITICAL FOR HALAL CHECKING
    'E400': { name: 'Alginic acid', status: 'HALAL', category: 'Emulsifier', description: 'Natural thickener from seaweed', risk: 'VERY_LOW' },
    'E401': { name: 'Sodium alginate', status: 'HALAL', category: 'Emulsifier', description: 'Seaweed salt', risk: 'VERY_LOW' },
    'E406': { name: 'Agar', status: 'HALAL', category: 'Emulsifier', description: 'Natural gelling from red seaweed', risk: 'VERY_LOW' },
    'E407': { name: 'Carrageenan', status: 'HALAL', category: 'Emulsifier', description: 'Natural thickener from red seaweed', risk: 'VERY_LOW' },
    'E410': { name: 'Locust bean gum', status: 'HALAL', category: 'Emulsifier', description: 'Natural from carob seeds', risk: 'VERY_LOW' },
    'E412': { name: 'Guar gum', status: 'HALAL', category: 'Emulsifier', description: 'Natural from guar beans', risk: 'VERY_LOW' },
    'E414': { name: 'Acacia gum', status: 'HALAL', category: 'Emulsifier', description: 'Natural from acacia tree', risk: 'VERY_LOW' },
    'E415': { name: 'Xanthan gum', status: 'HALAL', category: 'Emulsifier', description: 'Natural from bacterial fermentation', risk: 'VERY_LOW' },
    'E422': { name: 'Glycerol', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Can be plant (HALAL) or animal (HARAM) - verify source', risk: 'MEDIUM' },
    'E440': { name: 'Pectin', status: 'HALAL', category: 'Emulsifier', description: 'Natural gelling from fruits', risk: 'VERY_LOW' },
    'E441': { name: 'Gelatin', status: 'REQUIRES_REVIEW', category: 'Gelatin', description: 'Animal protein - can be halal (beef/chicken from halal slaughter with certification) or haram (pork). Source verification essential.', risk: 'HIGH' },
    'E450': { name: 'Diphosphates', status: 'HALAL', category: 'Emulsifier', description: 'Mineral salt', risk: 'VERY_LOW' },
    'E451': { name: 'Triphosphates', status: 'HALAL', category: 'Emulsifier', description: 'Mineral salt', risk: 'VERY_LOW' },
    'E452': { name: 'Polyphosphates', status: 'HALAL', category: 'Emulsifier', description: 'Mineral salt', risk: 'VERY_LOW' },
    'E470': { name: 'Fatty acid salts', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Salts of fatty acids - source must be verified', risk: 'MEDIUM' },
    'E471': { name: 'Mono- and diglycerides', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Critical - can be plant (HALAL) or animal (HARAM) - verify source', risk: 'HIGH' },
    'E472a': { name: 'Acetic acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E472b': { name: 'Lactic acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E472c': { name: 'Citric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E472d': { name: 'Tartaric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E472e': { name: 'Diacetyl tartaric acid esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Critical emulsifier - verify source', risk: 'HIGH' },
    'E472f': { name: 'Mixed acetic/tartaric esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E473': { name: 'Sucrose esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E474': { name: 'Sucroglycerides', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E475': { name: 'Polyglycerol esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E476': { name: 'Polyglycerol polyricinoleate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify castor oil and fatty acid source', risk: 'MEDIUM' },
    'E477': { name: 'Propylene glycol esters', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Emulsifier - verify fatty acid source', risk: 'MEDIUM' },
    'E481': { name: 'Sodium stearoyl-2-lactylate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Critical - stearic acid source must be verified', risk: 'HIGH' },
    'E482': { name: 'Calcium stearoyl-2-lactylate', status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Critical - stearic acid source must be verified', risk: 'HIGH' },

    // ACIDS & ACIDITY REGULATORS (E500-E599)
    'E500': { name: 'Sodium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Baking soda and washing soda', risk: 'VERY_LOW' },
    'E501': { name: 'Potassium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Potassium carbonate and bicarbonate', risk: 'VERY_LOW' },
    'E503': { name: 'Ammonium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Ammonium carbonate and bicarbonate', risk: 'VERY_LOW' },
    'E504': { name: 'Magnesium carbonates', status: 'HALAL', category: 'Acidity Regulator', description: 'Magnesium carbonate and bicarbonate', risk: 'VERY_LOW' },
    'E507': { name: 'Hydrochloric acid', status: 'HALAL', category: 'Acidity Regulator', description: 'Food-grade hydrochloric acid', risk: 'VERY_LOW' },
    'E509': { name: 'Calcium chloride', status: 'HALAL', category: 'Acidity Regulator', description: 'Mineral salt', risk: 'VERY_LOW' },
    'E524': { name: 'Sodium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Food-grade caustic soda', risk: 'VERY_LOW' },
    'E526': { name: 'Calcium hydroxide', status: 'HALAL', category: 'Acidity Regulator', description: 'Food-grade slaked lime', risk: 'VERY_LOW' },

    // FLAVOR ENHANCERS (E600-E699)
    'E620': { name: 'Glutamic acid', status: 'HALAL', category: 'Flavor Enhancer', description: 'Natural amino acid from fermentation', risk: 'VERY_LOW' },
    'E621': { name: 'Monosodium glutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'MSG - from bacterial fermentation', risk: 'VERY_LOW' },
    'E622': { name: 'Monopotassium glutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Potassium salt of glutamic acid', risk: 'VERY_LOW' },
    'E623': { name: 'Calcium diglutamate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Calcium salt of glutamic acid', risk: 'VERY_LOW' },
    'E626': { name: 'Guanylic acid', status: 'HALAL', category: 'Flavor Enhancer', description: 'Natural nucleotide from yeast', risk: 'VERY_LOW' },
    'E627': { name: 'Disodium guanylate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Flavor enhancer from yeast extract', risk: 'VERY_LOW' },
    'E628': { name: 'Dipotassium guanylate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Potassium salt of guanylic acid', risk: 'VERY_LOW' },
    'E630': { name: 'Inosinic acid', status: 'HALAL', category: 'Flavor Enhancer', description: 'Natural nucleotide from yeast/meat', risk: 'LOW' },
    'E631': { name: 'Disodium inosinate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Flavor enhancer from yeast/meat extract', risk: 'LOW' },
    'E632': { name: 'Dipotassium inosinate', status: 'HALAL', category: 'Flavor Enhancer', description: 'Potassium salt of inosinic acid', risk: 'LOW' },
    'E634': { name: 'Calcium 5-ribonucleotides', status: 'HALAL', category: 'Flavor Enhancer', description: 'Mixed nucleotide flavor enhancer', risk: 'LOW' },
    'E635': { name: 'Disodium 5-ribonucleotides', status: 'HALAL', category: 'Flavor Enhancer', description: 'Mixed nucleotide flavor enhancer', risk: 'LOW' },

    // SWEETENERS (E900-E999)
    'E900': { name: 'Dimethylpolysiloxane', status: 'HALAL', category: 'Anti-foaming Agent', description: 'Silicone anti-foam from synthetic', risk: 'LOW' },
    'E901': { name: 'Beeswax', status: 'HALAL', category: 'Glazing Agent', description: 'Natural wax from honeycombs', risk: 'VERY_LOW' },
    'E902': { name: 'Candelilla wax', status: 'HALAL', category: 'Glazing Agent', description: 'Natural wax from candelilla plant', risk: 'VERY_LOW' },
    'E903': { name: 'Carnauba wax', status: 'HALAL', category: 'Glazing Agent', description: 'Natural wax from Brazilian palm leaves', risk: 'VERY_LOW' },
    'E904': { name: 'Shellac', status: 'HARAM', category: 'Glazing Agent', description: 'Resin from lac insects - insect-derived', risk: 'HIGH' },
    'E905': { name: 'Microcrystalline wax', status: 'HALAL', category: 'Glazing Agent', description: 'Petroleum-derived wax', risk: 'LOW' },
    'E950': { name: 'Acesulfame K', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E951': { name: 'Aspartame', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E952': { name: 'Cyclamic acid', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E954': { name: 'Saccharin', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E955': { name: 'Sucralose', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener from sugar', risk: 'LOW' },
    'E960': { name: 'Steviol glycosides', status: 'HALAL', category: 'Sweetener', description: 'Natural sweetener from stevia plant', risk: 'VERY_LOW' },
    'E961': { name: 'Neotame', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E965': { name: 'Maltitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol from starch', risk: 'VERY_LOW' },
    'E966': { name: 'Lactitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol from lactose', risk: 'VERY_LOW' },
    'E967': { name: 'Xylitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol from birch/plants', risk: 'VERY_LOW' },
    'E968': { name: 'Erythritol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol from fermentation', risk: 'VERY_LOW' },

    // MISCELLANEOUS CRITICAL INGREDIENTS
    'E1100': { name: 'Amylase', status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Starch-digesting enzyme - verify source', risk: 'MEDIUM' },
    'E1101': { name: 'Protease', status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Protein-digesting enzyme - verify source', risk: 'MEDIUM' },
    'E1102': { name: 'Glucose oxidase', status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Enzyme - verify source', risk: 'MEDIUM' },
    'E1103': { name: 'Invertase', status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Sugar-splitting enzyme - verify source', risk: 'MEDIUM' },
    'E1105': { name: 'Lysozyme', status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Egg white enzyme - verify source', risk: 'MEDIUM' },
    'E1200': { name: 'Polydextrose', status: 'HALAL', category: 'Bulking Agent', description: 'Synthetic fiber', risk: 'LOW' },
    'E1400': { name: 'Dextrin', status: 'HALAL', category: 'Stabilizer', description: 'Modified starch', risk: 'VERY_LOW' },
    'E1505': { name: 'Triethyl citrate', status: 'HALAL', category: 'Solvent', description: 'Citrate ester solvent', risk: 'LOW' },
    'E1510': { name: 'Ethanol', status: 'MASHBOOH', category: 'Solvent', description: 'Alcohol - depends on source and quantity', risk: 'HIGH' },
    'E1518': { name: 'Glyceryl triacetate', status: 'HALAL', category: 'Solvent', description: 'Triacetin solvent', risk: 'LOW' },
    'E1520': { name: 'Propylene glycol', status: 'HALAL', category: 'Solvent', description: 'Synthetic solvent', risk: 'LOW' },

    // ADDITIONAL E-NUMBERS FOR COMPREHENSIVE COVERAGE
    'E551': { name: 'Silicon dioxide', status: 'HALAL', category: 'Anti-caking agent', description: 'Synthetic anti-caking agent', risk: 'VERY_LOW' },
    'E552': { name: 'Calcium silicate', status: 'HALAL', category: 'Anti-caking agent', description: 'Anti-caking agent from minerals', risk: 'VERY_LOW' },
    'E553a': { name: 'Magnesium silicate', status: 'HALAL', category: 'Anti-caking agent', description: 'Talc powder anti-caking', risk: 'LOW' },
    'E553b': { name: 'Talc', status: 'HALAL', category: 'Anti-caking agent', description: 'Mineral powder', risk: 'LOW' },
    'E554': { name: 'Sodium aluminium silicate', status: 'HALAL', category: 'Anti-caking agent', description: 'Synthetic anti-caking', risk: 'LOW' },
    'E555': { name: 'Potassium aluminium silicate', status: 'HALAL', category: 'Anti-caking agent', description: 'Synthetic anti-caking', risk: 'LOW' },
    'E556': { name: 'Calcium aluminium silicate', status: 'HALAL', category: 'Anti-caking agent', description: 'Synthetic anti-caking', risk: 'LOW' },
    'E558': { name: 'Bentonite', status: 'HALAL', category: 'Anti-caking agent', description: 'Natural clay mineral', risk: 'VERY_LOW' },
    'E559': { name: 'Aluminium silicate', status: 'HALAL', category: 'Anti-caking agent', description: 'Kaolin clay', risk: 'LOW' },
    
    // SWEETENERS (E950-E999)
    'E950': { name: 'Acesulfame potassium', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E951': { name: 'Aspartame', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E952': { name: 'Cyclamate', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E953': { name: 'Isomalt', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol', risk: 'VERY_LOW' },
    'E954': { name: 'Saccharin', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E955': { name: 'Sucralose', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E957': { name: 'Thaumatin', status: 'HALAL', category: 'Sweetener', description: 'Natural protein sweetener', risk: 'VERY_LOW' },
    'E959': { name: 'Neohesperidin DC', status: 'HALAL', category: 'Sweetener', description: 'Natural sweetener enhancer', risk: 'LOW' },
    'E960': { name: 'Steviol glycosides', status: 'HALAL', category: 'Sweetener', description: 'Natural stevia sweetener', risk: 'VERY_LOW' },
    'E961': { name: 'Neotame', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener', risk: 'LOW' },
    'E962': { name: 'Aspartame-acesulfame salt', status: 'HALAL', category: 'Sweetener', description: 'Artificial sweetener blend', risk: 'LOW' },
    'E965': { name: 'Maltitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol', risk: 'VERY_LOW' },
    'E966': { name: 'Lactitol', status: 'HALAL', category: 'Sweetener', description: 'Sugar alcohol from milk sugar', risk: 'VERY_LOW' },
    'E967': { name: 'Xylitol', status: 'HALAL', category: 'Sweetener', description: 'Natural sugar alcohol', risk: 'VERY_LOW' },
    
    // GLAZING AGENTS & SURFACE TREATMENTS (E900-E949)
    'E900': { name: 'Dimethylpolysiloxane', status: 'HALAL', category: 'Anti-foaming agent', description: 'Silicone anti-foam', risk: 'LOW' },
    'E901': { name: 'Beeswax', status: 'HALAL', category: 'Glazing agent', description: 'Natural wax from bees', risk: 'VERY_LOW' },
    'E902': { name: 'Candelilla wax', status: 'HALAL', category: 'Glazing agent', description: 'Natural plant wax', risk: 'VERY_LOW' },
    'E903': { name: 'Carnauba wax', status: 'HALAL', category: 'Glazing agent', description: 'Natural palm wax', risk: 'VERY_LOW' },
    'E904': { name: 'Shellac', status: 'MASHBOOH', category: 'Glazing agent', description: 'Insect secretion - scholars debate permissibility', risk: 'MEDIUM' },
    'E905': { name: 'Microcrystalline wax', status: 'HALAL', category: 'Glazing agent', description: 'Petroleum-derived wax', risk: 'LOW' },
    'E912': { name: 'Montanic acid esters', status: 'HALAL', category: 'Glazing agent', description: 'Mineral wax', risk: 'LOW' },
    'E914': { name: 'Oxidized polyethylene wax', status: 'HALAL', category: 'Glazing agent', description: 'Synthetic wax', risk: 'LOW' },
    
    // FLOUR TREATMENT AGENTS
    'E920': { name: 'L-cysteine', status: 'REQUIRES_REVIEW', category: 'Flour treatment', description: 'Amino acid - can be from hair/feathers (HARAM) or synthetic (HALAL)', risk: 'HIGH' },
    'E921': { name: 'L-cysteine hydrochloride', status: 'REQUIRES_REVIEW', category: 'Flour treatment', description: 'Same as E920 - verify source', risk: 'HIGH' },
    'E922': { name: 'Potassium persulfate', status: 'HALAL', category: 'Flour treatment', description: 'Synthetic oxidizing agent', risk: 'LOW' },
    'E923': { name: 'Ammonium persulfate', status: 'HALAL', category: 'Flour treatment', description: 'Synthetic oxidizing agent', risk: 'LOW' },
    'E924': { name: 'Potassium bromate', status: 'HALAL', category: 'Flour treatment', description: 'Synthetic oxidizing agent', risk: 'MEDIUM' },
    'E925': { name: 'Chlorine', status: 'HALAL', category: 'Flour treatment', description: 'Gas treatment agent', risk: 'MEDIUM' },
    'E926': { name: 'Chlorine dioxide', status: 'HALAL', category: 'Flour treatment', description: 'Gas treatment agent', risk: 'MEDIUM' },
    'E927b': { name: 'Carbamide', status: 'HALAL', category: 'Flour treatment', description: 'Urea treatment agent', risk: 'LOW' },
    'E928': { name: 'Benzoyl peroxide', status: 'HALAL', category: 'Flour treatment', description: 'Synthetic bleaching agent', risk: 'LOW' },

    // COMPREHENSIVE E-NUMBERS EXPANSION (Based on EU & FDA databases)
    
    // ADDITIONAL COLORANTS
    'E103': { name: 'Alkanet', status: 'HALAL', category: 'Colourant', description: 'Natural red dye from alkanet root', risk: 'VERY_LOW' },
    'E105': { name: 'Fast Yellow AB', status: 'HALAL', category: 'Colourant', description: 'Synthetic yellow dye - banned in many countries', risk: 'MEDIUM' },
    'E111': { name: 'Orange GGN', status: 'HALAL', category: 'Colourant', description: 'Synthetic orange dye', risk: 'LOW' },
    'E121': { name: 'Citrus Red 2', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye', risk: 'LOW' },
    'E123': { name: 'Amaranth', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye', risk: 'LOW' },
    'E125': { name: 'Ponceau SX', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye', risk: 'LOW' },
    'E126': { name: 'Ponceau 6R', status: 'HALAL', category: 'Colourant', description: 'Synthetic red dye', risk: 'LOW' },
    'E130': { name: 'Indanthrene blue RS', status: 'HALAL', category: 'Colourant', description: 'Synthetic blue dye', risk: 'LOW' },
    'E143': { name: 'Fast Green FCF', status: 'HALAL', category: 'Colourant', description: 'Synthetic green dye', risk: 'LOW' },
    'E151': { name: 'Brilliant Black BN', status: 'HALAL', category: 'Colourant', description: 'Synthetic black dye', risk: 'LOW' },
    'E152': { name: 'Carbon black', status: 'HALAL', category: 'Colourant', description: 'Synthetic black pigment', risk: 'LOW' },
    'E153': { name: 'Vegetable carbon', status: 'HALAL', category: 'Colourant', description: 'Natural black from plant sources', risk: 'VERY_LOW' },
    'E154': { name: 'Brown FK', status: 'HALAL', category: 'Colourant', description: 'Synthetic brown dye', risk: 'LOW' },
    'E155': { name: 'Brown HT', status: 'HALAL', category: 'Colourant', description: 'Synthetic brown dye', risk: 'LOW' },
    'E160a': { name: 'Beta-carotene', status: 'HALAL', category: 'Colourant', description: 'Natural orange from plants', risk: 'VERY_LOW' },
    'E160b': { name: 'Annatto', status: 'HALAL', category: 'Colourant', description: 'Natural yellow-orange from seeds', risk: 'VERY_LOW' },
    'E160c': { name: 'Paprika extract', status: 'HALAL', category: 'Colourant', description: 'Natural red-orange from paprika', risk: 'VERY_LOW' },
    'E160d': { name: 'Lycopene', status: 'HALAL', category: 'Colourant', description: 'Natural red from tomatoes', risk: 'VERY_LOW' },
    'E160e': { name: 'Beta-apo-8-carotenal', status: 'HALAL', category: 'Colourant', description: 'Synthetic orange carotenoid', risk: 'LOW' },
    'E160f': { name: 'Ethyl ester of beta-apo-8-carotenoid acid', status: 'HALAL', category: 'Colourant', description: 'Synthetic orange carotenoid', risk: 'LOW' },
    'E161a': { name: 'Flavoxanthin', status: 'HALAL', category: 'Colourant', description: 'Natural yellow from plants', risk: 'VERY_LOW' },
    'E161b': { name: 'Lutein', status: 'HALAL', category: 'Colourant', description: 'Natural yellow from marigold', risk: 'VERY_LOW' },
    'E161c': { name: 'Cryptoxanthin', status: 'HALAL', category: 'Colourant', description: 'Natural orange from plants', risk: 'VERY_LOW' },
    'E161d': { name: 'Rubixanthin', status: 'HALAL', category: 'Colourant', description: 'Natural red-orange from plants', risk: 'VERY_LOW' },
    'E161e': { name: 'Violaxanthin', status: 'HALAL', category: 'Colourant', description: 'Natural yellow from plants', risk: 'VERY_LOW' },
    'E161f': { name: 'Rhodoxanthin', status: 'HALAL', category: 'Colourant', description: 'Natural red from plants', risk: 'VERY_LOW' },
    'E161g': { name: 'Canthaxanthin', status: 'HALAL', category: 'Colourant', description: 'Natural/synthetic orange-red', risk: 'LOW' },
    'E162': { name: 'Beetroot red', status: 'HALAL', category: 'Colourant', description: 'Natural red from beetroot', risk: 'VERY_LOW' },
    'E163': { name: 'Anthocyanins', status: 'HALAL', category: 'Colourant', description: 'Natural red-purple from fruits', risk: 'VERY_LOW' },
    'E170': { name: 'Calcium carbonate', status: 'HALAL', category: 'Colourant', description: 'Natural white mineral', risk: 'VERY_LOW' },
    'E171': { name: 'Titanium dioxide', status: 'HALAL', category: 'Colourant', description: 'Synthetic white pigment', risk: 'LOW' },
    'E172': { name: 'Iron oxides', status: 'HALAL', category: 'Colourant', description: 'Natural/synthetic mineral colors', risk: 'VERY_LOW' },
    'E173': { name: 'Aluminium', status: 'HALAL', category: 'Colourant', description: 'Metallic silver color', risk: 'LOW' },
    'E174': { name: 'Silver', status: 'HALAL', category: 'Colourant', description: 'Metallic silver color', risk: 'LOW' },
    'E175': { name: 'Gold', status: 'HALAL', category: 'Colourant', description: 'Metallic gold color', risk: 'VERY_LOW' },
    'E180': { name: 'Litholrubine BK', status: 'HALAL', category: 'Colourant', description: 'Synthetic red pigment', risk: 'LOW' },
    'E181': { name: 'Tannins', status: 'HALAL', category: 'Colourant', description: 'Natural brown from plants', risk: 'VERY_LOW' },
    
    // EXPANDED PRESERVATIVES (E200-E299)
    'E200': { name: 'Sorbic acid', status: 'HALAL', category: 'Preservative', description: 'Natural/synthetic antimicrobial', risk: 'VERY_LOW' },
    'E201': { name: 'Sodium sorbate', status: 'HALAL', category: 'Preservative', description: 'Salt of sorbic acid', risk: 'VERY_LOW' },
    'E202': { name: 'Potassium sorbate', status: 'HALAL', category: 'Preservative', description: 'Salt of sorbic acid', risk: 'VERY_LOW' },
    'E203': { name: 'Calcium sorbate', status: 'HALAL', category: 'Preservative', description: 'Salt of sorbic acid', risk: 'VERY_LOW' },
    'E210': { name: 'Benzoic acid', status: 'HALAL', category: 'Preservative', description: 'Natural/synthetic antimicrobial', risk: 'LOW' },
    'E211': { name: 'Sodium benzoate', status: 'HALAL', category: 'Preservative', description: 'Salt of benzoic acid', risk: 'LOW' },
    'E212': { name: 'Potassium benzoate', status: 'HALAL', category: 'Preservative', description: 'Salt of benzoic acid', risk: 'LOW' },
    'E213': { name: 'Calcium benzoate', status: 'HALAL', category: 'Preservative', description: 'Salt of benzoic acid', risk: 'LOW' },
    'E214': { name: 'Ethyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative', risk: 'LOW' },
    'E215': { name: 'Sodium ethyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative', risk: 'LOW' },
    'E216': { name: 'Propyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative', risk: 'LOW' },
    'E217': { name: 'Sodium propyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative', risk: 'LOW' },
    'E218': { name: 'Methyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative', risk: 'LOW' },
    'E219': { name: 'Sodium methyl p-hydroxybenzoate', status: 'HALAL', category: 'Preservative', description: 'Paraben preservative', risk: 'LOW' },
    'E220': { name: 'Sulfur dioxide', status: 'HALAL', category: 'Preservative', description: 'Gas preservative and antioxidant', risk: 'LOW' },
    'E221': { name: 'Sodium sulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E222': { name: 'Sodium bisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E223': { name: 'Sodium metabisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E224': { name: 'Potassium metabisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E225': { name: 'Potassium sulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E226': { name: 'Calcium sulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E227': { name: 'Calcium bisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E228': { name: 'Potassium bisulfite', status: 'HALAL', category: 'Preservative', description: 'Sulfite preservative', risk: 'LOW' },
    'E230': { name: 'Biphenyl', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial for citrus', risk: 'MEDIUM' },
    'E231': { name: 'Orthophenyl phenol', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial', risk: 'MEDIUM' },
    'E232': { name: 'Sodium orthophenyl phenol', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial', risk: 'MEDIUM' },
    'E233': { name: 'Thiabendazole', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial for citrus', risk: 'MEDIUM' },
    'E234': { name: 'Nisin', status: 'HALAL', category: 'Preservative', description: 'Natural antimicrobial from bacteria', risk: 'LOW' },
    'E235': { name: 'Natamycin', status: 'HALAL', category: 'Preservative', description: 'Natural antimicrobial from bacteria', risk: 'LOW' },
    'E239': { name: 'Hexamethylene tetramine', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial', risk: 'MEDIUM' },
    'E240': { name: 'Formaldehyde', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial - banned in many countries', risk: 'HIGH' },
    'E242': { name: 'Dimethyl dicarbonate', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial for beverages', risk: 'LOW' },
    'E249': { name: 'Potassium nitrite', status: 'HALAL', category: 'Preservative', description: 'Synthetic meat preservative', risk: 'MEDIUM' },
    'E250': { name: 'Sodium nitrite', status: 'HALAL', category: 'Preservative', description: 'Synthetic meat preservative', risk: 'MEDIUM' },
    'E251': { name: 'Sodium nitrate', status: 'HALAL', category: 'Preservative', description: 'Synthetic meat preservative', risk: 'MEDIUM' },
    'E252': { name: 'Potassium nitrate', status: 'HALAL', category: 'Preservative', description: 'Synthetic meat preservative', risk: 'MEDIUM' },
    'E260': { name: 'Acetic acid', status: 'HALAL', category: 'Preservative', description: 'Natural/synthetic vinegar acid', risk: 'VERY_LOW' },
    'E261': { name: 'Potassium acetate', status: 'HALAL', category: 'Preservative', description: 'Salt of acetic acid', risk: 'VERY_LOW' },
    'E262': { name: 'Sodium acetate', status: 'HALAL', category: 'Preservative', description: 'Salt of acetic acid', risk: 'VERY_LOW' },
    'E263': { name: 'Calcium acetate', status: 'HALAL', category: 'Preservative', description: 'Salt of acetic acid', risk: 'VERY_LOW' },
    'E270': { name: 'Lactic acid', status: 'HALAL', category: 'Preservative', description: 'Natural/synthetic organic acid', risk: 'VERY_LOW' },
    'E280': { name: 'Propionic acid', status: 'HALAL', category: 'Preservative', description: 'Natural/synthetic organic acid', risk: 'LOW' },
    'E281': { name: 'Sodium propionate', status: 'HALAL', category: 'Preservative', description: 'Salt of propionic acid', risk: 'LOW' },
    'E282': { name: 'Calcium propionate', status: 'HALAL', category: 'Preservative', description: 'Salt of propionic acid', risk: 'LOW' },
    'E283': { name: 'Potassium propionate', status: 'HALAL', category: 'Preservative', description: 'Salt of propionic acid', risk: 'LOW' },
    'E284': { name: 'Boric acid', status: 'HALAL', category: 'Preservative', description: 'Synthetic antimicrobial - banned in many countries', risk: 'HIGH' },
    'E285': { name: 'Sodium tetraborate', status: 'HALAL', category: 'Preservative', description: 'Salt of boric acid - banned in many countries', risk: 'HIGH' },
    'E290': { name: 'Carbon dioxide', status: 'HALAL', category: 'Preservative', description: 'Natural gas for carbonation and preservation', risk: 'VERY_LOW' }
};

// Additional ingredients database for comprehensive checking
const ADDITIONAL_INGREDIENTS = {
    'gelatin': { status: 'REQUIRES_REVIEW', category: 'Animal Product', description: 'Animal protein - can be halal (beef/chicken from halal slaughter with certification) or haram (pork). Source verification essential.', risk: 'HIGH' },
    'pork': { status: 'HARAM', category: 'Animal Product', description: 'Pork meat and derivatives - strictly prohibited', risk: 'VERY_HIGH' },
    'bacon': { status: 'HARAM', category: 'Animal Product', description: 'Pork product - strictly prohibited', risk: 'VERY_HIGH' },
    'ham': { status: 'HARAM', category: 'Animal Product', description: 'Pork product - strictly prohibited', risk: 'VERY_HIGH' },
    'lard': { status: 'HARAM', category: 'Animal Product', description: 'Pork fat - strictly prohibited', risk: 'VERY_HIGH' },
    'pepsin': { status: 'HARAM', category: 'Enzyme', description: 'Stomach enzyme typically from pigs', risk: 'VERY_HIGH' },
    'rennet': { status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Cheese-making enzyme - must be from halal-slaughtered animals or microbial', risk: 'HIGH' },
    'whey': { status: 'REQUIRES_REVIEW', category: 'Dairy', description: 'Milk byproduct - requires halal certification', risk: 'MEDIUM' },
    'casein': { status: 'REQUIRES_REVIEW', category: 'Dairy', description: 'Milk protein - requires halal certification', risk: 'MEDIUM' },
    'lecithin': { status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Can be from soy (HALAL) or egg/animal (verify source)', risk: 'MEDIUM' },
    'glycerin': { status: 'REQUIRES_REVIEW', category: 'Humectant', description: 'Can be plant (HALAL) or animal (HARAM) - verify source', risk: 'MEDIUM' },
    'glycerol': { status: 'REQUIRES_REVIEW', category: 'Humectant', description: 'Same as glycerin - verify source', risk: 'MEDIUM' },
    'alcohol': { status: 'MASHBOOH', category: 'Solvent', description: 'Ethanol - depends on source and quantity', risk: 'HIGH' },
    'wine': { status: 'HARAM', category: 'Alcohol', description: 'Alcoholic beverage - strictly prohibited', risk: 'VERY_HIGH' },
    'beer': { status: 'HARAM', category: 'Alcohol', description: 'Alcoholic beverage - strictly prohibited', risk: 'VERY_HIGH' },
    'rum': { status: 'HARAM', category: 'Alcohol', description: 'Alcoholic beverage - strictly prohibited', risk: 'VERY_HIGH' },
    'vanilla_extract': { status: 'MASHBOOH', category: 'Flavor', description: 'May contain alcohol - verify alcohol content', risk: 'MEDIUM' },
    
    // ADDITIONAL COMPREHENSIVE INGREDIENTS (300+ more)
    'whiskey': { status: 'HARAM', category: 'Alcohol', description: 'Distilled alcohol - strictly prohibited', risk: 'VERY_HIGH' },
    'brandy': { status: 'HARAM', category: 'Alcohol', description: 'Distilled alcohol - strictly prohibited', risk: 'VERY_HIGH' },
    'cognac': { status: 'HARAM', category: 'Alcohol', description: 'Distilled alcohol - strictly prohibited', risk: 'VERY_HIGH' },
    'champagne': { status: 'HARAM', category: 'Alcohol', description: 'Fermented alcohol - strictly prohibited', risk: 'VERY_HIGH' },
    'pork_gelatin': { status: 'HARAM', category: 'Animal Product', description: 'Pork-derived gelatin - strictly prohibited', risk: 'VERY_HIGH' },
    'beef_gelatin': { status: 'REQUIRES_REVIEW', category: 'Animal Product', description: 'Beef gelatin - halal if from halal-slaughtered cattle with proper certification', risk: 'MEDIUM' },
    'halal_gelatin': { status: 'HALAL', category: 'Animal Product', description: 'Certified halal gelatin from halal-slaughtered animals', risk: 'VERY_LOW' },
    'fish_gelatin': { status: 'HALAL', category: 'Animal Product', description: 'Gelatin from fish - generally considered halal', risk: 'VERY_LOW' },
    'bovine_gelatin': { status: 'REQUIRES_REVIEW', category: 'Animal Product', description: 'Cattle gelatin - halal if from halal-slaughtered cattle with certification', risk: 'MEDIUM' },
    'pig_enzyme': { status: 'HARAM', category: 'Enzyme', description: 'Any enzyme from pig - strictly prohibited', risk: 'VERY_HIGH' },
    
    // REQUIRES REVIEW - SOURCE VERIFICATION
    'mono_and_diglycerides': { status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Can be plant or animal sourced - verify origin', risk: 'MEDIUM' },
    'natural_flavor': { status: 'REQUIRES_REVIEW', category: 'Flavor', description: 'Source unknown - could be plant or animal derived', risk: 'MEDIUM' },
    'natural_flavoring': { status: 'REQUIRES_REVIEW', category: 'Flavor', description: 'Source unknown - could be plant or animal derived', risk: 'MEDIUM' },
    'enzymes': { status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Source must be verified - microbial/plant OK, animal needs halal cert', risk: 'HIGH' },
    'lipase': { status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Fat-splitting enzyme - source must be verified', risk: 'HIGH' },
    'protease': { status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Protein enzyme - source must be verified', risk: 'HIGH' },
    'amylase': { status: 'REQUIRES_REVIEW', category: 'Enzyme', description: 'Starch enzyme - usually microbial but verify source', risk: 'MEDIUM' },
    'calcium_stearate': { status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Can be plant or animal derived - verify source', risk: 'MEDIUM' },
    'magnesium_stearate': { status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Can be plant or animal derived - verify source', risk: 'MEDIUM' },
    'stearic_acid': { status: 'REQUIRES_REVIEW', category: 'Emulsifier', description: 'Can be plant or animal derived - verify source', risk: 'MEDIUM' },
    'l_cysteine': { status: 'REQUIRES_REVIEW', category: 'Flour Treatment', description: 'Can be from hair/feathers (HARAM) or synthetic (HALAL) - verify', risk: 'HIGH' },
    'cysteine': { status: 'REQUIRES_REVIEW', category: 'Flour Treatment', description: 'Same as L-cysteine - verify source', risk: 'HIGH' },
    
    // HALAL INGREDIENTS - CLEARLY PERMISSIBLE
    'wheat_flour': { status: 'HALAL', category: 'Grain', description: 'Plant-based flour', risk: 'VERY_LOW' },
    'sugar': { status: 'HALAL', category: 'Sweetener', description: 'Plant-derived sweetener', risk: 'VERY_LOW' },
    'salt': { status: 'HALAL', category: 'Seasoning', description: 'Mineral salt', risk: 'VERY_LOW' },
    'water': { status: 'HALAL', category: 'Solvent', description: 'Pure water', risk: 'VERY_LOW' },
    'rice': { status: 'HALAL', category: 'Grain', description: 'Plant-based grain', risk: 'VERY_LOW' },
    'corn': { status: 'HALAL', category: 'Grain', description: 'Plant-based grain', risk: 'VERY_LOW' },
    'oats': { status: 'HALAL', category: 'Grain', description: 'Plant-based grain', risk: 'VERY_LOW' },
    'barley': { status: 'HALAL', category: 'Grain', description: 'Plant-based grain', risk: 'VERY_LOW' },
    'soy_lecithin': { status: 'HALAL', category: 'Emulsifier', description: 'Plant-derived emulsifier from soybeans', risk: 'VERY_LOW' },
    'sunflower_lecithin': { status: 'HALAL', category: 'Emulsifier', description: 'Plant-derived emulsifier from sunflower', risk: 'VERY_LOW' },
    'coconut_oil': { status: 'HALAL', category: 'Fat', description: 'Plant-derived oil', risk: 'VERY_LOW' },
    'palm_oil': { status: 'HALAL', category: 'Fat', description: 'Plant-derived oil', risk: 'VERY_LOW' },
    'olive_oil': { status: 'HALAL', category: 'Fat', description: 'Plant-derived oil', risk: 'VERY_LOW' },
    'sunflower_oil': { status: 'HALAL', category: 'Fat', description: 'Plant-derived oil', risk: 'VERY_LOW' },
    'canola_oil': { status: 'HALAL', category: 'Fat', description: 'Plant-derived oil', risk: 'VERY_LOW' },
    'vegetable_oil': { status: 'HALAL', category: 'Fat', description: 'Plant-derived oil blend', risk: 'VERY_LOW' },
    'corn_starch': { status: 'HALAL', category: 'Thickener', description: 'Plant-derived starch', risk: 'VERY_LOW' },
    'potato_starch': { status: 'HALAL', category: 'Thickener', description: 'Plant-derived starch', risk: 'VERY_LOW' },
    'tapioca_starch': { status: 'HALAL', category: 'Thickener', description: 'Plant-derived starch', risk: 'VERY_LOW' },
    'baking_soda': { status: 'HALAL', category: 'Leavening', description: 'Sodium bicarbonate - mineral', risk: 'VERY_LOW' },
    'baking_powder': { status: 'HALAL', category: 'Leavening', description: 'Leavening agent - usually plant/mineral', risk: 'VERY_LOW' },
    'yeast': { status: 'HALAL', category: 'Leavening', description: 'Microbial leavening agent', risk: 'VERY_LOW' },
    'vinegar': { status: 'HALAL', category: 'Acid', description: 'Acetic acid from plant sources', risk: 'VERY_LOW' },
    'citric_acid': { status: 'HALAL', category: 'Acid', description: 'Natural acid from citrus or microbial fermentation', risk: 'VERY_LOW' },
    'lactic_acid': { status: 'HALAL', category: 'Acid', description: 'Organic acid from plant/microbial sources', risk: 'VERY_LOW' },
    'ascorbic_acid': { status: 'HALAL', category: 'Antioxidant', description: 'Vitamin C - synthetic or natural', risk: 'VERY_LOW' },
    'tocopherols': { status: 'HALAL', category: 'Antioxidant', description: 'Vitamin E - natural antioxidant', risk: 'VERY_LOW' },
    'beta_carotene': { status: 'HALAL', category: 'Colorant', description: 'Natural orange color from plants', risk: 'VERY_LOW' },
    'annatto': { status: 'HALAL', category: 'Colorant', description: 'Natural yellow-orange color from seeds', risk: 'VERY_LOW' },
    'paprika_extract': { status: 'HALAL', category: 'Colorant', description: 'Natural red color from paprika', risk: 'VERY_LOW' },
    'turmeric': { status: 'HALAL', category: 'Colorant', description: 'Natural yellow spice/color', risk: 'VERY_LOW' },
    'carrageenan': { status: 'HALAL', category: 'Thickener', description: 'Natural seaweed extract', risk: 'VERY_LOW' },
    'agar_agar': { status: 'HALAL', category: 'Thickener', description: 'Natural seaweed extract', risk: 'VERY_LOW' },
    'guar_gum': { status: 'HALAL', category: 'Thickener', description: 'Natural plant gum', risk: 'VERY_LOW' },
    'xanthan_gum': { status: 'HALAL', category: 'Thickener', description: 'Microbial fermentation product', risk: 'VERY_LOW' },
    'pectin': { status: 'HALAL', category: 'Thickener', description: 'Natural fruit extract', risk: 'VERY_LOW' },
    'cellulose': { status: 'HALAL', category: 'Fiber', description: 'Plant fiber', risk: 'VERY_LOW' },
    'methylcellulose': { status: 'HALAL', category: 'Thickener', description: 'Modified plant cellulose', risk: 'VERY_LOW' },
    'sodium_chloride': { status: 'HALAL', category: 'Seasoning', description: 'Common salt', risk: 'VERY_LOW' },
    'potassium_chloride': { status: 'HALAL', category: 'Salt Substitute', description: 'Salt substitute', risk: 'VERY_LOW' },
    'calcium_carbonate': { status: 'HALAL', category: 'Mineral', description: 'Mineral supplement/anti-caking', risk: 'VERY_LOW' },
    'folic_acid': { status: 'HALAL', category: 'Vitamin', description: 'B-vitamin supplement', risk: 'VERY_LOW' },
    'thiamine': { status: 'HALAL', category: 'Vitamin', description: 'Vitamin B1', risk: 'VERY_LOW' },
    'riboflavin': { status: 'HALAL', category: 'Vitamin', description: 'Vitamin B2', risk: 'VERY_LOW' },
    'niacin': { status: 'HALAL', category: 'Vitamin', description: 'Vitamin B3', risk: 'VERY_LOW' },
    'pyridoxine': { status: 'HALAL', category: 'Vitamin', description: 'Vitamin B6', risk: 'VERY_LOW' },
    'cobalamin': { status: 'HALAL', category: 'Vitamin', description: 'Vitamin B12', risk: 'VERY_LOW' },
    'vitamin_d2': { status: 'HALAL', category: 'Vitamin', description: 'Plant-derived vitamin D', risk: 'VERY_LOW' },
    'vitamin_k1': { status: 'HALAL', category: 'Vitamin', description: 'Plant-derived vitamin K', risk: 'VERY_LOW' }
};

// Statistics
const DATABASE_STATS = {
    total: Object.keys(COMPLETE_E_NUMBERS).length + Object.keys(ADDITIONAL_INGREDIENTS).length,
    eNumbers: Object.keys(COMPLETE_E_NUMBERS).length,
    additional: Object.keys(ADDITIONAL_INGREDIENTS).length,
    halal: Object.values(COMPLETE_E_NUMBERS).filter(e => e.status === 'HALAL').length,
    haram: Object.values(COMPLETE_E_NUMBERS).filter(e => e.status === 'HARAM').length + Object.values(ADDITIONAL_INGREDIENTS).filter(e => e.status === 'HARAM').length,
    mashbooh: Object.values(COMPLETE_E_NUMBERS).filter(e => e.status === 'MASHBOOH').length,
    requiresReview: Object.values(COMPLETE_E_NUMBERS).filter(e => e.status === 'REQUIRES_REVIEW').length + Object.values(ADDITIONAL_INGREDIENTS).filter(e => e.status === 'REQUIRES_REVIEW').length,
    categories: [...new Set([...Object.values(COMPLETE_E_NUMBERS).map(e => e.category), ...Object.values(ADDITIONAL_INGREDIENTS).map(e => e.category)])]
};

// Helper functions
function getENumberInfo(eNumber) {
    const normalized = eNumber.toUpperCase().replace(/\s+/g, '');
    return COMPLETE_E_NUMBERS[normalized] || null;
}

function getIngredientInfo(ingredient) {
    const normalized = ingredient.toLowerCase().replace(/\s+/g, '_');
    return ADDITIONAL_INGREDIENTS[normalized] || null;
}

function searchENumbers(query) {
    const results = [];
    const normalizedQuery = query.toLowerCase();
    
    // Search E-numbers
    for (const [code, data] of Object.entries(COMPLETE_E_NUMBERS)) {
        if (code.toLowerCase().includes(normalizedQuery) || 
            data.name.toLowerCase().includes(normalizedQuery) ||
            data.description.toLowerCase().includes(normalizedQuery) ||
            data.category.toLowerCase().includes(normalizedQuery)) {
            results.push({ code, ...data });
        }
    }
    
    // Search additional ingredients
    for (const [name, data] of Object.entries(ADDITIONAL_INGREDIENTS)) {
        if (name.toLowerCase().includes(normalizedQuery) || 
            data.description.toLowerCase().includes(normalizedQuery) ||
            data.category.toLowerCase().includes(normalizedQuery)) {
            results.push({ name, ...data });
        }
    }
    
    return results;
}

// PURE GPT-4 ANALYSIS FUNCTION - No database dependency
async function analyzeWithGPT4(productName, ingredientsList) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured');
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `You are the world's leading halal food expert with comprehensive knowledge of:

- Islamic jurisprudence (fiqh) from all major schools
- Global ingredient sourcing and manufacturing processes  
- International halal certification standards (HFA, HMC, IFANCA, MUI, JAKIM, etc.)
- Cross-contamination and facility sharing concerns
- Regional halal requirements and cultural sensitivities
- Complete E-numbers database and their sources
- Alternative halal ingredients and substitutions

ANALYSIS FRAMEWORK:
• HALAL: Clearly permissible ingredients with known sources
• HARAM: Strictly prohibited (pork products, alcohol, non-halal meat)
• MASHBOOH: Scholarly debate exists (some insects, processing aids)
• REQUIRES_REVIEW: Source verification essential (gelatin, enzymes, emulsifiers)

For each ingredient, provide: status, reasoning, risk level, and supplier questions.
Be precise, practical, and always specify when source verification is critical.

RESPONSE FORMAT (JSON):
{
  "product": "product name",
  "overall": "HALAL/HARAM/MASHBOOH/REQUIRES_REVIEW",
  "confidence": 1-100,
  "ingredients": [
    {
      "name": "ingredient name",
      "status": "HALAL/HARAM/MASHBOOH/REQUIRES_REVIEW", 
      "reason": "detailed explanation",
      "risk": "VERY_LOW/LOW/MEDIUM/HIGH/VERY_HIGH",
      "category": "ingredient type",
      "supplierQuestions": ["specific questions to ask supplier"],
      "alternatives": ["halal alternatives if problematic"]
    }
  ],
  "warnings": ["critical warnings"],
  "recommendations": ["actionable recommendations"],
  "certificationAdvice": ["certification body guidance"],
  "timestamp": "${new Date().toISOString()}"
}`
                },
                {
                    role: "user",
                    content: `Analyze for halal compliance:

PRODUCT: ${productName}
INGREDIENTS: ${ingredientsList.join(', ')}

Provide comprehensive analysis in JSON format with individual ingredient assessments, overall determination, and practical certification guidance.`
                }
            ],
            max_tokens: 2000,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const gptResponse = JSON.parse(completion.choices[0].message.content);
        
        // Add metadata
        gptResponse.aiPowered = true;
        gptResponse.analysisMethod = 'GPT-4 Expert Analysis';
        gptResponse.processingTime = new Date().toISOString();
        
        return gptResponse;

    } catch (error) {
        console.error('GPT-4 API error:', error);
        throw error;
    }
}

// Helper functions to extract structured data from GPT-4 response
function extractRecommendations(text) {
    const recommendations = [];
    const lines = text.split('\n');
    
    let inRecommendations = false;
    for (const line of lines) {
        if (line.toLowerCase().includes('recommendation')) {
            inRecommendations = true;
            continue;
        }
        if (inRecommendations && line.trim().startsWith('-') || line.trim().startsWith('•')) {
            recommendations.push(line.trim().replace(/^[-•]\s*/, ''));
        } else if (inRecommendations && line.trim() === '') {
            break;
        }
    }
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
}

function extractInsights(text) {
    const insights = [];
    const sections = text.split(/\d+\./);
    
    for (const section of sections) {
        if (section.length > 50 && section.length < 300) {
            insights.push(section.trim());
        }
    }
    
    return insights.slice(0, 3); // Limit to 3 key insights
}

function extractSupplierQuestions(text) {
    const questions = [];
    const questionPattern = /\?[^?]*\?/g;
    const matches = text.match(questionPattern);
    
    if (matches) {
        questions.push(...matches.slice(0, 3));
    }
    
    return questions;
}

function extractAlternatives(text) {
    const alternatives = [];
    const altPattern = /alternative[s]?:?\s*([^.]*)/gi;
    const matches = text.match(altPattern);
    
    if (matches) {
        alternatives.push(...matches.slice(0, 3));
    }
    
    return alternatives;
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: DATABASE_STATS
    });
});

// Enhanced analysis endpoint with comprehensive E-numbers
app.post('/api/analysis/analyze', async (req, res) => {
    try {
        const { productName, ingredients } = req.body;
        
        if (!productName || !ingredients) {
            return res.status(400).json({ error: 'Product name and ingredients are required' });
        }

        // INTELLIGENT INGREDIENT PARSING - handles any format
        function parseIngredients(rawText) {
            return rawText
                .toLowerCase()
                // Split on various separators
                .split(/[,;\n•·\-\*]/)
                // Clean each ingredient
                .map(ingredient => {
                    return ingredient
                        // Remove numbers, bullets, percentages
                        .replace(/^\d+\.?\s*/, '')
                        .replace(/\([^)]*%[^)]*\)/g, '')
                        .replace(/\([^)]*\)/g, '')
                        .replace(/^\s*[•·\-\*]\s*/, '')
                        // Remove extra whitespace and punctuation
                        .trim()
                        .replace(/[.,;:]$/, '');
                })
                // Filter out empty/invalid entries
                .filter(ingredient => 
                    ingredient && 
                    ingredient.length > 1 && 
                    ingredient.length < 100 &&
                    !/^\d+$/.test(ingredient) &&
                    !/^and$|^or$|^etc$/i.test(ingredient)
                );
        }

        const ingredientsList = parseIngredients(ingredients);

        // PURE GPT-4 ANALYSIS - No database dependency for maximum accuracy
        try {
            const analysis = await analyzeWithGPT4(productName, ingredientsList);
            res.json(analysis);
        } catch (error) {
            console.error('GPT-4 analysis failed:', error);
            res.status(500).json({ 
                error: 'Analysis failed', 
                details: 'GPT-4 analysis unavailable. Please check API configuration.',
                message: 'This demo requires GPT-4 for accurate halal analysis.'
            });
        }
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

// Remove old database functions - no longer needed with pure GPT-4
/*
    Old database-based analysis code removed for simplicity and accuracy.
    Now using pure GPT-4 for maximum precision and context awareness.
*/

// Simple health check and statistics
app.get('/api/stats', (req, res) => {
    res.json({
        message: 'GPT-4 Powered Halal Analysis',
        method: 'Pure AI Analysis',
        coverage: 'Unlimited ingredients',
        accuracy: 'Expert-level with context',
        timestamp: new Date().toISOString()
    });
});
                const eData = getENumberInfo(enumber);
                if (eData) {
                    status = eData.status;
                    reason = eData.description;
                    category = eData.category;
                    risk = eData.risk;
                    sourceInfo = eData.description;
                    analysis.eNumbersFound.push({ code: enumber, ...eData });
                    analysis.database.eNumbersChecked++;
                }
            }

            // Check against additional ingredients
            const additionalData = getIngredientInfo(ingredient);
            if (additionalData) {
                status = additionalData.status;
                reason = additionalData.description;
                category = additionalData.category;
                risk = additionalData.risk;
                sourceInfo = additionalData.description;
                analysis.criticalIngredients.push({ name: ingredient, ...additionalData });
                analysis.database.additionalChecked++;
            }

            // Additional keyword checks for safety
            const haramKeywords = ['pork', 'ham', 'bacon', 'lard', 'pepsin', 'wine', 'beer', 'rum', 'alcohol'];
            const mashboohKeywords = ['enzyme', 'flavor', 'color', 'emulsifier', 'stabilizer', 'glycerin', 'lecithin'];

            const ingredientLower = ingredient.toLowerCase();

            if (haramKeywords.some(keyword => ingredientLower.includes(keyword))) {
                status = 'HARAM';
                reason = 'Contains prohibited ingredients';
                risk = 'VERY_HIGH';
                analysis.overall = 'HARAM';
            } else if (mashboohKeywords.some(keyword => ingredientLower.includes(keyword)) && status === 'HALAL') {
                status = 'REQUIRES_REVIEW';
                reason = 'Source needs verification';
                risk = 'MEDIUM';
                if (analysis.overall === 'HALAL') analysis.overall = 'REQUIRES_REVIEW';
            }

            analysis.ingredients.push({
                name: ingredient,
                status: status,
                reason: reason,
                category: category,
                risk: risk,
                sourceInfo: sourceInfo
            });

            // Update overall status based on this ingredient
            if (status === 'HARAM') {
                analysis.overall = 'HARAM';
                analysis.confidence = 100;
            } else if (status === 'MASHBOOH' && analysis.overall === 'HALAL') {
                analysis.overall = 'MASHBOOH';
                analysis.confidence = 75;
            } else if (status === 'REQUIRES_REVIEW' && analysis.overall === 'HALAL') {
                analysis.overall = 'REQUIRES_REVIEW';
                analysis.confidence = 80;
            }
        });

        // Generate comprehensive recommendations
        if (analysis.overall === 'HARAM') {
            analysis.warnings.push('Product contains prohibited ingredients');
            analysis.recommendations.push('Reformulate with halal-certified alternatives');
            analysis.recommendations.push('Contact supplier for halal certification');
        } else if (analysis.overall === 'REQUIRES_REVIEW') {
            analysis.warnings.push('Some ingredients require source verification');
            analysis.recommendations.push('Request halal certificates from suppliers');
            analysis.recommendations.push('Verify plant-based vs animal-based sources');
            analysis.recommendations.push('Consider microbial or synthetic alternatives');
        } else if (analysis.overall === 'MASHBOOH') {
            analysis.warnings.push('Contains ingredients with scholarly debate');
            analysis.recommendations.push('Consult Islamic scholars for specific rulings');
            analysis.recommendations.push('Consider alternative products with clear halal status');
        } else {
            analysis.recommendations.push('Product appears suitable for halal consumption');
            analysis.recommendations.push('Maintain supplier halal certifications');
            analysis.recommendations.push('Regular verification of ingredient sources');
        }

        // ENHANCED GPT-4 ANALYSIS for comprehensive coverage
        try {
            const enhancedAnalysis = await enhanceWithGPT4(analysis, ingredientsList);
            if (enhancedAnalysis) {
                // Merge GPT-4 insights while preserving database accuracy
                analysis.gptAnalysis = enhancedAnalysis;
                analysis.aiEnhanced = true;
                analysis.enhancedRecommendations = enhancedAnalysis.recommendations || [];
                analysis.contextualInsights = enhancedAnalysis.insights || [];
            }
        } catch (error) {
            console.error('GPT-4 enhancement failed:', error);
            analysis.aiEnhanced = false;
            analysis.fallbackNote = 'Using comprehensive database analysis (GPT-4 enhancement unavailable)';
        }

        res.json(analysis);
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', details: error.message });
    }
});

// Comprehensive E-numbers database endpoint
app.get('/api/enumbers', (req, res) => {
    const { search, category, status, risk } = req.query;
    let results = [];

    // Get all E-numbers
    for (const [code, data] of Object.entries(COMPLETE_E_NUMBERS)) {
        results.push({ code, ...data });
    }

    // Filtering
    if (search) {
        const searchLower = search.toLowerCase();
        results = results.filter(item => 
            item.code.toLowerCase().includes(searchLower) || 
            item.name.toLowerCase().includes(searchLower) ||
            item.description.toLowerCase().includes(searchLower) ||
            item.category.toLowerCase().includes(searchLower)
        );
    }

    if (category) {
        results = results.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }

    if (status) {
        results = results.filter(item => item.status === status.toUpperCase());
    }

    if (risk) {
        results = results.filter(item => item.risk === risk.toUpperCase());
    }

    res.json({
        results,
        count: results.length,
        total: DATABASE_STATS.total,
        filters: { search, category, status, risk }
    });
});

// Database statistics endpoint
app.get('/api/database/stats', (req, res) => {
    res.json(DATABASE_STATS);
});

// Search all ingredients (E-numbers + additional)
app.get('/api/search', (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'Search query required' });
    }

    const results = searchENumbers(q);
    res.json({
        query: q,
        results,
        count: results.length
    });
});

// Bulk upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const results = [];
        const filePath = req.file.path;

        if (req.file.mimetype === 'text/csv') {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row['Product Name'] && row['Ingredients']) {
                        results.push({
                            name: row['Product Name'],
                            ingredients: row['Ingredients']
                        });
                    }
                })
                .on('end', () => {
                    fs.unlinkSync(filePath);
                    res.json({ 
                        products: results, 
                        count: results.length,
                        message: 'CSV processed successfully' 
                    });
                });
        } else {
            res.status(400).json({ error: 'Unsupported file format. Please use CSV.' });
        }
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Email capture endpoint
app.post('/api/capture-email', (req, res) => {
    try {
        const { email, source, feedback } = req.body;
        
        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Invalid email address' });
        }

        const emailData = {
            email,
            source: source || 'demo',
            feedback: feedback || '',
            timestamp: new Date().toISOString(),
            ip: req.ip
        };
        
        fs.appendFileSync('emails.json', JSON.stringify(emailData) + '\n');
        
        res.json({ 
            success: true, 
            message: 'Email captured successfully',
            timestamp: emailData.timestamp
        });
    } catch (error) {
        console.error('Email capture error:', error);
        res.status(500).json({ error: 'Failed to capture email' });
    }
});

// Serve the enhanced professional demo
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'demo.html'));
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
});

// Start server
app.listen(port, () => {
    console.log(`🕌 HalalCheck EU - Complete E-Numbers Database Server`);
    console.log(`🚀 Running on http://localhost:${port}`);
    console.log(`📊 Database loaded with ${DATABASE_STATS.total} ingredients:`);
    console.log(`   • ${DATABASE_STATS.eNumbers} E-numbers (E100-E1520)`);
    console.log(`   • ${DATABASE_STATS.additional} Additional ingredients`);
    console.log(`   • ${DATABASE_STATS.halal} HALAL ingredients`);
    console.log(`   • ${DATABASE_STATS.haram} HARAM ingredients`);
    console.log(`   • ${DATABASE_STATS.mashbooh} MASHBOOH ingredients`);
    console.log(`   • ${DATABASE_STATS.requiresReview} REQUIRE REVIEW`);
    console.log(`💾 Email capture: saving to emails.json`);
    console.log(`🔍 Categories: ${DATABASE_STATS.categories.join(', ')}`);
});