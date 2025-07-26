'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useOrganization, useOrganizationText, useOrganizationStyling } from '@/contexts/organization-context'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const { config, terminology, isLoading: orgLoading } = useOrganization()
  const orgText = useOrganizationText()
  const orgStyling = useOrganizationStyling()

  useEffect(() => {
    console.log('Dashboard: loading state changed', { loading, orgLoading, config })
    setLoading(false)
  }, [orgLoading])

  console.log('Dashboard render:', { loading, orgLoading, configType: config?.type })

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${orgStyling.colors.primary} rounded-xl flex items-center justify-center shadow-md`}>
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
                  HalalCheck AI
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${orgStyling.colors.secondary}`}>
                {config.name}
              </div>
              <Link className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors" href="/pricing">
                Pricing
              </Link>
              <Link className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5" href="/register">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
          
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <span className={`inline-flex items-center px-4 py-2 rounded-full ${orgStyling.colors.secondary} border ${orgStyling.colors.border} text-sm font-medium`}>
                <span className="mr-2">{config.icon}</span>
                {config.dashboardTitle}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
              Welcome to Your
              <span className={`bg-gradient-to-r ${orgStyling.colors.primary} bg-clip-text text-transparent block mt-2`}>
                {config.dashboardTitle}
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {config.description}. Start by analyzing ingredients, manage your {terminology.itemNamePlural.toLowerCase()}, and generate professional {terminology.documentName.toLowerCase()}s.
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            
            {/* AI Analysis - Primary Action */}
            <Link
              href="/dashboard/analyze"
              className="group relative bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-green-400/20 lg:col-span-2"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="text-xs bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-white font-medium">PRIMARY</div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">🔥 AI Ingredient Analysis</h3>
              <p className="text-green-100 text-sm mb-4">Analyze ingredients instantly with AI-powered halal compliance checking. Get detailed reports and Islamic jurisprudence references.</p>
              <div className="flex items-center text-white text-sm font-medium">
                <span>Start Analysis</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Pipeline Management */}
            <Link
              href="/dashboard/applications"
              className="group relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/60 hover:border-blue-300/60"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">⚙️ {terminology.pipelineName}</h3>
              <p className="text-gray-600 text-sm mb-4">Manage {terminology.itemNamePlural.toLowerCase()}, track progress, and organize your {terminology.workflowName.toLowerCase()}.</p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Manage Pipeline</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            {/* Documents/Certificates */}
            <Link
              href="/dashboard/certificates"
              className="group relative bg-white/70 backdrop-blur-sm p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200/60 hover:border-purple-300/60"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">📊 {terminology.documentAction}</h3>
              <p className="text-gray-600 text-sm mb-4">Generate professional {terminology.documentName.toLowerCase()}s with Islamic compliance details.</p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <span>Generate Documents</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
            <Link href="/dashboard/analytics" className="group bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">📈 Analytics</div>
                  <div className="text-xs text-gray-600">View reports</div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/documents" className="group bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">📁 Documents</div>
                  <div className="text-xs text-gray-600">Document library</div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/history" className="group bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">📚 History</div>
                  <div className="text-xs text-gray-600">Past analyses</div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/billing" className="group bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">💳 Billing</div>
                  <div className="text-xs text-gray-600">Manage plan</div>
                </div>
              </div>
            </Link>

            <Link href="/settings" className="group bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border border-gray-200/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">⚙️ Settings</div>
                  <div className="text-xs text-gray-600">Preferences</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Workflow Status Overview */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {terminology.workflowName} Overview
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {config.stages.map((stage, index) => (
                <div key={stage.id} className="text-center">
                  <div className="relative mb-4">
                    <div className={`w-16 h-16 mx-auto rounded-2xl ${stage.color} flex items-center justify-center shadow-lg`}>
                      <span className="text-2xl font-bold">{index + 1}</span>
                    </div>
                    {index < config.stages.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2"></div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{stage.title}</h3>
                  <p className="text-sm text-gray-600">{stage.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Total Analyses</h3>
                <svg className="w-8 h-8 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd"/>
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">107</div>
              <div className="text-green-100 text-sm">Complete ingredient reviews</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{terminology.itemNamePlural}</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">81</div>
              <div className="text-blue-100 text-sm">In {terminology.workflowName.toLowerCase()}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{terminology.documentName}s</h3>
                <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-bold mb-2">45</div>
              <div className="text-purple-100 text-sm">Successfully generated</div>
            </div>
          </div>

        </div>
      </main>

    </div>
  )
}