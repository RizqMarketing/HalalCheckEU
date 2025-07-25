/**
 * HalalCheck EU - OCR Service
 * 
 * Optical Character Recognition for ingredient label extraction
 * Supports multiple image formats and languages
 */

import OpenAI from 'openai';
import { logger } from '@/utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

export interface OCRResult {
  extractedText: string;
  confidence: number;
  language: string;
  processedImagePath?: string;
  processingTimeMs: number;
}

export interface ImageUploadResult {
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  path: string;
}

export class OCRService {
  private openai: OpenAI;
  private uploadDir: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.ensureUploadDirectory();
  }

  /**
   * Configure multer for file uploads
   */
  configureMulter(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `ingredient-label-${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      // Accept only image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Single file upload
      }
    });
  }

  /**
   * Extract text from uploaded image using OpenAI Vision API
   */
  async extractTextFromImage(imagePath: string, language: string = 'auto'): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      logger.info('Starting OCR text extraction', {
        imagePath: path.basename(imagePath),
        language
      });

      // Read image file and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeTypeFromPath(imagePath);

      // Use OpenAI Vision API for OCR
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.createOCRPrompt(language)
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      });

      const extractedContent = response.choices[0]?.message?.content;
      if (!extractedContent) {
        throw new Error('No text extracted from image');
      }

      // Parse the response to extract text and confidence
      const result = this.parseOCRResponse(extractedContent);
      
      const ocrResult: OCRResult = {
        extractedText: result.text,
        confidence: result.confidence,
        language: result.detectedLanguage || language,
        processedImagePath: imagePath,
        processingTimeMs: Date.now() - startTime
      };

      logger.info('OCR text extraction completed', {
        imagePath: path.basename(imagePath),
        textLength: result.text.length,
        confidence: result.confidence,
        processingTime: ocrResult.processingTimeMs
      });

      return ocrResult;

    } catch (error) {
      logger.error('OCR text extraction failed', {
        error: error.message,
        imagePath: path.basename(imagePath)
      });
      throw new Error(`OCR extraction failed: ${error.message}`);
    }
  }

  /**
   * Process ingredient label image with enhanced extraction
   */
  async processIngredientLabel(imagePath: string, language: string = 'auto'): Promise<OCRResult> {
    try {
      // First attempt: Standard OCR
      const ocrResult = await this.extractTextFromImage(imagePath, language);

      // If confidence is low, try enhanced processing
      if (ocrResult.confidence < 0.7) {
        logger.info('Low confidence OCR result, attempting enhanced processing', {
          initialConfidence: ocrResult.confidence
        });

        const enhancedResult = await this.enhancedIngredientExtraction(imagePath, language);
        if (enhancedResult.confidence > ocrResult.confidence) {
          return enhancedResult;
        }
      }

      return ocrResult;

    } catch (error) {
      logger.error('Ingredient label processing failed', {
        error: error.message,
        imagePath: path.basename(imagePath)
      });
      throw error;
    }
  }

  /**
   * Enhanced ingredient extraction with specialized prompting
   */
  private async enhancedIngredientExtraction(imagePath: string, language: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeTypeFromPath(imagePath);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: this.createEnhancedIngredientPrompt(language)
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      });

      const extractedContent = response.choices[0]?.message?.content;
      if (!extractedContent) {
        throw new Error('Enhanced extraction failed');
      }

      const result = this.parseOCRResponse(extractedContent);

      return {
        extractedText: result.text,
        confidence: Math.min(result.confidence + 0.1, 1.0), // Boost confidence for enhanced method
        language: result.detectedLanguage || language,
        processedImagePath: imagePath,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      logger.error('Enhanced ingredient extraction failed', {
        error: error.message,
        imagePath: path.basename(imagePath)
      });
      throw error;
    }
  }

  /**
   * Clean up uploaded file
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      logger.debug('Cleaned up uploaded file', { filePath: path.basename(filePath) });
    } catch (error) {
      logger.warn('Failed to cleanup file', {
        error: error.message,
        filePath: path.basename(filePath)
      });
    }
  }

  /**
   * Validate uploaded image
   */
  validateUploadedImage(file: Express.Multer.File): void {
    // Check file size (already handled by multer, but double-check)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Image file too large (max 10MB)');
    }

    // Check mime type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error('Invalid image format. Supported: JPEG, PNG, WebP');
    }

    // Check filename
    if (file.originalname.length > 255) {
      throw new Error('Filename too long');
    }
  }

  /**
   * Create OCR prompt for general text extraction
   */
  private createOCRPrompt(language: string): string {
    return `Extract ALL text from this image with maximum accuracy. This appears to be a food product ingredient label.

REQUIREMENTS:
1. Extract every word, number, and symbol visible
2. Maintain the original structure and order
3. Include punctuation marks like commas, periods, parentheses
4. Preserve line breaks where appropriate
5. If text is in multiple languages, extract all of it
6. Pay special attention to ingredient lists (often in smaller text)

TARGET LANGUAGE: ${language === 'auto' ? 'Detect automatically' : language}

Return the result in this JSON format:
{
  "extractedText": "Complete extracted text here",
  "confidence": 0.95,
  "detectedLanguage": "en",
  "notes": "Any relevant observations about the extraction"
}

Be extremely thorough - this text will be used for halal certification analysis.`;
  }

  /**
   * Create enhanced prompt specifically for ingredient extraction
   */
  private createEnhancedIngredientPrompt(language: string): string {
    return `You are an expert at reading food product labels for halal certification. Extract the ingredient list from this image with extreme precision.

CRITICAL MISSION: Extract ingredient information for religious dietary compliance analysis.

EXTRACTION FOCUS:
1. Look for sections labeled: "Ingredients", "Ingrédients", "Ingrediënten", "Zutaten", "المكونات"
2. Extract E-numbers (E123, E471, etc.) with perfect accuracy
3. Include percentage indicators if present (e.g., "Wheat flour 30%")
4. Capture parenthetical information (allergen warnings, specifications)
5. Preserve commas and semicolons that separate ingredients
6. Include any allergen warnings or "Contains:" statements
7. Look for halal/kosher certification symbols or text

LANGUAGE: ${language === 'auto' ? 'Auto-detect (likely European languages)' : language}

QUALITY REQUIREMENTS:
- 99%+ accuracy for religious compliance
- Preserve exact spelling of ingredient names
- Include ALL visible text that could be ingredients
- Note any unclear or potentially misread text

Return JSON format:
{
  "extractedText": "Complete ingredient list and related text",
  "confidence": 0.98,
  "detectedLanguage": "en",
  "ingredientsSection": "Just the main ingredient list",
  "allergenInfo": "Any allergen warnings found",
  "certificationMarks": "Any halal/kosher symbols or text",
  "uncertainText": "Any text that was difficult to read",
  "notes": "Observations about image quality or text clarity"
}`;
  }

  /**
   * Parse OCR response from OpenAI
   */
  private parseOCRResponse(response: string): {
    text: string;
    confidence: number;
    detectedLanguage?: string;
  } {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return {
        text: parsed.extractedText || parsed.ingredientsSection || response,
        confidence: parsed.confidence || 0.8,
        detectedLanguage: parsed.detectedLanguage
      };
    } catch {
      // If not JSON, treat as plain text
      return {
        text: response.trim(),
        confidence: 0.6, // Lower confidence for non-structured response
        detectedLanguage: undefined
      };
    }
  }

  /**
   * Get MIME type from file path
   */
  private getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info('Created upload directory', { uploadDir: this.uploadDir });
    }
  }
}