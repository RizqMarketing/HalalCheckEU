// Enhanced client profile card with organization-specific information
'use client'

import { useOrganization, useOrganizationText } from '@/contexts/organization-context'

interface ClientProfile {
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
  organizationType?: string
  createdAt?: string
}

interface ClientProfileCardProps {
  client: ClientProfile
  isSelected?: boolean
  onClick?: () => void
  showDetails?: boolean
}

export default function ClientProfileCard({ 
  client, 
  isSelected = false, 
  onClick, 
  showDetails = false 
}: ClientProfileCardProps) {
  const { organizationType } = useOrganization()
  const orgText = useOrganizationText()

  const getClientTypeIcon = () => {
    if (client.organizationType === 'food-manufacturer' || organizationType === 'food-manufacturer') {
      return (
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
      )
    } else if (client.organizationType === 'import-export' || organizationType === 'import-export') {
      return (
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    }
  }

  const formatCategories = (categories?: string[]) => {
    if (!categories || categories.length === 0) return 'Not specified'
    if (categories.length <= 2) return categories.join(', ')
    return `${categories.slice(0, 2).join(', ')} +${categories.length - 2} more`
  }

  return (
    <div 
      className={`p-4 border rounded-xl transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-green-500 bg-green-50' 
          : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        {getClientTypeIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 truncate">{client.name}</h3>
            {isSelected && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          
          <p className="text-sm text-slate-600 truncate">{client.company}</p>
          
          {client.role && (
            <p className="text-xs text-slate-500 truncate">{client.role}</p>
          )}
          
          <div className="flex items-center space-x-4 text-xs text-slate-500 mt-2">
            <span>{client.email}</span>
            {client.phone && <span>{client.phone}</span>}
          </div>

          {showDetails && (
            <div className="mt-4 space-y-3 pt-3 border-t border-slate-200">
              {/* Organization-specific details */}
              {organizationType === 'food-manufacturer' && (
                <>
                  {client.department && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Department:</span>
                      <span className="font-medium text-slate-900">{client.department}</span>
                    </div>
                  )}
                  
                  {client.companySize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Company Size:</span>
                      <span className="font-medium text-slate-900">{client.companySize}</span>
                    </div>
                  )}
                  
                  {client.productCategories && client.productCategories.length > 0 && (
                    <div className="text-sm">
                      <span className="text-slate-600">Product Categories:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {client.productCategories.slice(0, 3).map((category, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                            {category}
                          </span>
                        ))}
                        {client.productCategories.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                            +{client.productCategories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {organizationType === 'certification-body' && (
                <>
                  {client.department && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Department:</span>
                      <span className="font-medium text-slate-900">{client.department}</span>
                    </div>
                  )}
                  
                  {client.certificationNeeds && client.certificationNeeds.length > 0 && (
                    <div className="text-sm">
                      <span className="text-slate-600">Certification Needs:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {client.certificationNeeds.slice(0, 2).map((need, index) => (
                          <span key={index} className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded-md">
                            {need}
                          </span>
                        ))}
                        {client.certificationNeeds.length > 2 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                            +{client.certificationNeeds.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {organizationType === 'import-export' && (
                <>
                  {client.department && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Department:</span>
                      <span className="font-medium text-slate-900">{client.department}</span>
                    </div>
                  )}
                  
                  {client.productCategories && client.productCategories.length > 0 && (
                    <div className="text-sm">
                      <span className="text-slate-600">Trade Categories:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {client.productCategories.slice(0, 3).map((category, index) => (
                          <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-md">
                            {category}
                          </span>
                        ))}
                        {client.productCategories.length > 3 && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                            +{client.productCategories.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {client.country && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Location:</span>
                  <span className="font-medium text-slate-900">{client.country}</span>
                </div>
              )}

              {client.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Added:</span>
                  <span className="font-medium text-slate-900">
                    {new Date(client.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Compact version for dropdowns
export function ClientProfileOption({ client, isSelected = false }: { 
  client: ClientProfile
  isSelected?: boolean 
}) {
  const { organizationType } = useOrganization()

  const getOrgBadge = () => {
    const clientOrgType = client.organizationType || organizationType
    
    switch (clientOrgType) {
      case 'food-manufacturer':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">Manufacturer</span>
      case 'import-export':
        return <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Trader</span>
      default:
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded">Certifier</span>
    }
  }

  return (
    <div className={`flex items-center justify-between p-3 hover:bg-green-50 transition-colors ${
      isSelected ? 'bg-green-50 border-l-4 border-green-500' : ''
    }`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="font-medium text-slate-900 truncate">{client.name}</p>
          {getOrgBadge()}
        </div>
        <p className="text-sm text-slate-600 truncate">{client.company}</p>
        {client.role && (
          <p className="text-xs text-slate-500 truncate">{client.role}</p>
        )}
        {client.productCategories && client.productCategories.length > 0 && (
          <p className="text-xs text-slate-500 truncate">
            {formatCategories(client.productCategories)}
          </p>
        )}
      </div>
      
      {isSelected && (
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ml-2">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  )
}