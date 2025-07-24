'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { dataManager, Certificate, Application } from '@/lib/data-manager'

const statusConfig = {
  active: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Active' },
  expired: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Expired' },
  revoked: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Revoked' },
  pending: { color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'Pending' }
}

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    loadData()
    
    // Subscribe to data changes
    const unsubscribe = dataManager.subscribe(() => {
      loadData()
    })

    return unsubscribe
  }, [])

  const loadData = () => {
    setCertificates(dataManager.getCertificates())
    setApplications(dataManager.getApplications())
  }

  const createCertificateFromApplication = async (appId: string) => {
    const application = dataManager.getApplicationById(appId)
    if (!application) return

    setIsGeneratingPDF(true)
    
    // Simulate PDF generation time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate certificate
    const certificate = dataManager.generateCertificateFromApplication(application)
    
    setIsGeneratingPDF(false)
    alert(`Certificate ${certificate.certificateNumber} generated successfully!`)
  }

  const downloadPDF = async (cert: Certificate) => {
    // Simulate PDF download - in real app, this would fetch actual PDF
    const pdfContent = generatePDFContent(cert)
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${cert.certificateNumber}_Halal_Certificate.pdf`
    link.click()
    
    URL.revokeObjectURL(url)
  }

  const generatePDFContent = (cert: Certificate): string => {
    // Generate a mock PDF content string (in real app, use PDF library)
    return `
HALAL CERTIFICATE
Certificate Number: ${cert.certificateNumber}
Issue Date: ${new Date(cert.issuedDate).toLocaleDateString()}
Expiry Date: ${new Date(cert.expiryDate).toLocaleDateString()}

Client: ${cert.clientName}
Company: ${cert.company}
Product: ${cert.productName}

This certifies that the above product complies with Islamic dietary laws.

Status: ${cert.status.toUpperCase()}
Type: ${cert.certificateType.toUpperCase()}

Notes: ${cert.notes}
    `
  }

  const revokeCertificate = (certId: string) => {
    if (confirm('Are you sure you want to revoke this certificate?')) {
      dataManager.updateCertificate(certId, { status: 'revoked' })
      setShowModal(false)
    }
  }

  const deleteCertificate = (certId: string) => {
    if (confirm('Are you sure you want to delete this certificate? This action cannot be undone.')) {
      dataManager.deleteCertificate(certId)
      setShowModal(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: Certificate['status']) => {
    switch (status) {
      case 'active': return <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      case 'expired': return <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      case 'revoked': return <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      case 'pending': return <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    }
  }

  const getFilteredCertificates = () => {
    let filtered = certificates

    if (filterStatus !== 'all') {
      filtered = filtered.filter(cert => cert.status === filterStatus)
    }

    if (searchTerm) {
      filtered = filtered.filter(cert =>
        cert.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }

  const getCertifiedApplications = () => {
    return applications.filter(app => app.status === 'certified' && 
      !certificates.some(cert => cert.applicationId === app.id)
    )
  }

  const activeCerts = certificates.filter(cert => cert.status === 'active').length
  const expiredCerts = certificates.filter(cert => cert.status === 'expired').length
  const revokedCerts = certificates.filter(cert => cert.status === 'revoked').length
  const pendingCertifiable = getCertifiedApplications().length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-purple-800 bg-clip-text text-transparent">
                  Issue Certificates
                </h1>
                <p className="text-slate-600 text-sm">
                  Generate official halal certificates
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-lg shadow-emerald-500/25"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Certificate</span>
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
        {/* Ready to Certify Alert */}
        {pendingCertifiable > 0 && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-800">
                    {pendingCertifiable} Application{pendingCertifiable > 1 ? 's' : ''} Ready for Certification
                  </h3>
                  <p className="text-emerald-700">
                    These applications have been approved and are ready to receive certificates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
              >
                Generate Certificates
              </button>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="mb-8 flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search certificates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{certificates.length}</div>
                <div className="text-sm text-slate-600">Total Certificates</div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-lg">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-emerald-600">{activeCerts}</div>
                <div className="text-sm text-slate-600">Active</div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center bg-emerald-100 rounded-lg">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-amber-600">{expiredCerts}</div>
                <div className="text-sm text-slate-600">Expired</div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded-lg">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/60">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{revokedCerts}</div>
                <div className="text-sm text-slate-600">Revoked</div>
              </div>
              <div className="w-8 h-8 flex items-center justify-center bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="p-6 border-b border-slate-200/60 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900">Issued Certificates</h3>
            <p className="text-sm text-slate-600">Manage halal certification documents</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Certificate</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {getFilteredCertificates().map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-slate-900">{cert.certificateNumber}</div>
                        <div className="text-sm text-slate-500 capitalize">{cert.certificateType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">{cert.clientName}</div>
                        <div className="text-sm text-slate-500">{cert.company}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{cert.productName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full border ${statusConfig[cert.status].color}`}>
                        <div className="flex items-center justify-center">{getStatusIcon(cert.status)}</div>
                        <span>{statusConfig[cert.status].label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-900">{formatDate(cert.expiryDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedCert(cert)
                            setShowModal(true)
                          }}
                          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => downloadPDF(cert)}
                          className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteCertificate(cert.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Certificate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {getFilteredCertificates().length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p>No certificates found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Certificate Detail Modal */}
      {showModal && selectedCert && (
        <CertificateModal 
          certificate={selectedCert}
          onClose={() => setShowModal(false)}
          onRevoke={revokeCertificate}
          onDownload={downloadPDF}
        />
      )}

      {/* Create Certificate Modal */}
      {showCreateModal && (
        <CreateCertificateModal
          onClose={() => setShowCreateModal(false)}
          applications={applications}
          certifiedApplications={getCertifiedApplications()}
          onCreateFromApplication={createCertificateFromApplication}
          onCreateManual={(certData) => {
            // Handle manual certificate creation
            setShowCreateModal(false)
          }}
          isGenerating={isGeneratingPDF}
        />
      )}
    </div>
  )
}

