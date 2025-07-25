/**
 * HalalCheck EU - Payment Integration Tests
 * 
 * End-to-end integration tests for Stripe payment workflows
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest } from '@jest/globals'
import request from 'supertest'
import { HalalCheckApp } from '../../src/app'
import { pool } from '../../src/database/connection'
import { UserRole } from '../../src/types'

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
      list: jest.fn().mockResolvedValue({
        data: [
          { id: 'price_starter', unit_amount: 29900, currency: 'eur' },
          { id: 'price_professional', unit_amount: 89900, currency: 'eur' },
          { id: 'price_enterprise', unit_amount: 299900, currency: 'eur' }
        ]
      })
    }
  }))
}))

describe('Payment Integration', () => {
  let app: HalalCheckApp
  let server: any
  let adminToken: string
  let userToken: string
  let organizationId: string
  let userId: string
  let mockStripe: any

  beforeAll(async () => {
    app = new HalalCheckApp()
    server = app.getApp()
    mockStripe = require('stripe')()
  })

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM payments WHERE organization_id IN (SELECT id FROM organizations WHERE name LIKE %Payment Integration%)')
    await pool.query('DELETE FROM users WHERE email LIKE %payment-integration%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Payment Integration%')

    // Create test organization
    const orgResult = await pool.query(`
      INSERT INTO organizations (
        name, type, country, subscription_plan, subscription_status, 
        billing_email, monthly_analysis_limit
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
    `, [
      'Payment Integration Test Org', 
      'FOOD_MANUFACTURER', 
      'Netherlands', 
      'STARTER', 
      'TRIAL', 
      'payment-integration@example.com',
      100
    ])

    organizationId = orgResult.rows[0].id

    // Create admin user
    const adminRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'payment-integration-admin@example.com',
        password: 'AdminPassword123!',
        firstName: 'Payment',
        lastName: 'Admin',
        organizationName: 'Payment Integration Test Org',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345700',
        acceptTerms: true
      })

    adminToken = adminRegister.body.data.tokens.accessToken
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ADMIN, organizationId, adminRegister.body.data.user.id]
    )

    // Create regular user
    const userRegister = await request(server)
      .post('/api/auth/register')
      .send({
        email: 'payment-integration-user@example.com',
        password: 'UserPassword123!',
        firstName: 'Payment',
        lastName: 'User',
        organizationName: 'Payment Integration Test Org',
        organizationType: 'FOOD_MANUFACTURER',
        country: 'Netherlands',
        phone: '+31612345701',
        acceptTerms: true
      })

    userToken = userRegister.body.data.tokens.accessToken
    userId = userRegister.body.data.user.id
    
    await pool.query(
      'UPDATE users SET role = $1, organization_id = $2 WHERE id = $3',
      [UserRole.ANALYST, organizationId, userId]
    )

    // Reset Stripe mocks
    jest.clearAllMocks()
  })

  afterEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM payments WHERE organization_id IN (SELECT id FROM organizations WHERE name LIKE %Payment Integration%)')
    await pool.query('DELETE FROM users WHERE email LIKE %payment-integration%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Payment Integration%')
  })

  afterAll(async () => {
    await pool.end()
  })

  describe('Subscription Creation Workflow', () => {
    it('should complete full subscription setup', async () => {
      // Mock Stripe responses
      const mockCustomer = {
        id: 'cus_integration_test',
        email: 'payment-integration@example.com',
        name: 'Payment Integration Test Org'
      }

      const mockSetupIntent = {
        id: 'seti_integration_test',
        client_secret: 'seti_integration_test_secret',
        status: 'requires_payment_method'
      }

      const mockSubscription = {
        id: 'sub_integration_test',
        customer: 'cus_integration_test',
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
        items: {
          data: [{ price: { id: 'price_professional' } }]
        },
        latest_invoice: {
          payment_intent: {
            status: 'succeeded'
          }
        }
      }

      mockStripe.customers.create.mockResolvedValue(mockCustomer)
      mockStripe.setupIntents.create.mockResolvedValue(mockSetupIntent)
      mockStripe.subscriptions.create.mockResolvedValue(mockSubscription)

      // Step 1: Create Stripe customer
      const customerResponse = await request(server)
        .post('/api/payments/create-customer')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'payment-integration@example.com',
          name: 'Payment Integration Test Org',
          address: {
            line1: '123 Test Street',
            city: 'Amsterdam',
            postal_code: '1234AB',
            country: 'NL'
          }
        })
        .expect(200)

      expect(customerResponse.body.success).toBe(true)
      expect(customerResponse.body.data.customerId).toBe('cus_integration_test')

      // Step 2: Create setup intent for payment method
      const setupIntentResponse = await request(server)
        .post('/api/payments/create-setup-intent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(setupIntentResponse.body.success).toBe(true)
      expect(setupIntentResponse.body.data.clientSecret).toBe('seti_integration_test_secret')

      // Step 3: Create subscription
      const subscriptionResponse = await request(server)
        .post('/api/payments/create-subscription')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          priceId: 'price_professional'
        })
        .expect(200)

      expect(subscriptionResponse.body.success).toBe(true)
      expect(subscriptionResponse.body.data.subscriptionId).toBe('sub_integration_test')

      // Step 4: Verify organization was updated
      const orgResult = await pool.query(
        'SELECT stripe_customer_id, stripe_subscription_id, subscription_plan, subscription_status FROM organizations WHERE id = $1',
        [organizationId]
      )

      expect(orgResult.rows[0].stripe_customer_id).toBe('cus_integration_test')
      expect(orgResult.rows[0].stripe_subscription_id).toBe('sub_integration_test')
      expect(orgResult.rows[0].subscription_plan).toBe('PROFESSIONAL')
      expect(orgResult.rows[0].subscription_status).toBe('ACTIVE')
    })

    it('should reject subscription creation for non-admin users', async () => {
      const response = await request(server)
        .post('/api/payments/create-customer')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          email: 'test@example.com',
          name: 'Test Org'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS')
    })
  })

  describe('Subscription Management', () => {
    beforeEach(async () => {
      // Setup organization with existing subscription
      await pool.query(`
        UPDATE organizations 
        SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = $3
        WHERE id = $4
      `, ['cus_existing', 'sub_existing', 'ACTIVE', organizationId])
    })

    it('should update subscription plan', async () => {
      const mockUpdatedSubscription = {
        id: 'sub_existing',
        customer: 'cus_existing',
        status: 'active',
        items: {
          data: [{ 
            id: 'si_test',
            price: { id: 'price_enterprise' } 
          }]
        }
      }

      mockStripe.subscriptions.update.mockResolvedValue(mockUpdatedSubscription)

      const response = await request(server)
        .patch('/api/payments/update-subscription')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newPriceId: 'price_enterprise'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        'sub_existing',
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              price: 'price_enterprise'
            })
          ])
        })
      )

      // Verify database was updated
      const orgResult = await pool.query(
        'SELECT subscription_plan FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(orgResult.rows[0].subscription_plan).toBe('ENTERPRISE')
    })

    it('should cancel subscription', async () => {
      const mockCancelledSubscription = {
        id: 'sub_existing',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000)
      }

      mockStripe.subscriptions.cancel.mockResolvedValue(mockCancelledSubscription)

      const response = await request(server)
        .post('/api/payments/cancel-subscription')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_existing')

      // Verify database was updated
      const orgResult = await pool.query(
        'SELECT subscription_status FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(orgResult.rows[0].subscription_status).toBe('CANCELLED')
    })

    it('should retrieve invoices', async () => {
      const mockInvoices = {
        data: [
          {
            id: 'in_test1',
            amount_paid: 89900,
            currency: 'eur',
            status: 'paid',
            created: Math.floor(Date.now() / 1000),
            invoice_pdf: 'https://invoice.stripe.com/test1.pdf'
          },
          {
            id: 'in_test2',
            amount_paid: 89900,
            currency: 'eur',
            status: 'paid',
            created: Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60),
            invoice_pdf: 'https://invoice.stripe.com/test2.pdf'
          }
        ],
        has_more: false
      }

      mockStripe.invoices.list.mockResolvedValue(mockInvoices)

      const response = await request(server)
        .get('/api/payments/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.invoices).toHaveLength(2)
      expect(response.body.data.invoices[0].id).toBe('in_test1')
      expect(response.body.data.invoices[0].amount).toBe(89900)
    })
  })

  describe('Webhook Integration', () => {
    it('should handle subscription updated webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_webhook_test',
            customer: 'cus_webhook_test',
            status: 'active',
            current_period_start: Math.floor(Date.now() / 1000),
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            items: {
              data: [{ price: { id: 'price_professional' } }]
            },
            metadata: {
              organizationId: organizationId
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Update organization to have the webhook customer ID
      await pool.query(
        'UPDATE organizations SET stripe_customer_id = $1, stripe_subscription_id = $2 WHERE id = $3',
        ['cus_webhook_test', 'sub_webhook_test', organizationId]
      )

      const response = await request(server)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from('webhook-body'))
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled()

      // Verify organization was updated
      const orgResult = await pool.query(
        'SELECT subscription_status, subscription_plan FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(orgResult.rows[0].subscription_status).toBe('ACTIVE')
      expect(orgResult.rows[0].subscription_plan).toBe('PROFESSIONAL')
    })

    it('should handle invoice payment succeeded webhook', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_webhook_test',
            customer: 'cus_webhook_test',
            subscription: 'sub_webhook_test',
            amount_paid: 89900,
            currency: 'eur',
            status: 'paid',
            created: Math.floor(Date.now() / 1000),
            metadata: {
              organizationId: organizationId
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Update organization to have the webhook customer ID
      await pool.query(
        'UPDATE organizations SET stripe_customer_id = $1, stripe_subscription_id = $2 WHERE id = $3',
        ['cus_webhook_test', 'sub_webhook_test', organizationId]
      )

      const response = await request(server)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from('webhook-body'))
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify payment record was created
      const paymentResult = await pool.query(
        'SELECT * FROM payments WHERE stripe_invoice_id = $1',
        ['in_webhook_test']
      )

      expect(paymentResult.rows).toHaveLength(1)
      expect(paymentResult.rows[0].amount).toBe(89900)
      expect(paymentResult.rows[0].status).toBe('succeeded')
      expect(paymentResult.rows[0].organization_id).toBe(organizationId)
    })

    it('should handle subscription canceled webhook', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_webhook_test',
            customer: 'cus_webhook_test',
            status: 'canceled',
            canceled_at: Math.floor(Date.now() / 1000),
            metadata: {
              organizationId: organizationId
            }
          }
        }
      }

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent)

      // Update organization to have the webhook customer ID
      await pool.query(
        'UPDATE organizations SET stripe_customer_id = $1, stripe_subscription_id = $2, subscription_status = $3 WHERE id = $4',
        ['cus_webhook_test', 'sub_webhook_test', 'ACTIVE', organizationId]
      )

      const response = await request(server)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from('webhook-body'))
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify organization subscription was canceled
      const orgResult = await pool.query(
        'SELECT subscription_status FROM organizations WHERE id = $1',
        [organizationId]
      )
      expect(orgResult.rows[0].subscription_status).toBe('CANCELLED')
    })

    it('should reject invalid webhook signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature')
      })

      const response = await request(server)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send(Buffer.from('webhook-body'))
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('WEBHOOK_ERROR')
    })
  })

  describe('Usage Tracking Integration', () => {
    beforeEach(async () => {
      // Setup organization with subscription
      await pool.query(`
        UPDATE organizations 
        SET 
          stripe_customer_id = $1, 
          stripe_subscription_id = $2, 
          subscription_plan = $3,
          subscription_status = $4,
          monthly_analysis_limit = $5,
          current_month_usage = $6
        WHERE id = $7
      `, ['cus_usage_test', 'sub_usage_test', 'PROFESSIONAL', 'ACTIVE', 500, 0, organizationId])
    })

    it('should get current usage statistics', async () => {
      // Create some test analyses to track usage
      for (let i = 0; i < 5; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          `Usage Test Product ${i}`,
          organizationId,
          userId,
          'HALAL',
          'LOW',
          new Date()
        ])
      }

      const response = await request(server)
        .get('/api/payments/usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.currentUsage).toBe(5)
      expect(response.body.data.monthlyLimit).toBe(500)
      expect(response.body.data.usagePercentage).toBe(1) // 5/500 = 1%
      expect(response.body.data.remainingAnalyses).toBe(495)
    })

    it('should show usage warnings when approaching limit', async () => {
      // Set usage to 90% of limit
      await pool.query(
        'UPDATE organizations SET current_month_usage = $1 WHERE id = $2',
        [450, organizationId] // 90% of 500
      )

      const response = await request(server)
        .get('/api/payments/usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.currentUsage).toBe(450)
      expect(response.body.data.usagePercentage).toBe(90)
      expect(response.body.data.warningLevel).toBe('high') // Should warn at 90%
    })

    it('should track usage across billing periods', async () => {
      // Create analyses from different months
      const currentDate = new Date()
      const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 15)

      // Last month's analyses (should not count)
      for (let i = 0; i < 3; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          `Last Month Product ${i}`,
          organizationId,
          userId,
          'HALAL',
          'LOW',
          lastMonth
        ])
      }

      // Current month's analyses (should count)
      for (let i = 0; i < 2; i++) {
        await pool.query(`
          INSERT INTO product_analyses (
            product_name, organization_id, analyzed_by, overall_status, 
            overall_risk_level, analyzed_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          `Current Month Product ${i}`,
          organizationId,
          userId,
          'HALAL',
          'LOW',
          currentDate
        ])
      }

      const response = await request(server)
        .get('/api/payments/usage')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.currentUsage).toBe(2) // Only current month
    })
  })

  describe('Billing Portal Integration', () => {
    beforeEach(async () => {
      await pool.query(`
        UPDATE organizations 
        SET stripe_customer_id = $1
        WHERE id = $2
      `, ['cus_portal_test', organizationId])
    })

    it('should create billing portal session', async () => {
      const mockPortalSession = {
        id: 'bps_test',
        url: 'https://billing.stripe.com/session/test',
        customer: 'cus_portal_test'
      }

      // Note: We would need to add billing portal support to our Stripe mock
      // For now, we'll test the endpoint exists and requires admin access
      
      const response = await request(server)
        .post('/api/payments/create-portal-session')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          returnUrl: 'https://app.halalcheck.eu/settings/billing'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('should reject portal access for non-admin users', async () => {
      const response = await request(server)
        .post('/api/payments/create-portal-session')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          returnUrl: 'https://app.halalcheck.eu/settings/billing'
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('INSUFFICIENT_PERMISSIONS')
    })
  })
})