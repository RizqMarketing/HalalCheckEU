// Organization Context and Terminology Management
// This file manages organization-specific UI, workflows, and terminology

export type OrganizationType = 'certification-body' | 'food-manufacturer'

export interface OrganizationConfig {
  type: OrganizationType
  name: string
  description: string
  icon: string
  color: string
  dashboardTitle: string
  pipelineTitle: string
  stages: PipelineStage[]
  terminology: Terminology
  features: OrganizationFeatures
}

export interface PipelineStage {
  id: string
  title: string
  description: string
  color: string
  icon: string
  isDefault: boolean
  order: number
}

export interface Terminology {
  // Main entity names
  itemName: string // "Application" | "Product" | "Shipment"
  itemNamePlural: string // "Applications" | "Products" | "Shipments"
  
  // Pipeline terms
  pipelineName: string // "Application Pipeline" | "Product Development" | "Compliance Pipeline"
  workflowName: string // "Certification Workflow" | "Development Workflow" | "Compliance Workflow"
  
  // Actions
  createAction: string // "New Application" | "New Product" | "New Shipment"
  processAction: string // "Process Application" | "Develop Product" | "Process Shipment"
  completeAction: string // "Issue Certificate" | "Production Ready" | "Customs Approved"
  
  // Documents
  documentName: string // "Certificate" | "Pre-Certification Report" | "Compliance Certificate"
  documentAction: string // "Issue Certificate" | "Generate Report" | "Issue Certificate"
  
  // Status descriptions
  statusDescriptions: Record<string, string>
  
  // Client/Customer terminology
  clientName: string // "Client" | "Customer" | "Vendor"
  clientNamePlural: string // "Clients" | "Customers" | "Vendors"
}

export interface OrganizationFeatures {
  hasCertificates: boolean
  hasReports: boolean
  allowsCustomStages: boolean
  showsComplianceInfo: boolean
  enablesBulkProcessing: boolean
  supportsAuditTrail: boolean
}

// Organization Configurations
export const ORGANIZATION_CONFIGS: Record<OrganizationType, OrganizationConfig> = {
  'certification-body': {
    type: 'certification-body',
    name: 'Halal Certification Body',
    description: 'Issue official halal certificates and manage certification processes',
    icon: '🏛️',
    color: 'emerald',
    dashboardTitle: 'Certification Dashboard',
    pipelineTitle: 'Application Pipeline',
    stages: [
      {
        id: 'new',
        title: 'New Applications',
        description: 'Recently submitted certification applications',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 1
      },
      {
        id: 'reviewing',
        title: 'Under Review',
        description: 'Applications being processed by auditors',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 2
      },
      {
        id: 'approved',
        title: 'Approved',
        description: 'Applications approved for certification',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 3
      },
      {
        id: 'certified',
        title: 'Certified',
        description: 'Official certificates issued',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 4
      }
    ],
    terminology: {
      itemName: 'Application',
      itemNamePlural: 'Applications',
      pipelineName: 'Application Pipeline',
      workflowName: 'Certification Workflow',
      createAction: 'New Application',
      processAction: 'Process Application',
      completeAction: 'Issue Certificate',
      documentName: 'Halal Certificate',
      documentAction: 'Issue Certificate',
      clientName: 'Client',
      clientNamePlural: 'Clients',
      statusDescriptions: {
        new: 'Newly submitted certification applications awaiting initial review',
        reviewing: 'Applications under review by certification auditors',
        approved: 'Applications approved and ready for certificate issuance',
        certified: 'Applications with officially issued halal certificates',
        rejected: 'Applications that did not meet certification requirements'
      }
    },
    features: {
      hasCertificates: true,
      hasReports: true,
      allowsCustomStages: true,
      showsComplianceInfo: true,
      enablesBulkProcessing: true,
      supportsAuditTrail: true
    }
  },

  'food-manufacturer': {
    type: 'food-manufacturer',
    name: 'Food Manufacturer',
    description: 'Develop halal products and prepare for certification',
    icon: '🏭',
    color: 'blue',
    dashboardTitle: 'Product Development Dashboard',
    pipelineTitle: 'Product Development Pipeline',
    stages: [
      {
        id: 'recipe',
        title: 'Recipe Development',
        description: 'Initial product formulation and ingredient selection',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 1
      },
      {
        id: 'testing',
        title: 'Testing & Validation',
        description: 'Product testing and halal compliance validation',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 2
      },
      {
        id: 'documentation',
        title: 'Documentation Complete',
        description: 'All required documentation prepared',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 3
      },
      {
        id: 'certification-ready',
        title: 'Certification Ready',
        description: 'Ready for submission to certification body',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: '<svg>...</svg>',
        isDefault: true,
        order: 4
      }
    ],
    terminology: {
      itemName: 'Product',
      itemNamePlural: 'Products',
      pipelineName: 'Product Development Pipeline',
      workflowName: 'Development Workflow',
      createAction: 'New Product',
      processAction: 'Develop Product',
      completeAction: 'Ready for Certification',
      documentName: 'Pre-Certification Report',
      documentAction: 'Generate Report',
      clientName: 'Customer',
      clientNamePlural: 'Customers',
      statusDescriptions: {
        recipe: 'Initial product formulation and ingredient selection phase',
        testing: 'Product testing and halal compliance validation in progress',
        documentation: 'All required documentation and supplier certificates prepared',
        'certification-ready': 'Product ready for submission to halal certification body',
        rejected: 'Product formulation requires modifications for halal compliance'
      }
    },
    features: {
      hasCertificates: false,
      hasReports: true,
      allowsCustomStages: true,
      showsComplianceInfo: true,
      enablesBulkProcessing: true,
      supportsAuditTrail: false
    }
  }
}

