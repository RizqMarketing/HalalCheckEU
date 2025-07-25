/**
 * HalalCheck EU - Report Routes
 * 
 * Analysis reporting and export endpoints
 */

import { Router } from 'express';
import { ReportController } from '@/controllers/reportController';
import { authenticate, requireRole } from '@/middleware/auth';
import { UserRole } from '@/types/auth';

const router = Router();
const reportController = new ReportController();

/**
 * @route GET /api/reports/summary
 * @desc Get analysis summary report with filters
 * @access Private
 */
router.get('/summary', 
  authenticate, 
  reportController.getAnalysisSummary
);

/**
 * @route GET /api/reports/export/csv
 * @desc Export analysis data as CSV
 * @access Private
 */
router.get('/export/csv', 
  authenticate, 
  reportController.exportAnalysesCSV
);

/**
 * @route GET /api/reports/ingredients
 * @desc Get ingredient frequency and analysis report
 * @access Private
 */
router.get('/ingredients', 
  authenticate, 
  reportController.getIngredientReport
);

export default router;