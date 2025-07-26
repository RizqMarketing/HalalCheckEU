// Organization-specific report templates and export formats
// Handles different report types for certification bodies vs manufacturers

import { OrganizationType, getOrganizationConfig } from './organization-context'

export interface ReportData {
  id: string
  clientName: string
  company: string
  productName: string
  email: string
  phone: string
  analysisResult: any
  organizationType: OrganizationType
  createdDate: string
  reportNumber?: string
}

export interface ReportTemplate {
  title: string
  subtitle: string
  headerColor: string
  sections: ReportSection[]
  footer: string
  documentType: string
  validityPeriod?: string
  complianceStatement: string
}

export interface ReportSection {
  title: string
  content: string
  type: 'header' | 'analysis' | 'ingredients' | 'recommendations' | 'compliance' | 'footer'
  priority: number
}

export class ReportGenerator {
  private static instance: ReportGenerator
  
  static getInstance(): ReportGenerator {
    if (!ReportGenerator.instance) {
      ReportGenerator.instance = new ReportGenerator()
    }
    return ReportGenerator.instance
  }

  // Generate organization-specific report template
  generateReportTemplate(data: ReportData): ReportTemplate {
    const config = getOrganizationConfig(data.organizationType)
    
    switch (data.organizationType) {
      case 'certification-body':
        return this.generateCertificationBodyTemplate(data, config)
      case 'food-manufacturer':
        return this.generateManufacturerTemplate(data, config)
      case 'import-export':
        return this.generateImportExportTemplate(data, config)
      default:
        return this.generateCertificationBodyTemplate(data, config)
    }
  }

