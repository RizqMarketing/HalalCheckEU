/**
 * HalalCheck EU - Payment Service
 * 
 * Stripe integration for subscription management and billing
 */

import Stripe from 'stripe';
import { DatabaseService } from './databaseService';
import { AuditService } from './auditService';
import { EmailService } from './emailService';
import { logger } from '@/utils/logger';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in cents
  currency: string;
  interval: 'month' | 'year';
  monthlyAnalysisLimit: number;
  features: string[];
  stripeProductId: string;
  stripePriceId: string;
}

export interface PaymentSession {
  sessionId: string;
  url: string;
  organizationId: string;
  planId: string;
  mode: 'subscription' | 'payment';
}

export class PaymentService {
  private stripe: Stripe;
  private db: DatabaseService;
  private auditService: AuditService;
  private emailService: EmailService;

  // Subscription plans configuration
  private readonly SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Starter Plan',
      price: 2900, // €29.00
      currency: 'eur',
      interval: 'month',
      monthlyAnalysisLimit: 100,
      features: [
        '100 ingredient analyses per month',
        'Basic halal compliance checking',
        'Email support',
        'Export to CSV',
        'Multi-language support'
      ],
      stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID!,
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID!
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      price: 7900, // €79.00
      currency: 'eur',
      interval: 'month',
      monthlyAnalysisLimit: 500,
      features: [
        '500 ingredient analyses per month',
        'Advanced AI-powered analysis',
        'Priority email support',
        'Export to CSV, PDF, Excel',
        'Multi-language support',
        'OCR image processing',
        'Batch analysis',
        'Custom reports'
      ],
      stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID!,
      stripePriceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 19900, // €199.00
      currency: 'eur',
      interval: 'month',
      monthlyAnalysisLimit: 2000,
      features: [
        '2000 ingredient analyses per month',
        'Advanced AI-powered analysis',
        'Priority phone & email support',
        'Export to all formats',
        'Multi-language support',
        'OCR image processing',
        'Batch analysis',
        'Custom reports',
        'API access',
        'Dedicated account manager',
        'Custom integrations'
      ],
      stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID!,
      stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID!
    }
  ];

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
    this.db = new DatabaseService();
    this.auditService = new AuditService();
    this.emailService = new EmailService();
  }

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans(): SubscriptionPlan[] {
    return this.SUBSCRIPTION_PLANS;
  }

  /**
   * Get specific subscription plan
   */
  getSubscriptionPlan(planId: string): SubscriptionPlan | null {
    return this.SUBSCRIPTION_PLANS.find(plan => plan.id === planId) || null;
  }

  /**
   * Create Stripe checkout session for subscription
   */
  async createSubscriptionSession(
    organizationId: string,
    planId: string,
    userId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<PaymentSession> {
    try {
      const plan = this.getSubscriptionPlan(planId);
      if (!plan) {
        throw new Error(`Invalid subscription plan: ${planId}`);
      }

      // Get organization details
      const orgQuery = 'SELECT name, subscription_plan FROM organizations WHERE id = $1';
      const orgResult = await this.db.query(orgQuery, [organizationId]);
      const organization = orgResult.rows[0];

      if (!organization) {
        throw new Error('Organization not found');
      }

      // Check if organization already has a subscription
      let customerId: string | undefined;
      const customerQuery = 'SELECT stripe_customer_id FROM organizations WHERE id = $1';
      const customerResult = await this.db.query(customerQuery, [organizationId]);
      customerId = customerResult.rows[0]?.stripe_customer_id;

      // Create or retrieve Stripe customer
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          name: organization.name,
          metadata: {
            organizationId,
            userId
          }
        });
        customerId = customer.id;

        // Update organization with customer ID
        await this.db.query(
          'UPDATE organizations SET stripe_customer_id = $1 WHERE id = $2',
          [customerId, organizationId]
        );
      }

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          organizationId,
          planId,
          userId
        },
        subscription_data: {
          metadata: {
            organizationId,
            planId
          }
        }
      });

      // Log checkout session creation
      await this.auditService.logAction({
        userId,
        organizationId,
        action: 'CHECKOUT_SESSION_CREATED',
        resource: 'subscription',
        details: {
          planId,
          sessionId: session.id,
          amount: plan.price,
          currency: plan.currency
        }
      });

      return {
        sessionId: session.id,
        url: session.url!,
        organizationId,
        planId,
        mode: 'subscription'
      };

    } catch (error) {
      logger.error('Failed to create subscription session', {
        error: error.message,
        organizationId,
        planId,
        userId
      });
      throw new Error(`Failed to create payment session: ${error.message}`);
    }
  }

  /**
   * Create Stripe portal session for subscription management
   */
  async createPortalSession(organizationId: string, returnUrl: string): Promise<{ url: string }> {
    try {
      // Get organization's Stripe customer ID
      const query = 'SELECT stripe_customer_id FROM organizations WHERE id = $1';
      const result = await this.db.query(query, [organizationId]);
      const customerId = result.rows[0]?.stripe_customer_id;

      if (!customerId) {
        throw new Error('No subscription found for organization');
      }

      // Create portal session
      const portalSession = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl
      });

      return {
        url: portalSession.url
      };

    } catch (error) {
      logger.error('Failed to create portal session', {
        error: error.message,
        organizationId
      });
      throw new Error(`Failed to create portal session: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      logger.info('Processing Stripe webhook', {
        eventType: event.type,
        eventId: event.id
      });

      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;

        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          logger.info('Unhandled webhook event type', { eventType: event.type });
      }

    } catch (error) {
      logger.error('Webhook processing failed', {
        error: error.message,
        eventType: event.type,
        eventId: event.id
      });
      throw error;
    }
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const organizationId = session.metadata?.organizationId;
    const planId = session.metadata?.planId;

    if (!organizationId || !planId) {
      logger.error('Missing metadata in checkout session', {
        sessionId: session.id,
        metadata: session.metadata
      });
      return;
    }

    const plan = this.getSubscriptionPlan(planId);
    if (!plan) {
      logger.error('Invalid plan ID in checkout session', { planId });
      return;
    }

    try {
      // Update organization subscription
      await this.db.query(`
        UPDATE organizations 
        SET 
          subscription_plan = $1,
          monthly_analysis_limit = $2,
          stripe_subscription_id = $3,
          subscription_status = 'active',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
      `, [planId, plan.monthlyAnalysisLimit, session.subscription, organizationId]);

      // Log subscription activation
      await this.auditService.logAction({
        userId: session.metadata?.userId,
        organizationId,
        action: 'SUBSCRIPTION_ACTIVATED',
        resource: 'subscription',
        details: {
          planId,
          sessionId: session.id,
          subscriptionId: session.subscription
        }
      });

      logger.info('Subscription activated successfully', {
        organizationId,
        planId,
        subscriptionId: session.subscription
      });

    } catch (error) {
      logger.error('Failed to activate subscription', {
        error: error.message,
        organizationId,
        planId
      });
    }
  }

  /**
   * Handle subscription creation
   */
  private async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    
    if (!organizationId) {
      logger.error('Missing organization ID in subscription metadata');
      return;
    }

    try {
      await this.db.query(`
        UPDATE organizations 
        SET 
          stripe_subscription_id = $1,
          subscription_status = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [subscription.id, subscription.status, organizationId]);

      logger.info('Subscription created and updated', {
        organizationId,
        subscriptionId: subscription.id,
        status: subscription.status
      });

    } catch (error) {
      logger.error('Failed to update subscription creation', {
        error: error.message,
        organizationId,
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    const organizationId = subscription.metadata?.organizationId;
    
    if (!organizationId) {
      logger.error('Missing organization ID in subscription metadata');
      return;
    }

    try {
      await this.db.query(`
        UPDATE organizations 
        SET 
          subscription_status = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $2
      `, [subscription.status, subscription.id]);

      logger.info('Subscription updated', {
        organizationId,
        subscriptionId: subscription.id,
        status: subscription.status
      });

    } catch (error) {
      logger.error('Failed to update subscription', {
        error: error.message,
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * Handle subscription deletion/cancellation
   */
  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      await this.db.query(`
        UPDATE organizations 
        SET 
          subscription_plan = 'free',
          monthly_analysis_limit = 10,
          subscription_status = 'canceled',
          stripe_subscription_id = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $1
      `, [subscription.id]);

      logger.info('Subscription canceled', {
        subscriptionId: subscription.id
      });

    } catch (error) {
      logger.error('Failed to handle subscription cancellation', {
        error: error.message,
        subscriptionId: subscription.id
      });
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    
    if (!subscriptionId) {
      return; // Not a subscription payment
    }

    try {
      // Reset monthly usage on successful payment
      await this.db.query(`
        UPDATE organizations 
        SET 
          current_month_usage = 0,
          updated_at = CURRENT_TIMESTAMP
        WHERE stripe_subscription_id = $1
      `, [subscriptionId]);

      logger.info('Payment succeeded and usage reset', {
        subscriptionId,
        invoiceId: invoice.id
      });

    } catch (error) {
      logger.error('Failed to handle payment success', {
        error: error.message,
        subscriptionId,
        invoiceId: invoice.id
      });
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    
    if (!subscriptionId) {
      return;
    }

    try {
      // Get organization details
      const query = `
        SELECT id, name, stripe_customer_id
        FROM organizations 
        WHERE stripe_subscription_id = $1
      `;
      const result = await this.db.query(query, [subscriptionId]);
      const organization = result.rows[0];

      if (organization) {
        // Send payment failure notification
        // This would typically be done through your email service
        logger.warn('Payment failed for organization', {
          organizationId: organization.id,
          subscriptionId,
          invoiceId: invoice.id
        });
      }

    } catch (error) {
      logger.error('Failed to handle payment failure', {
        error: error.message,
        subscriptionId,
        invoiceId: invoice.id
      });
    }
  }

  /**
   * Get organization's current subscription status
   */
  async getSubscriptionStatus(organizationId: string): Promise<{
    plan: string;
    status: string;
    monthlyLimit: number;
    currentUsage: number;
    stripeSubscriptionId?: string;
  }> {
    try {
      const query = `
        SELECT 
          subscription_plan,
          subscription_status,
          monthly_analysis_limit,
          current_month_usage,
          stripe_subscription_id
        FROM organizations 
        WHERE id = $1
      `;
      
      const result = await this.db.query(query, [organizationId]);
      const org = result.rows[0];

      if (!org) {
        throw new Error('Organization not found');
      }

      return {
        plan: org.subscription_plan || 'free',
        status: org.subscription_status || 'active',
        monthlyLimit: org.monthly_analysis_limit || 10,
        currentUsage: org.current_month_usage || 0,
        stripeSubscriptionId: org.stripe_subscription_id
      };

    } catch (error) {
      logger.error('Failed to get subscription status', {
        error: error.message,
        organizationId
      });
      throw error;
    }
  }
}