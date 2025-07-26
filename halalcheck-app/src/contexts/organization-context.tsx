'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  OrganizationType, 
  OrganizationContextData,
  getOrganizationConfig,
  DEFAULT_ORGANIZATION_TYPE,
  mapRegistrationTypeToOrganization
} from '@/lib/organization-context'

interface OrganizationContextValue extends OrganizationContextData {
  setOrganizationType: (type: OrganizationType) => void
  isLoading: boolean
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined)

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const [organizationType, setOrganizationTypeState] = useState<OrganizationType>(DEFAULT_ORGANIZATION_TYPE)
  const [isLoading, setIsLoading] = useState(true)

  // Enhanced setOrganizationType that updates localStorage and DataManager
  const setOrganizationType = (newType: OrganizationType) => {
    console.log('OrganizationContext: Setting organization type from', organizationType, 'to:', newType)
    
    // Update state first
    setOrganizationTypeState(newType)
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user-organization-type', newType)
      console.log('OrganizationContext: Saved to localStorage:', newType)
    }
    
    // Update DataManager if available (using dynamic import to avoid SSR issues)
    if (typeof window !== 'undefined') {
      import('@/lib/data-manager').then(({ dataManager }) => {
        dataManager.setOrganizationType(newType)
        console.log('OrganizationContext: Updated DataManager to:', newType)
      }).catch(error => {
        console.warn('Could not update DataManager:', error)
      })
    }
  }

  // Load organization type from localStorage or user profile
  useEffect(() => {
    const loadOrganizationType = async () => {
      try {
        // First try to get from localStorage (for demo purposes)
        const storedType = localStorage.getItem('user-organization-type')
        if (storedType && isValidOrganizationType(storedType)) {
          setOrganizationTypeState(storedType as OrganizationType)
          setIsLoading(false)
          return
        }

        // Set timeout for API calls to prevent hanging
        const timeoutId = setTimeout(() => {
          console.warn('Organization type loading timeout, using default')
          setOrganizationTypeState(DEFAULT_ORGANIZATION_TYPE)
          setIsLoading(false)
        }, 1000) // 1 second timeout (reduced)

        // Skip API calls for development - use localStorage only

        // Clear timeout and set default
        clearTimeout(timeoutId)
        setOrganizationTypeState(DEFAULT_ORGANIZATION_TYPE)
        setIsLoading(false)
      } catch (error) {
        console.error('Error loading organization type:', error)
        setOrganizationTypeState(DEFAULT_ORGANIZATION_TYPE)
        setIsLoading(false)
      }
    }

    loadOrganizationType()
  }, [])

  // Save organization type to localStorage when it changes
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('user-organization-type', organizationType)
    }
  }, [organizationType, isLoading])

  // Debug: Log organization type changes
  useEffect(() => {
    console.log('OrganizationContext: organizationType changed to:', organizationType)
  }, [organizationType])

  const config = getOrganizationConfig(organizationType)

  const contextValue: OrganizationContextValue = {
    organizationType,
    config,
    terminology: config.terminology,
    stages: config.stages,
    features: config.features,
    setOrganizationType,
    isLoading
  }

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

// Helper function for type validation
function isValidOrganizationType(type: string): boolean {
  return ['certification-body', 'food-manufacturer'].includes(type)
}

// Hook for getting organization-specific text
export function useOrganizationText() {
  const { terminology } = useOrganization()
  
  return {
    // Common text helpers
    getItemName: (singular: boolean = true) => 
      singular ? terminology.itemName : terminology.itemNamePlural,
    
    getClientName: (singular: boolean = true) => 
      singular ? terminology.clientName : terminology.clientNamePlural,
    
    getPipelineName: () => terminology.pipelineName,
    getWorkflowName: () => terminology.workflowName,
    getDocumentName: () => terminology.documentName,
    getDocumentAction: () => terminology.documentAction,
    
    // Action text helpers
    getCreateAction: () => terminology.createAction,
    getProcessAction: () => terminology.processAction,
    getCompleteAction: () => terminology.completeAction,
    
    // Status description helper
    getStatusDescription: (status: string) => 
      terminology.statusDescriptions[status] || `${terminology.itemName} status: ${status}`,
    
    // Analysis page description helper
    getAnalysisPageDescription: () => {
      const { organizationType } = useOrganization()
      const descriptions = {
        'certification-body': 'Analyze ingredients for halal certification compliance using advanced AI technology',
        'food-manufacturer': 'Validate product ingredients for halal compliance during development'
      }
      return descriptions[organizationType] || descriptions['certification-body']
    },

    // Documentation text helper
    getDocumentationText: (type: 'required' | 'complete' | 'upload') => {
      const { organizationType } = useOrganization()
      const documentationTexts = {
        'certification-body': {
          required: 'Verification Required',
          complete: 'Documentation Complete',
          upload: 'Upload verified halal documentation: certificates, supplier letters, lab reports'
        },
        'food-manufacturer': {
          required: 'Compliance Documentation Required',
          complete: 'Compliance Documentation Complete',
          upload: 'Upload compliance documentation: certificates, lab reports, supplier attestations'
        }
      }
      return documentationTexts[organizationType][type] || documentationTexts['certification-body'][type]
    }
  }
}

// Hook for organization-specific features
export function useOrganizationFeatures() {
  const { features } = useOrganization()
  return features
}

// Hook for organization-specific styling
export function useOrganizationStyling() {
  const { config } = useOrganization()
  
  const getColorClasses = () => {
    const colorMap: Record<string, { 
      primary: string
      secondary: string
      text: string
      bg: string
      border: string
      hover: string
    }> = {
      emerald: {
        primary: 'bg-emerald-600 hover:bg-emerald-700',
        secondary: 'bg-emerald-100 text-emerald-800',
        text: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        hover: 'hover:bg-emerald-50'
      },
      blue: {
        primary: 'bg-blue-600 hover:bg-blue-700',
        secondary: 'bg-blue-100 text-blue-800',
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-50'
      },
      indigo: {
        primary: 'bg-indigo-600 hover:bg-indigo-700',
        secondary: 'bg-indigo-100 text-indigo-800',
        text: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        hover: 'hover:bg-indigo-50'
      }
    }
    
    return colorMap[config.color] || colorMap.emerald
  }
  
  return {
    colors: getColorClasses(),
    icon: config.icon
  }
}