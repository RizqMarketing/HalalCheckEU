/**
 * HalalCheck EU - Organization Management Routes
 * 
 * Organization profile, settings, and usage management
 */

import { Router } from 'express';
import { OrganizationController } from '@/controllers/organizationController';
import { authenticate, requireAdmin } from '@/middleware/auth';

const router = Router();
const organizationController = new OrganizationController();

/**
 * @route GET /api/organizations/profile
 * @desc Get organization profile
 * @access Private
 */
router.get('/profile', 
  authenticate, 
  organizationController.getOrganizationProfile
);

/**
 * @route PUT /api/organizations/profile
 * @desc Update organization profile (admin only)
 * @access Private (Admin)
 */
router.put('/profile', 
  authenticate, 
  requireAdmin, 
  organizationController.updateOrganizationProfile
);

/**
 * @route GET /api/organizations/settings
 * @desc Get organization settings
 * @access Private
 */
router.get('/settings', 
  authenticate, 
  organizationController.getOrganizationSettings
);

/**
 * @route PUT /api/organizations/settings
 * @desc Update organization settings (admin only)
 * @access Private (Admin)
 */
router.put('/settings', 
  authenticate, 
  requireAdmin, 
  organizationController.updateOrganizationSettings
);

/**
 * @route GET /api/organizations/usage
 * @desc Get usage statistics
 * @access Private
 */
router.get('/usage', 
  authenticate, 
  organizationController.getUsageStatistics
);

/**
 * @route GET /api/organizations/activity
 * @desc Get organization activity log (admin only)
 * @access Private (Admin)
 */
router.get('/activity', 
  authenticate, 
  requireAdmin, 
  organizationController.getActivityLog
);

export default router;