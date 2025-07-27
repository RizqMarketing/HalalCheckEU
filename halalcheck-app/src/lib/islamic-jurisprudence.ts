/**
 * Islamic Jurisprudence Database for Halal Ingredient Analysis
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

interface IslamicReference {
  source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa'
  reference: string
  arabic?: string
  transliteration?: string
  translation: string
  school?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General'
}

interface IngredientClassification {
  name: string
  status: 'HALAL' | 'HARAM' | 'MASHBOOH'
  category: string
  confidence: number
  reasoning: string
  islamicReferences: IslamicReference[]
  alternativeSuggestions?: string[]
  requiresVerification?: boolean
}

// Primary Quranic References for Food Laws
export const QURANIC_FOOD_REFERENCES: IslamicReference[] = [
  {
    source: 'Quran',
    reference: 'Q2:173',
    arabic: 'إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ وَمَا أُهِلَّ بِهِ لِغَيْرِ اللَّهِ',
    transliteration: 'Innama harrama alaykumu al-maytata wa-ad-dama wa lahma al-khinziri wa ma uhilla bihi li-ghayri Allah',
    translation: 'He has only forbidden you carrion, blood, swine flesh, and that over which any name other than Allah\'s has been invoked.',
    school: 'General'
  },
  {
    source: 'Quran',
    reference: 'Q5:3',
    arabic: 'حُرِّمَتْ عَلَيْكُمُ الْمَيْتَةُ وَالدَّمُ وَلَحْمُ الْخِنزِيرِ',
    transliteration: 'Hurrimat alaykumu al-maytatu wa-ad-damu wa lahmu al-khinziri',
    translation: 'Forbidden to you are carrion, blood, and swine; what is slaughtered in the name of any other than Allah; what is killed by strangling, beating, a fall, or by being gored to death; what is partly eaten by a predator unless you slaughter it; and what is sacrificed on altars.',
    school: 'General'
  },
  {
    source: 'Quran',
    reference: 'Q5:90',
    arabic: 'إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ فَاجْتَنِبُوهُ',
    transliteration: 'Innama al-khamru wa-al-maysiru wa-al-ansabu wa-al-azlamu rijsun min amali ash-shaytani fa-ijtanibuhu',
    translation: 'Intoxicants, gambling, idolatrous practices, and divining arrows are abominations devised by Satan. Avoid them so that you may prosper.',
    school: 'General'
  },
  {
    source: 'Quran',
    reference: 'Q2:168',
    arabic: 'يَا أَيُّهَا النَّاسُ كُلُوا مِمَّا فِي الْأَرْضِ حَلَالًا طَيِّبًا',
    transliteration: 'Ya ayyuha an-nasu kulu mimma fi al-ardi halalan tayyiban',
    translation: 'O people! Eat of what is lawful and pure on earth.',
    school: 'General'
  }
]

// Comprehensive Ingredient Classifications
export const INGREDIENT_CLASSIFICATIONS: IngredientClassification[] = [
  // HARAM INGREDIENTS
  {
    name: 'Pork Gelatin',
    status: 'HARAM',
    category: 'Animal Derivatives',
    confidence: 100,
    reasoning: 'Derived from pork, which is explicitly forbidden in Islamic law.',
    islamicReferences: [
      {
        source: 'Quran',
        reference: 'Q2:173',
        translation: 'He has only forbidden you carrion, blood, swine flesh, and that over which any name other than Allah\'s has been invoked.',
        school: 'General'
      }
    ]
  },
  {
    name: 'Ethanol',
    status: 'HARAM',
    category: 'Alcoholic Substances',
    confidence: 95,
    reasoning: 'Intoxicating alcohol is prohibited. However, some scholars allow trace amounts (<0.1%) from non-khamr sources.',
    islamicReferences: [
      {
        source: 'Quran',
        reference: 'Q5:90',
        arabic: 'إِنَّمَا الْخَمْرُ وَالْمَيْسِرُ وَالْأَنصَابُ وَالْأَزْلَامُ رِجْسٌ مِّنْ عَمَلِ الشَّيْطَانِ فَاجْتَنِبُوهُ',
        translation: 'Intoxicants are abominations devised by Satan. Avoid them so that you may prosper.',
        school: 'General'
      }
    ],
    requiresVerification: true
  },
  {
    name: 'Lard',
    status: 'HARAM',
    category: 'Animal Fats',
    confidence: 100,
    reasoning: 'Pig fat, explicitly forbidden as it derives from swine.',
    islamicReferences: [
      {
        source: 'Quran',
        reference: 'Q5:3',
        translation: 'Forbidden to you are carrion, blood, and swine.',
        school: 'General'
      }
    ]
  },

  // MASHBOOH INGREDIENTS
  {
    name: 'E471 (Mono- and Diglycerides)',
    status: 'MASHBOOH',
    category: 'Emulsifiers',
    confidence: 25,
    reasoning: 'Critical ingredient requiring source verification. Can be derived from plant oils (halal), beef/mutton tallow from zabiha animals (halal), or pork fat (haram). Manufacturing processes may involve cross-contamination between halal and haram sources.',
    islamicReferences: [
      {
        source: 'Quran',
        reference: 'Q2:173',
        arabic: 'إِنَّمَا حَرَّمَ عَلَيْكُمُ الْمَيْتَةَ وَالدَّمَ وَلَحْمَ الْخِنزِيرِ وَمَا أُهِلَّ بِهِ لِغَيْرِ اللَّهِ',
        transliteration: 'Innama harrama alaykumu al-maytata wa-ad-dama wa lahma al-khinziri wa ma uhilla bihi li-ghayri Allah',
        translation: 'He has only forbidden you carrion, blood, swine flesh, and that over which any name other than Allah\'s has been invoked.',
        school: 'General'
      },
      {
        source: 'Hadith',
        reference: 'Sahih Muslim 1599',
        arabic: 'إِنَّ اللَّهَ إِذَا حَرَّمَ شَيْئًا حَرَّمَ ثَمَنَهُ',
        transliteration: 'Inna Allaha idha harrama shay\'an harrama thamanahu',
        translation: 'When Allah forbids something, He also forbids its price (and by extension, derivatives).',
        school: 'General'
      },
      {
        source: 'Scholarly_Consensus',
        reference: 'Islamic Fiqh Academy Decision 6/6/57',
        translation: 'Chemical transformation (istihalah) of haram substances may render them permissible if the original substance is completely changed in properties and characteristics. However, mono- and diglycerides retain the chemical structure of their source fats.',
        school: 'General'
      },
      {
        source: 'Contemporary_Fatwa',
        reference: 'JAKIM Malaysia Technical Standard MS1500:2019',
        translation: 'E471 mono- and diglycerides must be derived from halal sources with proper documentation. Source verification certificates are mandatory for halal certification.',
        school: 'General'
      },
      {
        source: 'Contemporary_Fatwa',
        reference: 'European Halal Certification Bodies Consensus 2023',
        translation: 'Emulsifiers E471 require complete supply chain traceability from raw material source to final product to ensure halal compliance.',
        school: 'General'
      }
    ],
    requiresVerification: true,
    alternativeSuggestions: [
      'E472e (Mono- and diacetyl tartaric acid esters) from verified plant sources',
      'Lecithin (E322) from soy or sunflower sources',
      'Polyglycerol esters (E475) from plant glycerol',
      'Certified halal plant-based emulsifiers'
    ]
  },
  {
    name: 'E120 (Cochineal)',
    status: 'MASHBOOH',
    category: 'Colorants',
    confidence: 25,
    reasoning: 'Derived from insects. Scholarly opinion differs on consumption of insects in Islamic law.',
    islamicReferences: [
      {
        source: 'Scholarly_Consensus',
        reference: 'Differing Madhab Opinions',
        translation: 'Hanafi school generally prohibits insects, while other schools may permit certain insects.',
        school: 'General'
      }
    ],
    requiresVerification: true,
    alternativeSuggestions: ['E163 (Anthocyanins) from plant sources', 'E160a (Beta-carotene) from vegetables']
  },
  {
    name: 'E441 (Superheated Steam)',
    status: 'MASHBOOH',
    category: 'Processing Aids',
    confidence: 40,
    reasoning: 'Processing method that may come into contact with non-halal substances during manufacturing.',
    islamicReferences: [
      {
        source: 'Contemporary_Fatwa',
        reference: 'Modern Food Processing Guidelines',
        translation: 'Equipment and processing methods must be free from contamination with haram substances.',
        school: 'General'
      }
    ],
    requiresVerification: true
  },

  // HALAL INGREDIENTS
  {
    name: 'Olive Oil',
    status: 'HALAL',
    category: 'Plant Oils',
    confidence: 100,
    reasoning: 'Pure plant-based oil, mentioned favorably in Islamic tradition.',
    islamicReferences: [
      {
        source: 'Quran',
        reference: 'Q24:35',
        arabic: 'مِن شَجَرَةٍ مُّبَارَكَةٍ زَيْتُونَةٍ',
        transliteration: 'Min shajaratin mubarakatin zaytunatin',
        translation: 'From a blessed olive tree.',
        school: 'General'
      }
    ]
  },
  {
    name: 'Sea Salt',
    status: 'HALAL',
    category: 'Minerals',
    confidence: 100,
    reasoning: 'Natural mineral salt from permissible source (sea).',
    islamicReferences: [
      {
        source: 'Hadith',
        reference: 'Sahih Bukhari 2312, Sunan Abu Dawud 83',
        arabic: 'هُوَ الطَّهُورُ مَاؤُهُ الْحِلُّ مَيْتَتُهُ',
        transliteration: 'Huwa at-tahuru ma\'uhu al-hillu maytatuhu',
        translation: 'Its (the sea\'s) water is pure and its dead (fish) are lawful food.',
        school: 'General'
      }
    ]
  },
  {
    name: 'Beef Gelatin (Halal Slaughtered)',
    status: 'HALAL',
    category: 'Animal Derivatives',
    confidence: 95,
    reasoning: 'Derived from cattle slaughtered according to Islamic law (Zabiha).',
    islamicReferences: [
      {
        source: 'Hadith',
        reference: 'Sahih Bukhari 5498, Sahih Muslim 1955',
        arabic: 'إِنَّ اللَّهَ كَتَبَ الْإِحْسَانَ عَلَى كُلِّ شَيْءٍ فَإِذَا قَتَلْتُمْ فَأَحْسِنُوا الْقِتْلَةَ وَإِذَا ذَبَحْتُمْ فَأَحْسِنُوا الذَّبْحَ',
        transliteration: 'Inna Allaha kataba al-ihsana ala kulli shay\'in fa-idha qataltum fa-ahsinu al-qitlata wa-idha dhabahtum fa-ahsinu adh-dhabh',
        translation: 'Allah has prescribed excellence in all things. So when you kill, kill well; and when you slaughter, slaughter well.',
        school: 'General'
      }
    ],
    requiresVerification: true
  }
]

// Islamic Terminology and Concepts
export const ISLAMIC_TERMS = {
  HALAL: {
    arabic: 'حَلَال',
    transliteration: 'Ḥalāl',
    meaning: 'Lawful, permitted'
  },
  HARAM: {
    arabic: 'حَرَام',
    transliteration: 'Ḥarām',
    meaning: 'Unlawful, forbidden'
  },
  MASHBOOH: {
    arabic: 'مَشْبُوه',
    transliteration: 'Mashbūh',
    meaning: 'Doubtful, questionable'
  },
  ZABIHA: {
    arabic: 'ذَبِيحَة',
    transliteration: 'Zabīḥah',
    meaning: 'Properly slaughtered according to Islamic law'
  },
  TAYYIB: {
    arabic: 'طَيِّب',
    transliteration: 'Ṭayyib',
    meaning: 'Pure, wholesome, good'
  }
}

// Verification Requirements for Critical Ingredients
export const VERIFICATION_REQUIREMENTS = {
  'E471': {
    ingredientName: 'E471 (Mono- and Diglycerides)',
    criticalDocuments: [
      'Source origin certificate (plant/animal specification)',
      'Halal slaughter certificate (if animal-derived)',
      'Manufacturing process documentation',
      'Cross-contamination prevention protocols',
      'Supply chain traceability records'
    ],
    acceptableSources: [
      'Certified halal plant oils (palm, soy, sunflower)',
      'Beef/mutton tallow from zabiha-slaughtered animals',
      'Synthetic glycerol from halal sources'
    ],
    prohibitedSources: [
      'Pork fat or lard',
      'Non-halal slaughtered animal fats',
      'Mixed production lines without separation'
    ],
    certificationBodies: [
      'JAKIM (Malaysia)',
      'MUI (Indonesia)', 
      'HFCE (Europe)',
      'HFA (Australia)',
      'IFANCA (USA)'
    ],
    riskFactors: [
      'Source ambiguity in ingredient labeling',
      'Mixed production facilities',
      'Lack of supply chain documentation',
      'Generic "vegetable fat" declarations'
    ],
    verificationSteps: [
      '1. Contact manufacturer for source specification',
      '2. Request halal certification from recognized body',
      '3. Verify production line separation protocols',
      '4. Check for cross-contamination prevention measures',
      '5. Obtain complete supply chain documentation'
    ],
    commonMisconceptions: [
      'All plant-derived E471 is automatically halal (processing matters)',
      'Chemical transformation removes haram nature (not applicable to E471)',
      'Generic "vegetable" labeling guarantees plant source',
      'Small quantities make verification unnecessary'
    ],
    schematicGuidance: {
      'Hanafi': 'Strict source verification required; doubt leads to prohibition',
      'Maliki': 'Source documentation mandatory; benefit of doubt not applicable',
      'Shafi': 'Clear evidence of halal source required before consumption',
      'Hanbali': 'Precautionary principle applies; avoid unless certain of source'
    }
  }
}

// Ingredient Analysis Functions
export function getIslamicReferences(ingredientName: string): IngredientClassification | null {
  const classification = INGREDIENT_CLASSIFICATIONS.find(
    item => item.name.toLowerCase().includes(ingredientName.toLowerCase())
  )
  return classification || null
}

export function getQuranicReference(verse: string): IslamicReference | null {
  return QURANIC_FOOD_REFERENCES.find(ref => ref.reference === verse) || null
}

export function getVerificationRequirements(eNumber: string): any | null {
  return VERIFICATION_REQUIREMENTS[eNumber] || null
}

export function formatIslamicReference(reference: IslamicReference): string {
  let formatted = `**${reference.source}** - ${reference.reference}\n`
  
  if (reference.arabic) {
    formatted += `*Arabic:* ${reference.arabic}\n`
  }
  
  if (reference.transliteration) {
    formatted += `*Transliteration:* ${reference.transliteration}\n`
  }
  
  formatted += `*Translation:* ${reference.translation}`
  
  if (reference.school && reference.school !== 'General') {
    formatted += `\n*School:* ${reference.school}`
  }
  
  return formatted
}

// Enhanced Analysis with Islamic Context
export function enhanceAnalysisWithIslamicContext(ingredient: any) {
  const classification = getIslamicReferences(ingredient.name)
  
  if (!classification) {
    return {
      ...ingredient,
      islamicReferences: [],
      requiresScholarlyConsultation: true,
      disclaimer: 'No specific Islamic ruling found. Consult qualified Islamic scholars for definitive guidance.'
    }
  }
  
  return {
    ...ingredient,
    islamicReferences: classification.islamicReferences,
    requiresVerification: classification.requiresVerification,
    alternativeSuggestions: classification.alternativeSuggestions,
    islamicReasoning: classification.reasoning,
    confidence: classification.confidence
  }
}

export default {
  QURANIC_FOOD_REFERENCES,
  INGREDIENT_CLASSIFICATIONS,
  ISLAMIC_TERMS,
  VERIFICATION_REQUIREMENTS,
  getIslamicReferences,
  getQuranicReference,
  getVerificationRequirements,
  formatIslamicReference,
  enhanceAnalysisWithIslamicContext
}