// Helper Functions
export function getOrganizationConfig(type: OrganizationType): OrganizationConfig {
  return ORGANIZATION_CONFIGS[type]
}

export function getTerminology(type: OrganizationType): Terminology {
  return ORGANIZATION_CONFIGS[type].terminology
}

export function getPipelineStages(type: OrganizationType): PipelineStage[] {
  return ORGANIZATION_CONFIGS[type].stages
}

export function getOrganizationFeatures(type: OrganizationType): OrganizationFeatures {
  return ORGANIZATION_CONFIGS[type].features
}

// Organization Context Hook Data
export interface OrganizationContextData {
  organizationType: OrganizationType
  config: OrganizationConfig
  terminology: Terminology
  stages: PipelineStage[]
  features: OrganizationFeatures
}

// Default organization type (for new users)
export const DEFAULT_ORGANIZATION_TYPE: OrganizationType = 'certification-body'

// Organization type mapping for registration form
export const REGISTRATION_ORGANIZATION_MAPPING: Record<string, OrganizationType> = {
  'certification_body': 'certification-body',
  'food_manufacturer': 'food-manufacturer',
  'restaurant': 'food-manufacturer', // Maps to manufacturer workflow
  'consultant': 'certification-body', // Maps to certification workflow
  'other': 'certification-body' // Default fallback
}

// Validation functions
export function isValidOrganizationType(type: string): type is OrganizationType {
  return Object.keys(ORGANIZATION_CONFIGS).includes(type as OrganizationType)
}

export function mapRegistrationTypeToOrganization(registrationType: string): OrganizationType {
  return REGISTRATION_ORGANIZATION_MAPPING[registrationType] || DEFAULT_ORGANIZATION_TYPE
}

// Color utility functions
export function getColorClasses(colorName: string) {
  const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
    emerald: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      hover: 'hover:bg-emerald-50'
    },
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:bg-blue-50'
    },
    indigo: {
      bg: 'bg-indigo-500',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      hover: 'hover:bg-indigo-50'
    }
  }
  
  return colorMap[colorName] || colorMap.emerald
}