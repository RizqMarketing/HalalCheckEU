/**
 * HalalCheck EU - Payment Service Tests
 * 
 * Comprehensive unit tests for Stripe payment integration
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { PaymentService } from '../src/services/paymentService'
import { pool } from '../src/database/connection'

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    },
    subscriptions: {
      create: jest.fn(),
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      list: jest.fn()
    },
    invoices: {
      list: jest.fn(),
      retrieve: jest.fn(),
      pay: jest.fn()
    },
    paymentMethods: {
      attach: jest.fn(),
      detach: jest.fn(),
      list: jest.fn()
    },
    setupIntents: {
      create: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    },
    prices: {
      list: jest.fn()
    }
  }))
})

describe('PaymentService', () => {
  let service: PaymentService
  let mockStripe: any

  beforeEach(async () => {
    service = new PaymentService()
    mockStripe = require('stripe')()
    
    // Clean up test data
    await pool.query('DELETE FROM organizations WHERE name LIKE %Payment Test%')
    await pool.query('DELETE FROM users WHERE email LIKE %payment-test%')
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM organizations WHERE name LIKE %Payment Test%')
    await pool.query('DELETE FROM users WHERE email LIKE %payment-test%')
    jest.clearAllMocks()
  })

  describe('createCustomer', () => {
    it('should create a Stripe customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_test123',
        email: 'payment-test@example.com',
        name: 'Payment Test Org',
        metadata: {}
      }

      mockStripe.customers.create.mockResolvedValue(mockCustomer)

      // Create test organization
      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status, billing_email)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, ['Payment Test Org', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'TRIAL', 'payment-test@example.com'])

      const organizationId = orgResult.rows[0].id

      const result = await service.createCustomer({
        organizationId,
        email: 'payment-test@example.com',
        name: 'Payment Test Org',
        address: {
          line1: '123 Test Street',
          city: 'Amsterdam',
          postal_code: '1234AB',
          country: 'NL'
        }
      })

      expect(result.customerId).toBe('cus_test123')
      expect(mockStripe.customers.create).toHaveBeenCalledWith({
        email: 'payment-test@example.com',
        name: 'Payment Test Org',
        address: {
          line1: '123 Test Street',
          city: 'Amsterdam',
          postal_code: '1234AB',
          country: 'NL'
        },
        metadata: {
          organizationId: organizationId,
          platform: 'halalcheck-eu'
        }
      })

      // Verify customer ID was stored in database
      const dbResult = await pool.query(
        'SELECT stripe_customer_id FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(dbResult.rows[0].stripe_customer_id).toBe('cus_test123')
    })

    it('should handle Stripe API errors', async () => {
      mockStripe.customers.create.mockRejectedValue(new Error('Stripe API Error'))

      const orgResult = await pool.query(`
        INSERT INTO organizations (name, type, country, subscription_plan, subscription_status, billing_email)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
      `, ['Payment Test Org 2', 'FOOD_MANUFACTURER', 'Netherlands', 'STARTER', 'TRIAL', 'payment-test2@example.com'])

      const organizationId = orgResult.rows[0].id

      await expect(service.createCustomer({
        organizationId,
        email: 'payment-test2@example.com',
        name: 'Payment Test Org 2'
      })).rejects.toThrow('Failed to create Stripe customer')
    })
  })

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{ price: { id: 'price_starter' } }]
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded'
          }
        }
      }

      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription)

      // Create test organization with customer ID
      const orgResult = await pool.query(`
        INSERT INTO organizations (
          name, type, country, subscription_plan, subscription_status, 
          billing_email, stripe_customer_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [
        'Payment Test Org Subscription', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'STARTER', 
        'TRIAL', 
        'payment-sub-test@example.com',
        'cus_test123'
      ])

      const organizationId = orgResult.rows[0].id

      const result = await service.createSubscription({
        customerId: 'cus_test123',
        priceId: 'price_starter',
        organizationId
      })

      expect(result.subscriptionId).toBe('sub_test123')
      expect(result.status).toBe('active')
      expect(mockStripe.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        items: [{ price: 'price_starter' }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organizationId: organizationId,
          platform: 'halalcheck-eu'
        }
      })

      // Verify subscription was stored in database
      const dbResult = await pool.query(
        'SELECT stripe_subscription_id, subscription_status FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(dbResult.rows[0].stripe_subscription_id).toBe('sub_test123')
      expect(dbResult.rows[0].subscription_status).toBe('ACTIVE')
    })

    it('should handle subscription creation failures', async () => {
      mockStripe.subscriptions.create.mockRejectedValue(new Error('Payment failed'))

      const orgResult = await pool.query(`
        INSERT INTO organizations (
          name, type, country, subscription_plan, subscription_status, 
          billing_email, stripe_customer_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [
        'Payment Test Org Failed', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'STARTER', 
        'TRIAL', 
        'payment-failed-test@example.com',
        'cus_test456'
      ])

      const organizationId = orgResult.rows[0].id

      await expect(service.createSubscription({
        customerId: 'cus_test456',
        priceId: 'price_starter',
        organizationId
      })).rejects.toThrow('Failed to create subscription')
    })
  })

  describe('updateSubscription', () => {
    it('should update subscription plan successfully', async () => {
      const mockSubscription = {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        items: {
          data: [{ 
            id: 'si_test123',
            price: { id: 'price_professional' } 
          }]
        }
      }

      mockStripe.subscriptions.update.mockResolvedValue(mockSubscription)

      // Create test organization with subscription
      const orgResult = await pool.query(`
        INSERT INTO organizations (
          name, type, country, subscription_plan, subscription_status, 
          billing_email, stripe_customer_id, stripe_subscription_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [
        'Payment Test Org Update', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'STARTER', 
        'ACTIVE', 
        'payment-update-test@example.com',
        'cus_test123',
        'sub_test123'
      ])

      const organizationId = orgResult.rows[0].id

      const result = await service.updateSubscription({
        subscriptionId: 'sub_test123',
        newPriceId: 'price_professional',
        organizationId
      })

      expect(result.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalled()

      // Verify plan was updated in database
      const dbResult = await pool.query(
        'SELECT subscription_plan FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(dbResult.rows[0].subscription_plan).toBe('PROFESSIONAL')
    })
  })

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockCancelledSubscription = {
        id: 'sub_test123',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }

      mockStripe.subscriptions.cancel.mockResolvedValue(mockCancelledSubscription)

      // Create test organization with subscription
      const orgResult = await pool.query(`
        INSERT INTO organizations (
          name, type, country, subscription_plan, subscription_status, 
          billing_email, stripe_customer_id, stripe_subscription_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
      `, [
        'Payment Test Org Cancel', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'PROFESSIONAL', 
        'ACTIVE', 
        'payment-cancel-test@example.com',
        'cus_test123',
        'sub_test123'
      ])

      const organizationId = orgResult.rows[0].id

      const result = await service.cancelSubscription({
        subscriptionId: 'sub_test123',
        organizationId
      })

      expect(result.success).toBe(true)
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test123')

      // Verify status was updated in database
      const dbResult = await pool.query(
        'SELECT subscription_status FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(dbResult.rows[0].subscription_status).toBe('CANCELLED')
    })
  })

  describe('handleWebhook', () => {
    it('should handle subscription updated webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            metadata: {
              organizationId: 'test-org-id'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Create test organization
      const orgResult = await pool.query(`
        INSERT INTO organizations (
          id, name, type, country, subscription_plan, subscription_status, 
          billing_email, stripe_customer_id, stripe_subscription_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id
      `, [
        'test-org-id',
        'Payment Test Org Webhook', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'STARTER', 
        'TRIAL', 
        'payment-webhook-test@example.com',
        'cus_test123',
        'sub_test123'
      ])

      const result = await service.handleWebhook(
        Buffer.from('webhook-body'),
        'test-signature'
      )

      expect(result.success).toBe(true)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        Buffer.from('webhook-body'),
        'test-signature',
        process.env.STRIPE_WEBHOOK_SECRET
      )
    })

    it('should handle invoice payment succeeded webhook', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test123',
            customer: 'cus_test123',
            subscription: 'sub_test123',
            amount_paid: 29900, // €299 in cents
            currency: 'eur',
            status: 'paid',
            metadata: {
              organizationId: 'test-org-id-2'
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Create test organization
      await pool.query(`
        INSERT INTO organizations (
          id, name, type, country, subscription_plan, subscription_status, 
          billing_email, stripe_customer_id, stripe_subscription_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        'test-org-id-2',
        'Payment Test Org Invoice', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'STARTER', 
        'ACTIVE', 
        'payment-invoice-test@example.com',
        'cus_test123',
        'sub_test123'
      ])

      const result = await service.handleWebhook(
        Buffer.from('webhook-body'),
        'test-signature'
      )

      expect(result.success).toBe(true)
      // Payment record should be created in database
      const paymentResult = await pool.query(
        'SELECT * FROM payments WHERE stripe_invoice_id = $1',
        ['in_test123']
      )
      expect(paymentResult.rows).toHaveLength(1)
      expect(paymentResult.rows[0].amount).toBe(29900)
      expect(paymentResult.rows[0].status).toBe('succeeded')
    })

    it('should handle invalid webhook signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      await expect(service.handleWebhook(
        Buffer.from('webhook-body'),
        'invalid-signature'
      )).rejects.toThrow('Webhook signature verification failed')
    })
  })

  describe('getInvoices', () => {
    it('should retrieve customer invoices', async () => {
      const mockInvoices = {
        data: [
          {
            id: 'in_test123',
            amount_paid: 29900,
            currency: 'eur',
            status: 'paid',
            created: Math.floor(Date.now() / 1000),
            invoice_pdf: 'https://invoice.stripe.com/test.pdf'
          }
        ],
        has_more: false
      }

      mockStripe.invoices.list.mockResolvedValue(mockInvoices)

      const result = await service.getInvoices('cus_test123')

      expect(result.invoices).toHaveLength(1)
      expect(result.invoices[0].id).toBe('in_test123')
      expect(result.invoices[0].amount).toBe(29900)
      expect(result.invoices[0].status).toBe('paid')
      expect(mockStripe.invoices.list).toHaveBeenCalledWith({
        customer: 'cus_test123',
        limit: 100
      })
    })
  })

  describe('createSetupIntent', () => {
    it('should create setup intent for payment method', async () => {
      const mockSetupIntent = {
        id: 'seti_test123',
        client_secret: 'seti_test123_secret_test',
        status: 'requires_payment_method'
      }

      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent)

      const result = await service.createSetupIntent('cus_test123')

      expect(result.setupIntentId).toBe('seti_test123')
      expect(result.clientSecret).toBe('seti_test123_secret_test')
      expect(mockStripe.setupIntents.create).toHaveBeenCalledWith({
        customer: 'cus_test123',
        payment_method_types: ['card'],
        usage: 'off_session'
      })
    })
  })

  describe('getSubscriptionUsage', () => {
    it('should calculate usage and limits correctly', async () => {
      // Create test organization
      const orgResult = await pool.query(`
        INSERT INTO organizations (
          name, type, country, subscription_plan, subscription_status, 
          billing_email, monthly_analysis_limit
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [
        'Usage Test Org', 
        'FOOD_MANUFACTURER', 
        'Netherlands', 
        'PROFESSIONAL', 
        'ACTIVE', 
        'usage-test@example.com',
        500
      ])

      const organizationId = orgResult.rows[0].id

      // Create some test analyses for this month
      const currentDate = new Date()
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      for (let i = 0; i < 50; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          `Test Product ${i}`,
          organizationId,
          'test-user-id',
          'HALAL',
          'LOW',
          monthStart
        ])
      }

      const usage = await service.getSubscriptionUsage(organizationId)

      expect(usage.currentUsage).toBe(50)
      expect(usage.monthlyLimit).toBe(500)
      expect(usage.usagePercentage).toBe(10)
      expect(usage.remainingAnalyses).toBe(450)
    })
  })
})