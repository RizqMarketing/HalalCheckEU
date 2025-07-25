/**
 * HalalCheck EU - Database Migration Script
 * 
 * Safely creates database schema with proper error handling
 */

import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();
    
    console.log('🔄 Running database migrations...');
    
    // Read and execute schema
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf8');
    
    // Execute schema in a transaction
    await client.query('BEGIN');
    
    try {
      await client.query(schemaSql);
      await client.query('COMMIT');
      console.log('✅ Database schema created successfully!');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };