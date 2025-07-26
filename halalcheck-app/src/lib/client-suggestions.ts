// Smart client suggestions based on organization type and context
import { OrganizationType } from './organization-context'

export interface ClientSuggestion {
  name: string
  company: string
  email: string
  phone?: string
  country?: string
  department?: string
  role?: string
  productCategories?: string[]
  companySize?: string
  certificationNeeds?: string[]
  reason: string
  priority: 'high' | 'medium' | 'low'
}

export class ClientSuggestionsEngine {
  private static instance: ClientSuggestionsEngine
  
  static getInstance(): ClientSuggestionsEngine {
    if (!ClientSuggestionsEngine.instance) {
      ClientSuggestionsEngine.instance = new ClientSuggestionsEngine()
    }
    return ClientSuggestionsEngine.instance
  }

  // Generate smart client suggestions based on analysis context
  generateSuggestions(
    organizationType: OrganizationType,
    analysisResult?: any,
    productName?: string,
    existingClients: any[] = []
  ): ClientSuggestion[] {
    const suggestions: ClientSuggestion[] = []

    // Add organization-specific template suggestions
    suggestions.push(...this.getTemplateSuggestions(organizationType))

    // Add context-aware suggestions based on analysis
    if (analysisResult) {
      suggestions.push(...this.getAnalysisBasedSuggestions(organizationType, analysisResult, productName))
    }

    // Filter out existing clients and sort by priority
    const existingEmails = new Set(existingClients.map(client => client.email.toLowerCase()))
    const filteredSuggestions = suggestions
      .filter(suggestion => !existingEmails.has(suggestion.email.toLowerCase()))
      .sort((a, b) => this.getPriorityScore(b.priority) - this.getPriorityScore(a.priority))

    return filteredSuggestions.slice(0, 5) // Return top 5 suggestions
  }

  private getTemplateSuggestions(organizationType: OrganizationType): ClientSuggestion[] {
    switch (organizationType) {
      case 'food-manufacturer':
        return [
          {
            name: 'Sarah Johnson',
            company: 'Pure Foods Manufacturing',
            email: 'sarah.johnson@purefoods.com',
            phone: '+31 20 456 7890',
            country: 'Netherlands',
            department: 'R&D',
            role: 'Product Development Manager',
            productCategories: ['Snacks & Confectionery', 'Baked Goods'],
            companySize: 'Medium',
            reason: 'Typical manufacturer profile for snack development',
            priority: 'high'
          },
          {
            name: 'Ahmed Al-Rashid',
            company: 'Halal Innovations BV',
            email: 'ahmed@halalinnovations.nl',
            phone: '+31 20 567 8901',
            country: 'Netherlands',
            department: 'Quality Assurance',
            role: 'QA Director',
            productCategories: ['Meat Products', 'Frozen Foods'],
            companySize: 'Large',
            reason: 'Experienced in halal product development',
            priority: 'high'
          },
          {
            name: 'Maria Santos',
            company: 'European Dairy Solutions',
            email: 'maria.santos@eurodairy.eu',
            phone: '+49 30 123 4567',
            country: 'Germany',
            department: 'Regulatory Affairs',
            role: 'Compliance Manager',
            productCategories: ['Dairy Products', 'Beverages'],
            companySize: 'Enterprise',
            reason: 'Specializes in dairy compliance and certification',
            priority: 'medium'
          }
        ]

      case 'certification-body':
        return [
          {
            name: 'Dr. Mohammad Hassan',
            company: 'Netherlands Halal Council',
            email: 'mohammad.hassan@nhc.nl',
            phone: '+31 20 234 5678',
            country: 'Netherlands',
            department: 'Operations',
            role: 'Senior Certification Officer',
            certificationNeeds: ['Product Certification', 'Facility Certification'],
            reason: 'Senior halal certification professional',
            priority: 'high'
          },
          {
            name: 'Fatima Al-Zahra',
            company: 'European Islamic Certification',
            email: 'fatima@eic-halal.org',
            phone: '+32 2 345 6789',
            country: 'Belgium',
            department: 'Quality Control',
            role: 'Lead Auditor',
            certificationNeeds: ['Audit Support', 'Supply Chain Verification'],
            reason: 'Experienced in halal audit processes',
            priority: 'high'
          },
          {
            name: 'Ibrahim Osman',
            company: 'Global Halal Certification GmbH',
            email: 'ibrahim.osman@ghc.de',
            phone: '+49 40 456 7890',
            country: 'Germany',
            department: 'Management',
            role: 'Regional Director',
            certificationNeeds: ['Export Documentation', 'Renewal Services'],
            reason: 'Handles international halal certification',
            priority: 'medium'
          }
        ]

      case 'import-export':
        return [
          {
            name: 'Yuki Tanaka',
            company: 'Asia-Europe Food Trading',
            email: 'yuki.tanaka@aeft.com',
            phone: '+31 10 567 8901',
            country: 'Netherlands',
            department: 'Import Operations',
            role: 'Import Manager',
            productCategories: ['Food Import', 'Halal Ingredients'],
            reason: 'Manages halal food imports from Asia',
            priority: 'high'
          },
          {
            name: 'Hassan Al-Mahmoud',
            company: 'Middle East Trading Partners',
            email: 'hassan@metp.ae',
            phone: '+971 4 123 4567',
            country: 'UAE',
            department: 'Export Operations',
            role: 'Trade Compliance Director',
            productCategories: ['Food Export', 'Raw Materials'],
            reason: 'Expert in Middle East halal trade compliance',
            priority: 'high'
          },
          {
            name: 'Elena Petrov',
            company: 'European Halal Logistics',
            email: 'elena.petrov@ehl.eu',
            phone: '+33 1 234 5678',
            country: 'France',
            department: 'Compliance',
            role: 'Regulatory Affairs Manager',
            productCategories: ['Processed Foods', 'Consumer Goods'],
            reason: 'Specializes in EU halal import regulations',
            priority: 'medium'
          }
        ]

      default:
        return []
    }
  }

