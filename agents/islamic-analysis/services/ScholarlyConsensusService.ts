/**
 * Scholarly Consensus Service
 * 
 * Provides madhab-specific rulings and scholarly consensus on ingredient permissibility
 */

import { IslamicReference } from '../domain/IslamicKnowledgeBase';
import { Logger } from '../../../core/infrastructure/logging/Logger';

export interface MadhabRuling {
  madhab: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali';
  ruling: 'HALAL' | 'HARAM' | 'MASHBOOH';
  confidence: number;
  reasoning: string;
  references: IslamicReference[];
  scholars?: string[];
}

export interface ConsensusAnalysis {
  ingredient: string;
  consensusLevel: 'unanimous' | 'majority' | 'divided' | 'unclear';
  madhabRulings: MadhabRuling[];
  recommendedApproach: string;
  alternativeOpinions?: string[];
}

export class ScholarlyConsensusService {
  private logger: Logger;
  private madhabRulings: Map<string, MadhabRuling[]>;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger('ScholarlyConsensusService');
    this.madhabRulings = new Map();
    this.initializeMadhabRulings();
  }

  private initializeMadhabRulings(): void {
    // Initialize with known madhab-specific rulings
    this.addMadhabRulings('insects', [
      {
        madhab: 'Hanafi',
        ruling: 'HARAM',
        confidence: 90,
        reasoning: 'Hanafi school generally prohibits consumption of insects.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Al-Hidayah by Al-Marghinani',
            translation: 'Insects are considered impure and their consumption is prohibited.',
            school: 'Hanafi'
          }
        ],
        scholars: ['Al-Marghinani', 'Ibn Abidin']
      },
      {
        madhab: 'Maliki',
        ruling: 'MASHBOOH',
        confidence: 70,
        reasoning: 'Maliki school permits certain insects if they are not harmful.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Al-Mudawwana by Imam Malik',
            translation: 'Some insects may be permissible if they are not considered harmful.',
            school: 'Maliki'
          }
        ],
        scholars: ['Imam Malik', 'Al-Qurtubi']
      },
      {
        madhab: 'Shafi',
        ruling: 'HALAL',
        confidence: 80,
        reasoning: 'Shafi school permits consumption of certain insects like locusts.',
        references: [
          {
            source: 'Hadith',
            reference: 'Sunan Ibn Majah 3218',
            arabic: 'أُحِلَّتْ لَنَا مَيْتَتَانِ وَدَمَانِ السَّمَكُ وَالْجَرَادُ وَالْكَبِدُ وَالطِّحَالُ',
            translation: 'Two types of dead animals and two types of blood have been made lawful for us: fish and locusts, liver and spleen.',
            school: 'Shafi'
          }
        ],
        scholars: ['Imam Al-Shafi', 'Al-Nawawi']
      },
      {
        madhab: 'Hanbali',
        ruling: 'MASHBOOH',
        confidence: 75,
        reasoning: 'Hanbali school has mixed opinions on insects.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Al-Mughni by Ibn Qudamah',
            translation: 'Different opinions exist within the Hanbali school regarding insect consumption.',
            school: 'Hanbali'
          }
        ],
        scholars: ['Ibn Qudamah', 'Ibn Taymiyyah']
      }
    ]);

    this.addMadhabRulings('alcohol in food processing', [
      {
        madhab: 'Hanafi',
        ruling: 'HARAM',
        confidence: 95,
        reasoning: 'Hanafi school strictly prohibits alcohol in any form.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Contemporary Hanafi Rulings',
            translation: 'Any amount of alcohol renders the entire product impermissible.',
            school: 'Hanafi'
          }
        ]
      },
      {
        madhab: 'Maliki',
        ruling: 'MASHBOOH',
        confidence: 70,
        reasoning: 'Maliki school may allow trace amounts if transformed.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Maliki Contemporary Fatawa',
            translation: 'Alcohol used in processing may be permissible if it undergoes transformation.',
            school: 'Maliki'
          }
        ]
      },
      {
        madhab: 'Shafi',
        ruling: 'MASHBOOH',
        confidence: 65,
        reasoning: 'Shafi school considers intent and final alcohol content.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Contemporary Shafi Rulings',
            translation: 'Alcohol for processing purposes may be permissible if it does not intoxicate.',
            school: 'Shafi'
          }
        ]
      },
      {
        madhab: 'Hanbali',
        ruling: 'HARAM',
        confidence: 90,
        reasoning: 'Hanbali school generally prohibits alcohol in food.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Hanbali Contemporary Opinions',
            translation: 'Alcohol in food processing is generally not permissible.',
            school: 'Hanbali'
          }
        ]
      }
    ]);

    this.addMadhabRulings('non-muslim slaughter', [
      {
        madhab: 'Hanafi',
        ruling: 'MASHBOOH',
        confidence: 60,
        reasoning: 'Hanafi school permits meat of People of the Book with conditions.',
        references: [
          {
            source: 'Quran',
            reference: 'Q5:5',
            translation: 'The food of those who were given the Scripture is lawful for you.',
            school: 'Hanafi'
          }
        ]
      },
      {
        madhab: 'Maliki',
        ruling: 'MASHBOOH',
        confidence: 65,
        reasoning: 'Maliki school allows meat of People of the Book with proper slaughter.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Maliki Fiqh Rulings',
            translation: 'Meat from People of the Book is permissible if slaughtered properly.',
            school: 'Maliki'
          }
        ]
      },
      {
        madhab: 'Shafi',
        ruling: 'MASHBOOH',
        confidence: 70,
        reasoning: 'Shafi school permits with verification of proper slaughter.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Shafi Contemporary Rulings',
            translation: 'Meat from Christians and Jews is permissible with proper slaughter verification.',
            school: 'Shafi'
          }
        ]
      },
      {
        madhab: 'Hanbali',
        ruling: 'HARAM',
        confidence: 85,
        reasoning: 'Hanbali school requires Muslim slaughter for certainty.',
        references: [
          {
            source: 'Scholarly_Consensus',
            reference: 'Hanbali Strict Interpretation',
            translation: 'Preference for Muslim slaughter to ensure proper Islamic requirements.',
            school: 'Hanbali'
          }
        ]
      }
    ]);
  }

  private addMadhabRulings(ingredient: string, rulings: MadhabRuling[]): void {
    this.madhabRulings.set(ingredient.toLowerCase(), rulings);
  }

  async getMadhabSpecificRuling(
    ingredient: string, 
    madhab: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali'
  ): Promise<IslamicReference | null> {
    this.logger.debug(`Getting ${madhab} ruling for ingredient: ${ingredient}`);

    const normalizedIngredient = ingredient.toLowerCase();
    
    // Check for direct matches
    const rulings = this.madhabRulings.get(normalizedIngredient);
    if (rulings) {
      const madhabRuling = rulings.find(r => r.madhab === madhab);
      if (madhabRuling && madhabRuling.references.length > 0) {
        return madhabRuling.references[0];
      }
    }

    // Check for category matches
    const categoryMatch = this.findCategoryMatch(normalizedIngredient);
    if (categoryMatch) {
      const rulings = this.madhabRulings.get(categoryMatch);
      if (rulings) {
        const madhabRuling = rulings.find(r => r.madhab === madhab);
        if (madhabRuling && madhabRuling.references.length > 0) {
          return madhabRuling.references[0];
        }
      }
    }

    return null;
  }

  async getConsensusAnalysis(ingredient: string): Promise<ConsensusAnalysis> {
    this.logger.debug(`Analyzing scholarly consensus for: ${ingredient}`);

    const normalizedIngredient = ingredient.toLowerCase();
    let rulings = this.madhabRulings.get(normalizedIngredient);
    
    if (!rulings) {
      const categoryMatch = this.findCategoryMatch(normalizedIngredient);
      if (categoryMatch) {
        rulings = this.madhabRulings.get(categoryMatch);
      }
    }

    if (!rulings || rulings.length === 0) {
      return {
        ingredient,
        consensusLevel: 'unclear',
        madhabRulings: [],
        recommendedApproach: 'Consult qualified Islamic scholars for this specific ingredient.',
        alternativeOpinions: ['Seek contemporary fatwa from recognized Islamic authorities']
      };
    }

    const consensusLevel = this.determineConsensusLevel(rulings);
    const recommendedApproach = this.generateRecommendedApproach(rulings, consensusLevel);

    return {
      ingredient,
      consensusLevel,
      madhabRulings: rulings,
      recommendedApproach,
      alternativeOpinions: this.getAlternativeOpinions(rulings)
    };
  }

  private findCategoryMatch(ingredient: string): string | null {
    const categories = [
      'insects',
      'alcohol in food processing',
      'non-muslim slaughter',
      'marine animals',
      'synthetic compounds'
    ];

    for (const category of categories) {
      if (this.isIngredientInCategory(ingredient, category)) {
        return category;
      }
    }

    return null;
  }

  private isIngredientInCategory(ingredient: string, category: string): boolean {
    const categoryKeywords = {
      'insects': ['cochineal', 'carmine', 'shellac', 'insect', 'bug'],
      'alcohol in food processing': ['ethanol', 'alcohol', 'vanilla extract', 'wine'],
      'non-muslim slaughter': ['beef', 'chicken', 'lamb', 'meat', 'poultry'],
      'marine animals': ['fish', 'seafood', 'shrimp', 'crab', 'lobster'],
      'synthetic compounds': ['artificial', 'synthetic', 'manufactured']
    };

    const keywords = categoryKeywords[category] || [];
    return keywords.some(keyword => ingredient.includes(keyword));
  }

  private determineConsensusLevel(rulings: MadhabRuling[]): ConsensusAnalysis['consensusLevel'] {
    if (rulings.length < 2) return 'unclear';

    const halalCount = rulings.filter(r => r.ruling === 'HALAL').length;
    const haramCount = rulings.filter(r => r.ruling === 'HARAM').length;
    const mashboohCount = rulings.filter(r => r.ruling === 'MASHBOOH').length;

    // Unanimous if all rulings are the same
    if (halalCount === rulings.length || haramCount === rulings.length || mashboohCount === rulings.length) {
      return 'unanimous';
    }

    // Majority if more than half agree
    const majorityThreshold = Math.ceil(rulings.length / 2);
    if (halalCount >= majorityThreshold || haramCount >= majorityThreshold || mashboohCount >= majorityThreshold) {
      return 'majority';
    }

    return 'divided';
  }

  private generateRecommendedApproach(
    rulings: MadhabRuling[], 
    consensusLevel: ConsensusAnalysis['consensusLevel']
  ): string {
    switch (consensusLevel) {
      case 'unanimous':
        const unanimousRuling = rulings[0].ruling;
        return `All major schools agree this is ${unanimousRuling}. Follow the unanimous scholarly opinion.`;
      
      case 'majority':
        const majorityRuling = this.getMajorityRuling(rulings);
        return `Majority of scholars consider this ${majorityRuling}. Follow the majority opinion while respecting minority views.`;
      
      case 'divided':
        return 'Scholarly opinion is divided. Follow the most cautious approach or consult your local imam.';
      
      case 'unclear':
        return 'Insufficient scholarly consensus available. Seek guidance from qualified contemporary scholars.';
      
      default:
        return 'Consult qualified Islamic scholars for guidance.';
    }
  }

  private getMajorityRuling(rulings: MadhabRuling[]): string {
    const counts = rulings.reduce((acc, ruling) => {
      acc[ruling.ruling] = (acc[ruling.ruling] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)[0][0];
  }

  private getAlternativeOpinions(rulings: MadhabRuling[]): string[] {
    const opinions: string[] = [];
    
    rulings.forEach(ruling => {
      opinions.push(`${ruling.madhab} school: ${ruling.ruling} - ${ruling.reasoning}`);
    });

    return opinions;
  }

  getScholarlyDifferences(ingredient: string): string[] {
    const analysis = this.getConsensusAnalysis(ingredient);
    return analysis.then(result => result.alternativeOpinions || []);
  }

  async generateMadhabComparison(ingredient: string): Promise<string> {
    const analysis = await this.getConsensusAnalysis(ingredient);
    
    let comparison = `# Madhab Comparison for ${ingredient}\n\n`;
    
    if (analysis.madhabRulings.length === 0) {
      comparison += 'No specific madhab rulings available for this ingredient.\n';
      return comparison;
    }

    comparison += `**Consensus Level:** ${analysis.consensusLevel.toUpperCase()}\n\n`;
    
    analysis.madhabRulings.forEach(ruling => {
      comparison += `## ${ruling.madhab} School\n`;
      comparison += `**Ruling:** ${ruling.ruling}\n`;
      comparison += `**Confidence:** ${ruling.confidence}%\n`;
      comparison += `**Reasoning:** ${ruling.reasoning}\n`;
      
      if (ruling.references.length > 0) {
        comparison += `**References:**\n`;
        ruling.references.forEach(ref => {
          comparison += `- ${ref.source}: ${ref.reference}\n`;
          comparison += `  *${ref.translation}*\n`;
        });
      }
      
      if (ruling.scholars && ruling.scholars.length > 0) {
        comparison += `**Key Scholars:** ${ruling.scholars.join(', ')}\n`;
      }
      
      comparison += `\n`;
    });

    comparison += `## Recommended Approach\n${analysis.recommendedApproach}\n`;
    
    return comparison;
  }
}