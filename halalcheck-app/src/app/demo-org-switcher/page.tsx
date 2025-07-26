'use client'

import { useState } from 'react'

export default function DemoOrgSwitcher() {
  const [currentOrg, setCurrentOrg] = useState('certification-body')

  const organizations = [
    {
      type: 'certification-body',
      name: 'Halal Certification Body',
      icon: '🏛️',
      color: 'bg-emerald-500',
      description: 'Issue official halal certificates',
      pipeline: ['New Applications', 'Under Review', 'Approved', 'Certified'],
      terminology: {
        items: 'Applications',
        pipeline: 'Application Pipeline',
        documents: 'Halal Certificates',
        action: 'Issue Certificate'
      }
    },
    {
      type: 'food-manufacturer',
      name: 'Food Manufacturer',
      icon: '🏭',
      color: 'bg-blue-500',
      description: 'Develop halal products and prepare for certification',
      pipeline: ['Recipe Development', 'Testing & Validation', 'Documentation Complete', 'Certification Ready'],
      terminology: {
        items: 'Products',
        pipeline: 'Product Development Pipeline',
        documents: 'Pre-Certification Reports',
        action: 'Generate Report'
      }
    },
    {
      type: 'import-export',
      name: 'Import/Export Company',
      icon: '🚢',
      color: 'bg-indigo-500',
      description: 'Manage halal compliance for international trade',
      pipeline: ['Documentation Review', 'Compliance Verification', 'Customs Ready', 'Trade Approved'],
      terminology: {
        items: 'Shipments',
        pipeline: 'Compliance Pipeline',
        documents: 'Compliance Certificates',
        action: 'Issue Compliance Certificate'
      }
    }
  ]

  const current = organizations.find(org => org.type === currentOrg) || organizations[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚧 Organization Switcher Demo
          </h1>
          <p className="text-xl text-gray-600">
            See how the same dashboard adapts for different organization types
          </p>
        </div>

        {/* Organization Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3 text-center">Switch Organization Type:</div>
            <div className="flex space-x-2">
              {organizations.map((org) => (
                <button
                  key={org.type}
                  onClick={() => setCurrentOrg(org.type)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 border-2 ${
                    currentOrg === org.type
                      ? `${org.color} text-white border-transparent shadow-lg`
                      : 'text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{org.icon}</span>
                  <span className="font-medium">{org.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current Organization Dashboard */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className={`${current.color} text-white p-6`}>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">{current.icon}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{current.name}</h2>
                <p className="text-white/90">{current.description}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white">
                <h3 className="text-lg font-bold mb-2">🔥 AI Ingredient Analysis</h3>
                <p className="text-green-100 text-sm">Analyze ingredients with AI-powered halal compliance checking</p>
              </div>
              
              <div className="bg-white border-2 border-gray-200 p-6 rounded-xl hover:border-blue-300 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 mb-2">⚙️ {current.terminology.pipeline}</h3>
                <p className="text-gray-600 text-sm">Manage {current.terminology.items.toLowerCase()} and track progress</p>
              </div>
              
              <div className="bg-white border-2 border-gray-200 p-6 rounded-xl hover:border-purple-300 transition-colors">
                <h3 className="text-lg font-bold text-gray-900 mb-2">📊 {current.terminology.action}</h3>
                <p className="text-gray-600 text-sm">Generate professional {current.terminology.documents.toLowerCase()}</p>
              </div>
            </div>

            {/* Pipeline Overview */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{current.terminology.pipeline} Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {current.pipeline.map((stage, index) => (
                  <div key={index} className="text-center">
                    <div className={`w-12 h-12 mx-auto rounded-xl ${current.color} text-white flex items-center justify-center font-bold text-lg mb-2`}>
                      {index + 1}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{stage}</h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminology Comparison */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Organization-Specific Terminology</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Items</div>
                  <div className="font-semibold text-gray-900">{current.terminology.items}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Pipeline</div>
                  <div className="font-semibold text-gray-900">{current.terminology.pipeline}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Documents</div>
                  <div className="font-semibold text-gray-900">{current.terminology.documents}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-600">Primary Action</div>
                  <div className="font-semibold text-gray-900">{current.terminology.action}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-blue-900 mb-2">How It Works</h3>
            <p className="text-blue-800">
              Click the organization buttons above to see how the same dashboard platform 
              adapts its terminology, pipeline stages, and features for different business types. 
              Each organization gets a completely customized experience while sharing the same underlying system.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}