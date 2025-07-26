'use client'

import { useState } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { OrganizationType, ORGANIZATION_CONFIGS } from '@/lib/organization-context'

export default function DevelopmentOrgSwitcher() {
  const { organizationType, setOrganizationType } = useOrganization()
  const [isOpen, setIsOpen] = useState(false)

  console.log('DevelopmentOrgSwitcher - Current org type:', organizationType)
  console.log('DevelopmentOrgSwitcher - setOrganizationType function:', typeof setOrganizationType)

  // Always show for development/testing (remove NODE_ENV check for now)
  // if (process.env.NODE_ENV !== 'development') {
  //   return null
  // }

  const organizations: { type: OrganizationType; label: string; icon: string; color: string }[] = [
    {
      type: 'certification-body',
      label: 'Halal Certification Body',
      icon: '🏛️',
      color: 'bg-emerald-500'
    },
    {
      type: 'food-manufacturer',
      label: 'Food Manufacturer',
      icon: '🏭',
      color: 'bg-blue-500'
    }
  ]

  const currentOrg = organizations.find(org => org.type === organizationType)

  const handleSwitch = (newType: OrganizationType) => {
    console.log('=== HANDLE SWITCH CALLED ===')
    console.log('DevelopmentOrgSwitcher: Switching from', organizationType, 'to:', newType)
    console.log('setOrganizationType type:', typeof setOrganizationType)
    console.log('setOrganizationType function:', setOrganizationType)
    
    // Prevent switching to the same type
    if (newType === organizationType) {
      console.log('DevelopmentOrgSwitcher: Already on this organization type')
      setIsOpen(false)
      return
    }
    
    try {
      console.log('About to call setOrganizationType with:', newType)
      setOrganizationType(newType)
      console.log('DevelopmentOrgSwitcher: setOrganizationType called successfully')
      setIsOpen(false)
      
      // Show notification
      showNotification(newType)
      
      // Force a small delay to ensure state update
      setTimeout(() => {
        console.log('DevelopmentOrgSwitcher: Switch completed, new type should be:', newType)
      }, 100)
    } catch (error) {
      console.error('DevelopmentOrgSwitcher: Error during switch:', error)
    }
  }


  const showNotification = (newType: OrganizationType) => {
    // Show notification
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300'
    notification.textContent = `Switched to ${organizations.find(o => o.type === newType)?.label}`
    document.body.appendChild(notification)
    
    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification)
        }
      }, 300)
    }, 2000)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Development Badge */}
      <div className="mb-2 text-right">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          🚧 DEV MODE
        </span>
      </div>


      {/* Switcher Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-3 px-4 py-3 rounded-xl shadow-lg border-2 border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-105 ${currentOrg?.color} text-white`}
          title="Switch Organization Type (Development Only)"
        >
          <span className="text-xl">{currentOrg?.icon}</span>
          <div className="text-left">
            <div className="text-sm font-medium">Switch Org</div>
            <div className="text-xs opacity-90">{currentOrg?.label}</div>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Development: Switch Organization</h3>
              <p className="text-xs text-gray-600 mt-1">Test different dashboard experiences</p>
            </div>
            
            <div className="p-2">
              {organizations.map((org) => {
                const config = ORGANIZATION_CONFIGS[org.type]
                const isActive = org.type === organizationType
                
                return (
                  <button
                    key={org.type}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('=== BUTTON CLICKED ===', org.type)
                      handleSwitch(org.type)
                    }}
                    className={`w-full flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    style={{ zIndex: 51 }}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${org.color} text-white shadow-md`}>
                      <span className="text-lg">{org.icon}</span>
                    </div>
                    
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-gray-900">{org.label}</h4>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{config.description}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        <span className="font-medium">Pipeline:</span> {config.pipelineTitle}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Items:</span> {config.terminology.itemNamePlural}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-600 text-center">
                💡 Each organization type has different workflows, terminology, and features
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Overlay to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}