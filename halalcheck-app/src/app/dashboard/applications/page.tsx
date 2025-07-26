'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { dataManager, Application } from '@/lib/data-manager'
import { trackPipeline, trackPageView, trackFeatureUsage } from '@/lib/analytics-tracker'
import { useOrganization, useOrganizationText } from '@/contexts/organization-context'

export default function ApplicationsPage() {
  const { stages, terminology, config } = useOrganization()
  const orgText = useOrganizationText()
  
  const [applications, setApplications] = useState<Application[]>([])
  const [draggedApp, setDraggedApp] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showNewAppModal, setShowNewAppModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [customColumns, setCustomColumns] = useState<Array<{id: string, title: string, icon: JSX.Element}>>([])
  const [showColumnManager, setShowColumnManager] = useState(false)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnTitle, setEditingColumnTitle] = useState('')

  // Create status config from organization stages
  const statusConfig = stages.reduce((acc, stage) => {
    acc[stage.id] = {
      color: stage.color,
      label: stage.title
    }
    return acc
  }, {} as Record<string, { color: string; label: string }>)

  useEffect(() => {
    // Track page view
    trackPageView('applications', {
      viewType: 'pipeline'
    })
    
    loadApplications()
    loadCustomColumns()
    
    // Subscribe to data changes
    const unsubscribe = dataManager.subscribe(() => {
      loadApplications()
    })

    return unsubscribe
  }, [])

  const loadApplications = () => {
    setApplications(dataManager.getApplications())
  }

  const handleDragStart = (appId: string) => {
    setDraggedApp(appId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, newStatus: Application['status']) => {
    e.preventDefault()
    if (draggedApp) {
      const app = applications.find(a => a.id === draggedApp)
      const oldStatus = app?.status
      
      dataManager.updateApplication(draggedApp, { status: newStatus })
      setDraggedApp(null)
      
      // Track pipeline stage change
      if (app && oldStatus !== newStatus) {
        trackPipeline('stage_changed', {
          applicationId: draggedApp,
          clientName: app.clientName,
          productName: app.productName,
          fromStatus: oldStatus,
          toStatus: newStatus,
          changeMethod: 'drag_drop'
        })
      }
    }
  }

  const getApplicationsByStatus = (status: Application['status']) => {
    let filtered = applications.filter(app => app.status === status)
    
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return filtered
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: Application['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'normal': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  const getVerificationDocumentCount = (app: Application) => {
    if (!app.analysisResult?.ingredients) {
      return app.documents?.length || 0
    }
    
    let count = 0
    app.analysisResult.ingredients.forEach((ingredient: any) => {
      if (ingredient.verificationDocuments) {
        count += ingredient.verificationDocuments.length
      }
    })
    
    return count
  }

  const openApplicationModal = (app: Application) => {
    setSelectedApp(app)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedApp(null)
  }

  const updateApplicationNotes = (notes: string) => {
    if (selectedApp) {
      dataManager.updateApplication(selectedApp.id, { notes })
      setSelectedApp({ ...selectedApp, notes })
    }
  }

  const deleteApplication = (appId: string) => {
    if (confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      dataManager.deleteApplication(appId)
      setShowModal(false)
    }
  }

  // Custom columns management
  const loadCustomColumns = () => {
    const saved = localStorage.getItem('pipeline-custom-columns')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setCustomColumns(parsed.map((col: any) => ({
          ...col,
          icon: <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        })))
      } catch (e) {
        console.error('Failed to load custom columns:', e)
      }
    }
  }

  const saveCustomColumns = (columns: Array<{id: string, title: string}>) => {
    localStorage.setItem('pipeline-custom-columns', JSON.stringify(columns.map(col => ({id: col.id, title: col.title}))))
  }

  const addCustomColumn = () => {
    const newColumn = {
      id: `custom-${Date.now()}`,
      title: 'New Stage',
      icon: <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
    }
    const updated = [...customColumns, newColumn]
    setCustomColumns(updated)
    saveCustomColumns(updated)
    
    // Track custom column creation
    trackFeatureUsage('pipeline_custom_stage_added', {
      stageId: newColumn.id,
      totalCustomStages: updated.length,
      totalStages: defaultColumns.length + updated.length
    })
  }

  const removeCustomColumn = (columnId: string) => {
    if (confirm('Are you sure you want to remove this column? All applications in this column will be moved to "New Applications".')) {
      // Count applications that will be moved
      const affectedApps = applications.filter(app => app.status === columnId as any)
      
      // Move all applications in this column to 'new' status
      applications.forEach(app => {
        if (app.status === columnId as any) {
          dataManager.updateApplication(app.id, { status: 'new' })
        }
      })
      
      const updated = customColumns.filter(col => col.id !== columnId)
      setCustomColumns(updated)
      saveCustomColumns(updated)
      
      // Track custom column removal
      trackFeatureUsage('pipeline_custom_stage_removed', {
        stageId: columnId,
        affectedApplications: affectedApps.length,
        totalCustomStages: updated.length,
        totalStages: defaultColumns.length + updated.length
      })
    }
  }

  const updateColumnTitle = (columnId: string, newTitle: string) => {
    const updated = customColumns.map(col => 
      col.id === columnId ? { ...col, title: newTitle } : col
    )
    setCustomColumns(updated)
    saveCustomColumns(updated)
    setEditingColumnId(null)
    setEditingColumnTitle('')
  }

  const startEditingColumn = (columnId: string, currentTitle: string) => {
    setEditingColumnId(columnId)
    setEditingColumnTitle(currentTitle)
  }

  // Create default columns from organization stages
  const defaultColumns: { status: Application['status']; title: string; icon: JSX.Element; isDefault: boolean }[] = stages.map(stage => ({
    status: stage.id as Application['status'],
    title: stage.title,
    icon: typeof stage.icon === 'string' && stage.icon.includes('svg') ? 
      <div dangerouslySetInnerHTML={{ __html: stage.icon }} /> :
      <div className="text-lg">{stage.icon}</div>,
    isDefault: true
  }))

  const allColumns = [
    ...defaultColumns,
    ...customColumns.map(col => ({ ...col, status: col.id as Application['status'], isDefault: false }))
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-blue-800 bg-clip-text text-transparent">
                  {config.pipelineTitle}
                </h1>
                <p className="text-slate-600 text-sm">
                  {terminology.workflowName} management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowColumnManager(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg shadow-purple-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span>Manage Pipeline</span>
              </button>
              <button 
                onClick={() => setShowNewAppModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Application</span>
              </button>
              <Link 
                href="/dashboard"
                className="inline-flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="mb-8 flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="reviewing">Under Review</option>
            <option value="approved">Approved</option>
            <option value="certified">Certified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {allColumns.map(column => (
            <div key={column.status} className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {getApplicationsByStatus(column.status).length}
                  </div>
                  <div className="text-sm text-slate-600">{column.title}</div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg">{column.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Kanban Board */}
        <div className={`grid gap-6 ${allColumns.length <= 4 ? 'grid-cols-1 lg:grid-cols-4' : allColumns.length <= 6 ? 'grid-cols-1 lg:grid-cols-3 xl:grid-cols-6' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6'}`}>
          {allColumns.map(column => (
            <div
              key={column.status}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="p-4 border-b border-slate-200/60 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-6 h-6">{column.icon}</div>
                    {editingColumnId === column.status ? (
                      <input
                        type="text"
                        value={editingColumnTitle}
                        onChange={(e) => setEditingColumnTitle(e.target.value)}
                        onBlur={() => updateColumnTitle(column.status, editingColumnTitle)}
                        onKeyPress={(e) => e.key === 'Enter' && updateColumnTitle(column.status, editingColumnTitle)}
                        className="text-sm font-bold bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <h3 
                        className={`font-bold text-slate-900 ${!column.isDefault ? 'cursor-pointer hover:text-blue-600' : ''}`}
                        onClick={() => !column.isDefault && startEditingColumn(column.status, column.title)}
                      >
                        {column.title}
                      </h3>
                    )}
                    <span className="text-sm text-slate-500">
                      ({getApplicationsByStatus(column.status).length})
                    </span>
                  </div>
                  {!column.isDefault && (
                    <button
                      onClick={() => removeCustomColumn(column.status)}
                      className="text-red-500 hover:text-red-700 transition-colors opacity-60 hover:opacity-100"
                      title="Remove column"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 space-y-4 min-h-[400px]">
                {getApplicationsByStatus(column.status).map(app => (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-move group"
                    draggable
                    onDragStart={() => handleDragStart(app.id)}
                    onClick={() => openApplicationModal(app)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{app.productName}</h4>
                        <p className="text-sm text-slate-600">{app.company}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(app.priority)}`}>
                        {app.priority}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-xs text-slate-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                        <span>{app.clientName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                        </svg>
                        <span>{formatDate(app.submittedDate)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                        </svg>
                        <span>{getVerificationDocumentCount(app)} documents</span>
                      </div>
                    </div>

                    {/* Quick Actions (visible on hover) */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Click to edit</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteApplication(app.id)
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {getApplicationsByStatus(column.status).length === 0 && (
                  <div className="text-center text-slate-400 py-8">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p>No applications</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Application Detail Modal */}
      {showModal && selectedApp && (
        <ApplicationModal 
          application={selectedApp}
          onClose={closeModal}
          onUpdate={updateApplicationNotes}
          onDelete={deleteApplication}
        />
      )}

      {/* New Application Modal */}
      {showNewAppModal && (
        <NewApplicationModal
          onClose={() => setShowNewAppModal(false)}
          onCreate={(appData) => {
            dataManager.addApplication(appData)
            setShowNewAppModal(false)
          }}
        />
      )}

      {/* Pipeline Management Modal */}
      {showColumnManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Manage Pipeline Stages</h2>
                <button
                  onClick={() => setShowColumnManager(false)}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Customize your workflow by adding, removing, or renaming pipeline stages.
              </p>
            </div>

            <div className="p-6">
              {/* Default Columns */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Default Stages
                </h3>
                <div className="grid gap-3">
                  {defaultColumns.map(column => (
                    <div key={column.status} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm">
                          {column.icon}
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">{column.title}</div>
                          <div className="text-sm text-slate-500">Built-in stage</div>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {getApplicationsByStatus(column.status).length} applications
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Columns */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Custom Stages
                  </h3>
                  <button
                    onClick={addCustomColumn}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg shadow-purple-500/25"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Stage</span>
                  </button>
                </div>
                
                {customColumns.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm">No custom stages yet. Add one to customize your workflow!</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {customColumns.map(column => (
                      <div key={column.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-lg shadow-sm">
                            {column.icon}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{column.title}</div>
                            <div className="text-sm text-purple-600">Custom stage • Click name to edit</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-slate-500">
                            {getApplicationsByStatus(column.id as any).length} applications
                          </div>
                          <button
                            onClick={() => removeCustomColumn(column.id)}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-lg"
                            title="Remove stage"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">How to use custom stages:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Click the stage name in the pipeline to rename it</li>
                      <li>• Drag applications between stages to update their status</li>
                      <li>• Custom stages appear as purple columns in your pipeline</li>
                      <li>• Removing a stage moves all applications back to "New Applications"</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowColumnManager(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-4 rounded-xl font-medium transition-all duration-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Application Detail Modal Component
function ApplicationModal({ application, onClose, onUpdate, onDelete }: {
  application: Application
  onClose: () => void
  onUpdate: (notes: string) => void
  onDelete: (id: string) => void
}) {
  const [notes, setNotes] = useState(application.notes)

  const handleSave = () => {
    onUpdate(notes)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">{application.productName}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Client Name</label>
              <p className="text-slate-900">{application.clientName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Company</label>
              <p className="text-slate-900">{application.company}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <p className="text-slate-900">{application.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone</label>
              <p className="text-slate-900">{application.phone}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border mt-1 ${statusConfig[application.status].color}`}>
              {statusConfig[application.status].label}
            </span>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700">Documents</label>
            <div className="mt-2 space-y-2">
              {/* Show uploaded verification documents from analysis */}
              {application.analysisResult && application.analysisResult.ingredients && (
                <>
                  {application.analysisResult.ingredients.map((ingredient: any) => {
                    if (ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0) {
                      return ingredient.verificationDocuments.map((doc: any) => {
                        const getDocumentIcon = (filename: string) => {
                          const ext = filename.toLowerCase().split('.').pop()
                          if (ext === 'pdf') {
                            return (
                              <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )
                          } else if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
                            return (
                              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )
                          } else {
                            return (
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )
                          }
                        }

                        const getDocumentTypeBadge = (type: string) => {
                          const typeMap: Record<string, any> = {
                            'certificate': { color: 'bg-green-100 text-green-700', icon: '🏆', label: 'Certificate' },
                            'supplier_letter': { color: 'bg-blue-100 text-blue-700', icon: '📄', label: 'Supplier Letter' },
                            'lab_report': { color: 'bg-purple-100 text-purple-700', icon: '🔬', label: 'Lab Report' },
                            'other': { color: 'bg-gray-100 text-gray-700', icon: '📎', label: 'Other Document' }
                          }
                          const typeInfo = typeMap[type] || typeMap.other
                          return typeInfo
                        }

                        const docType = getDocumentTypeBadge(doc.type)
                        
                        return (
                          <div key={doc.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                            <div className="flex items-start space-x-3">
                              {getDocumentIcon(doc.filename)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-slate-800 truncate">
                                    {doc.filename}
                                  </span>
                                  <span className="text-xs text-slate-500 ml-2">
                                    {new Date(doc.uploadDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${docType.color}`}>
                                      {docType.icon} {docType.label}
                                    </span>
                                    <span className="text-xs text-slate-600">
                                      for {ingredient.name}
                                    </span>
                                  </div>
                                  <button 
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    onClick={() => {
                                      // TODO: Add document view functionality
                                      console.log('View document:', doc.filename)
                                    }}
                                  >
                                    View
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    }
                    return null
                  }).filter(Boolean)}
                </>
              )}
              
              {/* Show standard documents if no verification documents */}
              {(!application.analysisResult || 
                !application.analysisResult.ingredients ||
                !application.analysisResult.ingredients.some((ing: any) => ing.verificationDocuments?.length > 0)) && 
                application.documents.map((doc, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
                  <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm text-slate-700">{doc}</span>
                </div>
              ))}
              
              {/* Show if no documents at all */}
              {(!application.documents || application.documents.length === 0) && 
               (!application.analysisResult || 
                !application.analysisResult.ingredients ||
                !application.analysisResult.ingredients.some((ing: any) => ing.verificationDocuments?.length > 0)) && (
                <div className="text-sm text-slate-500 italic p-2">
                  No documents uploaded yet
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
              className="w-full mt-2 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Add notes about this application..."
            />
          </div>
          
          <div className="flex space-x-3">
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
              Start Analysis
            </button>
            <button 
              onClick={() => onDelete(application.id)}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// New Application Modal Component
function NewApplicationModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (data: Omit<Application, 'id' | 'createdAt' | 'updatedAt'>) => void
}) {
  const [formData, setFormData] = useState({
    clientName: '',
    company: '',
    productName: '',
    email: '',
    phone: '',
    status: 'new' as Application['status'],
    priority: 'normal' as Application['priority'],
    documents: [] as string[],
    notes: '',
    submittedDate: new Date().toISOString(),
    analysisResult: undefined
  })

  const [newDocument, setNewDocument] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.clientName || !formData.company || !formData.productName || !formData.email) {
      alert('Please fill in all required fields')
      return
    }
    onCreate(formData)
  }

  const addDocument = () => {
    if (newDocument.trim()) {
      setFormData({
        ...formData,
        documents: [...formData.documents, newDocument.trim()]
      })
      setNewDocument('')
    }
  }

  const removeDocument = (index: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">New Application</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Client Name *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
            <input
              type="text"
              value={formData.productName}
              onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Application['priority'] })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Application['status'] })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="new">New</option>
                <option value="reviewing">Under Review</option>
                <option value="approved">Approved</option>
                <option value="certified">Certified</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Documents</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                placeholder="Document name (e.g., ingredient_list.pdf)"
                className="flex-1 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addDocument}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {formData.documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">{doc}</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Additional notes about this application..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Create Application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}