  private getAnalysisBasedSuggestions(
    organizationType: OrganizationType,
    analysisResult: any,
    productName?: string
  ): ClientSuggestion[] {
    const suggestions: ClientSuggestion[] = []

    // Determine product category from analysis
    const productCategory = this.inferProductCategory(analysisResult, productName)
    
    // Get category-specific suggestions
    if (productCategory) {
      suggestions.push(...this.getCategorySpecificSuggestions(organizationType, productCategory))
    }

    // Add compliance-level specific suggestions
    const complianceLevel = this.getComplianceLevel(analysisResult)
    suggestions.push(...this.getComplianceLevelSuggestions(organizationType, complianceLevel))

    return suggestions
  }

  private inferProductCategory(analysisResult: any, productName?: string): string | null {
    const productLower = (productName || '').toLowerCase()
    const ingredients = analysisResult?.ingredients || []
    
    // Analyze product name
    if (productLower.includes('meat') || productLower.includes('beef') || productLower.includes('chicken')) {
      return 'Meat Products'
    } else if (productLower.includes('dairy') || productLower.includes('milk') || productLower.includes('cheese')) {
      return 'Dairy Products'
    } else if (productLower.includes('bread') || productLower.includes('cake') || productLower.includes('bakery')) {
      return 'Baked Goods'
    } else if (productLower.includes('drink') || productLower.includes('juice') || productLower.includes('beverage')) {
      return 'Beverages'
    } else if (productLower.includes('snack') || productLower.includes('candy') || productLower.includes('chocolate')) {
      return 'Snacks & Confectionery'
    }

    // Analyze ingredients
    const ingredientNames = ingredients.map((ing: any) => (ing.name || ing.ingredient || '').toLowerCase()).join(' ')
    
    if (ingredientNames.includes('milk') || ingredientNames.includes('cream') || ingredientNames.includes('butter')) {
      return 'Dairy Products'
    } else if (ingredientNames.includes('flour') || ingredientNames.includes('yeast') || ingredientNames.includes('wheat')) {
      return 'Baked Goods'
    } else if (ingredientNames.includes('sugar') || ingredientNames.includes('cocoa') || ingredientNames.includes('vanilla')) {
      return 'Snacks & Confectionery'
    }

    return null
  }

