'use client'

import { useState, useEffect } from 'react'
import { useOrganization, useOrganizationText } from '@/contexts/organization-context'

interface DocumentRecord {
  id: string
  filename: string
  type: 'certificate' | 'supplier_letter' | 'lab_report' | 'other'
  uploadDate: string
  analysisId: string
  ingredientName: string
  productName?: string
  clientName?: string
  status: 'verified'
}

export default function DocumentsPage() {
  const { config, terminology } = useOrganization()
  const orgText = useOrganizationText()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'type'>('date')

  // Load documents from localStorage (in real app, this would be from API)
  useEffect(() => {
    const loadDocuments = () => {
      const analysisData = localStorage.getItem('halalcheck-analysis-state')
      if (analysisData) {
        try {
          const parsed = JSON.parse(analysisData)
          const allDocuments: DocumentRecord[] = []
          
          // Extract documents from all analysis results
          if (parsed.analysisResults) {
            parsed.analysisResults.forEach((analysis: any) => {
              analysis.ingredients?.forEach((ingredient: any) => {
                if (ingredient.verificationDocuments) {
                  ingredient.verificationDocuments.forEach((doc: any) => {
                    allDocuments.push({
                      ...doc,
                      analysisId: analysis.id,
                      ingredientName: ingredient.name,
                      productName: analysis.product,
                      clientName: parsed.selectedClient?.name || 'Unknown Client',
                      status: 'verified'
                    })
                  })
                }
              })
            })
          }
          
          // Sort by date (newest first)
          allDocuments.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
          setDocuments(allDocuments)
          
        } catch (error) {
          console.error('Error loading documents:', error)
        }
      }
    }

    loadDocuments()
    
    // Refresh documents when localStorage changes
    const handleStorageChange = () => {
      loadDocuments()
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = searchTerm === '' || 
        doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.ingredientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesFilter = filterType === 'all' || doc.type === filterType
      
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        case 'name':
          return a.filename.localeCompare(b.filename)
        case 'type':
          return a.type.localeCompare(b.type)
        default:
          return 0
      }
    })

  const getDocumentIcon = (filename: string, type: string) => {
    const ext = filename.toLowerCase().split('.').pop()
    if (ext === 'pdf') {
      return (
        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
      )
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
      return (
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )
    } else {
      return (
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        </div>
      )
    }
  }

  const getDocumentTypeBadge = (type: string) => {
    const typeMap = {
      'certificate': { color: 'bg-green-100 text-green-700', icon: '🏆', label: 'Certificate' },
      'supplier_letter': { color: 'bg-blue-100 text-blue-700', icon: '📄', label: 'Supplier Letter' },
      'lab_report': { color: 'bg-purple-100 text-purple-700', icon: '🔬', label: 'Lab Report' },
      'other': { color: 'bg-gray-100 text-gray-700', icon: '📎', label: 'Other Document' }
    }
    const typeInfo = typeMap[type as keyof typeof typeMap] || typeMap.other
    return (
      <span className={`text-xs px-2 py-1 rounded font-medium ${typeInfo.color}`}>
        {typeInfo.icon} {typeInfo.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {orgText.getDocumentationText('complete')} Library
            </h1>
            <p className="text-slate-600 mt-1">
              Manage all verification documents across your {orgText.getItemName(false).toLowerCase()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
              {documents.length} Documents
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search documents, ingredients, products..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Document Types</option>
            <option value="certificate">Certificates</option>
            <option value="supplier_letter">Supplier Letters</option>
            <option value="lab_report">Lab Reports</option>
            <option value="other">Other Documents</option>
          </select>

          {/* Sort */}
          <select
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'type')}
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
          </select>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4">
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Documents Found</h3>
            <p className="text-slate-600">
              Upload verification documents through the analysis tool to see them here.
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                {getDocumentIcon(doc.filename, doc.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {doc.filename}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {doc.productName} • {doc.ingredientName}
                      </p>
                      <p className="text-xs text-slate-500">
                        Client: {doc.clientName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {getDocumentTypeBadge(doc.type)}
                      <span className="text-xs text-slate-500">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                        ✓ Verified
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                        onClick={() => {
                          // TODO: Add document preview functionality
                          console.log('View document:', doc.filename)
                        }}
                      >
                        View Document
                      </button>
                      <button 
                        className="text-sm text-slate-600 hover:text-slate-700 font-medium"
                        onClick={() => {
                          // TODO: Add download functionality
                          console.log('Download document:', doc.filename)
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}