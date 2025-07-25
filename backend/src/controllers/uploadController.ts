/**
 * HalalCheck EU - Upload Controller
 * 
 * Handles file uploads and OCR processing for ingredient labels
 */

import { Request, Response } from 'express';
import { OCRService } from '@/services/ocrService';
import { AuditService } from '@/services/auditService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';

export class UploadController {
  private ocrService: OCRService;
  private auditService: AuditService;

  constructor() {
    this.ocrService = new OCRService();
    this.auditService = new AuditService();
  }

  /**
   * Get multer middleware configuration
   */
  getMulterMiddleware() {
    return this.ocrService.configureMulter();
  }

  /**
   * Upload and process ingredient label image
   */
  uploadIngredientLabel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'No image file uploaded'
      });
      return;
    }

    try {
      // Validate uploaded file
      this.ocrService.validateUploadedImage(req.file);

      const language = req.body.language || 'auto';
      const extractTextOnly = req.body.extractTextOnly === 'true';

      // Log upload
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'IMAGE_UPLOADED',
        resource: 'ingredient_label',
        details: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
          language,
          extractTextOnly
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Process image with OCR
      const ocrResult = await this.ocrService.processIngredientLabel(req.file.path, language);

      // Log OCR completion
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'OCR_COMPLETED',
        resource: 'ingredient_label',
        details: {
          filename: req.file.filename,
          textLength: ocrResult.extractedText.length,
          confidence: ocrResult.confidence,
          processingTimeMs: ocrResult.processingTimeMs,
          detectedLanguage: ocrResult.language
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Prepare response
      const responseData = {
        upload: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        ocr: {
          extractedText: ocrResult.extractedText,
          confidence: Math.round(ocrResult.confidence * 100), // Convert to percentage
          detectedLanguage: ocrResult.language,
          processingTimeMs: ocrResult.processingTimeMs
        }
      };

      // Clean up uploaded file (optional - keep for audit trail in production)
      if (process.env.CLEANUP_UPLOADS === 'true') {
        setTimeout(() => {
          this.ocrService.cleanupFile(req.file!.path);
        }, 5000); // Clean up after 5 seconds
      }

      res.status(200).json({
        success: true,
        message: 'Image uploaded and processed successfully',
        data: responseData
      });

    } catch (error) {
      logger.error('Image upload and OCR processing failed', {
        error: error.message,
        filename: req.file?.filename,
        userId: req.user.id
      });

      // Log failure
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'OCR_FAILED',
        resource: 'ingredient_label',
        details: {
          filename: req.file?.filename,
          error: error.message
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Clean up file on error
      if (req.file) {
        this.ocrService.cleanupFile(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'PROCESSING_FAILED',
        message: 'Failed to process uploaded image'
      });
    }
  });

  /**
   * Upload multiple ingredient label images (batch processing)
   */
  uploadMultipleLabels = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'No image files uploaded'
      });
      return;
    }

    if (files.length > 5) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Maximum 5 files allowed per batch'
      });
      return;
    }

    const language = req.body.language || 'auto';
    const results: any[] = [];
    const errors: any[] = [];

    // Log batch upload
    await this.auditService.logAction({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'BATCH_UPLOAD_STARTED',
      resource: 'ingredient_labels',
      details: {
        fileCount: files.length,
        language
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        this.ocrService.validateUploadedImage(file);
        const ocrResult = await this.ocrService.processIngredientLabel(file.path, language);

        results.push({
          index: i,
          filename: file.filename,
          originalName: file.originalname,
          ocr: {
            extractedText: ocrResult.extractedText,
            confidence: Math.round(ocrResult.confidence * 100),
            detectedLanguage: ocrResult.language,
            processingTimeMs: ocrResult.processingTimeMs
          }
        });

        // Clean up file
        if (process.env.CLEANUP_UPLOADS === 'true') {
          setTimeout(() => {
            this.ocrService.cleanupFile(file.path);
          }, 5000);
        }

      } catch (error) {
        logger.error('Batch processing failed for file', {
          error: error.message,
          filename: file.filename,
          index: i
        });

        errors.push({
          index: i,
          filename: file.filename,
          originalName: file.originalname,
          error: error.message
        });

        // Clean up failed file
        this.ocrService.cleanupFile(file.path);
      }
    }

    // Log batch completion
    await this.auditService.logAction({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'BATCH_UPLOAD_COMPLETED',
      resource: 'ingredient_labels',
      details: {
        totalFiles: files.length,
        successCount: results.length,
        errorCount: errors.length
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: `Batch processing completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        results,
        errors,
        summary: {
          totalFiles: files.length,
          successCount: results.length,
          errorCount: errors.length
        }
      }
    });
  });

  /**
   * Get upload limits and supported formats
   */
  getUploadInfo = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      success: true,
      data: {
        limits: {
          maxFileSize: '10MB',
          maxFiles: 5,
          supportedFormats: ['JPEG', 'PNG', 'WebP']
        },
        features: {
          ocrSupport: true,
          multiLanguage: true,
          batchProcessing: true,
          enhancedExtraction: true
        },
        supportedLanguages: [
          { code: 'auto', name: 'Auto-detect' },
          { code: 'en', name: 'English' },
          { code: 'nl', name: 'Dutch' },
          { code: 'fr', name: 'French' },
          { code: 'de', name: 'German' },
          { code: 'ar', name: 'Arabic' }
        ]
      }
    });
  });
}