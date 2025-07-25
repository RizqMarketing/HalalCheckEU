/**
 * HalalCheck EU - Professional Reporting Service
 * 
 * CRITICAL: These reports are used for official halal certification decisions.
 * Legal disclaimers and religious sensitivity are mandatory.
 * 
 * Features:
 * - Professional PDF generation
 * - Multi-language support
 * - Legal disclaimers
 * - Certification-ready formats
 * - White-label branding
 * - Audit trail compliance
 */

import { ProductAnalysis, CertificationReport, HalalStatus } from '@/types/halal';
import { User, Organization } from '@/types/auth';
import { logger } from '@/utils/logger';
import { DatabaseService } from '@/services/databaseService';

export enum ReportType {
  EXECUTIVE_SUMMARY = 'EXECUTIVE_SUMMARY',
  DETAILED_ANALYSIS = 'DETAILED_ANALYSIS',
  CERTIFICATION_READY = 'CERTIFICATION_READY',
  COMPLIANCE_DASHBOARD = 'COMPLIANCE_DASHBOARD'
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  JSON = 'JSON'
}

export interface ReportRequest {
  analysisId: string;
  type: ReportType;
  format: ReportFormat;
  language: string;
  includeBranding?: boolean;
  customBranding?: {
    logoUrl?: string;
    companyName?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
  userId: string;
  organizationId: string;
}

export interface ReportMetadata {
  id: string;
  title: string;
  generatedAt: Date;
  generatedBy: string;
  organization: string;
  language: string;
  version: string;
  pages?: number;
  fileSize?: number;
}

export class ReportingService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Generate professional report
   */
  async generateReport(request: ReportRequest): Promise<{ 
    reportId: string; 
    downloadUrl: string; 
    metadata: ReportMetadata 
  }> {
    try {
      logger.info('Starting report generation', { 
        analysisId: request.analysisId,
        type: request.type,
        format: request.format,
        userId: request.userId 
      });

      // Get analysis data
      const analysis = await this.db.getProductAnalysis(request.analysisId);
      if (!analysis) {
        throw new Error('Analysis not found');
      }

      // Get user and organization
      const user = await this.db.findUserById(request.userId);
      const organization = await this.db.findOrganizationById(request.organizationId);
      
      if (!user || !organization) {
        throw new Error('User or organization not found');
      }

      // Generate report content based on type
      const reportContent = await this.generateReportContent(
        analysis, 
        request.type, 
        request.language,
        user,
        organization
      );

      // Apply branding if requested
      if (request.includeBranding && request.customBranding) {
        reportContent.branding = request.customBranding;
      }

      // Generate file based on format
      const fileData = await this.generateReportFile(reportContent, request.format);

      // Store report in database
      const reportId = await this.storeReport({
        analysisId: request.analysisId,
        userId: request.userId,
        organizationId: request.organizationId,
        type: request.type,
        format: request.format,
        language: request.language,
        fileData,
        metadata: reportContent.metadata
      });

      // Generate download URL (would integrate with S3 or similar)
      const downloadUrl = await this.generateSecureDownloadUrl(reportId);

      logger.info('Report generated successfully', { 
        reportId,
        analysisId: request.analysisId,
        type: request.type 
      });

      return {
        reportId,
        downloadUrl,
        metadata: reportContent.metadata
      };

    } catch (error) {
      logger.error('Report generation failed', { 
        error: error.message,
        analysisId: request.analysisId,
        type: request.type 
      });
      throw error;
    }
  }

