'use client'

import { useOrganization } from '@/contexts/organization-context'
import { OrganizationType } from '@/lib/organization-context'

export default function SimpleDevelopmentSwitcher() {
  const { organizationType, setOrganizationType } = useOrganization()

  const handleSwitch = (newType: OrganizationType) => {
    console.log('Switching from', organizationType, 'to', newType)
    setOrganizationType(newType)
    alert(`Switched to ${newType}`)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <div className="text-xs font-bold mb-2">🚧 DEV SWITCHER</div>
      <div className="text-xs mb-2">Current: {organizationType}</div>
      <div className="space-y-1">
        <button 
          onClick={() => handleSwitch('certification-body')}
          className={`block w-full text-left px-2 py-1 rounded text-xs ${organizationType === 'certification-body' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
        >
          🏛️ Certification Body
        </button>
        <button 
          onClick={() => handleSwitch('food-manufacturer')}
          className={`block w-full text-left px-2 py-1 rounded text-xs ${organizationType === 'food-manufacturer' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
        >
          🏭 Food Manufacturer
        </button>
        <button 
          onClick={() => handleSwitch('import-export')}
          className={`block w-full text-left px-2 py-1 rounded text-xs ${organizationType === 'import-export' ? 'bg-green-100' : 'hover:bg-gray-100'}`}
        >
          🚢 Import/Export
        </button>
      </div>
    </div>
  )
}