/**
 * HalalCheck EU - Test Teardown
 * 
 * Global test teardown and cleanup
 */

import { pool } from '../src/database/connection'

module.exports = async () => {
  // Final cleanup
  try {
    console.log('🧹 Running final test cleanup...')
    
    // Close database connection
    await pool.end()
    
    console.log('✅ Test teardown completed')
  } catch (error) {
    console.error('❌ Error in test teardown:', error)
  }
}