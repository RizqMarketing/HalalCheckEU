/**
 * HalalCheck EU - Halal Classification Types
 * 
 * CRITICAL: These types define religious compliance classifications.
 * Any changes must be reviewed by Islamic scholars and certified halal experts.
 */

export enum HalalStatus {
  HALAL = 'HALAL',
  HARAM = 'HARAM',
  MASHBOOH = 'MASHBOOH', // Doubtful/Uncertain
  UNCERTAIN = 'UNCERTAIN', // Cannot determine
  REQUIRES_REVIEW = 'REQUIRES_REVIEW'
}

export enum IngredientCategory {
  MEAT = 'MEAT',
  DAIRY = 'DAIRY',
  PLANT = 'PLANT',
  ADDITIVE = 'ADDITIVE',
  EMULSIFIER = 'EMULSIFIER',
  PRESERVATIVE = 'PRESERVATIVE',
  FLAVORING = 'FLAVORING',
  COLORING = 'COLORING',
  VITAMIN = 'VITAMIN',
  ENZYME = 'ENZYME',
  ALCOHOL = 'ALCOHOL',
  GELATIN = 'GELATIN',
  OTHER = 'OTHER'
}

export enum CertificationStandard {
  JAKIM = 'JAKIM', // Malaysia - Gold Standard
  MUI = 'MUI', // Indonesia
  HFCE = 'HFCE', // Europe
  HQC = 'HQC', // Netherlands
  HIC = 'HIC', // Netherlands
  ISWA = 'ISWA', // UK
  CUSTOM = 'CUSTOM'
}

export enum RiskLevel {
  VERY_LOW = 'VERY_LOW', // 0-5%
  LOW = 'LOW', // 5-15%
  MEDIUM = 'MEDIUM', // 15-30%
  HIGH = 'HIGH', // 30-70%
  VERY_HIGH = 'VERY_HIGH' // 70%+
}

export interface IngredientSource {
  name: string;
  type: 'ANIMAL' | 'PLANT' | 'SYNTHETIC' | 'MINERAL' | 'MICROBIAL';
  animalType?: 'BEEF' | 'PORK' | 'CHICKEN' | 'FISH' | 'INSECT' | 'OTHER';
  isHalal: boolean;
  certificationRequired: boolean;
  notes?: string;
}

export interface RegionalVariation {
  region: 'EU' | 'NETHERLANDS' | 'BELGIUM' | 'FRANCE' | 'GERMANY' | 'UK';
  status: HalalStatus;
  standard: CertificationStandard;
  reasoning: string;
  lastReviewed: Date;
  reviewedBy: string;
}

export interface Ingredient {
  id: string;
  name: string;
  eNumber?: string; // EU E-numbers
  casNumber?: string; // Chemical Abstract Service number
  category: IngredientCategory;
  
  // Default classification
  defaultStatus: HalalStatus;
  riskLevel: RiskLevel;
  
  // Possible sources and their halal status
  sources: IngredientSource[];
  
  // Regional variations in interpretation
  regionalVariations: RegionalVariation[];
  
  // Detailed analysis
  description: string;
  commonUses: string[];
  alternativeNames: string[];
  
  // Cross-contamination risks
  crossContaminationRisk: boolean;
  crossContaminationNotes?: string;
  
  // Certification requirements
  requiresCertificate: boolean;
  certificateTypes: string[];
  
  // Expert review requirements
  requiresExpertReview: boolean;
  expertReviewReason?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt: Date;
  reviewedBy: string;
  version: number;
  
  // Verification sources
  sources_references: string[];
  islamicRulings: string[];
  
  // Multi-language support
  translations: {
    [languageCode: string]: {
      name: string;
      description: string;
      notes?: string;
    };
  };
}

export interface AnalysisResult {
  ingredientId: string;
  ingredient: Ingredient;
  detectedName: string;
  confidence: number; // 0-1
  status: HalalStatus;
  riskLevel: RiskLevel;
  reasoning: string;
  requiresExpertReview: boolean;
  warnings: string[];
  suggestions: string[];
}

export interface AnalysisRequest {
  productName: string;
  ingredientText: string;
  language: string;
  region: string;
  certificationStandard: string;
  userId: string;
  organizationId: string;
}

export interface IngredientAnalysis {
  detectedName: string;
  standardName: string;
  status: HalalStatus;
  riskLevel: RiskLevel;
  confidence: number; // 0-1
  reasoning: string;
  requiresExpertReview: boolean;
  warnings: string[];
  suggestions: string[];
  source: 'database' | 'ai' | 'fallback';
  eNumbers: string[];
  categories: string[];
}

export interface ProductAnalysis {
  id: string;
  productName: string;
  ingredientText: string;
  language: string;
  region: string;
  certificationStandard: string;
  
  // Overall assessment
  overallStatus: HalalStatus;
  overallRiskLevel: RiskLevel;
  
  // Individual ingredient results
  ingredients: IngredientAnalysis[];
  
  // Summary
  summary: {
    total_ingredients: number;
    halal_count: number;
    haram_count: number;
    mashbooh_count: number;
    uncertain_count: number;
  };
  
  // Critical findings
  haram_ingredients: IngredientAnalysis[];
  mashbooh_ingredients: IngredientAnalysis[];
  requires_expert_review: IngredientAnalysis[];
  
  // Recommendations
  recommendations: string[];
  expertReviewRequired: boolean;
  
  // Metadata
  userId: string;
  organizationId: string;
  analyzedAt: Date;
  processingTimeMs: number;
}

export interface CertificationReport {
  id: string;
  productAnalysis: ProductAnalysis;
  certificationStandard: CertificationStandard;
  certifierName: string;
  
  // Final decision
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  certificateNumber?: string;
  
  // Legal disclaimers and notes
  disclaimers: string[];
  expertNotes?: string;
  
  // Validity
  validFrom?: Date;
  validUntil?: Date;
  
  createdAt: Date;
}

// Validation schemas using Zod will be in separate file
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}