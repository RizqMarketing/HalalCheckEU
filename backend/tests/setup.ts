/**
 * HalalCheck EU - Test Setup
 * 
 * Global test setup and configuration
 */

import { config } from 'dotenv'
import { pool } from '../src/database/connection'

// Load test environment variables
config({ path: '.env.test' })

// Set test environment
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.OPENAI_API_KEY = 'test-openai-key'
process.env.STRIPE_SECRET_KEY = 'sk_test_123'
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'

// Increase timeout for database operations
jest.setTimeout(30000)

// Global test setup
beforeAll(async () => {
  // Ensure database connection
  try {
    await pool.query('SELECT 1')
    console.log('✅ Database connection established for tests')
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error)
    throw error
  }
})

// Clean up after all tests
afterAll(async () => {
  // Clean up test data
  try {
    await pool.query('DELETE FROM product_analyses WHERE product_name LIKE %Test%')
    await pool.query('DELETE FROM users WHERE email LIKE %test%')
    await pool.query('DELETE FROM organizations WHERE name LIKE %Test%')
    await pool.end()
    console.log('✅ Test database cleaned up')
  } catch (error) {
    console.error('❌ Error cleaning up test database:', error)
  }
})