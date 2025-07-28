/**
 * GPT-4 Powered Islamic Analysis Interface
 * 
 * This module provides interfaces for AI-powered Islamic ingredient analysis
 * without relying on static databases. All analysis is performed by intelligent
 * agents with comprehensive Islamic jurisprudence knowledge.
 */

export interface IslamicReference {
  source: 'Quran' | 'Hadith' | 'Scholarly_Consensus' | 'Contemporary_Fatwa'
  reference: string
  arabic?: string
  transliteration?: string
  translation: string
  school?: 'Hanafi' | 'Maliki' | 'Shafi' | 'Hanbali' | 'General'
}

export interface IngredientClassification {
  name: string
  status: 'HALAL' | 'HARAM' | 'MASHBOOH'
  category: string
  confidence: number
  reasoning: string
  islamicReferences: IslamicReference[]
  alternativeSuggestions?: string[]
  requiresVerification?: boolean
}

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

// GPT-4 Analysis Functions (interfaces for AI analysis)
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

// Enhanced Analysis with AI Context
export function enhanceAnalysisWithAIContext(ingredient: any) {
  return {
    ...ingredient,
    analysisMode: 'GPT4_INTELLIGENT',
    disclaimer: 'Analysis powered by advanced AI with Islamic jurisprudence knowledge. For critical decisions, consult qualified Islamic scholars.'
  }
}

export default {
  ISLAMIC_TERMS,
  formatIslamicReference,
  enhanceAnalysisWithAIContext
}