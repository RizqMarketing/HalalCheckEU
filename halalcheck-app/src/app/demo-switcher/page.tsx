'use client'

import { useOrganization, useOrganizationText, useOrganizationStyling } from '@/contexts/organization-context'
import DevelopmentOrgSwitcher from '@/components/DevelopmentOrgSwitcher'

export default function DemoSwitcherPage() {
  const { config, terminology } = useOrganization()
  const orgText = useOrganizationText()
  const orgStyling = useOrganizationStyling()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Multi-Organization Dashboard Demo
          </h1>
          <p className="text-slate-600">
            Use the switcher in the bottom-right to see how the same dashboard adapts for different organization types
          </p>
        </div>

        {/* Current Organization Display */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
          <div className="flex items-center space-x-6 mb-6">
            <div className={`w-20 h-20 bg-gradient-to-br ${orgStyling.colors.primary} rounded-2xl flex items-center justify-center shadow-lg`}>
              <span className="text-3xl">{config.icon}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{config.name}</h2>
              <p className="text-slate-600 mb-2">{config.description}</p>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${orgStyling.colors.secondary} inline-block`}>
                {config.dashboardTitle}
              </div>
            </div>
          </div>

          {/* Organization-Specific Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Terminology */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Terminology</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Items:</span>
                  <span className="font-medium">{terminology.itemNamePlural}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pipeline:</span>
                  <span className="font-medium">{terminology.pipelineName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Documents:</span>
                  <span className="font-medium">{terminology.documentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Clients:</span>
                  <span className="font-medium">{terminology.clientNamePlural}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Action:</span>
                  <span className="font-medium">{terminology.documentAction}</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stages */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Pipeline Stages</h3>
              <div className="space-y-2">
                {config.stages.map((stage, index) => (
                  <div key={stage.id} className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-slate-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{stage.title}</div>
                      <div className="text-xs text-slate-600">{stage.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Organization Features</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border ${config.features.hasCertificates ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm font-medium">
                {config.features.hasCertificates ? '✅' : '❌'} Certificates
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${config.features.hasReports ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm font-medium">
                {config.features.hasReports ? '✅' : '❌'} Reports
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${config.features.allowsCustomStages ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm font-medium">
                {config.features.allowsCustomStages ? '✅' : '❌'} Custom Stages
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${config.features.showsComplianceInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm font-medium">
                {config.features.showsComplianceInfo ? '✅' : '❌'} Compliance Info
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${config.features.enablesBulkProcessing ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm font-medium">
                {config.features.enablesBulkProcessing ? '✅' : '❌'} Bulk Processing
              </div>
            </div>
            <div className={`p-3 rounded-lg border ${config.features.supportsAuditTrail ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="text-sm font-medium">
                {config.features.supportsAuditTrail ? '✅' : '❌'} Audit Trail
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Test</h3>
          <p className="text-blue-800 mb-4">
            Click the organization switcher in the bottom-right corner to see how this same dashboard 
            adapts for different organization types. Each type has different terminology, workflows, and features.
          </p>
          <div className="flex justify-center space-x-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🏛️</span>
              </div>
              <div className="text-sm font-medium text-blue-900">Certification Body</div>
              <div className="text-xs text-blue-700">Issue certificates</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🏭</span>
              </div>
              <div className="text-sm font-medium text-blue-900">Food Manufacturer</div>
              <div className="text-xs text-blue-700">Develop products</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-xl">🚢</span>
              </div>
              <div className="text-sm font-medium text-blue-900">Import/Export</div>
              <div className="text-xs text-blue-700">Trade compliance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Organization Switcher */}
      <DevelopmentOrgSwitcher />
    </div>
  )
}