  private getComplianceLevel(analysisResult: any): 'high' | 'medium' | 'low' {
    const overall = (analysisResult?.overall || '').toUpperCase()
    const ingredients = analysisResult?.ingredients || []
    
    if (overall === 'APPROVED') {
      return 'high'
    } else if (overall === 'PROHIBITED') {
      return 'low'
    } else {
      // Check ingredient risk levels
      const problematicCount = ingredients.filter((ing: any) => 
        (ing.status || '').toUpperCase() === 'PROHIBITED'
      ).length
      
      return problematicCount > 0 ? 'low' : 'medium'
    }
  }

  private getCategorySpecificSuggestions(organizationType: OrganizationType, category: string): ClientSuggestion[] {
    const suggestions: ClientSuggestion[] = []

    if (organizationType === 'food-manufacturer') {
      switch (category) {
        case 'Meat Products':
          suggestions.push({
            name: 'Omar Al-Halabi',
            company: 'Halal Meat Processing Ltd',
            email: 'omar@halalmeat.eu',
            phone: '+31 20 111 2222',
            country: 'Netherlands',
            department: 'Production',
            role: 'Production Manager',
            productCategories: ['Meat Products'],
            companySize: 'Large',
            reason: 'Specializes in halal meat product development',
            priority: 'high'
          })
          break
        case 'Dairy Products':
          suggestions.push({
            name: 'Anna Kowalski',
            company: 'European Dairy Innovations',
            email: 'anna.kowalski@edi.pl',
            phone: '+48 22 333 4444',
            country: 'Poland',
            department: 'R&D',
            role: 'Dairy Technologist',
            productCategories: ['Dairy Products'],
            companySize: 'Medium',
            reason: 'Expert in halal dairy formulations',
            priority: 'high'
          })
          break
      }
    }

    return suggestions
  }

  private getComplianceLevelSuggestions(organizationType: OrganizationType, level: 'high' | 'medium' | 'low'): ClientSuggestion[] {
    const suggestions: ClientSuggestion[] = []

    if (level === 'low' && organizationType === 'food-manufacturer') {
      // Suggest clients who can help with problematic formulations
      suggestions.push({
        name: 'Dr. Khalid Rahman',
        company: 'Halal Solutions Consulting',
        email: 'khalid.rahman@halalsolutions.com',
        phone: '+31 20 555 6666',
        country: 'Netherlands',
        department: 'R&D',
        role: 'Halal Compliance Consultant',
        productCategories: ['Consultation', 'Formulation Review'],
        companySize: 'Small',
        reason: 'Specializes in resolving complex halal compliance issues',
        priority: 'high'
      })
    }

    return suggestions
  }

  private getPriorityScore(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 0
    }
  }

  // Get quick client creation templates
  getQuickTemplates(organizationType: OrganizationType): Partial<ClientSuggestion>[] {
    const base = [
      {
        name: '',
        company: '',
        email: '',
        phone: '',
        country: 'Netherlands'
      }
    ]

    switch (organizationType) {
      case 'food-manufacturer':
        return [
          {
            ...base[0],
            department: 'R&D',
            role: 'Product Development Manager',
            productCategories: ['Snacks & Confectionery'],
            companySize: 'Medium'
          },
          {
            ...base[0],
            department: 'Quality Assurance',
            role: 'QA Manager',
            productCategories: ['Meat Products'],
            companySize: 'Large'
          }
        ]

      case 'certification-body':
        return [
          {
            ...base[0],
            department: 'Operations',
            role: 'Certification Officer',
            certificationNeeds: ['Product Certification']
          },
          {
            ...base[0],
            department: 'Quality Control',
            role: 'Senior Auditor',
            certificationNeeds: ['Facility Certification', 'Audit Support']
          }
        ]

      case 'import-export':
        return [
          {
            ...base[0],
            department: 'Import Operations',
            role: 'Import Manager',
            productCategories: ['Food Import']
          },
          {
            ...base[0],
            department: 'Compliance',
            role: 'Trade Compliance Manager',
            productCategories: ['Food Export']
          }
        ]

      default:
        return base
    }
  }
}

export const clientSuggestionsEngine = ClientSuggestionsEngine.getInstance()