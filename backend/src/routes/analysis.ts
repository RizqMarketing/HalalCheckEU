/**
 * HalalCheck EU - Analysis Routes
 * 
 * Core ingredient analysis endpoints with proper authentication and rate limiting
 */

import { Router } from 'express';
import { AnalysisController } from '@/controllers/analysisController';
import { authenticate, checkUsageLimit, requireAnalysisPermission } from '@/middleware/auth';

const router = Router();
const analysisController = new AnalysisController();

/**
 * @route POST /api/analysis/analyze
 * @desc Analyze ingredient list for halal compliance
 * @access Private (requires authentication and analysis permission)
 */
router.post('/analyze', 
  authenticate, 
  checkUsageLimit, 
  requireAnalysisPermission, 
  analysisController.analyzeIngredients
);

/**
 * @route GET /api/analysis/history
 * @desc Get analysis history for organization
 * @access Private
 */
router.get('/history', 
  authenticate, 
  analysisController.getAnalysisHistory
);

/**
 * @route GET /api/analysis/:analysisId
 * @desc Get specific analysis by ID
 * @access Private
 */
router.get('/:analysisId', 
  authenticate, 
  analysisController.getAnalysisById
);

/**
 * @route DELETE /api/analysis/:analysisId
 * @desc Delete analysis (soft delete)
 * @access Private
 */
router.delete('/:analysisId', 
  authenticate, 
  analysisController.deleteAnalysis
);

/**
 * @route GET /api/analysis/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private
 */
router.get('/dashboard/stats', 
  authenticate, 
  analysisController.getDashboardStats
);

export default router;