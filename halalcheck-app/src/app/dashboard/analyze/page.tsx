'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { useOrganization, useOrganizationText } from '@/contexts/organization-context'
import { dataManager } from '@/lib/data-manager'
import { enhanceAnalysisWithAIContext, formatIslamicReference } from '@/lib/islamic-jurisprudence'

// Type definitions
interface AnalysisResult {
  id: string
  product: string
  overall: 'APPROVED' | 'PROHIBITED' | 'REQUIRES_REVIEW'
  ingredients: Array<{
    name: string
    status: 'APPROVED' | 'PROHIBITED' | 'REQUIRES_REVIEW'
    reason: string
    risk: 'LOW' | 'MEDIUM' | 'HIGH'
    category: string
    islamicReferences?: any[]
    alternativeSuggestions?: string[]
    confidence: number
    // Document verification for questionable ingredients
    verificationDocuments?: Array<{
      id: string
      filename: string
      uploadDate: string
      type: 'certificate' | 'supplier_letter' | 'lab_report' | 'other'
      previewUrl?: string
      fileType?: string
      fileSize?: number
    }>
    verificationStatus?: 'verified'
    verificationNotes?: string
  }>
  warnings: string[]
  recommendations: string[]
  confidence: number
  timestamp: string
  analysis_time: number
  cost_savings: number
  time_savings: number
  islamic_guidance?: string
  analysis?: string
  islamicCompliance?: {
    totalIngredients: number
    halalCount: number
    haramCount: number
    questionableCount: number
    requiresVerification: number
    enhancedIngredients: number
  }
}

interface Client {
  id: string
  name: string
  company: string
  email: string
  phone?: string
}

interface AnalysisState {
  productName: string
  ingredients: string
  selectedClient: Client | null
  analysisResults: AnalysisResult[]
  bulkMode: boolean
  bulkResults: AnalysisResult[]
  bulkSelectedClient: Client | null
  bulkClientSearch: string
  clientSearch: string
  lastSaved: number
  showCreateClient: boolean
  newClient: {
    name: string
    company: string
    email: string
    phone: string
  }
}


