/**
 * HalalCheck EU - Upload Routes
 * 
 * File upload and OCR processing endpoints
 */

import { Router } from 'express';
import { UploadController } from '@/controllers/uploadController';
import { authenticate, checkUsageLimit } from '@/middleware/auth';

const router = Router();
const uploadController = new UploadController();

// Get multer middleware for file uploads
const upload = uploadController.getMulterMiddleware();

/**
 * @route POST /api/upload/ingredient-label
 * @desc Upload and process single ingredient label image
 * @access Private
 */
router.post('/ingredient-label',
  authenticate,
  checkUsageLimit,
  upload.single('image'),
  uploadController.uploadIngredientLabel
);

/**
 * @route POST /api/upload/ingredient-labels/batch
 * @desc Upload and process multiple ingredient label images
 * @access Private
 */
router.post('/ingredient-labels/batch',
  authenticate,
  checkUsageLimit,
  upload.array('images', 5), // Max 5 files
  uploadController.uploadMultipleLabels
);

/**
 * @route GET /api/upload/info
 * @desc Get upload limits and supported formats
 * @access Private
 */
router.get('/info',
  authenticate,
  uploadController.getUploadInfo
);

export default router;