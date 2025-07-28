// HalalCheck AI - API Service Layer
// Handles all backend API communications with proper error handling

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log('API Request:', { url, config });
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new ApiError(response.status, `API Error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(0, 'Network error or server unavailable');
    }
  }

  // Analysis endpoints - Enhanced with agent system
  async analyzeIngredients(productName: string, ingredients: string) {
    return this.request('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({
        productName,
        ingredients
      }),
    });
  }

  // Enhanced file analysis with vision support
  async analyzeFile(file: File, productName?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (productName) {
      formData.append('productName', productName);
    }

    return this.request('/api/analysis/analyze-file', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type for FormData
    });
  }

  async analyzeBulk(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/api/analysis/bulk', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type for FormData
    });
  }

  async generatePDF(analysisData: any) {
    return this.request('/api/analysis/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  // File upload endpoints
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type for FormData
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Database stats
  async getDatabaseStats() {
    return this.request('/api/database/stats');
  }

  // Get dashboard stats from backend
  async getDashboardStats() {
    try {
      return this.request('/api/dashboard/stats');
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      // Fallback to mock data if backend not available
      return {
        totalAnalyses: 23,
        halalCount: 15,
        haramCount: 3,
        mashboohCount: 5,
        costSavings: 1250,
        avgProcessingTime: 45
      };
    }
  }

  // Get recent analyses
  async getRecentAnalyses() {
    try {
      const response = await this.request('/api/dashboard/recent-analyses');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get recent analyses:', error);
      return [];
    }
  }

  // Test PDF generation
  async testPDF() {
    return this.request('/api/test-pdf');
  }

  // NEW AGENT-BASED ENDPOINTS

  // Execute workflows
  async executeWorkflow(workflowType: string, data: any) {
    return this.request('/api/workflows/execute', {
      method: 'POST',
      body: JSON.stringify({
        workflowType,
        data
      }),
    });
  }

  // Execute halal analysis workflow
  async executeHalalAnalysisWorkflow(data: any) {
    return this.executeWorkflow('halal-analysis', data);
  }

  // Execute certificate generation workflow
  async executeCertificateWorkflow(data: any) {
    return this.executeWorkflow('certificate-generation', data);
  }

  // Get organization configuration
  async getOrganizationConfig(organizationId: string) {
    return this.request(`/api/organization/${organizationId}/config`);
  }

  // Get system health and metrics
  async getSystemHealth() {
    return this.request('/api/system/health');
  }

  // Generate certificates
  async generateCertificate(certificateData: any) {
    return this.request('/api/certificates/generate', {
      method: 'POST',
      body: JSON.stringify(certificateData),
    });
  }

  // Enhanced analysis with agent system context
  async analyzeIngredientsWithContext(productName: string, ingredients: string, context?: {
    organizationType?: string;
    madhab?: string;
    strictnessLevel?: 'strict' | 'moderate' | 'lenient';
  }) {
    return this.request('/api/analysis/analyze', {
      method: 'POST',
      body: JSON.stringify({
        productName,
        ingredients,
        ...context
      }),
    });
  }

  // Complete document analysis workflow
  async analyzeDocumentComplete(file: File, productName?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (productName) {
      formData.append('productName', productName);
    }
    formData.append('workflowType', 'complete-analysis');

    return this.request('/api/analysis/analyze-file', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  }
}

// Transform backend response to frontend format
export function transformAnalysisResult(backendResult: any): any {
  // Handle new agent-based response format
  if (backendResult.overallStatus || backendResult.confidenceScore) {
    return {
      id: crypto.randomUUID(),
      overall_status: backendResult.overallStatus,
      confidence_score: (backendResult.confidenceScore || 85) / 100,
      ingredients_analyzed: (backendResult.ingredients || []).map((ing: any) => ({
        name: ing.name,
        status: ing.status,
        confidence: ing.confidence / 100 || 0.8,
        note: ing.reasoning || ing.reason || '',
        risk: ing.risk || 'LOW',
        category: ing.category || 'General',
        islamicReferences: ing.islamicReferences || [],
        alternatives: ing.alternativeSuggestions || [],
        requiresVerification: ing.requiresVerification || false
      })),
      high_risk_ingredients: (backendResult.ingredients || [])
        .filter((ing: any) => ing.status === 'HARAM' || ing.status === 'MASHBOOH' || ing.status === 'QUESTIONABLE')
        .map((ing: any) => ing.name),
      ai_reasoning: backendResult.analysis || backendResult.reasoning || 'Analysis completed using agent-based AI system.',
      islamic_references: backendResult.islamicGuidance || backendResult.scholarlyNotes?.join('\n') || 'Analysis follows Islamic dietary principles and halal certification standards.',
      recommendations: Array.isArray(backendResult.recommendations) ? 
        backendResult.recommendations.join('\n') : 
        (backendResult.recommendations || 'Continue with certification process based on analysis results.'),
      processing_time: (backendResult.timestamp ? (Date.now() - new Date(backendResult.timestamp).getTime()) / 1000 : 3.2),
      warnings: backendResult.warnings || [],
      pdf_url: backendResult.pdfUrl || null,
      // Enhanced agent-specific data
      agentMetadata: {
        agentId: backendResult.agentId,
        timestamp: backendResult.timestamp,
        success: backendResult.success
      }
    };
  }

  // Fallback to legacy format
  return {
    id: crypto.randomUUID(),
    overall_status: backendResult.status === 'APPROVED' ? 'HALAL' : 
                   backendResult.status === 'PROHIBITED' ? 'HARAM' : 'MASHBOOH',
    confidence_score: (backendResult.confidence || 85) / 100,
    ingredients_analyzed: (backendResult.ingredients || []).map((ing: any) => ({
      name: ing.name,
      status: ing.status === 'APPROVED' ? 'HALAL' : 
              ing.status === 'PROHIBITED' ? 'HARAM' : 'MASHBOOH',
      confidence: ing.confidence || 0.8,
      note: ing.reason || '',
      risk: ing.risk || 'LOW',
      category: ing.category || 'General'
    })),
    high_risk_ingredients: (backendResult.ingredients || [])
      .filter((ing: any) => ing.status === 'QUESTIONABLE' || ing.status === 'PROHIBITED')
      .map((ing: any) => ing.name),
    ai_reasoning: backendResult.analysis || 'Analysis completed using AI-powered ingredient verification.',
    islamic_references: backendResult.islamic_guidance || 'Analysis follows Islamic dietary principles and halal certification standards.',
    recommendations: Array.isArray(backendResult.recommendations) ? 
      backendResult.recommendations.join('\n') : 
      (backendResult.recommendations || 'Continue with certification process based on analysis results.'),
    processing_time: backendResult.processingTime || 3.2,
    warnings: backendResult.warnings || [],
    pdf_url: backendResult.pdfUrl || null
  };
}

// Export singleton instance
export const apiService = new ApiService();
export { ApiError };