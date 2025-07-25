/**
 * HalalCheck EU - Payment Controller
 * 
 * Handles subscription management and billing operations
 */

import { Request, Response } from 'express';
import { PaymentService } from '@/services/paymentService';
import { AuditService } from '@/services/auditService';
import { logger } from '@/utils/logger';
import { asyncHandler } from '@/middleware/errorHandler';
import Stripe from 'stripe';

export class PaymentController {
  private paymentService: PaymentService;
  private auditService: AuditService;
  private stripe: Stripe;

  constructor() {
    this.paymentService = new PaymentService();
    this.auditService = new AuditService();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const plans = this.paymentService.getSubscriptionPlans();

    res.status(200).json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          currency: plan.currency,
          interval: plan.interval,
          monthlyAnalysisLimit: plan.monthlyAnalysisLimit,
          features: plan.features,
          formattedPrice: `€${(plan.price / 100).toFixed(2)}`
        }))
      }
    });
  });

  /**
   * Create subscription checkout session
   */
  createSubscriptionSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { planId, successUrl, cancelUrl } = req.body;

    if (!planId || !successUrl || !cancelUrl) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Plan ID, success URL, and cancel URL are required'
      });
      return;
    }

    // Validate plan exists
    const plan = this.paymentService.getSubscriptionPlan(planId);
    if (!plan) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid subscription plan'
      });
      return;
    }

    try {
      const session = await this.paymentService.createSubscriptionSession(
        req.user.organizationId,
        planId,
        req.user.id,
        successUrl,
        cancelUrl
      );

      // Log session creation
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'SUBSCRIPTION_SESSION_CREATED',
        resource: 'payment',
        details: {
          planId,
          sessionId: session.sessionId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Checkout session created successfully',
        data: {
          sessionId: session.sessionId,
          url: session.url,
          planId: session.planId
        }
      });

    } catch (error) {
      logger.error('Failed to create subscription session', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId,
        planId
      });

      res.status(500).json({
        success: false,
        error: 'SESSION_CREATION_FAILED',
        message: 'Failed to create checkout session'
      });
    }
  });

  /**
   * Create customer portal session
   */
  createPortalSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { returnUrl } = req.body;

    if (!returnUrl) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Return URL is required'
      });
      return;
    }

    try {
      const portalSession = await this.paymentService.createPortalSession(
        req.user.organizationId,
        returnUrl
      );

      // Log portal session creation
      await this.auditService.logAction({
        userId: req.user.id,
        organizationId: req.user.organizationId,
        action: 'PORTAL_SESSION_CREATED',
        resource: 'payment',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Portal session created successfully',
        data: {
          url: portalSession.url
        }
      });

    } catch (error) {
      logger.error('Failed to create portal session', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'PORTAL_SESSION_FAILED',
        message: 'Failed to create portal session'
      });
    }
  });

  /**
   * Get current subscription status
   */
  getSubscriptionStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    try {
      const status = await this.paymentService.getSubscriptionStatus(req.user.organizationId);
      const plan = this.paymentService.getSubscriptionPlan(status.plan);

      res.status(200).json({
        success: true,
        data: {
          subscription: {
            plan: status.plan,
            planName: plan?.name || 'Free Plan',
            status: status.status,
            monthlyLimit: status.monthlyLimit,
            currentUsage: status.currentUsage,
            usagePercentage: status.monthlyLimit > 0 
              ? Math.round((status.currentUsage / status.monthlyLimit) * 100) 
              : 0,
            remainingAnalyses: Math.max(0, status.monthlyLimit - status.currentUsage),
            features: plan?.features || ['Basic halal analysis', 'Email support'],
            hasActiveSubscription: status.stripeSubscriptionId !== null
          }
        }
      });

    } catch (error) {
      logger.error('Failed to get subscription status', {
        error: error.message,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

      res.status(500).json({
        success: false,
        error: 'STATUS_FETCH_FAILED',
        message: 'Failed to fetch subscription status'
      });
    }
  });

  /**
   * Handle Stripe webhooks
   */
  handleWebhook = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    if (!sig || !webhookSecret) {
      res.status(400).json({
        success: false,
        error: 'WEBHOOK_ERROR',
        message: 'Missing webhook signature or secret'
      });
      return;
    }

    try {
      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

      // Process the webhook
      await this.paymentService.handleWebhook(event);

      logger.info('Webhook processed successfully', {
        eventType: event.type,
        eventId: event.id
      });

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        signature: sig.substring(0, 20) + '...'
      });

      if (error.message.includes('signature')) {
        res.status(400).json({
          success: false,
          error: 'INVALID_SIGNATURE',
          message: 'Invalid webhook signature'
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'WEBHOOK_PROCESSING_FAILED',
          message: 'Failed to process webhook'
        });
      }
    }
  });

  /**
   * Verify checkout session success
   */
  verifyCheckoutSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return;
    }

    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Session ID is required'
      });
      return;
    }

    try {
      // Retrieve checkout session from Stripe
      const session = await this.stripe.checkout.sessions.retrieve(sessionId);

      if (session.metadata?.organizationId !== req.user.organizationId) {
        res.status(403).json({
          success: false,
          error: 'FORBIDDEN',
          message: 'Session does not belong to your organization'
        });
        return;
      }

      const success = session.payment_status === 'paid';
      const planId = session.metadata?.planId;
      const plan = planId ? this.paymentService.getSubscriptionPlan(planId) : null;

      res.status(200).json({
        success: true,
        data: {
          session: {
            id: session.id,
            paymentStatus: session.payment_status,
            subscriptionId: session.subscription,
            success,
            planId,
            planName: plan?.name
          }
        }
      });

    } catch (error) {
      logger.error('Failed to verify checkout session', {
        error: error.message,
        sessionId,
        userId: req.user.id
      });

      res.status(500).json({
        success: false,
        error: 'VERIFICATION_FAILED',
        message: 'Failed to verify checkout session'
      });
    }
  });
}