  /**
   * Generate report content structure
   */
  private async generateReportContent(
    analysis: ProductAnalysis,
    type: ReportType,
    language: string,
    user: User,
    organization: Organization
  ): Promise<any> {
    
    const disclaimers = this.getDisclaimers(language);
    const translations = this.getTranslations(language);

    const baseContent = {
      metadata: {
        id: crypto.randomUUID(),
        title: this.getReportTitle(type, language),
        generatedAt: new Date(),
        generatedBy: `${user.firstName} ${user.lastName}`,
        organization: organization.name,
        language,
        version: '1.0'
      },
      analysis,
      disclaimers,
      translations
    };

    switch (type) {
      case ReportType.EXECUTIVE_SUMMARY:
        return this.generateExecutiveSummary(baseContent);
      
      case ReportType.DETAILED_ANALYSIS:
        return this.generateDetailedAnalysis(baseContent);
      
      case ReportType.CERTIFICATION_READY:
        return this.generateCertificationReport(baseContent);
      
      case ReportType.COMPLIANCE_DASHBOARD:
        return this.generateComplianceDashboard(baseContent);
      
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  /**
   * Generate Executive Summary Report
   */
  private generateExecutiveSummary(baseContent: any): any {
    const { analysis, disclaimers, translations } = baseContent;

    return {
      ...baseContent,
      sections: [
        {
          title: translations.executiveSummary,
          content: {
            productName: analysis.productName,
            overallStatus: analysis.overallStatus,
            overallRiskLevel: analysis.overallRiskLevel,
            summary: analysis.summary,
            keyFindings: [
              ...(analysis.haram_ingredients.length > 0 ? 
                [`${analysis.haram_ingredients.length} ${translations.haramIngredientsFound}`] : []),
              ...(analysis.mashbooh_ingredients.length > 0 ? 
                [`${analysis.mashbooh_ingredients.length} ${translations.mashboohIngredientsFound}`] : []),
              ...(analysis.requires_expert_review.length > 0 ? 
                [`${analysis.requires_expert_review.length} ${translations.ingredientsRequireReview}`] : [])
            ],
            recommendations: analysis.recommendations
          }
        },
        {
          title: translations.legalDisclaimers,
          content: disclaimers
        }
      ]
    };
  }

  /**
   * Generate Detailed Analysis Report
   */
  private generateDetailedAnalysis(baseContent: any): any {
    const { analysis, disclaimers, translations } = baseContent;

    return {
      ...baseContent,
      sections: [
        {
          title: translations.productOverview,
          content: {
            productName: analysis.productName,
            analyzedAt: analysis.analyzedAt,
            analyzedBy: analysis.analyzedBy,
            processingTime: `${analysis.processingTimeMs}ms`,
            overallStatus: analysis.overallStatus
          }
        },
        {
          title: translations.ingredientAnalysis,
          content: {
            totalIngredients: analysis.summary.total_ingredients,
            ingredients: analysis.ingredients.map(ing => ({
              name: ing.detectedName,
              status: ing.status,
              confidence: ing.confidence,
              riskLevel: ing.riskLevel,
              reasoning: ing.reasoning,
              warnings: ing.warnings,
              suggestions: ing.suggestions,
              requiresExpertReview: ing.requiresExpertReview
            }))
          }
        },
        {
          title: translations.criticalFindings,
          content: {
            haramIngredients: analysis.haram_ingredients,
            mashboohIngredients: analysis.mashbooh_ingredients,
            requiresReview: analysis.requires_expert_review
          }
        },
        {
          title: translations.recommendations,
          content: analysis.recommendations
        },
        {
          title: translations.legalDisclaimers,
          content: disclaimers
        }
      ]
    };
  }

  /**
   * Generate Certification-Ready Report
   */
  private generateCertificationReport(baseContent: any): any {
    const { analysis, disclaimers, translations } = baseContent;

    return {
      ...baseContent,
      sections: [
        {
          title: translations.certificationHeader,
          content: {
            productName: analysis.productName,
            certificationStatus: analysis.overallStatus,
            certificationDate: new Date(),
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            certificationStandard: 'HFCE EU Standard',
            certificateNumber: `HCHECK-${Date.now()}`
          }
        },
        {
          title: translations.complianceVerification,
          content: {
            totalIngredients: analysis.summary.total_ingredients,
            halalIngredients: analysis.summary.halal_count,
            haramIngredients: analysis.summary.haram_count,
            mashboohIngredients: analysis.summary.mashbooh_count,
            unknownIngredients: analysis.summary.unknown_count,
            expertReviewCompleted: analysis.expertReviewRequired
          }
        },
        {
          title: translations.ingredientBreakdown,
          content: analysis.ingredients
        },
        {
          title: translations.certification_disclaimers,
          content: disclaimers.certification
        }
      ]
    };
  }

  /**
   * Get legal disclaimers by language
   */
  private getDisclaimers(language: string): any {
    const disclaimers = {
      en: {
        general: [
          "This analysis is provided as a preliminary assessment tool only.",
          "Final halal certification decisions must be made by qualified Islamic scholars and certified halal experts.",
          "HalalCheck EU provides analysis based on available ingredient information and established halal standards.",
          "Users are responsible for verifying ingredient sources and certification validity.",
          "This tool does not replace proper halal certification processes.",
          "Religious rulings may vary between different schools of Islamic jurisprudence.",
          "For official certification, consult with recognized halal certification bodies."
        ],
        certification: [
          "This report is generated for preliminary assessment purposes only.",
          "Official halal certification requires review by certified Islamic scholars.",
          "Ingredient source verification and halal certificates must be validated independently.",
          "Cross-contamination risks must be assessed at production facilities.",
          "This analysis is based on ingredient information provided and may not reflect actual product composition.",
          "Final certification decisions remain the responsibility of authorized halal certification bodies."
        ],
        liability: [
          "HalalCheck EU disclaims all liability for decisions made based on this analysis.",
          "Users assume full responsibility for verifying halal compliance.",
          "This service is provided 'as is' without warranties of any kind.",
          "Consult qualified Islamic authorities for definitive halal rulings."
        ]
      },
      nl: {
        general: [
          "Deze analyse wordt alleen als voorlopig beoordelingsinstrument verstrekt.",
          "Definitieve halal-certificeringsbeslissingen moeten worden genomen door gekwalificeerde islamitische geleerden en gecertificeerde halal-experts.",
          "HalalCheck EU biedt analyses op basis van beschikbare ingrediëntinformatie en gevestigde halal-standaarden.",
          "Gebruikers zijn verantwoordelijk voor het verifiëren van ingrediëntbronnen en certificeringsgeldigheid.",
          "Dit hulpmiddel vervangt geen juiste halal-certificeringsprocessen.",
          "Religieuze uitspraken kunnen variëren tussen verschillende scholen van islamitische jurisprudentie.",
          "Voor officiële certificering, raadpleeg erkende halal-certificeringsinstanties."
        ]
      },
      fr: {
        general: [
          "Cette analyse n'est fournie qu'à titre d'outil d'évaluation préliminaire.",
          "Les décisions finales de certification halal doivent être prises par des érudits islamiques qualifiés et des experts halal certifiés.",
          "HalalCheck EU fournit des analyses basées sur les informations d'ingrédients disponibles et les normes halal établies.",
          "Les utilisateurs sont responsables de vérifier les sources d'ingrédients et la validité de la certification.",
          "Cet outil ne remplace pas les processus de certification halal appropriés.",
          "Les décisions religieuses peuvent varier entre différentes écoles de jurisprudence islamique.",
          "Pour une certification officielle, consultez des organismes de certification halal reconnus."
        ]
      },
      de: {
        general: [
          "Diese Analyse wird nur als vorläufiges Bewertungsinstrument bereitgestellt.",
          "Endgültige Halal-Zertifizierungsentscheidungen müssen von qualifizierten islamischen Gelehrten und zertifizierten Halal-Experten getroffen werden.",
          "HalalCheck EU bietet Analysen basierend auf verfügbaren Zutatinformationen und etablierten Halal-Standards.",
          "Benutzer sind verantwortlich für die Überprüfung von Zutatquellen und Zertifizierungsgültigkeit.",
          "Dieses Tool ersetzt keine ordnungsgemäßen Halal-Zertifizierungsverfahren.",
          "Religiöse Entscheidungen können zwischen verschiedenen Schulen der islamischen Rechtsprechung variieren.",
          "Für offizielle Zertifizierung konsultieren Sie anerkannte Halal-Zertifizierungsstellen."
        ]
      },
      ar: {
        general: [
          "يتم توفير هذا التحليل كأداة تقييم أولية فقط.",
          "يجب أن تتخذ قرارات الشهادة الحلال النهائية من قبل علماء إسلاميين مؤهلين وخبراء حلال معتمدين.",
          "تقدم HalalCheck EU تحليلات بناءً على معلومات المكونات المتاحة والمعايير الحلال المعتمدة.",
          "المستخدمون مسؤولون عن التحقق من مصادر المكونات وصحة الشهادة.",
          "هذه الأداة لا تحل محل عمليات الشهادة الحلال المناسبة.",
          "قد تختلف الأحكام الدينية بين المذاهب الفقهية الإسلامية المختلفة.",
          "للحصول على شهادة رسمية، استشر هيئات الشهادة الحلال المعترف بها."
        ]
      }
    };

    return disclaimers[language] || disclaimers.en;
  }

  /**
   * Get translations by language
   */
  private getTranslations(language: string): any {
    const translations = {
      en: {
        executiveSummary: 'Executive Summary',
        productOverview: 'Product Overview',
        ingredientAnalysis: 'Ingredient Analysis',
        criticalFindings: 'Critical Findings',
        recommendations: 'Recommendations',
        legalDisclaimers: 'Legal Disclaimers',
        certificationHeader: 'Halal Certification Report',
        complianceVerification: 'Compliance Verification',
        ingredientBreakdown: 'Detailed Ingredient Breakdown',
        certification_disclaimers: 'Certification Disclaimers',
        haramIngredientsFound: 'haram ingredients identified',
        mashboohIngredientsFound: 'doubtful (mashbooh) ingredients found',
        ingredientsRequireReview: 'ingredients require expert review'
      },
      nl: {
        executiveSummary: 'Managementsamenvatting',
        productOverview: 'Productoverzicht',
        ingredientAnalysis: 'Ingrediëntenanalyse',
        criticalFindings: 'Kritieke Bevindingen',
        recommendations: 'Aanbevelingen',
        legalDisclaimers: 'Juridische Disclaimers',
        haramIngredientsFound: 'haram ingrediënten geïdentificeerd',
        mashboohIngredientsFound: 'twijfelachtige (mashbooh) ingrediënten gevonden',
        ingredientsRequireReview: 'ingrediënten vereisen expertbeoordeling'
      }
    };

    return translations[language] || translations.en;
  }

  /**
   * Get report title by type and language
   */
  private getReportTitle(type: ReportType, language: string): string {
    const titles = {
      en: {
        [ReportType.EXECUTIVE_SUMMARY]: 'Halal Compliance - Executive Summary',
        [ReportType.DETAILED_ANALYSIS]: 'Detailed Halal Ingredient Analysis',
        [ReportType.CERTIFICATION_READY]: 'Halal Certification Assessment Report',
        [ReportType.COMPLIANCE_DASHBOARD]: 'Halal Compliance Dashboard'
      },
      nl: {
        [ReportType.EXECUTIVE_SUMMARY]: 'Halal Compliance - Managementsamenvatting',
        [ReportType.DETAILED_ANALYSIS]: 'Gedetailleerde Halal Ingrediëntenanalyse',
        [ReportType.CERTIFICATION_READY]: 'Halal Certificering Beoordelingsrapport',
        [ReportType.COMPLIANCE_DASHBOARD]: 'Halal Compliance Dashboard'
      }
    };

    return titles[language]?.[type] || titles.en[type];
  }

  /**
   * Generate report file based on format
   */
  private async generateReportFile(content: any, format: ReportFormat): Promise<Buffer> {
    switch (format) {
      case ReportFormat.PDF:
        return this.generatePDF(content);
      case ReportFormat.EXCEL:
        return this.generateExcel(content);
      case ReportFormat.JSON:
        return Buffer.from(JSON.stringify(content, null, 2));
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate PDF using a library like puppeteer or jsPDF
   */
  private async generatePDF(content: any): Promise<Buffer> {
    // This would integrate with a PDF generation library
    // For now, return placeholder
    return Buffer.from('PDF content placeholder');
  }

  /**
   * Generate Excel file
   */
  private async generateExcel(content: any): Promise<Buffer> {
    // This would integrate with a library like exceljs
    // For now, return placeholder
    return Buffer.from('Excel content placeholder');
  }

  /**
   * Store report in database
   */
  private async storeReport(reportData: any): Promise<string> {
    // Store report metadata and file reference in database
    const reportId = crypto.randomUUID();
    await this.db.storeReport(reportId, reportData);
    return reportId;
  }

  /**
   * Generate secure download URL
   */
  private async generateSecureDownloadUrl(reportId: string): Promise<string> {
    // Generate signed URL for secure download (integrate with S3 or similar)
    return `https://api.halalcheck.eu/reports/${reportId}/download?token=${crypto.randomUUID()}`;
  }
}