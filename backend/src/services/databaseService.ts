/**
 * HalalCheck EU - Database Service
 * 
 * Enterprise-grade database connection with connection pooling,
 * transactions, and proper error handling
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '@/utils/logger';
import { 
  User, 
  Organization, 
  ProductAnalysis, 
  AnalysisResult,
  UserRole,
  UserStatus,
  OrganizationType,
  SubscriptionPlan 
} from '@/types/auth';
import { Ingredient } from '@/types/halal';

export class DatabaseService {
  private pool: Pool;
  private static instance: DatabaseService;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      maxUses: 7500, // Close (and replace) a connection after it has been used this many times
    });

    // Handle pool errors
    this.pool.on('error', (err, client) => {
      logger.error('Unexpected error on idle client', err);
    });

    // Handle pool connection
    this.pool.on('connect', (client) => {
      logger.debug('New client connected to database');
    });
  }

  // Singleton pattern for database service
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Execute a query with parameters
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('Database query failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Execute query with a client from the pool (for transactions)
   */
  async queryWithClient<T = any>(client: PoolClient, text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    
    try {
      const result = await client.query<T>(text, params);
      const duration = Date.now() - start;
      
      logger.debug('Executed query with client', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration,
        rows: result.rowCount
      });
      
      return result;
    } catch (error) {
      logger.error('Database query with client failed', {
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        error: error.message,
        params
      });
      throw error;
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed', { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get a client from the pool for manual transaction management
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }

  // ===== USER MANAGEMENT =====

  /**
   * Create a new user
   */
  async createUser(userData: Partial<User>): Promise<User> {
    const query = `
      INSERT INTO users (
        email, username, first_name, last_name, password_hash, salt,
        email_verified, email_verification_token, role, permissions,
        organization_id, status, language, timezone, mfa_enabled,
        last_password_change, login_attempts
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *
    `;

    const values = [
      userData.email,
      userData.username,
      userData.firstName,
      userData.lastName,
      userData.passwordHash,
      userData.salt,
      userData.emailVerified || false,
      userData.emailVerificationToken,
      userData.role,
      userData.permissions || [],
      userData.organizationId,
      userData.status || UserStatus.PENDING_VERIFICATION,
      userData.language || 'en',
      userData.timezone || 'Europe/Amsterdam',
      userData.mfaEnabled || false,
      userData.lastPasswordChange || new Date(),
      userData.loginAttempts || 0
    ];

    const result = await this.query<User>(query, values);
    return result.rows[0];
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User | null> {
    const query = `
      SELECT u.*, o.name as organization_name, o.type as organization_type
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `;
    const result = await this.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find user by email verification token
   */
  async findUserByEmailVerificationToken(token: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email_verification_token = $1';
    const result = await this.query<User>(query, [token]);
    return result.rows[0] || null;
  }

  /**
   * Update user
   */
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Build dynamic update query
    const fields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const setClause = fields.map((field, index) => `${this.camelToSnake(field)} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(field => updates[field])];

    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1 
      RETURNING *
    `;

    const result = await this.query<User>(query, values);
    return result.rows[0];
  }

  // ===== ORGANIZATION MANAGEMENT =====

  /**
   * Create organization
   */
  async createOrganization(orgData: Partial<Organization>): Promise<Organization> {
    const query = `
      INSERT INTO organizations (
        name, type, country, subscription_plan, subscription_status,
        subscription_start_date, subscription_end_date, monthly_analysis_limit,
        current_month_usage, requires_mfa, phone, billing_email
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *
    `;

    const values = [
      orgData.name,
      orgData.type,
      orgData.country,
      orgData.subscriptionPlan || SubscriptionPlan.STARTER,
      orgData.subscriptionStatus || 'TRIAL',
      orgData.subscriptionStartDate || new Date(),
      orgData.subscriptionEndDate,
      orgData.monthlyAnalysisLimit || 100,
      orgData.currentMonthUsage || 0,
      orgData.requiresMFA || false,
      orgData.phone,
      orgData.billingEmail
    ];

    const result = await this.query<Organization>(query, values);
    return result.rows[0];
  }

  /**
   * Find organization by ID
   */
  async findOrganizationById(id: string): Promise<Organization | null> {
    const query = 'SELECT * FROM organizations WHERE id = $1';
    const result = await this.query<Organization>(query, [id]);
    return result.rows[0] || null;
  }

  // ===== INGREDIENT MANAGEMENT =====

  /**
   * Find ingredient by name (fuzzy search)
   */
  async findIngredientByName(name: string): Promise<Ingredient | null> {
    const query = `
      SELECT * FROM ingredients 
      WHERE name ILIKE $1 
      OR $2 = ANY(alternative_names)
      OR search_vector @@ plainto_tsquery('english', $3)
      ORDER BY 
        CASE 
          WHEN LOWER(name) = LOWER($4) THEN 1
          WHEN name ILIKE $5 THEN 2
          ELSE 3
        END
      LIMIT 1
    `;
    
    const searchTerm = name.trim();
    const result = await this.query<Ingredient>(query, [
      `%${searchTerm}%`,
      searchTerm,
      searchTerm,
      searchTerm,
      `${searchTerm}%`
    ]);
    
    return result.rows[0] || null;
  }

  /**
   * Find ingredient by E-number
   */
  async findIngredientByENumber(eNumber: string): Promise<Ingredient | null> {
    const query = 'SELECT * FROM ingredients WHERE e_number = $1';
    const result = await this.query<Ingredient>(query, [eNumber.toUpperCase()]);
    return result.rows[0] || null;
  }

  // ===== ANALYSIS MANAGEMENT =====

  /**
   * Store product analysis
   */
  async storeProductAnalysis(analysis: ProductAnalysis): Promise<string> {
    return await this.transaction(async (client) => {
      // Insert main analysis
      const analysisQuery = `
        INSERT INTO product_analyses (
          id, product_name, ingredient_text, overall_status, overall_risk_level,
          total_ingredients, halal_count, haram_count, mashbooh_count, unknown_count,
          expert_review_required, has_haram_ingredients, has_mashbooh_ingredients,
          recommendations, processing_time_ms, analyzed_by, organization_id
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        ) RETURNING id
      `;

      const analysisValues = [
        analysis.id,
        analysis.productName,
        'ingredient_text_placeholder', // We'll need to store this
        analysis.overallStatus,
        analysis.overallRiskLevel,
        analysis.summary.total_ingredients,
        analysis.summary.halal_count,
        analysis.summary.haram_count,
        analysis.summary.mashbooh_count,
        analysis.summary.unknown_count,
        analysis.expertReviewRequired,
        analysis.haram_ingredients.length > 0,
        analysis.mashbooh_ingredients.length > 0,
        analysis.recommendations,
        analysis.processingTimeMs,
        analysis.analyzedBy,
        'organization_id_placeholder' // We'll need to get this from user
      ];

      const analysisResult = await this.queryWithClient(client, analysisQuery, analysisValues);
      const analysisId = analysisResult.rows[0].id;

      // Insert individual ingredient results
      for (const ingredient of analysis.ingredients) {
        const ingredientQuery = `
          INSERT INTO analysis_results (
            product_analysis_id, ingredient_id, detected_name, confidence,
            match_type, status, risk_level, reasoning, requires_expert_review,
            warnings, suggestions
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `;

        const ingredientValues = [
          analysisId,
          ingredient.ingredientId !== 'unknown' ? ingredient.ingredientId : null,
          ingredient.detectedName,
          ingredient.confidence,
          'AI_SUGGESTED', // Default match type
          ingredient.status,
          ingredient.riskLevel,
          ingredient.reasoning,
          ingredient.requiresExpertReview,
          ingredient.warnings,
          ingredient.suggestions
        ];

        await this.queryWithClient(client, ingredientQuery, ingredientValues);
      }

      return analysisId;
    });
  }

  /**
   * Get product analysis by ID
   */
  async getProductAnalysis(id: string): Promise<ProductAnalysis | null> {
    const query = `
      SELECT pa.*, 
             array_agg(
               json_build_object(
                 'ingredientId', ar.ingredient_id,
                 'detectedName', ar.detected_name,
                 'confidence', ar.confidence,
                 'status', ar.status,
                 'riskLevel', ar.risk_level,
                 'reasoning', ar.reasoning,
                 'requiresExpertReview', ar.requires_expert_review,
                 'warnings', ar.warnings,
                 'suggestions', ar.suggestions
               )
             ) as ingredients
      FROM product_analyses pa
      LEFT JOIN analysis_results ar ON pa.id = ar.product_analysis_id
      WHERE pa.id = $1
      GROUP BY pa.id
    `;

    const result = await this.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    
    // Transform database result to ProductAnalysis
    return {
      id: row.id,
      productName: row.product_name,
      ingredients: row.ingredients.filter(i => i.ingredientId !== null),
      overallStatus: row.overall_status,
      overallRiskLevel: row.overall_risk_level,
      haram_ingredients: row.ingredients.filter(i => i.status === 'HARAM'),
      mashbooh_ingredients: row.ingredients.filter(i => i.status === 'MASHBOOH'),
      requires_expert_review: row.ingredients.filter(i => i.requiresExpertReview),
      summary: {
        total_ingredients: row.total_ingredients,
        halal_count: row.halal_count,
        haram_count: row.haram_count,
        mashbooh_count: row.mashbooh_count,
        unknown_count: row.unknown_count
      },
      recommendations: row.recommendations,
      expertReviewRequired: row.expert_review_required,
      analyzedAt: row.created_at,
      analyzedBy: row.analyzed_by,
      processingTimeMs: row.processing_time_ms
    };
  }

  // ===== TOKEN MANAGEMENT =====

  /**
   * Store refresh token
   */
  async storeRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `;
    await this.query(query, [userId, tokenHash, expiresAt]);
  }

  /**
   * Check if JWT token is revoked
   */
  async isTokenRevoked(jti: string): Promise<boolean> {
    const query = 'SELECT 1 FROM revoked_tokens WHERE jti = $1';
    const result = await this.query(query, [jti]);
    return result.rows.length > 0;
  }

  /**
   * Store report metadata
   */
  async storeReport(reportId: string, reportData: any): Promise<void> {
    const query = `
      INSERT INTO reports (
        id, product_analysis_id, type, format, language, 
        generated_by, organization_id, file_path
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.query(query, [
      reportId,
      reportData.analysisId,
      reportData.type,
      reportData.format,
      reportData.language,
      reportData.userId,
      reportData.organizationId,
      `reports/${reportId}.${reportData.format.toLowerCase()}`
    ]);
  }

  // ===== UTILITY METHODS =====

  /**
   * Convert camelCase to snake_case for database columns
   */
  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error('Database health check failed', error);
      return false;
    }
  }
}