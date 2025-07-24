'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { dataManager, Application } from '@/lib/data-manager'

const statusConfig = {
  new: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'New Application' },
  reviewing: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Under Review' },
  approved: { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Approved' },
  certified: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Certified' },
  rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [draggedApp, setDraggedApp] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showNewAppModal, setShowNewAppModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadApplications()
    
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
      dataManager.updateApplication(draggedApp, { status: newStatus })
      setDraggedApp(null)
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

  const columns: { status: Application['status']; title: string; icon: JSX.Element }[] = [
    { 
      status: 'new', 
      title: 'New Applications', 
      icon: <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    },
    { 
      status: 'reviewing', 
      title: 'Under Review', 
      icon: <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    },
    { 
      status: 'approved', 
      title: 'Approved', 
      icon: <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    },
    { 
      status: 'certified', 
      title: 'Certified', 
      icon: <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
    }
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
                  Application Pipeline
                </h1>
                <p className="text-slate-600 text-sm">
                  Certification workflow management
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
          {columns.map(column => (
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {columns.map(column => (
            <div
              key={column.status}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              <div className="p-4 border-b border-slate-200/60 bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-6 h-6">{column.icon}</div>
                  <h3 className="font-bold text-slate-900">{column.title}</h3>
                  <span className="text-sm text-slate-500">
                    ({getApplicationsByStatus(column.status).length})
                  </span>
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
                        <span>{app.documents.length} documents</span>
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
              {application.documents.map((doc, index) => (
                <div key={index} className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg">
                  <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-sm text-slate-700">{doc}</span>
                </div>
              ))}
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