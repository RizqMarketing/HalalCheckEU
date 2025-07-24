'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// Removed Supabase imports for mock implementation

type Analysis = any // Mock type for demonstration

interface AnalysisWithDetails extends Analysis {
  formatted_date: string
  status_color: string
  confidence_percentage: number
}

export default function HistoryPage() {
  const [analyses, setAnalyses] = useState<AnalysisWithDetails[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status' | 'confidence'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  // Removed Supabase client for mock implementation

  useEffect(() => {
    loadAnalyses()
  }, [])

  useEffect(() => {
    filterAndSortAnalyses()
  }, [analyses, searchTerm, statusFilter, sortBy, sortOrder])

  const loadAnalyses = async () => {
    try {
      // Use mock data for demonstration
      const mockAnalyses: Analysis[] = [
        {
          id: '1',
          user_id: 'demo-user',
          analysis_type: 'single',
          input_text: 'Sugar, Modified Corn Starch, Cocoa Powder, Lecithin (E322)',
          input_filename: 'chocolate-cookies.pdf',
          input_file_url: null,
          overall_status: 'HALAL',
          confidence_score: 0.92,
          analysis_duration_seconds: 6.2,
          cost_savings_euros: 150,
          ingredients_analyzed: null,
          high_risk_ingredients: ['Lecithin (E322)'],
          requires_expert_review: false,
          ai_reasoning: null,
          islamic_references: null,
          recommendations: null,
          pdf_report_url: '/reports/chocolate-cookies.pdf',
          email_template: null,
          created_at: '2024-01-20T10:30:00Z',
          updated_at: '2024-01-20T10:30:00Z',
          search_vector: null,
          analysis_version: null
        },
        {
          id: '2',
          user_id: 'demo-user',
          analysis_type: 'image_ocr',
          input_text: null,
          input_filename: 'instant-noodles.jpg',
          input_file_url: '/uploads/instant-noodles.jpg',
          overall_status: 'HARAM',
          confidence_score: 0.98,
          analysis_duration_seconds: 8.5,
          cost_savings_euros: 200,
          ingredients_analyzed: null,
          high_risk_ingredients: ['Pork Extract', 'Lard'],
          requires_expert_review: true,
          ai_reasoning: null,
          islamic_references: null,
          recommendations: null,
          pdf_report_url: '/reports/instant-noodles.pdf',
          email_template: null,
          created_at: '2024-01-19T14:15:00Z',
          updated_at: '2024-01-19T14:15:00Z',
          search_vector: null,
          analysis_version: null
        },
        {
          id: '3',
          user_id: 'demo-user',
          analysis_type: 'bulk',
          input_text: null,
          input_filename: 'product-catalog-january.xlsx',
          input_file_url: '/uploads/catalog.xlsx',
          overall_status: 'MASHBOOH',
          confidence_score: 0.75,
          analysis_duration_seconds: 45.3,
          cost_savings_euros: 850,
          ingredients_analyzed: null,
          high_risk_ingredients: ['Natural Flavoring', 'Mono and Diglycerides'],
          requires_expert_review: true,
          ai_reasoning: null,
          islamic_references: null,
          recommendations: null,
          pdf_report_url: '/reports/product-catalog.pdf',
          email_template: null,
          created_at: '2024-01-18T09:45:00Z',
          updated_at: '2024-01-18T09:45:00Z',
          search_vector: null,
          analysis_version: null
        },
        {
          id: '4',
          user_id: 'demo-user',
          analysis_type: 'single',
          input_text: 'Wheat Flour, Sugar, Palm Oil, Salt, Baking Powder',
          input_filename: null,
          input_file_url: null,
          overall_status: 'HALAL',
          confidence_score: 0.97,
          analysis_duration_seconds: 4.1,
          cost_savings_euros: 120,
          ingredients_analyzed: null,
          high_risk_ingredients: [],
          requires_expert_review: false,
          ai_reasoning: null,
          islamic_references: null,
          recommendations: null,
          pdf_report_url: '/reports/simple-biscuits.pdf',
          email_template: null,
          created_at: '2024-01-17T16:20:00Z',
          updated_at: '2024-01-17T16:20:00Z',
          search_vector: null,
          analysis_version: null
        },
        {
          id: '5',
          user_id: 'demo-user',
          analysis_type: 'image_ocr',
          input_text: null,
          input_filename: 'frozen-pizza.png',
          input_file_url: '/uploads/frozen-pizza.png',
          overall_status: 'HALAL',
          confidence_score: 0.88,
          analysis_duration_seconds: 12.7,
          cost_savings_euros: 180,
          ingredients_analyzed: null,
          high_risk_ingredients: ['Cheese (source unclear)'],
          requires_expert_review: true,
          ai_reasoning: null,
          islamic_references: null,
          recommendations: null,
          pdf_report_url: '/reports/frozen-pizza.pdf',
          email_template: null,
          created_at: '2024-01-16T11:10:00Z',
          updated_at: '2024-01-16T11:10:00Z',
          search_vector: null,
          analysis_version: null
        }
      ]

      const processedAnalyses: AnalysisWithDetails[] = mockAnalyses.map(analysis => ({
        ...analysis,
        formatted_date: new Date(analysis.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status_color: getStatusColor(analysis.overall_status),
        confidence_percentage: Math.round((analysis.confidence_score || 0) * 100)
      }))

      setAnalyses(processedAnalyses)
    } catch (error) {
      console.error('Error loading analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortAnalyses = () => {
    let filtered = analyses

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(analysis => 
        (analysis.input_filename?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (analysis.input_text?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (analysis.overall_status.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(analysis => analysis.overall_status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'name':
          aValue = a.input_filename || a.input_text || ''
          bValue = b.input_filename || b.input_text || ''
          break
        case 'status':
          aValue = a.overall_status
          bValue = b.overall_status
          break
        case 'confidence':
          aValue = a.confidence_score || 0
          bValue = b.confidence_score || 0
          break
        default:
          return 0
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
      }
    })

    setFilteredAnalyses(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HALAL': return 'text-green-600 bg-green-50 border-green-200'
      case 'HARAM': return 'text-red-600 bg-red-50 border-red-200'
      case 'MASHBOOH': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HALAL':
        return (
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      case 'HARAM':
        return (
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        )
      case 'MASHBOOH':
        return (
          <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      default:
        return null
    }
  }

  const getAnalysisTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return 'Single Product'
      case 'bulk': return 'Bulk Analysis'
      case 'image_ocr': return 'Image/OCR'
      default: return type
    }
  }

  const totalCostSavings = filteredAnalyses.reduce((sum, analysis) => sum + (analysis.cost_savings_euros || 0), 0)
  const averageConfidence = filteredAnalyses.reduce((sum, analysis) => sum + (analysis.confidence_score || 0), 0) / filteredAnalyses.length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Analysis History</h1>
            </div>
            <Link
              href="/dashboard/analyze"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              New Analysis
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{filteredAnalyses.length}</p>
                <p className="text-sm text-gray-600">Total Analyses</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAnalyses.filter(a => a.overall_status === 'HALAL').length}
                </p>
                <p className="text-sm text-gray-600">Halal Products</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">€{Math.round(totalCostSavings)}</p>
                <p className="text-sm text-gray-600">Total Savings</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((averageConfidence || 0) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Avg Confidence</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by filename, ingredients, or status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Status</option>
                <option value="HALAL">Halal</option>
                <option value="HARAM">Haram</option>
                <option value="MASHBOOH">Mashbooh</option>
              </select>

              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field as any)
                  setSortOrder(order as any)
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="confidence-desc">Highest Confidence</option>
                <option value="confidence-asc">Lowest Confidence</option>
              </select>

              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium ${viewMode === 'table' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium border-l border-gray-300 ${viewMode === 'grid' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis List */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnalyses.map((analysis) => (
                    <tr key={analysis.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              {analysis.analysis_type === 'image_ocr' ? (
                                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              ) : (
                                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {analysis.input_filename || 'Text Input'}
                            </div>
                            {analysis.high_risk_ingredients && analysis.high_risk_ingredients.length > 0 && (
                              <div className="text-xs text-red-600">
                                {analysis.high_risk_ingredients.length} risk ingredient(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(analysis.overall_status)}
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${analysis.status_color}`}>
                            {analysis.overall_status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${analysis.confidence_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{analysis.confidence_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getAnalysisTypeLabel(analysis.analysis_type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {analysis.formatted_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {analysis.pdf_report_url && (
                          <a
                            href={analysis.pdf_report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700"
                          >
                            Report
                          </a>
                        )}
                        <button className="text-blue-600 hover:text-blue-700">
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
              <div key={analysis.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(analysis.overall_status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${analysis.status_color}`}>
                      {analysis.overall_status}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{analysis.confidence_percentage}%</div>
                    <div className="text-xs text-gray-500">confidence</div>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {analysis.input_filename || 'Text Analysis'}
                </h3>
                
                <div className="text-sm text-gray-600 mb-4">
                  <div className="flex items-center justify-between">
                    <span>{getAnalysisTypeLabel(analysis.analysis_type)}</span>
                    <span>{analysis.formatted_date}</span>
                  </div>
                </div>

                {analysis.high_risk_ingredients && analysis.high_risk_ingredients.length > 0 && (
                  <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-xs text-yellow-800 font-medium">
                      {analysis.high_risk_ingredients.length} ingredient(s) need attention
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  {analysis.pdf_report_url && (
                    <a
                      href={analysis.pdf_report_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Download Report
                    </a>
                  )}
                  <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredAnalyses.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start by uploading your first product for analysis'
              }
            </p>
            <Link
              href="/dashboard/analyze"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Create New Analysis
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}