export default function AnalyzePage() {
  const router = useRouter()
  const { config, terminology } = useOrganization()
  const orgText = useOrganizationText()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkFileInputRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts will be added after function definitions to avoid dependency issues

  // State management with localStorage persistence (24-hour expiry)
  const [state, setState] = useState<AnalysisState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('halalcheck_analysis_state')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          const hoursPassed = (Date.now() - parsed.lastSaved) / (1000 * 60 * 60)
          if (hoursPassed < 24) {
            return parsed
          }
        } catch (e) {
          console.error('Error parsing saved state:', e)
        }
      }
    }

    return {
      productName: '',
      ingredients: '',
      selectedClient: null,
      analysisResults: [],
      bulkMode: false,
      bulkResults: [],
      bulkSelectedClient: null,
      bulkClientSearch: '',
      clientSearch: '',
      lastSaved: Date.now(),
      showCreateClient: false,
      newClient: {
        name: '',
        company: '',
        email: '',
        phone: ''
      }
    }
  })

  const [analyzing, setAnalyzing] = useState(false)
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false)
  const [expandedBulkResults, setExpandedBulkResults] = useState<Set<string>>(new Set())
  const [refreshKey, setRefreshKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  // Debug effect to track state changes
  useEffect(() => {
    if (state.bulkResults.length > 0) {
      console.log('📄 STATE CHANGE: Bulk results updated:', state.bulkResults.length, 'results')
      state.bulkResults.forEach((result, idx) => {
        const docsCount = result.ingredients.reduce((count, ing) => count + (ing.verificationDocuments?.length || 0), 0)
        console.log(`📄 STATE CHANGE: Result ${idx}: ${result.product} has ${docsCount} total documents`)
        result.ingredients.forEach(ing => {
          if (ing.verificationDocuments && ing.verificationDocuments.length > 0) {
            console.log(`📄 STATE CHANGE: Ingredient "${ing.name}" has ${ing.verificationDocuments.length} documents:`, ing.verificationDocuments)
          }
        })
      })
    }
  }, [state.bulkResults, refreshKey])
  const [contextualError, setContextualError] = useState<{message: string, context: string} | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Comprehensive client list
  const [clients, setClients] = useState<Client[]>(() => {
    // Load clients from localStorage
    const savedClients = localStorage.getItem('halalcheck_clients')
    if (savedClients) {
      try {
        return JSON.parse(savedClients)
      } catch (error) {
        console.error('Error loading clients:', error)
      }
    }
    // Default clients if none saved
    return [
      { id: '1', name: 'Ahmed Al-Rashid', company: 'Halal Food Co.', email: 'ahmed@halalfood.com', phone: '+44 20 7946 0958' },
      { id: '2', name: 'Fatima Hassan', company: 'Pure Foods Ltd.', email: 'fatima@purefoods.com', phone: '+44 121 234 5678' },
      { id: '3', name: 'Omar Abdullah', company: 'Islamic Certification', email: 'omar@islamiccert.org', phone: '+44 161 876 5432' },
      { id: '4', name: 'Amina Khan', company: 'Tayyib Products', email: 'amina@tayyib.com', phone: '+44 114 234 5678' },
      { id: '5', name: 'Muhammad Ali', company: 'Halal Express', email: 'muhammad@halalexpress.eu', phone: '+32 2 123 4567' },
      { id: '6', name: 'Sarah Mitchell', company: 'Global Foods Inc.', email: 'sarah@globalfoods.com', phone: '+44 20 3456 7890' },
      { id: '7', name: 'Yusuf Ahmed', company: 'Organic Halal Ltd.', email: 'yusuf@organichalal.co.uk', phone: '+44 113 234 5678' },
      { id: '8', name: 'Khadija Osman', company: 'Mediterranean Foods', email: 'khadija@medfoods.eu', phone: '+33 1 45 67 89 00' }
    ]
  })

  // Enhanced API call to backend with full error handling
  const callAnalysisAPI = async (productName: string, ingredients: string) => {
    try {
      setError(null)
      console.log('Making enhanced API call to backend...')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analysis/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productName,
          ingredients
        }),
      })

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('Enhanced API Response:', result)
      return result
    } catch (error: any) {
      console.error('API call failed:', error)
      setError(`Analysis failed: ${error.message}`)
      throw error
    }
  }

  // Save state to localStorage with timestamp
  const saveState = useCallback((updates: Partial<AnalysisState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates, lastSaved: Date.now() }
      localStorage.setItem('halalcheck_analysis_state', JSON.stringify(newState))
      return newState
    })
  }, [])

  // Enhanced analyze ingredients function with full Islamic context
  const analyzeIngredients = async () => {
    if (!state.productName.trim() || !state.ingredients.trim()) {
      setError('Please provide both product name and ingredients')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      console.log('Starting comprehensive analysis...')
      
      // Start both the API call and minimum loading time in parallel
      const [result] = await Promise.all([
        callAnalysisAPI(state.productName, state.ingredients),
        new Promise(resolve => setTimeout(resolve, 2000)) // Minimum 2 second loading
      ])
      
      // Use the server's actual processing time
      const actualAnalysisTime = result.processingTime || 3.2
      
      // Enhanced transformation with full Islamic context
      const transformedResult: AnalysisResult = {
        id: crypto.randomUUID(),
        product: state.productName,
        overall: result.overallStatus === 'HALAL' ? 'APPROVED' : 
                result.overallStatus === 'HARAM' ? 'PROHIBITED' : 
                result.overallStatus === 'MASHBOOH' ? 'REQUIRES_REVIEW' : 'REQUIRES_REVIEW',
        ingredients: (result.ingredients || []).map((ing: any) => ({
          name: ing.name,
          status: ing.status === 'HALAL' ? 'APPROVED' : 
                 ing.status === 'HARAM' ? 'PROHIBITED' : 'REQUIRES_REVIEW',
          reason: ing.reasoning || 'Analysis completed with Islamic jurisprudence',
          risk: ing.confidence > 80 ? 'LOW' : ing.confidence > 50 ? 'MEDIUM' : 'HIGH',
          category: ing.category || 'General',
          islamicReferences: ing.islamicReferences || [],
          alternativeSuggestions: ing.alternativeSuggestions || [],
          confidence: ing.confidence || 70
        })),
        warnings: result.recommendations?.filter((r: string) => r.includes('prohibited') || r.includes('should not')) || [],
        recommendations: result.recommendations || [],
        confidence: result.confidenceScore || 85,
        timestamp: new Date().toISOString(),
        analysis_time: Number(actualAnalysisTime.toFixed(1)), // Use actual processing time
        cost_savings: Math.floor(Math.random() * 100) + 50,
        time_savings: Math.floor(Math.random() * 30) + 10,
        islamic_guidance: result.islamic_guidance || '',
        analysis: result.analysis || 'Comprehensive halal analysis completed',
        islamicCompliance: result.islamicCompliance || {
          totalIngredients: (result.ingredients || []).length,
          halalCount: (result.ingredients || []).filter((ing: any) => ing.status === 'HALAL').length,
          haramCount: (result.ingredients || []).filter((ing: any) => ing.status === 'HARAM').length,
          questionableCount: (result.ingredients || []).filter((ing: any) => ing.status === 'MASHBOOH').length,
          requiresVerification: (result.ingredients || []).filter((ing: any) => ing.status === 'MASHBOOH').length,
          enhancedIngredients: 0
        }
      }

      // Enhance ingredients with comprehensive AI context
      transformedResult.ingredients = transformedResult.ingredients.map(ingredient => 
        enhanceAnalysisWithAIContext(ingredient)
      )

      console.log('Comprehensive analysis completed successfully')
      
      // Update state with new results
      saveState({
        analysisResults: [transformedResult, ...state.analysisResults]
      })
      
    } catch (error: any) {
      console.error('Analysis failed:', error)
      setError(`Analysis failed: ${error.message}`)
    } finally {
      setAnalyzing(false)
    }
  }

  // Enhanced file upload handling with multiple formats
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, isBulk = false) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setError(null)
      
      if (isBulk) {
        setBulkAnalyzing(true)
        console.log('Starting enhanced bulk file analysis...')
        
        const formData = new FormData()
        formData.append('file', file)
        
        // Start both the API call and minimum loading time in parallel
        const [response] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analysis/analyze-file`, {
            method: 'POST',
            body: formData,
          }),
          new Promise(resolve => setTimeout(resolve, 2500)) // Minimum 2.5 second loading for file processing
        ])
        
        if (!response.ok) {
          throw new Error(`Enhanced file analysis failed: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('🔄 NEW UPLOAD: Enhanced bulk analysis result:', result)
        console.log('🔄 NEW UPLOAD: Result keys:', Object.keys(result))
        console.log('🔄 NEW UPLOAD: Has analysisResults?', !!result.analysisResults)
        console.log('🔄 NEW UPLOAD: AnalysisResults length:', result.analysisResults?.length || 0)
        console.log('🔄 NEW UPLOAD: Current state before update:', {
          bulkResultsCount: state.bulkResults.length,
          soloResultsCount: state.analysisResults.length
        })
        if (result.analysisResults?.[0]) {
          console.log('🔄 NEW UPLOAD: First analysis result:', result.analysisResults[0])
        }
        
        // Transform and save bulk results with full context from enhanced API
        const transformedResults: AnalysisResult[] = []
        
        if (result.analysisResults && result.analysisResults.length > 0) {
          // Process multiple products from enhanced analysis (new format)
          console.log('Processing new analysisResults format')
          for (const productResult of result.analysisResults) {
            const analysis = productResult.analysis
            
            const transformedResult: AnalysisResult = {
              id: crypto.randomUUID(),
              product: productResult.productName || file.name,
              overall: analysis.overallStatus === 'HALAL' ? 'APPROVED' : 
                      analysis.overallStatus === 'HARAM' ? 'PROHIBITED' : 
                      analysis.overallStatus === 'MASHBOOH' ? 'REQUIRES_REVIEW' : 'REQUIRES_REVIEW',
              ingredients: (analysis.ingredients || []).map((ing: any) => ({
                name: ing.name,
                status: ing.status === 'HALAL' ? 'APPROVED' : 
                       ing.status === 'HARAM' ? 'PROHIBITED' : 'REQUIRES_REVIEW',
                reason: ing.reasoning || 'Enhanced analysis completed',
                risk: ing.confidence > 80 ? 'LOW' : ing.confidence > 50 ? 'MEDIUM' : 'HIGH',
                category: ing.category || 'General',
                islamicReferences: ing.islamicReferences || [],
                alternativeSuggestions: ing.alternativeSuggestions || [],
                confidence: ing.confidence || 70
              })),
              warnings: analysis.recommendations?.filter((r: string) => r.includes('prohibited') || r.includes('should not')) || [],
              recommendations: analysis.recommendations || [],
              confidence: analysis.confidenceScore || 85,
              timestamp: new Date().toISOString(),
              analysis_time: Math.random() * 5 + 2,
              cost_savings: Math.floor(Math.random() * 100) + 50,
              time_savings: Math.floor(Math.random() * 30) + 10,
              islamic_guidance: '',
              analysis: `Processed ${result.originalFilename} - ${analysis.overallStatus} classification`
            }
            
            transformedResults.push(transformedResult)
          }
        } else if (result.products && result.products.length > 0) {
          // Handle legacy products format
          console.log('Processing legacy products format')
          for (const product of result.products) {
            const analysis = product.analysis || {}
            
            const transformedResult: AnalysisResult = {
              id: crypto.randomUUID(),
              product: product.productName || file.name,
              overall: analysis.overallStatus === 'HALAL' ? 'APPROVED' : 
                      analysis.overallStatus === 'HARAM' ? 'PROHIBITED' : 
                      analysis.overallStatus === 'MASHBOOH' ? 'REQUIRES_REVIEW' : 'REQUIRES_REVIEW',
              ingredients: (analysis.ingredients || []).map((ing: any) => ({
                name: ing.name,
                status: ing.status === 'HALAL' ? 'APPROVED' : 
                       ing.status === 'HARAM' ? 'PROHIBITED' : 'REQUIRES_REVIEW',
                reason: ing.reasoning || ing.reason || 'Analysis completed',
                risk: ing.confidence > 80 ? 'LOW' : ing.confidence > 50 ? 'MEDIUM' : 'HIGH',
                category: ing.category || 'General',
                islamicReferences: ing.islamicReferences || [],
                alternativeSuggestions: ing.alternativeSuggestions || [],
                confidence: ing.confidence || 70
              })),
              warnings: analysis.recommendations?.filter((r: string) => r.includes('prohibited') || r.includes('should not')) || [],
              recommendations: analysis.recommendations || [],
              confidence: analysis.confidenceScore || 85,
              timestamp: new Date().toISOString(),
              analysis_time: Math.random() * 5 + 2,
              cost_savings: Math.floor(Math.random() * 100) + 50,
              time_savings: Math.floor(Math.random() * 30) + 10,
              islamic_guidance: '',
              analysis: `Processed ${file.name} - ${analysis.overallStatus || 'Unknown'} classification`
            }
            
            transformedResults.push(transformedResult)
          }
        } else {
          // Fallback for no products found
          console.log('No products found, using fallback')
          const transformedResult: AnalysisResult = {
            id: crypto.randomUUID(),
            product: file.name,
            overall: 'REQUIRES_REVIEW',
            ingredients: [],
            warnings: ['Could not extract ingredients from file'],
            recommendations: ['Please verify file format and try again'],
            confidence: 50,
            timestamp: new Date().toISOString(),
            analysis_time: 1,
            cost_savings: 0,
            time_savings: 0,
            islamic_guidance: '',
            analysis: 'File processing incomplete'
          }
          transformedResults.push(transformedResult)
        }
        
        // Auto-expand new results to show detailed analysis
        const newExpandedSet = new Set(expandedBulkResults)
        transformedResults.forEach(result => {
          newExpandedSet.add(result.id)
        })
        setExpandedBulkResults(newExpandedSet)
        
        // Check if this is a fresh start (no existing bulk results) or an addition
        const shouldReplaceResults = state.bulkResults.length === 0
        
        console.log('🔄 SAVE STATE: Decision:', shouldReplaceResults ? 'REPLACE (fresh start)' : 'APPEND (adding to existing)')
        console.log('🔄 SAVE STATE: Current bulk results count:', state.bulkResults.length)
        console.log('🔄 SAVE STATE: New results count:', transformedResults.length)
        
        saveState({
          bulkResults: shouldReplaceResults ? transformedResults : [...transformedResults, ...state.bulkResults]
        })
        
        console.log('🔄 SAVE STATE: Final bulk results count:', shouldReplaceResults ? transformedResults.length : transformedResults.length + state.bulkResults.length)
        
      } else {
        // Single file analysis - extract text and populate form
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productName', state.productName || file.name)
        
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/analysis/analyze-file`;
        console.log('🔗 NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);
        console.log('🔗 Frontend attempting to connect to:', apiUrl);
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData,
        }).catch(error => {
          console.error('🚨 Fetch error details:', error);
          throw new Error(`Network error: ${error.message}`);
        });
        
        if (!response.ok) {
          throw new Error(`File processing failed: ${response.statusText}`)
        }
        
        const result = await response.json()
        console.log('Enhanced file processing result:', result)
        
        // If ingredients were extracted, populate the form
        if (result.ingredients && result.ingredients.length > 0) {
          saveState({
            ingredients: result.ingredients.join(', '),
            productName: state.productName || result.product || file.name.replace(/\.[^/.]+$/, "")
          })
        }
      }
      
    } catch (error: any) {
      console.error('File upload error:', error)
      setError(`File processing failed: ${error.message}`)
    } finally {
      setBulkAnalyzing(false)
    }
    
    // Reset file input
    event.target.value = ''
  }

  // Function to recalculate overall status based on document uploads
  const recalculateOverallStatus = (result: AnalysisResult): 'APPROVED' | 'PROHIBITED' | 'REQUIRES_REVIEW' => {
    const haramIngredients = result.ingredients.filter(ing => ing.status === 'PROHIBITED')
    const mashboohIngredients = result.ingredients.filter(ing => ing.status === 'REQUIRES_REVIEW')
    
    // Any haram ingredient makes the product prohibited
    if (haramIngredients.length > 0) {
      return 'PROHIBITED'
    }
    
    // Check if all mashbooh ingredients have at least 1 verification document
    const unverifiedMashbooh = mashboohIngredients.filter(ing => 
      !ing.verificationDocuments || ing.verificationDocuments.length === 0
    )
    
    if (unverifiedMashbooh.length > 0) {
      return 'REQUIRES_REVIEW' // Still needs verification
    }
    
    return 'APPROVED' // All ingredients are halal or verified
  }

  // Document upload handler for questionable ingredients
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, analysisId: string, ingredientName: string) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      console.log(`Uploading verification document for ${ingredientName} in analysis ${analysisId}`)
      console.log('Current bulk results:', state.bulkResults.length)
      
      // Create document preview URL
      const documentPreviewUrl = URL.createObjectURL(file)
      console.log('📄 Document preview URL created:', documentPreviewUrl)
      console.log('📄 File details:', {
        name: file.name,
        type: file.type,
        size: file.size
      })
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('analysisId', analysisId)
      formData.append('ingredientName', ingredientName)
      formData.append('documentType', 'certificate') // Default type
      
      // Upload to backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/verification/upload-document`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`Document upload failed: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('Document uploaded successfully:', result)
      
      // Show success message
      setContextualError({
        message: `✅ Document uploaded successfully! ${ingredientName} is now verified as Halal.`,
        context: 'save-success'
      })
      
      // Clear success message after 3 seconds
      setTimeout(() => setContextualError(null), 3000)
      
      // Update the analysis results with the new document and recalculate overall status
      setState(prevState => ({
        ...prevState,
        analysisResults: prevState.analysisResults.map(analysis => {
          if (analysis.id === analysisId) {
            const updatedAnalysis = {
              ...analysis,
              ingredients: analysis.ingredients.map(ingredient => {
                if (ingredient.name === ingredientName) {
                  return {
                    ...ingredient,
                    verificationDocuments: [
                      ...(ingredient.verificationDocuments || []),
                      {
                        id: result.documentId || crypto.randomUUID(),
                        filename: file.name,
                        uploadDate: new Date().toISOString(),
                        type: 'certificate' as const,
                        previewUrl: documentPreviewUrl,
                        fileType: file.type,
                        fileSize: file.size
                      }
                    ],
                    verificationStatus: 'verified' as const,
                    // Change to APPROVED (HALAL) when document is uploaded
                    status: 'APPROVED' as const
                  }
                }
                return ingredient
              })
            }
            
            // Recalculate overall status based on all ingredients and their documentation
            updatedAnalysis.overall = recalculateOverallStatus(updatedAnalysis)
            
            return updatedAnalysis
          }
          return analysis
        })
      }))
      
      // Also update bulk results if this is a bulk analysis (match solo analysis logic exactly)
      setState(prevState => ({
        ...prevState,
        bulkResults: prevState.bulkResults.map(bulkResult => {
          if (bulkResult.id === analysisId) {
            const updatedBulkResult = {
              ...bulkResult,
              ingredients: bulkResult.ingredients.map(ingredient => {
                if (ingredient.name === ingredientName) {
                  const newDoc = {
                    id: result.documentId || crypto.randomUUID(),
                    filename: file.name,
                    uploadDate: new Date().toISOString(),
                    type: 'certificate' as const,
                    previewUrl: documentPreviewUrl,
                    fileType: file.type,
                    fileSize: file.size
                  }
                  console.log('📄 BULK STATE: Adding document to ingredient:', ingredientName, 'New doc:', newDoc)
                  const updatedIngredient = {
                    ...ingredient,
                    verificationDocuments: [
                      ...(ingredient.verificationDocuments || []),
                      newDoc
                    ],
                    verificationStatus: 'verified' as const,
                    // Change to APPROVED (HALAL) when document is uploaded
                    status: 'APPROVED' as const
                  }
                  console.log('📄 BULK STATE: Updated ingredient:', updatedIngredient)
                  return updatedIngredient
                }
                return ingredient
              })
            }
            
            // Recalculate overall status based on all ingredients and their documentation
            updatedBulkResult.overall = recalculateOverallStatus(updatedBulkResult)
            
            return updatedBulkResult
          }
          return bulkResult
        })
      }))
      
      // Force component re-render
      setRefreshKey(prev => prev + 1)
      
      console.log(`📄 Document uploaded for ${ingredientName}: ${file.name}`)
      console.log('📄 Checking if document has previewUrl:', {
        hasPreviewUrl: !!documentPreviewUrl,
        fileType: file.type,
        fileName: file.name
      })
      
    } catch (error: any) {
      console.error('Document upload error:', error)
      setError(`Document upload failed: ${error.message}`)
    }
    
    // Reset file input
    event.target.value = ''
  }

  // Client management functions
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(state.clientSearch.toLowerCase()) ||
    client.company.toLowerCase().includes(state.clientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(state.clientSearch.toLowerCase())
  )

  const filteredBulkClients = clients.filter(client => 
    client.name.toLowerCase().includes(state.bulkClientSearch.toLowerCase()) ||
    client.company.toLowerCase().includes(state.bulkClientSearch.toLowerCase()) ||
    client.email.toLowerCase().includes(state.bulkClientSearch.toLowerCase())
  )

  // Create new client function
  const createNewClient = () => {
    if (!state.newClient.name.trim() || !state.newClient.email.trim()) {
      setContextualError({
        message: 'Please provide at least name and email for the new client',
        context: 'client-creation'
      })
      return
    }

    const newClient: Client = {
      id: crypto.randomUUID(),
      name: state.newClient.name.trim(),
      company: state.newClient.company.trim() || state.newClient.name.trim(),
      email: state.newClient.email.trim(),
      phone: state.newClient.phone.trim()
    }

    // Add to clients list and persist to localStorage
    const updatedClients = [...clients, newClient]
    setClients(updatedClients)
    localStorage.setItem('halalcheck_clients', JSON.stringify(updatedClients))
    
    // Clear contextual errors and select the new client
    setContextualError(null)
    saveState({
      selectedClient: newClient,
      showCreateClient: false,
      newClient: { name: '', company: '', email: '', phone: '' },
      clientSearch: ''
    })
  }

  // Determine intelligent status based on analysis completion
  const determineApplicationStatus = (result: AnalysisResult) => {
    // Count mashbooh ingredients that need documentation
    const mashboohIngredients = result.ingredients.filter(ingredient => {
      const status = ingredient.status?.toUpperCase() || ''
      return status === 'MASHBOOH' || 
             status === 'REQUIRES_REVIEW' || 
             status === 'QUESTIONABLE' ||
             status.includes('QUESTION') ||
             status.includes('REVIEW') ||
             status.includes('DOUBTFUL')
    })

    // Count how many mashbooh ingredients have uploaded documents
    const documentedMashboohIngredients = mashboohIngredients.filter(ingredient => 
      ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0
    )

    // Determine status based on completion (using lowercase for data manager compatibility)
    if (mashboohIngredients.length === 0) {
      // No questionable ingredients - can be approved directly
      return 'approved'
    } else if (documentedMashboohIngredients.length === mashboohIngredients.length) {
      // All questionable ingredients have documentation - ready for approval
      return 'approved'
    } else {
      // Some questionable ingredients missing documentation - needs review
      return 'reviewing'
    }
  }

  // Save analysis to applications with optional client assignment (only for certification bodies)
  const saveToApplications = async (result: AnalysisResult, client?: Client | null) => {
    try {
      setContextualError(null) // Clear any existing contextual errors
      
      // For certification bodies, require client assignment
      if (config.type === 'certification-body') {
        const selectedClient = client || state.selectedClient
        if (!selectedClient) {
          setContextualError({
            message: 'Please select a client before saving to applications',
            context: 'save-button'
          })
          return
        }
      }

      // Determine intelligent status based on documentation completeness
      const intelligentStatus = determineApplicationStatus(result)
      const mashboohCount = result.ingredients.filter(ing => {
        const status = ing.status?.toUpperCase() || ''
        return status === 'MASHBOOH' || status === 'QUESTIONABLE' || status.includes('REVIEW')
      }).length

      const selectedClient = client || state.selectedClient
      
      const applicationData = {
        clientName: config.type === 'certification-body' && selectedClient ? selectedClient.name : 'Internal Product',
        company: config.type === 'certification-body' && selectedClient ? selectedClient.company : 'Internal Development',
        productName: result.product,
        email: config.type === 'certification-body' && selectedClient ? selectedClient.email : '',
        phone: config.type === 'certification-body' && selectedClient ? selectedClient.phone || '' : '',
        submittedDate: new Date().toISOString(),
        status: intelligentStatus,
        priority: mashboohCount > 0 ? 'high' as const : 'normal' as const,
        documents: [],
        analysisResult: result,
        notes: `Analysis completed with ${result.ingredients.length} ingredients processed. ${mashboohCount > 0 ? `${mashboohCount} ingredients require documentation.` : 'All ingredients cleared for approval.'}`
      }

      const savedApplication = dataManager.addApplication(applicationData)
      console.log('Saved to applications with intelligent status:', savedApplication)
      
      // Show enhanced success message with status
      const statusText = intelligentStatus === 'approved' 
        ? '✅ Approved and saved' 
        : '🔍 Saved for review (missing documentation)'
        
      setContextualError({
        message: `${statusText} "${result.product}" to ${terminology.pipelineName}! View in Applications →`,
        context: 'save-success'
      })
      setTimeout(() => setContextualError(null), 6000)
      
      // Auto-navigate to applications after delay (optional)
      // setTimeout(() => router.push('/dashboard/applications'), 2000)
      
    } catch (error) {
      console.error('Error saving to applications:', error)
      setContextualError({
        message: 'Failed to save to applications',
        context: 'save-button'
      })
    }
  }

  // Save all analysis results to pipeline at once
  const saveAllResults = async () => {
    try {
      // For certification bodies, require client assignment
      if (config.type === 'certification-body' && !state.selectedClient) {
        setContextualError({
          message: 'Please select a client before saving all results',
          context: 'save-button'
        })
        return
      }

      const savedApplications = []
      let approvedCount = 0
      let reviewCount = 0
      
      for (const result of state.analysisResults) {
        // Determine intelligent status for each result
        const intelligentStatus = determineApplicationStatus(result)
        const mashboohCount = result.ingredients.filter(ing => {
          const status = ing.status?.toUpperCase() || ''
          return status === 'MASHBOOH' || status === 'QUESTIONABLE' || status.includes('REVIEW')
        }).length

        if (intelligentStatus === 'approved') approvedCount++
        else reviewCount++

        const applicationData = {
          clientName: config.type === 'certification-body' && state.selectedClient ? state.selectedClient.name : 'Internal Product',
          company: config.type === 'certification-body' && state.selectedClient ? state.selectedClient.company : 'Internal Development',
          productName: result.product,
          email: config.type === 'certification-body' && state.selectedClient ? state.selectedClient.email : '',
          phone: config.type === 'certification-body' && state.selectedClient ? state.selectedClient.phone || '' : '',
          submittedDate: new Date().toISOString(),
          status: intelligentStatus,
          priority: mashboohCount > 0 ? 'high' as const : 'normal' as const,
          documents: [],
          analysisResult: result,
          notes: `Bulk analysis completed with ${result.ingredients.length} ingredients processed. ${mashboohCount > 0 ? `${mashboohCount} ingredients require documentation.` : 'All ingredients cleared for approval.'}`
        }

        const savedApplication = dataManager.addApplication(applicationData)
        savedApplications.push(savedApplication)
      }

      console.log('Bulk saved to applications:', savedApplications)
      
      // Show enhanced success message with status breakdown
      const statusMessage = approvedCount > 0 && reviewCount > 0 
        ? `✅ Saved ${state.analysisResults.length} analyses: ${approvedCount} approved, ${reviewCount} under review`
        : approvedCount > 0 
        ? `✅ All ${state.analysisResults.length} analyses approved and saved!`
        : `✅ Saved ${state.analysisResults.length} analyses for review`
        
      setContextualError({
        message: `${statusMessage} View in ${terminology.pipelineName} →`,
        context: 'save-success'
      })
      setTimeout(() => setContextualError(null), 8000)
      
    } catch (error) {
      console.error('Error bulk saving to applications:', error)
      setContextualError({
        message: 'Failed to save all results to applications',
        context: 'save-button'
      })
    }
  }


  // Clear functions with different scopes
  const clearSingleAnalysis = () => {
    saveState({
      productName: '',
      ingredients: '',
      selectedClient: null,
      analysisResults: [],
      clientSearch: ''
    })
    setError(null)
  }
  
  // Delete a single analysis result
  const deleteAnalysisResult = (resultId: string) => {
    saveState({
      ...state,
      analysisResults: state.analysisResults.filter(result => result.id !== resultId)
    })
  }
  
  // Delete a bulk analysis result
  const deleteBulkResult = (resultId: string) => {
    console.log('🗑️ DELETING: Bulk result with ID:', resultId)
    console.log('🗑️ BEFORE DELETE: Current bulk results count:', state.bulkResults.length)
    
    const updatedResults = state.bulkResults.filter(result => result.id !== resultId)
    console.log('🗑️ AFTER DELETE: New bulk results count:', updatedResults.length)
    
    saveState({
      ...state,
      bulkResults: updatedResults
    })
    setRefreshKey(prev => prev + 1)
    
    // Clear any related expanded states
    setExpandedBulkResults(prev => {
      const newSet = new Set(prev)
      newSet.delete(resultId)
      return newSet
    })
  }

  // Delete individual document from ingredient
  const deleteDocument = (analysisId: string, ingredientName: string, documentId: string) => {
    console.log('🗑️ DELETE DOC:', { analysisId, ingredientName, documentId })
    
    // Update both solo and bulk analysis results
    setState(prevState => ({
      ...prevState,
      // Update solo analysis results
      analysisResults: prevState.analysisResults.map(analysis => {
        if (analysis.id === analysisId) {
          const updatedAnalysis = {
            ...analysis,
            ingredients: analysis.ingredients.map(ingredient => {
              if (ingredient.name === ingredientName) {
                const updatedDocs = (ingredient.verificationDocuments || []).filter(doc => doc.id !== documentId)
                console.log('🗑️ DOC COUNT CHANGE:', ingredient.verificationDocuments?.length, '→', updatedDocs.length)
                
                // If no documents left, change status back to REQUIRES_REVIEW
                const newStatus = updatedDocs.length === 0 ? 'REQUIRES_REVIEW' : 'APPROVED'
                
                return {
                  ...ingredient,
                  verificationDocuments: updatedDocs,
                  status: newStatus as any,
                  verificationStatus: updatedDocs.length > 0 ? 'verified' as const : undefined
                }
              }
              return ingredient
            })
          }
          
          // Recalculate overall status
          updatedAnalysis.overall = recalculateOverallStatus(updatedAnalysis)
          return updatedAnalysis
        }
        return analysis
      }),
      // Update bulk analysis results
      bulkResults: prevState.bulkResults.map(bulkResult => {
        if (bulkResult.id === analysisId) {
          const updatedBulkResult = {
            ...bulkResult,
            ingredients: bulkResult.ingredients.map(ingredient => {
              if (ingredient.name === ingredientName) {
                const updatedDocs = (ingredient.verificationDocuments || []).filter(doc => doc.id !== documentId)
                console.log('🗑️ BULK DOC COUNT CHANGE:', ingredient.verificationDocuments?.length, '→', updatedDocs.length)
                
                // If no documents left, change status back to REQUIRES_REVIEW
                const newStatus = updatedDocs.length === 0 ? 'REQUIRES_REVIEW' : 'APPROVED'
                
                return {
                  ...ingredient,
                  verificationDocuments: updatedDocs,
                  status: newStatus as any,
                  verificationStatus: updatedDocs.length > 0 ? 'verified' as const : undefined
                }
              }
              return ingredient
            })
          }
          
          // Recalculate overall status
          updatedBulkResult.overall = recalculateOverallStatus(updatedBulkResult)
          return updatedBulkResult
        }
        return bulkResult
      })
    }))
    
    // Force refresh
    setRefreshKey(prev => prev + 1)
    
    console.log('🗑️ DOCUMENT DELETED successfully')
  }

  // Enhanced drag and drop functionality for bulk upload
  const onDropBulk = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    
    for (const file of acceptedFiles) {
      // Simulate file input event for existing handler
      const event = {
        target: { files: [file], value: '' }
      } as React.ChangeEvent<HTMLInputElement>
      
      await handleFileUpload(event, true)
    }
  }, [])

  const {
    getRootProps: getBulkRootProps,
    getInputProps: getBulkInputProps,
    isDragActive: isBulkDragActive,
    isDragAccept: isBulkDragAccept,
    isDragReject: isBulkDragReject
  } = useDropzone({
    onDrop: onDropBulk,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 25 * 1024 * 1024, // 25MB
    multiple: true
  })

  const clearBulkAnalysis = () => {
    console.log('🧹 CLEARING: Starting clear all bulk analysis')
    console.log('🧹 BEFORE CLEAR: Current state:', {
      bulkResults: state.bulkResults.length,
      analysisResults: state.analysisResults.length,
      lastSaved: state.lastSaved
    })
    
    // NUCLEAR OPTION: Completely reset localStorage
    console.log('🧹 NUCLEAR: Removing entire localStorage entry')
    localStorage.removeItem('halalcheck_analysis_state')
    
    // Create completely fresh initial state
    const initialState: AnalysisState = {
      productName: '',
      ingredients: '',
      selectedClient: null,
      analysisResults: [],
      bulkMode: false,
      bulkResults: [],
      bulkSelectedClient: null,
      bulkClientSearch: '',
      clientSearch: '',
      newClient: { name: '', company: '', email: '', phone: '' },
      showCreateClient: false,
      lastSaved: Date.now()
    }
    
    // Force set the state to initial
    setState(initialState)
    
    // Clear all UI states
    setExpandedBulkResults(new Set())
    setError(null)
    setContextualError(null)
    setBulkAnalyzing(false)
    setUploadProgress(0)
    setRefreshKey(prev => prev + 10) // Big jump to force re-render
    
    // Set fresh localStorage
    localStorage.setItem('halalcheck_analysis_state', JSON.stringify(initialState))
    
    console.log('🧹 NUCLEAR CLEARED: Completely reset everything')
    console.log('🧹 NEW INITIAL STATE:', initialState)
    
    // Force page reload as last resort
    setTimeout(() => {
      console.log('🧹 RELOADING PAGE to ensure clean state')
      window.location.reload()
    }, 500)
  }

  const clearAllState = () => {
    const initialState: AnalysisState = {
      productName: '',
      ingredients: '',
      selectedClient: null,
      analysisResults: [],
      bulkMode: false,
      bulkResults: [],
      bulkSelectedClient: null,
      bulkClientSearch: '',
      clientSearch: '',
      lastSaved: Date.now(),
      showCreateClient: false,
      newClient: { name: '', company: '', email: '', phone: '' }
    }
    setState(initialState)
    localStorage.removeItem('halalcheck_analysis_state')
    setError(null)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Enhanced status color and icon mapping for Islamic compliance
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { 
      color: string
      icon: JSX.Element
      label: string
      bgColor: string
    }> = {
      'APPROVED': { 
        color: 'bg-emerald-500 text-white border-emerald-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>, 
        label: 'Halal Certified',
        bgColor: 'bg-emerald-50 border-emerald-200'
      },
      'HALAL': { 
        color: 'bg-emerald-500 text-white border-emerald-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>, 
        label: 'Halal Certified',
        bgColor: 'bg-emerald-50 border-emerald-200'
      },
      'PROHIBITED': { 
        color: 'bg-red-500 text-white border-red-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>, 
        label: 'Haram - Prohibited',
        bgColor: 'bg-red-50 border-red-200'
      },
      'HARAM': { 
        color: 'bg-red-500 text-white border-red-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>, 
        label: 'Haram - Prohibited',
        bgColor: 'bg-red-50 border-red-200'
      },
      'REQUIRES_REVIEW': { 
        color: 'bg-amber-500 text-white border-amber-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>, 
        label: 'Mashbooh - Requires Review',
        bgColor: 'bg-amber-50 border-amber-200'
      },
      'QUESTIONABLE': { 
        color: 'bg-amber-500 text-white border-amber-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>, 
        label: 'Mashbooh - Questionable',
        bgColor: 'bg-amber-50 border-amber-200'
      },
      'MASHBOOH': { 
        color: 'bg-amber-500 text-white border-amber-500', 
        icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>, 
        label: 'Mashbooh - Questionable',
        bgColor: 'bg-amber-50 border-amber-200'
      }
    }
    // Handle variations and normalize status
    const normalizedStatus = status.toUpperCase()
    let matchedStatus = statusMap[normalizedStatus]
    
    // Try to find the best match for unknown statuses
    if (!matchedStatus) {
      if (normalizedStatus.includes('QUESTION') || normalizedStatus.includes('REVIEW') || normalizedStatus.includes('DOUBTFUL')) {
        matchedStatus = statusMap['REQUIRES_REVIEW']
      } else if (normalizedStatus.includes('PROHIBIT') || normalizedStatus.includes('HARAM') || normalizedStatus.includes('FORBIDDEN')) {
        matchedStatus = statusMap['PROHIBITED']
      } else if (normalizedStatus.includes('APPROV') || normalizedStatus.includes('HALAL') || normalizedStatus.includes('PERMIT')) {
        matchedStatus = statusMap['APPROVED']
      }
    }

    return matchedStatus || { 
      color: 'bg-amber-500 text-white border-amber-500', 
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>, 
      label: 'Mashbooh - Requires Review',
      bgColor: 'bg-amber-50 border-amber-200'
    }
  }

  // Enhanced risk level display
  const getRiskDisplay = (risk: string) => {
    const riskMap: Record<string, { color: string; icon: JSX.Element; label: string }> = {
      'VERY_LOW': { 
        color: 'text-emerald-600', 
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>, 
        label: 'Very Low Risk' 
      },
      'LOW': { 
        color: 'text-green-600', 
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>, 
        label: 'Low Risk' 
      },
      'MEDIUM': { 
        color: 'text-yellow-600', 
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>, 
        label: 'Medium Risk' 
      },
      'HIGH': { 
        color: 'text-orange-600', 
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>, 
        label: 'High Risk' 
      },
      'VERY_HIGH': { 
        color: 'text-red-600', 
        icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>, 
        label: 'Very High Risk' 
      }
    }
    return riskMap[risk] || { 
      color: 'text-slate-600', 
      icon: <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" /></svg>, 
      label: 'Unknown Risk' 
    }
  }

  // Calculate value metrics for analysis
  const calculateValueMetrics = (result: AnalysisResult) => {
    const baseTimePerIngredient = 2 // minutes for manual analysis per ingredient
    const baseCostPerIngredient = 1.67 // EUR for professional consultation per ingredient (€50/hour rate)
    
    const timeSaved = result.ingredients.length * baseTimePerIngredient
    const costSaved = result.ingredients.length * baseCostPerIngredient
    const analysisTime = Number((result.analysis_time || 3.2).toFixed(1))
    
    return {
      timeSaved: timeSaved,
      costSaved: costSaved,
      analysisTime: analysisTime
    }
  }

  // Keyboard shortcuts for power users (defined after all functions)
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            if (state.analysisResults.length > 1 && (config.type === 'food-manufacturer' || state.selectedClient)) {
              saveAllResults()
            } else if (state.analysisResults.length === 1 && (config.type === 'food-manufacturer' || state.selectedClient)) {
              saveToApplications(state.analysisResults[0])
            }
            break
          case 'Enter':
            e.preventDefault()
            if (!analyzing && state.productName && state.ingredients) {
              analyzeIngredients()
            }
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyboardShortcuts)
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts)
  }, [state, analyzing, saveAllResults, saveToApplications, analyzeIngredients])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Premium Background Pattern */}
      <div className="absolute inset-0 opacity-40" style={{
        backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%234f46e5\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"7\" cy=\"7\" r=\"5\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
      }}></div>
      
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl">{config.icon}</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
                  HalalCheck AI
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="text-sm text-gray-600">
                Analysis Tool
              </div>
              {/* State indicator */}
              {state.lastSaved && (
                <div className="flex items-center space-x-2 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>State saved</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="relative min-h-screen">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
          
          {/* Premium Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/60 mb-6">
              <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 leading-tight">
                    <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                      Intelligent Halal
                    </span>
                    <br />
                    <span className="text-slate-700">
                      Ingredient Analysis
                    </span>
                  </h1>
                  <div className="flex items-center justify-center space-x-2 mt-3">
                    <div className="h-0.5 w-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
                    <div className="w-2 h-2 bg-gradient-to-r from-teal-500 to-blue-500 rounded-full"></div>
                    <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                  </div>
              </div>
            </div>
            
            <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-medium">
              {orgText.getAnalysisPageDescription()}
            </p>
            <p className="text-lg text-slate-500 max-w-3xl mx-auto mt-3">
              Advanced AI technology with Islamic jurisprudence integration, multi-format support, and professional workflow management.
            </p>
            
            {/* Professional Disclaimer */}
            <div className="flex justify-center mt-8">
              <div className="max-w-4xl mx-auto bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Important Notice</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    This tool provides <strong>preliminary screening assistance only</strong> and is not a substitute for proper halal certification. 
                    <strong> Islamic compliance determinations must be made by qualified scholars</strong> and authorized certification bodies. 
                    Users bear full responsibility for verification. Religious references are included only when directly applicable to specific ingredients.
                  </p>
                  <div className="mt-3 text-xs text-slate-500">
                    Always consult with certified halal authorities for definitive rulings
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Mode Toggle */}
          <div className="flex justify-center mb-12">
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/60 p-1.5 hover:shadow-3xl transition-all duration-300">
              <div className="flex relative">
                <div
                  className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r rounded-xl transition-all duration-300 ease-out shadow-lg ${
                    !state.bulkMode
                      ? 'left-1.5 right-1/2 from-blue-500 to-indigo-600'
                      : 'left-1/2 right-1.5 from-purple-500 to-indigo-600'
                  }`}
                ></div>
                <button
                  onClick={() => saveState({ bulkMode: false })}
                  className={`relative z-10 px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    !state.bulkMode ? 'text-white' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Single Analysis</span>
                </button>
                <button
                  onClick={() => saveState({ bulkMode: true })}
                  className={`relative z-10 px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    state.bulkMode ? 'text-white' : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Bulk Analysis</span>
                </button>
              </div>
            </div>
          </div>

          {/* Clear Forms Section - REMOVED */}
          {false && (
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-4">
                <button
                  onClick={clearAllState}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear All Forms</span>
                </button>
              </div>
            </div>
          )}

          {!state.bulkMode ? (
            /* COMPREHENSIVE SINGLE ANALYSIS MODE */
            <div className="max-w-6xl mx-auto">
              {/* Premium Analysis Form */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/60 p-10 mb-10 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Analysis Configuration</h3>
                      <p className="text-sm text-slate-500">Configure your comprehensive ingredient analysis</p>
                    </div>
                  </div>
                </div>

                {/* Enhanced State Management Controls */}
                {state.lastSaved && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-700 font-medium">
                          State saved automatically • Last updated: {formatTimestamp(new Date(state.lastSaved).toISOString())}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={clearAllState}
                          className="text-xs px-3 py-1 bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          Reset All
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Client Assignment Section - Only for Certification Bodies */}
                {config.type === 'certification-body' && (
                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{terminology.clientName} Assignment</span>
                      </div>
                    </label>
                  
                  <div className="flex space-x-4">
                    {/* Client Search Dropdown */}
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={state.clientSearch}
                        onChange={(e) => saveState({ clientSearch: e.target.value })}
                        placeholder={`Search ${terminology.clientNamePlural.toLowerCase()} by name, company, or email...`}
                        className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 font-medium shadow-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      
                      {/* Client Dropdown */}
                      {state.clientSearch && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {filteredClients.length > 0 ? (
                            filteredClients.map(client => (
                              <button
                                key={client.id}
                                onClick={() => saveState({ selectedClient: client, clientSearch: '' })}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                              >
                                <div className="font-medium text-slate-900">{client.name}</div>
                                <div className="text-sm text-slate-500">{client.company} • {client.email}</div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-slate-500">No clients found</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Create New Client/Customer Button */}
                    <button
                      onClick={() => saveState({ showCreateClient: true })}
                      className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-md flex items-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>New {terminology.clientName}</span>
                    </button>
                  </div>
                  
                  {/* Selected Client Display */}
                  {state.selectedClient && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {state.selectedClient.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-blue-900">{state.selectedClient.name}</div>
                            <div className="text-sm text-blue-700">{state.selectedClient.company}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => saveState({ selectedClient: null })}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                {/* Create New Client/Customer Modal */}
                {state.showCreateClient && (
                  <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-emerald-800">Create New {terminology.clientName}</h4>
                      <button
                        onClick={() => saveState({ showCreateClient: false, newClient: { name: '', company: '', email: '', phone: '' } })}
                        className="text-emerald-600 hover:text-emerald-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <input
                        type="text"
                        value={state.newClient.name}
                        onChange={(e) => saveState({ newClient: { ...state.newClient, name: e.target.value } })}
                        placeholder={`${terminology.clientName} Name *`}
                        className="px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      />
                      <input
                        type="text"
                        value={state.newClient.company}
                        onChange={(e) => saveState({ newClient: { ...state.newClient, company: e.target.value } })}
                        placeholder="Company Name"
                        className="px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      />
                      <input
                        type="email"
                        value={state.newClient.email}
                        onChange={(e) => saveState({ newClient: { ...state.newClient, email: e.target.value } })}
                        placeholder="Email Address *"
                        className="px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      />
                      <input
                        type="tel"
                        value={state.newClient.phone}
                        onChange={(e) => saveState({ newClient: { ...state.newClient, phone: e.target.value } })}
                        placeholder="Phone Number"
                        className="px-4 py-3 border-2 border-emerald-200 rounded-xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
                      />
                    </div>
                    
                    <div className="relative">
                      <div className="flex space-x-3">
                        <button
                          onClick={createNewClient}
                          className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 font-medium"
                        >
                          Create {terminology.clientName}
                        </button>
                        <button
                          onClick={() => {
                            setContextualError(null)
                            saveState({ showCreateClient: false, newClient: { name: '', company: '', email: '', phone: '' } })
                          }}
                          className="px-6 py-2 bg-white border border-emerald-300 text-emerald-700 rounded-xl hover:bg-emerald-50 transition-all duration-200 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                      
                      {/* Contextual Error Display for Client Creation */}
                      {contextualError && contextualError.context === 'client-creation' && (
                        <div className="absolute top-full left-0 mt-2 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg shadow-lg z-50 min-w-max">
                          <div className="text-sm font-medium">{contextualError.message}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                </div>
                )}
                
                {/* Product Name Section */}
                <div className="mb-8">
                  <label htmlFor="productName" className="block text-sm font-semibold text-slate-700 mb-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Product Name</span>
                      <span className="text-red-500">*</span>
                    </div>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <input
                      id="productName"
                      type="text"
                      value={state.productName}
                      onChange={(e) => saveState({ productName: e.target.value })}
                      placeholder="Enter the product name (e.g., 'Chocolate Cookies', 'Beef Jerky')"
                      className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 font-medium shadow-sm"
                    />
                  </div>
                </div>

                {/* Enhanced Ingredients Section */}
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <label htmlFor="ingredients" className="block text-sm font-semibold text-slate-700">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span>Ingredients List</span>
                        <span className="text-red-500">*</span>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 text-sm font-medium shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span>Upload File</span>
                    </button>
                  </div>
                  <div className="relative">
                    <textarea
                      id="ingredients"
                      value={state.ingredients}
                      onChange={(e) => saveState({ ingredients: e.target.value })}
                      placeholder="Enter ingredients separated by commas (e.g., 'wheat flour, sugar, palm oil, salt, yeast, natural flavoring, vitamin E')"
                      rows={6}
                      className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-slate-700 placeholder-slate-400 font-medium shadow-sm resize-none"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
                      {state.ingredients.split(/[,\n]/).filter(i => i.trim()).length} ingredients
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".csv,.xlsx,.xls,.pdf,.jpg,.jpeg,.png,.gif,.webp,.tiff,.bmp,.doc,.docx,.txt"
                    className="hidden"
                  />
                </div>

                {/* Quick Test Examples */}
                <div className="mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm font-semibold text-slate-700">Quick Test Examples</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Halal Product Example */}
                    <button
                      type="button"
                      onClick={() => {
                        saveState({
                          productName: 'Pure Olive Oil',
                          ingredients: 'extra virgin olive oil'
                        })
                      }}
                      className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">✓</span>
                        </div>
                        <span className="font-semibold text-green-800">Halal Product</span>
                      </div>
                      <p className="text-sm text-green-700 leading-relaxed">
                        Test with clearly halal ingredients that should pass certification
                      </p>
                      <div className="mt-2 text-xs text-green-600 opacity-75 group-hover:opacity-100 transition-opacity">
                        Click to load example
                      </div>
                    </button>

                    {/* Mashbooh Example */}
                    <button
                      type="button"
                      onClick={() => {
                        saveState({
                          productName: 'Vanilla Cookies',
                          ingredients: 'wheat flour, sugar, palm oil, vanilla extract, E471 (mono- and diglycerides), salt, baking powder'
                        })
                      }}
                      className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">?</span>
                        </div>
                        <span className="font-semibold text-amber-800">Mashbooh Product</span>
                      </div>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        Test with questionable ingredients requiring verification documents
                      </p>
                      <div className="mt-2 text-xs text-amber-600 opacity-75 group-hover:opacity-100 transition-opacity">
                        Click to load example
                      </div>
                    </button>

                    {/* Prohibited Example */}
                    <button
                      type="button"
                      onClick={() => {
                        saveState({
                          productName: 'Wine Cheese',
                          ingredients: 'milk, cheese cultures, rennet, salt, red wine, potassium sorbate, gelatin'
                        })
                      }}
                      className="p-4 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-rose-100 transition-all duration-200 text-left group"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">✕</span>
                        </div>
                        <span className="font-semibold text-red-800">Prohibited Product</span>
                      </div>
                      <p className="text-sm text-red-700 leading-relaxed">
                        Test with clearly haram ingredients that should be rejected
                      </p>
                      <div className="mt-2 text-xs text-red-600 opacity-75 group-hover:opacity-100 transition-opacity">
                        Click to load example
                      </div>
                    </button>
                  </div>
                </div>

                {/* Premium Error Display */}
                {error && (
                  <div className="mb-8 p-5 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200/60 rounded-2xl shadow-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-red-500 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-800 mb-1">Analysis Error</h4>
                        <p className="text-sm text-red-700 leading-relaxed">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={analyzeIngredients}
                    disabled={analyzing || !state.productName.trim() || !state.ingredients.trim()}
                    className="group relative flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-300 font-semibold shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:transform-none disabled:hover:shadow-xl"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {analyzing ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative z-10">Analyzing with Enhanced AI...</span>
                      </>
                    ) : (
                      <div className="flex items-center space-x-3 relative z-10">
                        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span>Comprehensive Analysis</span>
                      </div>
                    )}
                  </button>

                </div>
              </div>

              {/* Comprehensive Results Display */}
              {state.analysisResults.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-800">Analysis Results</h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{state.analysisResults.length} analysis{state.analysisResults.length !== 1 ? 'es' : ''}</span>
                      </div>
                      {state.analysisResults.length > 1 && state.selectedClient && (
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            Client: {state.selectedClient.name}
                          </div>
                          <button
                            onClick={() => saveAllResults()}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2 shadow-md hover:shadow-lg"
                            title="Save all analysis results to pipeline (Ctrl+S)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Save All to {terminology.pipelineName}</span>
                            <span className="text-xs opacity-75">(Ctrl+S)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {state.analysisResults.map((result, index) => {
                    const statusDisplay = getStatusDisplay(result.overall)
                    const valueMetrics = calculateValueMetrics(result)
                    const pipelineStatus = determineApplicationStatus(result)
                    
                    return (
                      <div key={result.id} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 hover:shadow-2xl transition-all duration-300">
                        {/* Enhanced Result Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`px-6 py-3 rounded-2xl font-bold text-lg shadow-lg ${statusDisplay.color} flex items-center space-x-2`}>
                              <span className="text-xl">{statusDisplay.icon}</span>
                              <span>{statusDisplay.label}</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-slate-800">{result.product}</h4>
                              <p className="text-sm text-slate-500">{formatTimestamp(result.timestamp)}</p>
                            </div>
                            {/* Pipeline Status Indicator */}
                            {state.selectedClient && (
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pipelineStatus === 'approved' 
                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}>
                                {pipelineStatus === 'approved' ? '✅ Ready for Approval' : '🔍 Needs Documentation'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            {(() => {
                              const documentCount = result.ingredients.reduce((count, ing) => 
                                count + (ing.verificationDocuments?.length || 0), 0)
                              return (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => saveToApplications(result)}
                                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                                    >
                                      <span>Save to {terminology.pipelineName}</span>
                                      {documentCount > 0 && (
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                                          +{documentCount} docs
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => deleteAnalysisResult(result.id)}
                                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                                      title="Delete this analysis"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                  
                                  {/* Contextual Error/Success Display */}
                                  {contextualError && (contextualError.context === 'save-button' || contextualError.context === 'save-success') && (
                                    <div className={`absolute top-full left-0 mt-2 p-3 rounded-lg shadow-lg z-50 min-w-max ${
                                      contextualError.context === 'save-success' 
                                        ? 'bg-green-100 border border-green-300 text-green-700' 
                                        : 'bg-red-100 border border-red-300 text-red-700'
                                    }`}>
                                      <div className="text-sm font-medium">{contextualError.message}</div>
                                    </div>
                                  )}
                                  {contextualError && contextualError.context === 'save-success' && (
                                    <div className="absolute top-full left-0 mt-2 p-4 rounded-xl shadow-xl z-50 min-w-max bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 text-green-800">
                                      <div className="text-sm font-bold mb-2">{contextualError.message}</div>
                                      <div className="flex items-center space-x-2">
                                        <button 
                                          onClick={() => {
                                            router.push('/dashboard/applications')
                                            setContextualError(null)
                                          }}
                                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                                        >
                                          View Pipeline →
                                        </button>
                                        <button 
                                          onClick={() => setContextualError(null)}
                                          className="text-xs bg-white hover:bg-gray-50 text-green-700 px-3 py-1 rounded-lg font-medium border border-green-300 transition-colors"
                                        >
                                          Continue
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </div>

                        {/* Compact Analysis Value Metrics - Integrated into header area */}
                        <div className="mb-4 bg-gradient-to-r from-slate-50/80 to-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              {/* Left side - Title */}
                              <div className="flex items-center space-x-3">
                                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                                  </svg>
                                </div>
                                <div>
                                  <h6 className="text-sm font-semibold text-slate-700">Analysis Value Metrics</h6>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs text-slate-500">Performance Insights</span>
                                    <div className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium rounded-full">
                                      PREMIUM AI
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right side - Compact metrics in horizontal layout */}
                              <div className="flex items-center space-x-6">
                                {/* Time Savings */}
                                <div className="flex items-center space-x-2 group cursor-pointer">
                                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-emerald-600">{valueMetrics.timeSaved}</div>
                                    <div className="text-xs text-slate-500 leading-tight">Min Saved</div>
                                  </div>
                                </div>
                                
                                {/* Cost Savings */}
                                <div className="flex items-center space-x-2 group cursor-pointer">
                                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">€{valueMetrics.costSaved}</div>
                                    <div className="text-xs text-slate-500 leading-tight">Cost Saved</div>
                                  </div>
                                </div>
                                
                                {/* Processing Speed */}
                                <div className="flex items-center space-x-2 group cursor-pointer">
                                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-purple-600">{valueMetrics.analysisTime}s</div>
                                    <div className="text-xs text-slate-500 leading-tight">AI Speed</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Premium Islamic Compliance Dashboard */}
                        {result.islamicCompliance && (
                          <div className="mb-8 relative overflow-hidden">
                            {/* Premium background with Islamic pattern inspiration */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 rounded-3xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-white/30 rounded-3xl"></div>
                            
                            <div className="relative p-8 bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl shadow-2xl">
                              {/* Premium header with Islamic styling */}
                              <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                  <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h5 className="text-2xl font-black bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                                      Islamic Compliance Dashboard
                                    </h5>
                                    <p className="text-sm text-emerald-600 font-semibold mt-1">حلال • Halal Verification System</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm font-bold rounded-full shadow-lg">
                                    ✓ VERIFIED
                                  </div>
                                </div>
                              </div>
                              
                              {/* Premium compliance cards with Islamic design elements */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Total Ingredients */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-slate-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">TOTAL</div>
                                    </div>
                                    <div className="text-5xl font-black text-slate-700 mb-2 tracking-tight">{result.islamicCompliance.totalIngredients}</div>
                                    <div className="text-lg font-bold text-slate-800 mb-1">Total</div>
                                    <div className="text-sm text-slate-500 font-medium">Ingredients</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Halal Certified */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-green-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-green-600 font-bold uppercase tracking-wider">حلال</div>
                                    </div>
                                    <div className="text-5xl font-black text-green-600 mb-2 tracking-tight">{result.islamicCompliance.halalCount}</div>
                                    <div className="text-lg font-bold text-green-700 mb-1">Halal</div>
                                    <div className="text-sm text-green-600 font-medium">Certified</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Haram Prohibited */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-red-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-red-600 font-bold uppercase tracking-wider">حرام</div>
                                    </div>
                                    <div className="text-5xl font-black text-red-600 mb-2 tracking-tight">{result.islamicCompliance.haramCount}</div>
                                    <div className="text-lg font-bold text-red-700 mb-1">Haram</div>
                                    <div className="text-sm text-red-600 font-medium">Prohibited</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-red-400 to-rose-500 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Mashbooh Questionable */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-amber-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">مشبوه</div>
                                    </div>
                                    <div className="text-5xl font-black text-amber-600 mb-2 tracking-tight">{result.islamicCompliance.questionableCount}</div>
                                    <div className="text-lg font-bold text-amber-700 mb-1">Mashbooh</div>
                                    <div className="text-sm text-amber-600 font-medium">Review Needed</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Enhanced Ingredients Analysis */}
                      <div className="mb-6">
                        <div className="flex items-center space-x-2 mb-4">
                          <svg className="w-5 h-5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          <h5 className="font-bold text-slate-800 text-lg">Detailed Ingredient Analysis</h5>
                        </div>
                        <div className="grid gap-4">
                          {result.ingredients.map((ingredient, idx) => {
                            const ingredientStatus = getStatusDisplay(ingredient.status)
                            const riskDisplay = getRiskDisplay(ingredient.risk)
                            
                            return (
                              <div key={idx} className={`p-6 rounded-2xl border-2 shadow-md hover:shadow-lg transition-all duration-200 ${ingredientStatus.bgColor}`}>
                                <div className="flex items-center justify-between mb-3">
                                  <span className="font-bold text-lg text-slate-800">{ingredient.name}</span>
                                  <div className="flex items-center space-x-3">
                                    <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md ${ingredientStatus.color} flex items-center space-x-2`}>
                                      {ingredientStatus.icon}
                                      <span>{ingredientStatus.label}</span>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${riskDisplay.color} bg-white/80 border flex items-center space-x-2`}>
                                      {riskDisplay.icon}
                                      <span>{riskDisplay.label}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-slate-700 mb-3 leading-relaxed font-medium">{ingredient.reason}</p>
                                
                                
                                {ingredient.alternativeSuggestions && ingredient.alternativeSuggestions.length > 0 && (
                                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                    <div className="text-sm">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <svg className="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span className="font-bold text-emerald-800">Halal Alternatives:</span>
                                      </div>
                                      <div className="mt-1 text-emerald-700 font-medium">
                                        {ingredient.alternativeSuggestions.join(', ')}
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Document Upload for Questionable Ingredients */}
                                {(() => {
                                  // Show upload/document section for:
                                  // 1. Mashbooh ingredients (need documentation)
                                  // 2. Ingredients that already have uploaded documents (to show what's uploaded)
                                  
                                  const status = ingredient.status?.toUpperCase() || ''
                                  const reason = ingredient.reason?.toLowerCase() || ''
                                  const hasDocuments = ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0
                                  
                                  // Check if ingredient is mashbooh/questionable
                                  const isMashbooh = (
                                    // Direct mashbooh status
                                    status === 'MASHBOOH' || 
                                    status === 'REQUIRES_REVIEW' || 
                                    status === 'QUESTIONABLE' ||
                                    
                                    // Status variations that indicate uncertainty
                                    status.includes('QUESTION') ||
                                    status.includes('REVIEW') ||
                                    status.includes('DOUBTFUL')
                                  ) && 
                                  // Exclude clearly halal ingredients (unless they have docs)
                                  (hasDocuments || (status !== 'HALAL' && status !== 'APPROVED' && !status.includes('CERTIFIED')))
                                  
                                  // Additional check for specific ingredients known to be problematic
                                  const isProblematicIngredient = (
                                    reason.includes('can be derived from both plant and animal') ||
                                    reason.includes('may be from non-halal') ||
                                    reason.includes('verification of the source is necessary') ||
                                    (ingredient.name.toLowerCase().includes('e471') && status === 'QUESTIONABLE')
                                  )
                                  
                                  // Show section if ingredient is mashbooh OR if it has uploaded documents
                                  const finalResult = isMashbooh || isProblematicIngredient || hasDocuments
                                  
                                  // Debug log for troubleshooting (especially for vanilla extract)
                                  if (ingredient.name.toLowerCase().includes('vanilla') || ingredient.name.toLowerCase().includes('e471')) {
                                    console.log(`Upload box check for ${ingredient.name}:`, {
                                      status,
                                      isMashbooh,
                                      isProblematicIngredient,
                                      hasDocuments,
                                      finalResult,
                                      docCount: ingredient.verificationDocuments?.length || 0,
                                      reason: reason.substring(0, 80) + '...'
                                    })
                                  }
                                  
                                  return finalResult
                                })() && (
                                  <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="flex items-center space-x-2 mb-3">
                                      <svg className="w-5 h-5 text-orange-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-bold text-orange-800">
                                        {ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0 ? 
                                          `${orgText.getDocumentationText('complete')}` : `${orgText.getDocumentationText('required')}`
                                        }
                                      </span>
                                      {ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0 && (
                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                          ✓ Verified & Documented
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="text-sm text-orange-700 mb-3">
                                      {ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0 ? 
                                        `Upload additional verified documentation if needed` :
                                        orgText.getDocumentationText('upload')
                                      }
                                    </div>
                                    
                                    {ingredient.verificationDocuments && ingredient.verificationDocuments.length > 0 ? (
                                      <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between">
                                          <div className="text-sm text-green-700 font-bold">
                                            ✅ {ingredient.verificationDocuments.length} Verification Document(s) Uploaded
                                          </div>
                                          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                            Documented ✓
                                          </div>
                                        </div>
                                        {ingredient.verificationDocuments.map(doc => {
                                          const getDocumentIcon = (filename: string, type: string) => {
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
                                            } else if (['doc', 'docx'].includes(ext || '')) {
                                              return (
                                                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
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
                                            <div key={doc.id} className="bg-green-50 border border-green-200 rounded-xl p-4">
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                  </svg>
                                                  <span className="text-sm font-bold text-green-800">{doc.filename}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                                                    {doc.type}
                                                  </span>
                                                  <span className="text-xs text-green-500">
                                                    {new Date(doc.uploadDate).toLocaleDateString()}
                                                  </span>
                                                  <button
                                                    onClick={() => deleteDocument(result.id, ingredient.name, doc.id)}
                                                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                                                    title="Delete this document"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                  </button>
                                                </div>
                                              </div>
                                              
                                              {/* Document Preview Showcase */}
                                              {doc.previewUrl && (
                                                <div className="mt-3">
                                                  {doc.fileType?.startsWith('image/') ? (
                                                    <div className="border-2 border-green-300 rounded-lg overflow-hidden">
                                                      <img 
                                                        src={doc.previewUrl} 
                                                        alt={doc.filename}
                                                        className="w-full max-w-md max-h-64 object-contain bg-white"
                                                        onLoad={() => console.log('Solo analysis - Document image loaded:', doc.filename)}
                                                      />
                                                    </div>
                                                  ) : doc.fileType === 'application/pdf' ? (
                                                    <div className="border-2 border-green-300 rounded-lg p-4 bg-white text-center">
                                                      <svg className="w-16 h-16 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                      </svg>
                                                      <p className="text-sm font-medium text-green-700 mb-1">PDF Document</p>
                                                      <p className="text-xs text-green-600">{doc.filename}</p>
                                                      <button 
                                                        onClick={() => window.open(doc.previewUrl, '_blank')}
                                                        className="mt-2 px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors"
                                                      >
                                                        Open PDF
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    <div className="border-2 border-green-300 rounded-lg p-4 bg-white text-center">
                                                      <svg className="w-12 h-12 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                      </svg>
                                                      <p className="text-sm font-medium text-green-700 mb-1">Document Uploaded</p>
                                                      <p className="text-xs text-green-600">{doc.filename}</p>
                                                      {doc.fileSize && (
                                                        <p className="text-xs text-green-500 mt-1">
                                                          {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                                        </p>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        })}
                                        
                                        {/* Additional Upload Option for Existing Documents */}
                                        <div className="border border-dashed border-green-300 rounded-lg p-3 bg-green-25">
                                          <input
                                            type="file"
                                            id={`additional-doc-upload-${idx}`}
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                            onChange={(e) => handleDocumentUpload(e, result.id, ingredient.name)}
                                          />
                                          <label
                                            htmlFor={`additional-doc-upload-${idx}`}
                                            className="cursor-pointer inline-flex items-center space-x-2 text-sm text-green-700 hover:text-green-800 font-medium"
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <span>Upload Additional Document</span>
                                          </label>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="border-4 border-dashed border-amber-400 rounded-xl p-6 text-center bg-amber-50">
                                        <div className="mb-3">
                                          <svg className="w-12 h-12 text-amber-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                          </svg>
                                          <div className="text-lg font-bold text-amber-800 mb-1">
                                            ⚠️ Documentation Required
                                          </div>
                                          <div className="text-sm text-amber-700 font-medium">
                                            This ingredient requires verification documentation
                                          </div>
                                        </div>
                                        <input
                                          type="file"
                                          id={`doc-upload-${idx}`}
                                          className="hidden"
                                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                          onChange={(e) => handleDocumentUpload(e, result.id, ingredient.name)}
                                        />
                                        <label
                                          htmlFor={`doc-upload-${idx}`}
                                          className="cursor-pointer inline-flex items-center space-x-2 text-base text-amber-800 hover:text-amber-900 font-bold bg-amber-200 hover:bg-amber-300 px-6 py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                                        >
                                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                          </svg>
                                          <span>Upload Verification Document</span>
                                        </label>
                                        <div className="text-sm text-amber-600 mt-2 font-medium">
                                          PDF, JPG, PNG, DOC files accepted • Required for compliance
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Document Library Link */}
                        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="font-medium text-orange-800">
                                {orgText.getDocumentationText('complete')} Library
                              </span>
                            </div>
                            <Link 
                              href="/dashboard/documents"
                              className="text-sm text-orange-700 hover:text-orange-800 font-medium underline"
                            >
                              View All Documents →
                            </Link>
                          </div>
                          <p className="text-sm text-orange-600 mt-2">
                            Access all uploaded verification documents organized by ingredient and product
                          </p>
                        </div>
                      </div>

                        {/* Warnings and Recommendations */}
                        {(result.warnings.length > 0 || result.recommendations.length > 0) && (
                          <div className="grid md:grid-cols-2 gap-6 mb-6">
                            {result.warnings.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-2 mb-3">
                                  <svg className="w-5 h-5 text-red-800" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <h5 className="font-semibold text-red-800">Warnings</h5>
                                </div>
                                <ul className="space-y-2">
                                  {result.warnings.map((warning, idx) => (
                                    <li key={idx} className="text-sm text-red-700 p-3 bg-red-50 rounded-lg border border-red-200">
                                      {warning}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {result.recommendations.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-2 mb-3">
                                  <svg className="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <h5 className="font-semibold text-emerald-800">Recommendations</h5>
                                </div>
                                <ul className="space-y-2">
                                  {result.recommendations.map((rec, idx) => (
                                    <li key={idx} className="text-sm text-emerald-700 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            /* COMPREHENSIVE BULK ANALYSIS MODE */
            <div className="max-w-6xl mx-auto">
              {/* Premium Analysis Form - Same as Single Analysis */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/60 p-10 mb-10 hover:shadow-3xl transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">Bulk File Analysis</h3>
                      <p className="text-slate-600">Upload files for comprehensive batch processing with advanced AI analysis</p>
                    </div>
                  </div>
                </div>
                
                {/* Client Selection Section - Same styling as Single Analysis */}
                {config.features.clientManagement && (
                  <div className="grid md:grid-cols-2 gap-8 mb-8">
                    <div>
                      <label htmlFor="bulk-client-search" className="block text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Select {terminology.clientName} for Bulk Analysis</span>
                      </label>
                      
                      <div className="relative">
                        <input
                          id="bulk-client-search"
                          type="text"
                          value={state.bulkClientSearch}
                          onChange={(e) => saveState({ bulkClientSearch: e.target.value })}
                          placeholder={`Search ${terminology.clientName.toLowerCase()}...`}
                          className="w-full px-4 py-3 pr-10 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-200 bg-white shadow-sm"
                        />
                        <svg className="absolute right-3 top-3 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        
                        {state.bulkClientSearch && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {filteredBulkClients.map(client => (
                              <button
                                key={client.id}
                                onClick={() => saveState({ bulkSelectedClient: client, bulkClientSearch: '' })}
                                className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl"
                              >
                                <div className="font-medium text-slate-900">{client.name}</div>
                                <div className="text-sm text-slate-500">{client.company}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {state.bulkSelectedClient && (
                        <div className="mt-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-purple-900">{state.bulkSelectedClient.name}</div>
                              <div className="text-sm text-purple-700">{state.bulkSelectedClient.company}</div>
                            </div>
                            <button
                              onClick={() => saveState({ bulkSelectedClient: null })}
                              className="text-purple-600 hover:text-purple-800 transition-colors p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Info Panel - Same as Single Analysis */}
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-1">Bulk Analysis Benefits</h4>
                            <p className="text-sm text-blue-700">Process multiple files simultaneously with AI-powered extraction and comprehensive Islamic jurisprudence analysis.</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <h4 className="font-semibold text-green-900 mb-1">Smart File Processing</h4>
                            <p className="text-sm text-green-700">Supports 20+ file formats including images, PDFs, Excel, Word documents with OCR capabilities.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* File Upload Section - Same styling as Single Analysis */}
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload Files for Bulk Analysis</span>
                  </label>
                  
                  {/* Enhanced Drag & Drop Upload Zone */}
                  <div
                    {...getBulkRootProps()}
                    className={`
                      relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                      ${isBulkDragActive 
                        ? isBulkDragAccept 
                          ? 'border-green-400 bg-green-50/50' 
                          : 'border-red-400 bg-red-50/50'
                        : 'border-slate-300 hover:border-purple-400 hover:bg-purple-50/30'
                      }
                      ${bulkAnalyzing ? 'cursor-not-allowed opacity-60' : ''}
                    `}
                  >
                    <input {...getBulkInputProps()} disabled={bulkAnalyzing} />
                    
                    {bulkAnalyzing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                        <p className="text-purple-800 font-medium">Processing Files...</p>
                        <p className="text-sm text-purple-600">Using AI to extract and analyze ingredients</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100">
                            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold text-slate-800 mb-2">
                            {isBulkDragActive 
                              ? isBulkDragAccept 
                                ? 'Drop files to analyze' 
                                : 'Invalid file type'
                              : 'Ultra-Smart Bulk Analysis'
                            }
                          </h4>
                          
                          {!isBulkDragActive && (
                            <>
                              <p className="text-slate-600 mb-3">
                                Drag & drop files or click to browse
                              </p>
                              <p className="text-sm text-slate-500 mb-4">
                                AI-powered extraction from images, PDFs, Excel, Word, and more
                              </p>
                              
                              {/* Supported File Types */}
                              <div className="flex flex-wrap justify-center gap-2 mb-3">
                                {[
                                  { icon: '🖼️', label: 'Images' },
                                  { icon: '📄', label: 'PDFs' },
                                  { icon: '📊', label: 'Excel' },
                                  { icon: '📝', label: 'Word' },
                                  { icon: '📋', label: 'CSV' }
                                ].map((type, index) => (
                                  <span key={index} className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700">
                                    <span className="mr-1">{type.icon}</span>
                                    {type.label}
                                  </span>
                                ))}
                              </div>
                              
                              <p className="text-xs text-slate-400">
                                Maximum 25MB per file • Supports 20+ file types • Ultra accurate OCR
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </div>

              {/* Analysis Results Section - Same styling as Single Analysis */}
              {state.bulkResults.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-slate-800">Analysis Results</h3>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={clearBulkAnalysis}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2 shadow-md hover:shadow-lg"
                        title="Clear all bulk analysis results"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Clear All</span>
                      </button>
                      <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span>{state.bulkResults.length} analysis{state.bulkResults.length !== 1 ? 'es' : ''}</span>
                      </div>
                      {state.bulkResults.length > 1 && state.bulkSelectedClient && (
                        <div className="flex items-center space-x-3">
                          <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            Client: {state.bulkSelectedClient.name}
                          </div>
                          <button
                            onClick={() => {
                              // Save all bulk results
                              state.bulkResults.forEach(result => {
                                saveToApplications(result, state.bulkSelectedClient)
                              })
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2 shadow-md hover:shadow-lg"
                            title="Save all analysis results to pipeline (Ctrl+S)"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span>Save All to {terminology.pipelineName}</span>
                            <span className="text-xs opacity-75">(Ctrl+S)</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8" key={`bulk-results-${refreshKey}`}>
                  {state.bulkResults.map((result, index) => {
                    const statusDisplay = getStatusDisplay(result.overall)
                    const valueMetrics = calculateValueMetrics(result)
                    const pipelineStatus = determineApplicationStatus(result)
                    
                    // Create unique key that includes document count to force re-render
                    const documentCount = result.ingredients.reduce((count, ing) => count + (ing.verificationDocuments?.length || 0), 0)
                    const uniqueKey = `${result.id}-${result.lastUpdated || Date.now()}-docs-${documentCount}`
                    
                    return (
                      <div key={uniqueKey} className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-white/60 p-8 hover:shadow-2xl transition-all duration-300">
                        {/* Enhanced Result Header */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className={`px-6 py-3 rounded-2xl font-bold text-lg shadow-lg ${statusDisplay.color} flex items-center space-x-2`}>
                              <span className="text-xl">{statusDisplay.icon}</span>
                              <span>{statusDisplay.label}</span>
                            </div>
                            <div>
                              <h4 className="text-xl font-bold text-slate-800">{result.product}</h4>
                              <p className="text-sm text-slate-500">{formatTimestamp(result.timestamp)}</p>
                            </div>
                            {/* Pipeline Status Indicator */}
                            {state.bulkSelectedClient && (
                              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                pipelineStatus === 'approved' 
                                  ? 'bg-green-100 text-green-800 border border-green-300' 
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              }`}>
                                {pipelineStatus === 'approved' ? '✅ Ready for Approval' : '🔍 Needs Documentation'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4">
                            {(() => {
                              const documentCount = result.ingredients.reduce((count, ing) => 
                                count + (ing.verificationDocuments?.length || 0), 0)
                              return (
                                <div className="relative">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => saveToApplications(result, state.bulkSelectedClient)}
                                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                                    >
                                      <span>Save to {terminology.pipelineName}</span>
                                      {documentCount > 0 && (
                                        <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                                          +{documentCount} docs
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => deleteBulkResult(result.id)}
                                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-medium text-sm flex items-center space-x-2"
                                      title="Delete this analysis"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                  
                                  {/* Contextual Error/Success Display for Bulk Analysis */}
                                  {contextualError && (contextualError.context === 'save-button' || contextualError.context === 'save-success') && (
                                    <div className={`absolute top-full left-0 mt-2 p-3 rounded-lg shadow-lg z-50 min-w-max ${
                                      contextualError.context === 'save-success' 
                                        ? 'bg-green-100 border border-green-300 text-green-700' 
                                        : 'bg-red-100 border border-red-300 text-red-700'
                                    }`}>
                                      <div className="text-sm font-medium">{contextualError.message}</div>
                                    </div>
                                  )}
                                  {contextualError && contextualError.context === 'save-success' && (
                                    <div className="absolute top-full left-0 mt-2 p-4 rounded-xl shadow-xl z-50 min-w-max bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 text-green-800">
                                      <div className="text-sm font-bold mb-2">{contextualError.message}</div>
                                      <div className="flex items-center space-x-2">
                                        <button 
                                          onClick={() => {
                                            router.push('/dashboard/applications')
                                          }}
                                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                                        >
                                          View Pipeline →
                                        </button>
                                        <button 
                                          onClick={() => setContextualError(null)}
                                          className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                                        >
                                          Dismiss
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                          
                        {/* Compact Analysis Value Metrics - Bulk Analysis */}
                        <div className="mb-4 bg-gradient-to-r from-slate-50/80 to-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl shadow-sm">
                          <div className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              {/* Left side - Title */}
                              <div className="flex items-center space-x-3">
                                <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow">
                                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                                  </svg>
                                </div>
                                <div>
                                  <h6 className="text-sm font-semibold text-slate-700">Analysis Value Metrics</h6>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-xs text-slate-500">Performance Insights</span>
                                    <div className="px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium rounded-full">
                                      PREMIUM AI
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Right side - Compact metrics in horizontal layout */}
                              <div className="flex items-center space-x-6">
                                {/* Time Savings */}
                                <div className="flex items-center space-x-2 group cursor-pointer">
                                  <div className="p-1.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-emerald-600">{valueMetrics.timeSaved}</div>
                                    <div className="text-xs text-slate-500 leading-tight">Min Saved</div>
                                  </div>
                                </div>
                                
                                {/* Cost Savings */}
                                <div className="flex items-center space-x-2 group cursor-pointer">
                                  <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">€{valueMetrics.costSaved.toFixed(2)}</div>
                                    <div className="text-xs text-slate-500 leading-tight">Cost Saved</div>
                                  </div>
                                </div>
                                
                                {/* Processing Speed */}
                                <div className="flex items-center space-x-2 group cursor-pointer">
                                  <div className="p-1.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-lg font-bold text-purple-600">{valueMetrics.analysisTime}s</div>
                                    <div className="text-xs text-slate-500 leading-tight">AI Speed</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                          
                          {/* Premium Islamic Compliance Dashboard - Bulk Analysis */}
                          <div className="mb-8 relative overflow-hidden">
                            {/* Premium background with Islamic pattern inspiration */}
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 rounded-3xl"></div>
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/50 via-transparent to-white/30 rounded-3xl"></div>
                            
                            <div className="relative p-8 bg-white/90 backdrop-blur-sm border border-white/60 rounded-3xl shadow-2xl">
                              {/* Premium header with Islamic styling */}
                              <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                  <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-lg">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h5 className="text-2xl font-black bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
                                      Islamic Compliance Dashboard
                                    </h5>
                                    <p className="text-sm text-emerald-600 font-semibold mt-1">حلال • Halal Verification System</p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm font-bold rounded-full shadow-lg">
                                    ✓ VERIFIED
                                  </div>
                                </div>
                              </div>
                              
                              {/* Premium compliance cards with Islamic design elements */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Total Ingredients */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-slate-400 to-slate-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-slate-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">TOTAL</div>
                                    </div>
                                    <div className="text-5xl font-black text-slate-700 mb-2 tracking-tight">{result.ingredients.length}</div>
                                    <div className="text-lg font-bold text-slate-800 mb-1">Total</div>
                                    <div className="text-sm text-slate-500 font-medium">Ingredients</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-slate-400 to-slate-600 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Halal Certified */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-green-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-green-600 font-bold uppercase tracking-wider">حلال</div>
                                    </div>
                                    <div className="text-5xl font-black text-green-600 mb-2 tracking-tight">{result.ingredients.filter(i => i.status === 'APPROVED').length}</div>
                                    <div className="text-lg font-bold text-green-700 mb-1">Halal</div>
                                    <div className="text-sm text-green-600 font-medium">Certified</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Haram Prohibited */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-red-400 to-rose-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-red-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-red-600 font-bold uppercase tracking-wider">حرام</div>
                                    </div>
                                    <div className="text-5xl font-black text-red-600 mb-2 tracking-tight">{result.ingredients.filter(i => i.status === 'PROHIBITED').length}</div>
                                    <div className="text-lg font-bold text-red-700 mb-1">Haram</div>
                                    <div className="text-sm text-red-600 font-medium">Prohibited</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-red-400 to-rose-500 rounded-full"></div>
                                  </div>
                                </div>

                                {/* Mashbooh Questionable */}
                                <div className="group relative">
                                  <div className="absolute -inset-1 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-amber-200/80 transform group-hover:scale-105 transition-all duration-300">
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <div className="text-xs text-amber-600 font-bold uppercase tracking-wider">مشبوه</div>
                                    </div>
                                    <div className="text-5xl font-black text-amber-600 mb-2 tracking-tight">{result.ingredients.filter(i => i.status === 'REQUIRES_REVIEW').length}</div>
                                    <div className="text-lg font-bold text-amber-700 mb-1">Mashbooh</div>
                                    <div className="text-sm text-amber-600 font-medium">Review Needed</div>
                                    <div className="mt-4 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Detailed Ingredient Analysis */}
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h4 className="font-bold text-slate-800">Detailed Ingredient Analysis</h4>
                              </div>
                            </div>
                            
                            <div className="grid gap-4">
                              {result.ingredients.map((ing, idx) => {
                                const ingStatus = getStatusDisplay(ing.status)
                                const riskDisplay = getRiskDisplay(ing.risk)
                                
                                return (
                                  <div key={idx} className={`p-6 rounded-2xl border-2 shadow-md hover:shadow-lg transition-all duration-200 ${ingStatus.bgColor}`}>
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="font-bold text-lg text-slate-800">{ing.name}</span>
                                      <div className="flex items-center space-x-3">
                                        <div className={`px-4 py-2 rounded-xl font-bold text-sm shadow-md ${ingStatus.color} flex items-center space-x-2`}>
                                          {ingStatus.icon}
                                          <span>{ingStatus.label}</span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-sm font-medium ${riskDisplay.color} bg-white/80 border flex items-center space-x-2`}>
                                          {riskDisplay.icon}
                                          <span>{riskDisplay.label}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <p className="text-sm text-slate-700 mb-3 leading-relaxed font-medium">{ing.reason}</p>
                                    
                                    <div className="space-y-4 pt-4 border-t border-green-200">
                                        
                                        
                                        {/* Alternative Suggestions */}
                                        {ing.alternativeSuggestions && ing.alternativeSuggestions.length > 0 && (
                                          <div>
                                            <h6 className="font-semibold text-slate-700 mb-2">Halal Alternatives:</h6>
                                            <div className="flex flex-wrap gap-2">
                                              {ing.alternativeSuggestions.map((alt, altIdx) => (
                                                <span key={altIdx} className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                                  {alt}
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Document Upload/Display Section - Match Solo Analysis Exactly */}
                                        {(() => {
                                          const hasDocuments = ing.verificationDocuments && ing.verificationDocuments.length > 0
                                          const isMashbooh = ing.status === 'REQUIRES_REVIEW'
                                          console.log('📄 BULK DEBUG - Ingredient:', ing.name, 'Has docs?', hasDocuments, 'Length:', ing.verificationDocuments?.length, 'Docs:', ing.verificationDocuments)
                                          
                                          // Show section for mashbooh ingredients or ingredients with documents
                                          if (isMashbooh || hasDocuments) {
                                            return (
                                              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                                <div className="flex items-center space-x-2 mb-3">
                                                  <svg className="w-5 h-5 text-orange-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                  </svg>
                                                  <span className="font-bold text-orange-800">
                                                    {hasDocuments ? 'Documentation Complete' : 'Verification Required'}
                                                  </span>
                                                  {hasDocuments && (
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                                      ✓ Verified & Documented
                                                    </span>
                                                  )}
                                                </div>
                                                
                                                <div className="text-sm text-orange-700 mb-3">
                                                  {hasDocuments ? 
                                                    'Upload additional verified documentation if needed' :
                                                    'Upload verified halal documentation: certificates, supplier letters, lab reports'
                                                  }
                                                </div>
                                                
                                                {hasDocuments && (
                                                  <div className="space-y-3 mb-4">
                                                    <div className="flex items-center justify-between">
                                                      <div className="text-sm text-green-700 font-bold">
                                                        ✅ {ing.verificationDocuments.length} Verification Document(s) Uploaded
                                                      </div>
                                                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                        Documented ✓
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Document Display - Match Solo Analysis */}
                                                    {ing.verificationDocuments.map((doc, docIdx) => (
                                                      <div key={docIdx} className="p-3 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors">
                                                        <div className="flex items-start space-x-3">
                                                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                          </div>
                                                          <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                              <span className="text-sm font-medium text-green-800 truncate">
                                                                {doc.filename}
                                                              </span>
                                                              <div className="flex items-center space-x-2">
                                                                <span className="text-xs text-green-600 font-medium">
                                                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                                                </span>
                                                                <button
                                                                  onClick={() => deleteDocument(result.id, ing.name, doc.id)}
                                                                  className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                                                                  title="Delete this document"
                                                                >
                                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                  </svg>
                                                                </button>
                                                              </div>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                              <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700">
                                                                {doc.type}
                                                              </span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        
                                                        {/* Document Preview - Match Solo Analysis */}
                                                        {doc.previewUrl && (
                                                          <div className="mt-3">
                                                            {console.log('📄 BULK: Rendering preview for:', doc.filename, 'URL:', doc.previewUrl, 'Type:', doc.fileType)}
                                                            {doc.fileType?.startsWith('image/') ? (
                                                              <img 
                                                                src={doc.previewUrl} 
                                                                alt={doc.filename}
                                                                className="w-full max-w-full rounded border border-green-300"
                                                                style={{ maxHeight: '300px', objectFit: 'contain' }}
                                                                onLoad={() => console.log('BULK: Document image loaded:', doc.filename)}
                                                              />
                                                            ) : doc.fileType === 'application/pdf' ? (
                                                              <div className="border border-green-300 rounded p-4 bg-white text-center">
                                                                <svg className="w-12 h-12 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                                <p className="text-sm font-medium text-green-700">{doc.filename}</p>
                                                                <button 
                                                                  onClick={() => window.open(doc.previewUrl, '_blank')}
                                                                  className="mt-2 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                                                                >
                                                                  View PDF
                                                                </button>
                                                              </div>
                                                            ) : (
                                                              <div className="border border-green-300 rounded p-3 bg-white text-center">
                                                                <p className="text-sm text-green-700">{doc.filename}</p>
                                                                {doc.fileSize && (
                                                                  <p className="text-xs text-green-500">
                                                                    {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                                                  </p>
                                                                )}
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))}
                                                    
                                                    {/* Upload Additional Document Button */}
                                                    <div className="border border-dashed border-green-300 rounded-lg p-3 bg-green-25">
                                                      <input
                                                        type="file"
                                                        id={`additional-bulk-doc-upload-${idx}`}
                                                        className="hidden"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        onChange={(e) => handleDocumentUpload(e, result.id, ing.name)}
                                                      />
                                                      <label
                                                        htmlFor={`additional-bulk-doc-upload-${idx}`}
                                                        className="cursor-pointer inline-flex items-center space-x-2 text-sm text-green-700 hover:text-green-800 font-medium"
                                                      >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        <span>Upload Additional Document</span>
                                                      </label>
                                                    </div>
                                                  </div>
                                                )}
                                                
                                                {/* Initial Upload Section for Mashbooh without documents */}
                                                {!hasDocuments && (
                                                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center">
                                                    <svg className="w-8 h-8 text-orange-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                    </svg>
                                                    <div className="flex items-center justify-center space-x-2">
                                                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                      </svg>
                                                      <p className="font-semibold text-orange-700">Documentation Required</p>
                                                    </div>
                                                    <p className="text-sm text-orange-600 mt-1">This ingredient requires verification documentation</p>
                                                    
                                                    <label className="mt-3 inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors">
                                                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                      </svg>
                                                      Upload Verification Document
                                                      <input
                                                        type="file"
                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                        onChange={(e) => handleDocumentUpload(e, result.id, ing.name)}
                                                        className="hidden"
                                                      />
                                                    </label>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          }
                                          return null
                                        })()}
                                      </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                          
                          {/* Recommendations for Bulk Analysis */}
                          {(result.recommendations?.length > 0) && (
                            <div className="mt-6 grid md:grid-cols-1 gap-6">
                              {result.recommendations.length > 0 && (
                                <div>
                                  <div className="flex items-center space-x-2 mb-3">
                                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h5 className="font-semibold text-emerald-800">Recommendations</h5>
                                  </div>
                                  <ul className="space-y-2">
                                    {result.recommendations.map((rec, idx) => (
                                      <li key={idx} className="text-sm text-emerald-700 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}