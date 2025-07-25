/**
 * HalalCheck EU - User Management Routes
 * 
 * User profile and administration endpoints
 */

import { Router } from 'express';
import { UserController } from '@/controllers/userController';
import { authenticate, requireAdmin, requireRole } from '@/middleware/auth';
import { UserRole } from '@/types/auth';

const router = Router();
const userController = new UserController();

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put('/profile', 
  authenticate, 
  userController.updateProfile
);

/**
 * @route PUT /api/users/password
 * @desc Change user password
 * @access Private
 */
router.put('/password', 
  authenticate, 
  userController.changePassword
);

/**
 * @route GET /api/users/organization
 * @desc Get organization users (admin only)
 * @access Private (Admin)
 */
router.get('/organization', 
  authenticate, 
  requireAdmin, 
  userController.getOrganizationUsers
);

/**
 * @route PUT /api/users/:userId/role
 * @desc Update user role (admin only)
 * @access Private (Admin)
 */
router.put('/:userId/role', 
  authenticate, 
  requireAdmin, 
  userController.updateUserRole
);

/**
 * @route DELETE /api/users/:userId
 * @desc Deactivate user (admin only)
 * @access Private (Admin)
 */
router.delete('/:userId', 
  authenticate, 
  requireAdmin, 
  userController.deactivateUser
);

export default router;