// Certificate Detail Modal Component
function CertificateModal({ certificate, onClose, onRevoke, onDownload }: {
  certificate: Certificate
  onClose: () => void
  onRevoke: (id: string) => void
  onDownload: (cert: Certificate) => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Certificate Details</h2>
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
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{certificate.certificateNumber}</h3>
            <p className="text-slate-600">Official Halal Certificate</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Client Name</label>
              <p className="text-slate-900">{certificate.clientName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Company</label>
              <p className="text-slate-900">{certificate.company}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Product</label>
              <p className="text-slate-900">{certificate.productName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Type</label>
              <p className="text-slate-900 capitalize">{certificate.certificateType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Issued Date</label>
              <p className="text-slate-900">{new Date(certificate.issuedDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Expiry Date</label>
              <p className="text-slate-900">{new Date(certificate.expiryDate).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <p className="text-slate-900 p-3 bg-slate-50 rounded-lg">{certificate.notes}</p>
          </div>

          <div className="flex space-x-3">
            <button 
              onClick={() => onDownload(certificate)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Download PDF
            </button>
            {certificate.status === 'active' && (
              <button 
                onClick={() => onRevoke(certificate.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Revoke Certificate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Create Certificate Modal Component
function CreateCertificateModal({ onClose, applications, certifiedApplications, onCreateFromApplication, onCreateManual, isGenerating }: {
  onClose: () => void
  applications: Application[]
  certifiedApplications: Application[]
  onCreateFromApplication: (appId: string) => void
  onCreateManual: (data: any) => void
  isGenerating: boolean
}) {
  const [selectedApp, setSelectedApp] = useState<string>('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Issue New Certificate</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center transition-colors"
              disabled={isGenerating}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {certifiedApplications.length > 0 ? (
            <>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Ready for Certification</h3>
                <p className="text-slate-600 mb-4">Select an approved application to generate a certificate:</p>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {certifiedApplications.map(app => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedApp === app.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900">{app.productName}</h4>
                          <p className="text-sm text-slate-600">{app.company} - {app.clientName}</p>
                        </div>
                        <div className="text-sm text-slate-500">
                          {new Date(app.submittedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-3 px-4 rounded-lg font-medium transition-colors"
                  disabled={isGenerating}
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedApp && onCreateFromApplication(selectedApp)}
                  disabled={!selectedApp || isGenerating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate Certificate'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Applications Ready</h3>
              <p className="text-slate-600 mb-6">
                There are no certified applications ready for certificate generation. 
                Check the Application Pipeline to approve applications first.
              </p>
              <Link
                href="/dashboard/applications"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Go to Applications</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}