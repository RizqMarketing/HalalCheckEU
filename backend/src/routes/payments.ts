/**
 * HalalCheck EU - Payment Routes
 * 
 * Subscription management and billing endpoints
 */

import { Router } from 'express';
import { PaymentController } from '@/controllers/paymentController';
import { authenticate, requireAdmin } from '@/middleware/auth';
import express from 'express';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route GET /api/payments/plans
 * @desc Get available subscription plans
 * @access Public
 */
router.get('/plans', 
  paymentController.getSubscriptionPlans
);

/**
 * @route POST /api/payments/create-subscription-session
 * @desc Create Stripe checkout session for subscription
 * @access Private
 */
router.post('/create-subscription-session',
  authenticate,
  paymentController.createSubscriptionSession
);

/**
 * @route POST /api/payments/create-portal-session
 * @desc Create Stripe customer portal session
 * @access Private
 */
router.post('/create-portal-session',
  authenticate,
  paymentController.createPortalSession
);

/**
 * @route GET /api/payments/subscription-status
 * @desc Get current subscription status
 * @access Private
 */
router.get('/subscription-status',
  authenticate,
  paymentController.getSubscriptionStatus
);

/**
 * @route GET /api/payments/verify-session/:sessionId
 * @desc Verify checkout session success
 * @access Private
 */
router.get('/verify-session/:sessionId',
  authenticate,
  paymentController.verifyCheckoutSession
);

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhooks
 * @access Public (but verified by Stripe signature)
 */
router.post('/webhook',
  express.raw({ type: 'application/json' }), // Raw body needed for webhook signature verification
  paymentController.handleWebhook
);

export default router;