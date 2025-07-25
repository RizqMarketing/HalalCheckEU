/**
 * HalalCheck EU - Server Entry Point
 * 
 * Main server bootstrapping with environment validation and graceful startup
 */

import dotenv from 'dotenv';
import { logger } from '@/utils/logger';
import HalalCheckApp from '@/app';

// Load environment variables
dotenv.config();

/**
 * Validate critical environment variables
 */
function validateEnvironment(): void {
  const required = [
    'NODE_ENV',
    'DATABASE_URL',
    'JWT_SECRET',
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('Missing required environment variables', { missing });
    process.exit(1);
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.error('JWT_SECRET must be at least 32 characters long');
    process.exit(1);
  }

  logger.info('Environment validation passed');
}

/**
 * Bootstrap and start the application
 */
async function bootstrap(): Promise<void> {
  try {
    logger.info('Starting HalalCheck EU API Server...', {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    // Validate environment
    validateEnvironment();

    // Create and start the application
    const app = new HalalCheckApp();
    app.start();

    // Log successful startup
    logger.info('Server initialization completed successfully');

  } catch (error) {
    logger.error('Failed to start server', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Start the application
bootstrap();