  // Certification Body Template - Formal halal certificate
  private generateCertificationBodyTemplate(data: ReportData, config: any): ReportTemplate {
    const reportNumber = data.reportNumber || `HC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    
    return {
      title: 'Halal Certificate',
      subtitle: 'Islamic Dietary Compliance Certification',
      headerColor: '#059669', // emerald-600
      documentType: 'Official Halal Certificate',
      validityPeriod: '12 months from issue date',
      complianceStatement: 'This certificate confirms compliance with Islamic Shariah requirements for halal food production and consumption.',
      sections: [
        {
          title: 'Certificate Information',
          type: 'header',
          priority: 1,
          content: `
            <div class="certificate-header">
              <h1>HALAL CERTIFICATE</h1>
              <div class="cert-number">Certificate No: ${reportNumber}</div>
              <div class="issue-date">Issue Date: ${new Date(data.createdDate).toLocaleDateString()}</div>
              <div class="validity">Valid Until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
            </div>
          `
        },
        {
          title: 'Client Information',
          type: 'header',
          priority: 2,
          content: `
            <div class="client-info">
              <h3>Certified Entity</h3>
              <p><strong>Company:</strong> ${data.company}</p>
              <p><strong>Contact Person:</strong> ${data.clientName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> ${data.phone}</p>
              <p><strong>Product Name:</strong> ${data.productName}</p>
            </div>
          `
        },
        {
          title: 'Shariah Compliance Analysis',
          type: 'analysis',
          priority: 3,
          content: this.generateIslamicAnalysisSection(data.analysisResult)
        },
        {
          title: 'Ingredient Assessment',
          type: 'ingredients',
          priority: 4,
          content: this.generateIngredientsSection(data.analysisResult, 'certification-body')
        },
        {
          title: 'Certification Statement',
          type: 'compliance',
          priority: 5,
          content: `
            <div class="certification-statement">
              <h3>Official Certification</h3>
              <p>After thorough examination of the ingredients and production process, we hereby certify that the above-mentioned product:</p>
              <ul>
                <li>✅ Contains only halal-permissible ingredients</li>
                <li>✅ Complies with Islamic Shariah requirements</li>
                <li>✅ Is suitable for consumption by Muslim consumers</li>
                <li>✅ Meets international halal certification standards</li>
              </ul>
              <div class="islamic-declaration">
                <p><strong>Islamic Declaration:</strong></p>
                <p class="arabic-text">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
                <p><em>In the name of Allah, the Most Gracious, the Most Merciful</em></p>
                <p>This product has been evaluated according to Islamic jurisprudence (Fiqh) and found to be halal (permissible) for Muslim consumption.</p>
              </div>
            </div>
          `
        }
      ],
      footer: `
        <div class="certificate-footer">
          <p><strong>HalalCheck AI Professional Certification</strong></p>
          <p>This certificate is issued based on AI-powered analysis combined with Islamic jurisprudence expertise.</p>
          <p>For verification, contact: certification@halalcheck.eu | +31 20 123 4567</p>
          <div class="signature-section">
            <div class="signature">
              <p>________________________</p>
              <p>Chief Islamic Scholar</p>
              <p>HalalCheck AI Certification</p>
            </div>
          </div>
        </div>
      `
    }
  }

  // Food Manufacturer Template - Pre-certification development report
  private generateManufacturerTemplate(data: ReportData, config: any): ReportTemplate {
    const reportNumber = data.reportNumber || `PCR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    
    return {
      title: 'Pre-Certification Compliance Report',
      subtitle: 'Product Development Halal Compliance Analysis',
      headerColor: '#2563eb', // blue-600
      documentType: 'Development Compliance Report',
      validityPeriod: '6 months from issue date',
      complianceStatement: 'This report provides halal compliance guidance for product development and preparation for formal certification.',
      sections: [
        {
          title: 'Report Information',
          type: 'header',
          priority: 1,
          content: `
            <div class="report-header">
              <h1>PRE-CERTIFICATION COMPLIANCE REPORT</h1>
              <div class="report-number">Report No: ${reportNumber}</div>
              <div class="issue-date">Generated: ${new Date(data.createdDate).toLocaleDateString()}</div>
              <div class="validity">Valid for Development Until: ${new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
            </div>
          `
        },
        {
          title: 'Product Development Information',
          type: 'header',
          priority: 2,
          content: `
            <div class="product-info">
              <h3>Product Under Development</h3>
              <p><strong>Manufacturing Company:</strong> ${data.company}</p>
              <p><strong>Product Manager:</strong> ${data.clientName}</p>
              <p><strong>Contact Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> ${data.phone}</p>
              <p><strong>Product Name:</strong> ${data.productName}</p>
              <p><strong>Development Stage:</strong> Ingredient Compliance Validation</p>
            </div>
          `
        },
        {
          title: 'Compliance Analysis',
          type: 'analysis',
          priority: 3,
          content: this.generateComplianceAnalysisSection(data.analysisResult)
        },
        {
          title: 'Ingredient Risk Assessment',
          type: 'ingredients',
          priority: 4,
          content: this.generateIngredientsSection(data.analysisResult, 'food-manufacturer')
        },
        {
          title: 'Development Recommendations',
          type: 'recommendations',
          priority: 5,
          content: this.generateDevelopmentRecommendations(data.analysisResult)
        },
        {
          title: 'Next Steps for Certification',
          type: 'compliance',
          priority: 6,
          content: `
            <div class="next-steps">
              <h3>Recommended Actions</h3>
              <div class="action-items">
                <h4>📋 Immediate Actions:</h4>
                <ul>
                  <li>Review all flagged ingredients and find halal alternatives if needed</li>
                  <li>Verify supplier halal certifications for all ingredients</li>
                  <li>Document ingredient sourcing and supply chain processes</li>
                </ul>
                
                <h4>🏭 Production Readiness:</h4>
                <ul>
                  <li>Ensure production line halal compliance (no cross-contamination)</li>
                  <li>Implement halal quality control procedures</li>
                  <li>Train production staff on halal requirements</li>
                </ul>
                
                <h4>📄 Certification Preparation:</h4>
                <ul>
                  <li>Prepare formal application with halal certification body</li>
                  <li>Schedule facility inspection if required</li>
                  <li>Compile complete documentation package</li>
                </ul>
              </div>
              
              <div class="certification-pathway">
                <h4>🎯 Certification Pathway:</h4>
                <div class="pathway-steps">
                  <div class="step">1. Complete ingredient compliance ✅</div>
                  <div class="step">2. Production line validation</div>
                  <div class="step">3. Documentation review</div>
                  <div class="step">4. Facility inspection</div>
                  <div class="step">5. Final certification</div>
                </div>
              </div>
            </div>
          `
        }
      ],
      footer: `
        <div class="report-footer">
          <p><strong>HalalCheck AI Development Support</strong></p>
          <p>This pre-certification report supports halal product development. For final certification, contact an accredited halal certification body.</p>
          <p>Development Support: development@halalcheck.eu | +31 20 123 4567</p>
          <div class="disclaimer">
            <p><small>This report is for development guidance only and does not constitute official halal certification.</small></p>
          </div>
        </div>
      `
    }
  }

  // Import/Export Template - Compliance certificate for trade
  private generateImportExportTemplate(data: ReportData, config: any): ReportTemplate {
    const reportNumber = data.reportNumber || `CC-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`
    
    return {
      title: 'Trade Compliance Certificate',
      subtitle: 'International Halal Trade Compliance Verification',
      headerColor: '#7c3aed', // violet-600
      documentType: 'Trade Compliance Certificate',
      validityPeriod: '12 months from issue date',
      complianceStatement: 'This certificate verifies halal compliance for international trade and import/export operations.',
      sections: [
        {
          title: 'Compliance Certificate',
          type: 'header',
          priority: 1,
          content: `
            <div class="compliance-header">
              <h1>TRADE COMPLIANCE CERTIFICATE</h1>
              <div class="cert-number">Certificate No: ${reportNumber}</div>
              <div class="issue-date">Issue Date: ${new Date(data.createdDate).toLocaleDateString()}</div>
              <div class="validity">Valid Until: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
            </div>
          `
        },
        {
          title: 'Trading Entity Information',
          type: 'header',
          priority: 2,
          content: `
            <div class="trader-info">
              <h3>Certified Trading Entity</h3>
              <p><strong>Company:</strong> ${data.company}</p>
              <p><strong>Contact Person:</strong> ${data.clientName}</p>
              <p><strong>Email:</strong> ${data.email}</p>
              <p><strong>Phone:</strong> ${data.phone}</p>
              <p><strong>Product/Shipment:</strong> ${data.productName}</p>
              <p><strong>Trade Classification:</strong> Halal-Compliant Goods</p>
            </div>
          `
        },
        {
          title: 'Trade Compliance Analysis',
          type: 'analysis',
          priority: 3,
          content: this.generateTradeComplianceSection(data.analysisResult)
        },
        {
          title: 'Product Specification',
          type: 'ingredients',
          priority: 4,
          content: this.generateIngredientsSection(data.analysisResult, 'import-export')
        },
        {
          title: 'International Compliance Statement',
          type: 'compliance',
          priority: 5,
          content: `
            <div class="international-compliance">
              <h3>Trade Compliance Verification</h3>
              <p>This certificate confirms that the specified product meets international halal trade requirements for:</p>
              <ul>
                <li>✅ EU halal import/export regulations</li>
                <li>✅ OIC (Organisation of Islamic Cooperation) standards</li>
                <li>✅ International halal supply chain requirements</li>
                <li>✅ Cross-border halal trade compliance</li>
              </ul>
              
              <div class="trade-declaration">
                <h4>International Trade Declaration</h4>
                <p>The undersigned certifies that this product has been evaluated for halal compliance according to internationally recognized Islamic dietary laws and trade standards.</p>
                <p><strong>Compliance Standards:</strong> MS 1500:2019, SMIIC OIC/SMIIC 1:2019, UAE.S 2055-1:2015</p>
              </div>
            </div>
          `
        }
      ],
      footer: `
        <div class="trade-footer">
          <p><strong>HalalCheck AI International Trade Compliance</strong></p>
          <p>This certificate supports international halal trade operations and regulatory compliance.</p>
          <p>Trade Support: trade@halalcheck.eu | +31 20 123 4567</p>
          <div class="customs-note">
            <p><strong>For Customs Authorities:</strong> This certificate may be used for halal product classification in international trade.</p>
          </div>
        </div>
      `
    }
  }

  // Helper methods for generating specific sections

  private generateIslamicAnalysisSection(analysisResult: any): string {
    if (!analysisResult) return '<p>No analysis data available.</p>'
    
    const overallStatus = analysisResult.overall?.toUpperCase() || 'UNKNOWN'
    const statusColor = overallStatus === 'APPROVED' ? '#059669' : overallStatus === 'PROHIBITED' ? '#dc2626' : '#d97706'
    
    return `
      <div class="islamic-analysis">
        <div class="overall-ruling" style="border-left: 4px solid ${statusColor}; padding-left: 16px; margin-bottom: 20px;">
          <h4>Overall Islamic Ruling (Hukm Shar'i)</h4>
          <div class="ruling-status" style="color: ${statusColor}; font-weight: bold; font-size: 18px;">
            ${overallStatus === 'APPROVED' ? '✅ HALAL (حلال)' : overallStatus === 'PROHIBITED' ? '❌ HARAM (حرام)' : '⚠️ MASHBOOH (مشبوه)'}
          </div>
          <p class="ruling-explanation">${this.getRulingExplanation(overallStatus)}</p>
        </div>
        
        ${analysisResult.islamicContext ? `
          <div class="jurisprudence-context">
            <h4>Islamic Jurisprudence Context</h4>
            <p><strong>Scholarly Basis:</strong> ${analysisResult.islamicContext.scholarlyBasis}</p>
            <p><strong>Ruling:</strong> ${analysisResult.islamicContext.overallRuling}</p>
            
            ${analysisResult.islamicContext.quranicReferences?.length > 0 ? `
              <div class="quranic-references">
                <h5>Quranic References:</h5>
                ${analysisResult.islamicContext.quranicReferences.map((ref: any) => `
                  <div class="reference">
                    <p><strong>${ref.verse}:</strong></p>
                    <p class="arabic">${ref.arabic}</p>
                    <p class="translation"><em>${ref.translation}</em></p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `
  }

  private generateComplianceAnalysisSection(analysisResult: any): string {
    if (!analysisResult) return '<p>No analysis data available.</p>'
    
    const overallStatus = analysisResult.overall?.toUpperCase() || 'UNKNOWN'
    const statusColor = overallStatus === 'APPROVED' ? '#059669' : overallStatus === 'PROHIBITED' ? '#dc2626' : '#d97706'
    
    return `
      <div class="compliance-analysis">
        <div class="compliance-status" style="border-left: 4px solid ${statusColor}; padding-left: 16px; margin-bottom: 20px;">
          <h4>Compliance Assessment</h4>
          <div class="status-indicator" style="color: ${statusColor}; font-weight: bold; font-size: 18px;">
            ${overallStatus === 'APPROVED' ? '✅ COMPLIANT' : overallStatus === 'PROHIBITED' ? '❌ NON-COMPLIANT' : '⚠️ REQUIRES REVIEW'}
          </div>
          <p class="status-explanation">${this.getComplianceExplanation(overallStatus)}</p>
        </div>
        
        <div class="development-impact">
          <h4>Development Impact Assessment</h4>
          <div class="impact-metrics">
            <div class="metric">
              <span class="label">Risk Level:</span>
              <span class="value ${this.getRiskClass(overallStatus)}">${this.getRiskLevel(overallStatus)}</span>
            </div>
            <div class="metric">
              <span class="label">Development Phase:</span>
              <span class="value">Ingredient Validation</span>
            </div>
            <div class="metric">
              <span class="label">Certification Readiness:</span>
              <span class="value">${overallStatus === 'APPROVED' ? 'Ready for Next Phase' : 'Requires Ingredient Review'}</span>
            </div>
          </div>
        </div>
      </div>
    `
  }

  private generateTradeComplianceSection(analysisResult: any): string {
    if (!analysisResult) return '<p>No analysis data available.</p>'
    
    const overallStatus = analysisResult.overall?.toUpperCase() || 'UNKNOWN'
    const statusColor = overallStatus === 'APPROVED' ? '#059669' : overallStatus === 'PROHIBITED' ? '#dc2626' : '#d97706'
    
    return `
      <div class="trade-compliance">
        <div class="trade-status" style="border-left: 4px solid ${statusColor}; padding-left: 16px; margin-bottom: 20px;">
          <h4>Trade Compliance Status</h4>
          <div class="status-indicator" style="color: ${statusColor}; font-weight: bold; font-size: 18px;">
            ${overallStatus === 'APPROVED' ? '✅ CLEARED FOR TRADE' : overallStatus === 'PROHIBITED' ? '❌ TRADE RESTRICTED' : '⚠️ CONDITIONAL APPROVAL'}
          </div>
          <p class="status-explanation">${this.getTradeExplanation(overallStatus)}</p>
        </div>
        
        <div class="trade-classification">
          <h4>Product Classification</h4>
          <table class="classification-table">
            <tr>
              <td><strong>Halal Status:</strong></td>
              <td style="color: ${statusColor};">${overallStatus === 'APPROVED' ? 'Halal Certified' : overallStatus === 'PROHIBITED' ? 'Non-Halal' : 'Pending Verification'}</td>
            </tr>
            <tr>
              <td><strong>Trade Category:</strong></td>
              <td>Food Products - Halal Compliant</td>
            </tr>
            <tr>
              <td><strong>Regulatory Status:</strong></td>
              <td>${overallStatus === 'APPROVED' ? 'EU Import Approved' : 'Requires Additional Documentation'}</td>
            </tr>
            <tr>
              <td><strong>Market Access:</strong></td>
              <td>${overallStatus === 'APPROVED' ? 'Global Muslim Markets' : 'Restricted Markets'}</td>
            </tr>
          </table>
        </div>
      </div>
    `
  }

  private generateIngredientsSection(analysisResult: any, orgType: OrganizationType): string {
    if (!analysisResult?.ingredients || !Array.isArray(analysisResult.ingredients)) {
      return '<p>No ingredient data available.</p>'
    }

    const sectionTitle = orgType === 'food-manufacturer' ? 'Ingredient Risk Assessment' : 
                       orgType === 'import-export' ? 'Product Specification' : 
                       'Ingredient Analysis'

    return `
      <div class="ingredients-section">
        <h4>${sectionTitle}</h4>
        <div class="ingredients-table">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Ingredient</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Status</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">${orgType === 'food-manufacturer' ? 'Risk Level' : 'Classification'}</th>
                <th style="padding: 12px; text-align: left; border: 1px solid #e2e8f0;">Notes</th>
              </tr>
            </thead>
            <tbody>
              ${analysisResult.ingredients.map((ingredient: any, index: number) => {
                const status = ingredient.status?.toUpperCase() || 'UNKNOWN'
                const statusColor = status === 'APPROVED' ? '#059669' : status === 'PROHIBITED' ? '#dc2626' : '#d97706'
                
                return `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">
                      <strong>${ingredient.name || ingredient.ingredient || 'Unknown Ingredient'}</strong>
                    </td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0; color: ${statusColor}; font-weight: bold;">
                      ${status === 'APPROVED' ? '✅ Halal' : status === 'PROHIBITED' ? '❌ Haram' : '⚠️ Requires Verification'}
                    </td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">
                      ${orgType === 'food-manufacturer' ? this.getRiskLevel(status) : this.getClassification(status)}
                    </td>
                    <td style="padding: 12px; border: 1px solid #e2e8f0;">
                      ${ingredient.reason || ingredient.islamicReasoning || 'Standard halal ingredient assessment'}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  }

  private generateDevelopmentRecommendations(analysisResult: any): string {
    if (!analysisResult) return '<p>No analysis data available for recommendations.</p>'

    const problemIngredients = analysisResult.ingredients?.filter((ing: any) => 
      ing.status?.toUpperCase() !== 'APPROVED'
    ) || []

    const approvedCount = (analysisResult.ingredients?.length || 0) - problemIngredients.length
    const totalCount = analysisResult.ingredients?.length || 0

    return `
      <div class="development-recommendations">
        <div class="summary-metrics">
          <h4>Development Summary</h4>
          <div class="metrics-grid">
            <div class="metric-card approved">
              <div class="number">${approvedCount}</div>
              <div class="label">Approved Ingredients</div>
            </div>
            <div class="metric-card total">
              <div class="number">${totalCount}</div>
              <div class="label">Total Ingredients</div>
            </div>
            <div class="metric-card compliance">
              <div class="number">${Math.round((approvedCount / totalCount) * 100)}%</div>
              <div class="label">Compliance Rate</div>
            </div>
          </div>
        </div>

        ${problemIngredients.length > 0 ? `
          <div class="action-required">
            <h4>🚨 Ingredients Requiring Attention</h4>
            <div class="problem-ingredients">
              ${problemIngredients.map((ing: any) => `
                <div class="problem-ingredient">
                  <div class="ingredient-name">
                    <strong>${ing.name || ing.ingredient}</strong>
                    <span class="status-badge ${ing.status?.toLowerCase()}">${ing.status}</span>
                  </div>
                  <div class="recommendation">
                    <strong>Recommendation:</strong> ${this.getIngredientRecommendation(ing)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : `
          <div class="all-approved">
            <h4>✅ All Ingredients Approved</h4>
            <p>Congratulations! All ingredients in your product formulation are halal-compliant. You can proceed to the next development phase.</p>
          </div>
        `}

        <div class="next-phase-readiness">
          <h4>Next Phase Readiness Assessment</h4>
          <div class="readiness-indicators">
            <div class="indicator ${approvedCount === totalCount ? 'ready' : 'not-ready'}">
              <span class="icon">${approvedCount === totalCount ? '✅' : '⏳'}</span>
              <span class="text">Ingredient Compliance: ${approvedCount === totalCount ? 'Complete' : 'In Progress'}</span>
            </div>
            <div class="indicator pending">
              <span class="icon">⏳</span>
              <span class="text">Production Line Validation: Pending</span>
            </div>
            <div class="indicator pending">
              <span class="icon">⏳</span>
              <span class="text">Supplier Certification: Pending</span>
            </div>
            <div class="indicator pending">
              <span class="icon">⏳</span>
              <span class="text">Final Certification Application: Pending</span>
            </div>
          </div>
        </div>

        <div class="development-timeline">
          <h4>Recommended Development Timeline</h4>
          <div class="timeline">
            <div class="timeline-item completed">
              <div class="step">1</div>
              <div class="content">
                <h5>Ingredient Analysis</h5>
                <p>✅ Completed - ${new Date().toLocaleDateString()}</p>
              </div>
            </div>
            <div class="timeline-item ${problemIngredients.length === 0 ? 'current' : 'blocked'}">
              <div class="step">2</div>
              <div class="content">
                <h5>Formulation Finalization</h5>
                <p>${problemIngredients.length === 0 ? '📋 Ready to proceed' : '⚠️ Address ingredient issues first'}</p>
              </div>
            </div>
            <div class="timeline-item pending">
              <div class="step">3</div>
              <div class="content">
                <h5>Production Setup</h5>
                <p>🏭 Estimated: 2-4 weeks</p>
              </div>
            </div>
            <div class="timeline-item pending">
              <div class="step">4</div>
              <div class="content">
                <h5>Formal Certification</h5>
                <p>📄 Estimated: 3-6 weeks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Helper methods for status formatting
  private getRulingExplanation(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'This product is halal (permissible) according to Islamic law and suitable for Muslim consumption.'
      case 'PROHIBITED':
        return 'This product contains haram (forbidden) ingredients and is not suitable for Muslim consumption.'
      default:
        return 'This product contains questionable ingredients that require further scholarly consultation.'
    }
  }

  private getComplianceExplanation(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Product meets halal compliance requirements and is ready for the next development phase.'
      case 'PROHIBITED':
        return 'Product contains non-compliant ingredients that must be replaced before proceeding.'
      default:
        return 'Product requires ingredient verification before compliance can be confirmed.'
    }
  }

  private getTradeExplanation(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'Product meets international halal trade requirements and is cleared for export to Muslim markets.'
      case 'PROHIBITED':
        return 'Product does not meet halal requirements and trade to Muslim markets is restricted.'
      default:
        return 'Product requires additional documentation for halal trade clearance.'
    }
  }

  private getRiskLevel(status: string): string {
    switch (status) {
      case 'APPROVED': return 'Low Risk'
      case 'PROHIBITED': return 'High Risk'
      default: return 'Medium Risk'
    }
  }

  private getRiskClass(status: string): string {
    switch (status) {
      case 'APPROVED': return 'low-risk'
      case 'PROHIBITED': return 'high-risk'
      default: return 'medium-risk'
    }
  }

  private getClassification(status: string): string {
    switch (status) {
      case 'APPROVED': return 'Halal Certified'
      case 'PROHIBITED': return 'Non-Halal'
      default: return 'Requires Verification'
    }
  }

  private getIngredientRecommendation(ingredient: any): string {
    const status = ingredient.status?.toUpperCase()
    const name = ingredient.name || ingredient.ingredient || 'ingredient'
    
    switch (status) {
      case 'PROHIBITED':
        return `Replace ${name} with a halal-certified alternative. Contact your supplier for halal substitutes.`
      case 'QUESTIONABLE':
      case 'VERIFY_SOURCE':
        return `Verify the source and production method of ${name}. Obtain halal certification from the supplier.`
      default:
        return `Review the compliance status of ${name} and obtain proper documentation.`
    }
  }

  // Export functionality
  generateHTMLReport(template: ReportTemplate): string {
    const styles = this.getReportStyles(template.headerColor)
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.title}</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="report-container">
          <div class="report-header" style="border-top: 4px solid ${template.headerColor};">
            <h1>${template.title}</h1>
            <h2>${template.subtitle}</h2>
          </div>
          
          <div class="report-body">
            ${template.sections
              .sort((a, b) => a.priority - b.priority)
              .map(section => `
                <div class="report-section section-${section.type}">
                  ${section.title ? `<h3>${section.title}</h3>` : ''}
                  <div class="section-content">
                    ${section.content}
                  </div>
                </div>
              `).join('')
            }
          </div>
          
          <div class="report-footer">
            ${template.footer}
          </div>
        </div>
      </body>
      </html>
    `
  }

  private getReportStyles(primaryColor: string): string {
    return `
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 20px;
        background-color: #f8fafc;
      }
      
      .report-container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .report-header {
        padding: 40px;
        background: linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05);
        text-align: center;
      }
      
      .report-header h1 {
        color: ${primaryColor};
        margin: 0 0 10px 0;
        font-size: 2.5em;
        font-weight: bold;
      }
      
      .report-header h2 {
        color: #64748b;
        margin: 0;
        font-size: 1.2em;
        font-weight: normal;
      }
      
      .report-body {
        padding: 40px;
      }
      
      .report-section {
        margin-bottom: 40px;
        padding-bottom: 30px;
        border-bottom: 1px solid #e2e8f0;
      }
      
      .report-section:last-child {
        border-bottom: none;
      }
      
      .report-section h3 {
        color: ${primaryColor};
        font-size: 1.5em;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid ${primaryColor}20;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
      }
      
      th, td {
        padding: 12px;
        text-align: left;
        border: 1px solid #e2e8f0;
      }
      
      th {
        background-color: #f8fafc;
        font-weight: bold;
        color: #374151;
      }
      
      .certificate-header, .report-header, .compliance-header {
        text-align: center;
        margin-bottom: 30px;
      }
      
      .cert-number, .report-number {
        font-size: 1.2em;
        font-weight: bold;
        color: ${primaryColor};
        margin: 10px 0;
      }
      
      .issue-date, .validity {
        color: #64748b;
        margin: 5px 0;
      }
      
      .client-info, .product-info, .trader-info {
        background: #f8fafc;
        padding: 20px;
        border-radius: 8px;
        margin: 20px 0;
      }
      
      .certification-statement, .next-steps, .international-compliance {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
      }
      
      .islamic-declaration {
        background: #fefce8;
        border: 1px solid #fef08a;
        border-radius: 8px;
        padding: 20px;
        margin: 20px 0;
        text-align: center;
      }
      
      .arabic-text {
        font-size: 1.5em;
        font-weight: bold;
        color: #059669;
        margin: 15px 0;
        direction: rtl;
      }
      
      .signature-section {
        margin-top: 40px;
        text-align: right;
      }
      
      .signature {
        display: inline-block;
        text-align: center;
      }
      
      .report-footer {
        background: #f8fafc;
        padding: 30px 40px;
        border-top: 1px solid #e2e8f0;
        text-align: center;
        color: #64748b;
      }
      
      .disclaimer {
        margin-top: 20px;
        font-style: italic;
        color: #64748b;
      }
      
      .overall-ruling, .compliance-status, .trade-status {
        margin: 20px 0;
        padding: 20px;
        border-radius: 8px;
        background: #f8fafc;
      }
      
      .ruling-status, .status-indicator {
        font-size: 1.3em;
        margin: 10px 0;
      }
      
      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        margin: 20px 0;
      }
      
      .metric-card {
        text-align: center;
        padding: 20px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      
      .metric-card .number {
        font-size: 2em;
        font-weight: bold;
        color: ${primaryColor};
      }
      
      .metric-card .label {
        color: #64748b;
        font-size: 0.9em;
      }
      
      .timeline {
        margin: 20px 0;
      }
      
      .timeline-item {
        display: flex;
        margin: 20px 0;
        align-items: center;
      }
      
      .timeline-item .step {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        margin-right: 20px;
      }
      
      .timeline-item.pending .step {
        background: #e2e8f0;
        color: #64748b;
      }
      
      .timeline-item.blocked .step {
        background: #fef2f2;
        color: #dc2626;
        border: 2px solid #fecaca;
      }
      
      .readiness-indicators {
        margin: 20px 0;
      }
      
      .indicator {
        display: flex;
        align-items: center;
        margin: 10px 0;
        padding: 10px;
        border-radius: 6px;
        background: #f8fafc;
      }
      
      .indicator.ready {
        background: #f0fdf4;
        color: #059669;
      }
      
      .indicator.not-ready {
        background: #fef2f2;
        color: #dc2626;
      }
      
      .indicator .icon {
        margin-right: 10px;
        font-size: 1.2em;
      }
      
      .problem-ingredient {
        margin: 15px 0;
        padding: 15px;
        border-radius: 6px;
        background: #fef2f2;
        border: 1px solid #fecaca;
      }
      
      .ingredient-name {
        display: flex;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .status-badge {
        margin-left: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: bold;
        background: #dc2626;
        color: white;
      }
      
      .status-badge.questionable {
        background: #d97706;
      }
      
      @media print {
        body {
          background: white;
          padding: 0;
        }
        
        .report-container {
          box-shadow: none;
          border-radius: 0;
        }
        
        .report-section {
          break-inside: avoid;
        }
      }
    `
  }
}

// Export singleton instance
export const reportGenerator = ReportGenerator.getInstance()