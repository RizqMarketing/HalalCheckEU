'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  result?: any
  error?: string
  previewData?: {
    type: 'text' | 'image' | 'table'
    content: string | any[]
  }
}

interface EnhancedBulkUploadProps {
  onFilesProcessed: (results: any[]) => void
  onError: (error: string) => void
  disabled?: boolean
  maxFiles?: number
  selectedClient?: any
}

const EnhancedBulkUpload: React.FC<EnhancedBulkUploadProps> = ({
  onFilesProcessed,
  onError,
  disabled = false,
  maxFiles = 10,
  selectedClient
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Supported file types with comprehensive coverage
  const acceptedFileTypes = {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'image/tiff': ['.tiff', '.tif'],
    'image/bmp': ['.bmp'],
    
    // Documents
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
    'text/csv': ['.csv'],
    'text/plain': ['.txt'],
    'application/json': ['.json'],
    'application/xml': ['.xml'],
    
    // Additional formats
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'text/tab-separated-values': ['.tsv'],
    'application/rtf': ['.rtf']
  }

  const maxFileSize = 50 * 1024 * 1024 // 50MB

  const processFile = async (file: File): Promise<any> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('clientId', selectedClient?.id || '')
    formData.append('fileName', file.name)
    formData.append('fileType', file.type)
    formData.append('fileSize', file.size.toString())

    const response = await fetch('http://localhost:3003/api/analysis/process-enhanced-file', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Processing failed: ${response.status} - ${errorText}`)
    }

    return await response.json()
  }

  const updateFileStatus = (fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...updates } : f
    ))
  }

  const processAllFiles = async () => {
    setIsProcessing(true)
    const results: any[] = []

    try {
      for (const uploadedFile of uploadedFiles) {
        if (uploadedFile.status === 'completed') {
          results.push(uploadedFile.result)
          continue
        }

        updateFileStatus(uploadedFile.id, { status: 'processing', progress: 0 })

        try {
          // Simulate progress updates
          for (let progress = 10; progress <= 90; progress += 20) {
            updateFileStatus(uploadedFile.id, { progress })
            await new Promise(resolve => setTimeout(resolve, 200))
          }

          const result = await processFile(uploadedFile.file)
          updateFileStatus(uploadedFile.id, { 
            status: 'completed', 
            progress: 100, 
            result,
            previewData: result.previewData 
          })
          results.push(result)

        } catch (error: any) {
          console.error(`Error processing ${uploadedFile.file.name}:`, error)
          updateFileStatus(uploadedFile.id, { 
            status: 'error', 
            error: error.message 
          })
        }
      }

      onFilesProcessed(results)

    } catch (error: any) {
      onError(`Bulk processing failed: ${error.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach((error: any) => {
        if (error.code === 'file-too-large') {
          onError(`File "${file.name}" is too large. Maximum size is 50MB.`)
        } else if (error.code === 'file-invalid-type') {
          onError(`File "${file.name}" has an unsupported format.`)
        } else {
          onError(`File "${file.name}": ${error.message}`)
        }
      })
    })

    // Add accepted files
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      id: crypto.randomUUID(),
      status: 'pending',
      progress: 0
    }))

    setUploadedFiles(prev => {
      const combined = [...prev, ...newFiles]
      if (combined.length > maxFiles) {
        onError(`Maximum ${maxFiles} files allowed. Some files were not added.`)
        return combined.slice(0, maxFiles)
      }
      return combined
    })

  }, [maxFiles, onError])

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    maxSize: maxFileSize,
    maxFiles,
    disabled: disabled || isProcessing,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const clearAllFiles = () => {
    setUploadedFiles([])
  }

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase()
    if (type.startsWith('image/')) {
      return (
        <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    } else if (type.includes('pdf')) {
      return (
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    } else if (type.includes('spreadsheet') || type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      return (
        <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    } else if (type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    } else {
      return (
        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
  }

  const getStatusBadge = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
      case 'processing':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Processing</span>
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Completed</span>
      case 'error':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Error</span>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const totalFiles = uploadedFiles.length
  const completedFiles = uploadedFiles.filter(f => f.status === 'completed').length
  const errorFiles = uploadedFiles.filter(f => f.status === 'error').length

  return (
    <div className="w-full space-y-6">
      {/* Enhanced Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-4 border-dashed rounded-3xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragActive || dropzoneActive 
            ? 'border-purple-400 bg-purple-50 scale-[1.02] shadow-2xl' 
            : 'border-slate-300 bg-slate-50 hover:border-purple-300 hover:bg-purple-25'
          }
          ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          {/* Animated Upload Icon */}
          <div className={`mx-auto w-20 h-20 flex items-center justify-center rounded-full transition-all duration-300 ${
            isDragActive ? 'bg-purple-100 scale-110' : 'bg-slate-100'
          }`}>
            <svg 
              className={`w-10 h-10 transition-all duration-300 ${
                isDragActive ? 'text-purple-600 animate-bounce' : 'text-slate-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {/* Dynamic Content */}
          <div>
            {isDragActive ? (
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-purple-700">Drop your files here!</h3>
                <p className="text-purple-600">Release to start ultra-intelligent processing</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800">Ultra-Smart Bulk Analysis</h3>
                <div className="space-y-2">
                  <p className="text-slate-600 font-medium">
                    Drag & drop files or click to browse
                  </p>
                  <p className="text-sm text-slate-500">
                    AI-powered extraction from images, PDFs, Excel, Word, and more
                  </p>
                </div>

                {/* Supported Formats Grid */}
                <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto pt-4">
                  <div className="flex flex-col items-center space-y-1 p-3 bg-white rounded-xl shadow-sm border">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Images</span>
                    <span className="text-xs text-slate-400">OCR</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1 p-3 bg-white rounded-xl shadow-sm border">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-600">PDFs</span>
                    <span className="text-xs text-slate-400">Text Extract</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1 p-3 bg-white rounded-xl shadow-sm border">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Excel</span>
                    <span className="text-xs text-slate-400">Data Parse</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1 p-3 bg-white rounded-xl shadow-sm border">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-slate-600">Word</span>
                    <span className="text-xs text-slate-400">Smart Read</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* File Limits */}
          <div className="text-sm text-slate-500 space-y-1">
            <p>Maximum {maxFiles} files • 50MB per file</p>
            <p>Supports: JPG, PNG, PDF, Excel, Word, CSV, and more</p>
          </div>
        </div>
      </div>

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h4 className="text-lg font-bold text-slate-800">Uploaded Files</h4>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                  {totalFiles} files
                </span>
                {completedFiles > 0 && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                    {completedFiles} completed
                  </span>
                )}
                {errorFiles > 0 && (
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                    {errorFiles} errors
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                {!isProcessing && uploadedFiles.some(f => f.status === 'pending') && (
                  <button
                    onClick={processAllFiles}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm"
                  >
                    Process All Files
                  </button>
                )}
                <button
                  onClick={clearAllFiles}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* File Items */}
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {getFileIcon(uploadedFile.file)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <div className="flex items-center space-x-3 mt-1">
                        <p className="text-xs text-slate-500">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                        {getStatusBadge(uploadedFile.status)}
                        {uploadedFile.status === 'processing' && (
                          <div className="flex items-center space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-purple-600 h-1.5 rounded-full transition-all duration-300" 
                                style={{ width: `${uploadedFile.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-slate-500">{uploadedFile.progress}%</span>
                          </div>
                        )}
                      </div>
                      {uploadedFile.error && (
                        <p className="text-xs text-red-600 mt-1">{uploadedFile.error}</p>
                      )}
                      {uploadedFile.previewData && uploadedFile.status === 'completed' && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-700 font-medium">
                            ✅ Extracted: {uploadedFile.previewData.type === 'table' ? 
                              `${uploadedFile.previewData.content.length} products` :
                              `${uploadedFile.previewData.content.slice(0, 100)}...`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="ml-4 p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Progress */}
      {isProcessing && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg className="animate-spin w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-purple-800">Ultra-Smart Processing in Progress</h4>
              <p className="text-purple-600">AI is extracting and analyzing your files with advanced intelligence...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedBulkUpload