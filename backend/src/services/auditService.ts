/**
 * HalalCheck EU - Audit Service
 * 
 * Comprehensive audit logging for compliance and security
 */

import { DatabaseService } from './databaseService';
import { logger } from '@/utils/logger';

export interface AuditLogEntry {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Log an action for audit trail
   */
  async logAction(entry: AuditLogEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, organization_id, action, resource, resource_id,
          details, ip_address, user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;

      await this.db.query(query, [
        entry.userId || null,
        entry.organizationId || null,
        entry.action,
        entry.resource,
        entry.resourceId || null,
        entry.details ? JSON.stringify(entry.details) : null,
        entry.ipAddress || null,
        entry.userAgent || null
      ]);

      logger.info('Audit log created', {
        action: entry.action,
        resource: entry.resource,
        userId: entry.userId
      });

    } catch (error) {
      logger.error('Failed to create audit log', {
        error: error.message,
        entry
      });
      // Don't throw - audit logging failure shouldn't break the main flow
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit = 100): Promise<any[]> {
    const query = `
      SELECT * FROM audit_logs 
      WHERE user_id = $1 
      ORDER BY timestamp DESC 
      LIMIT $2
    `;

    const result = await this.db.query(query, [userId, limit]);
    return result.rows;
  }

  /**
   * Get audit logs for an organization
   */
  async getOrganizationAuditLogs(organizationId: string, limit = 100): Promise<any[]> {
    const query = `
      SELECT al.*, u.first_name, u.last_name, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.organization_id = $1 
      ORDER BY al.timestamp DESC 
      LIMIT $2
    `;

    const result = await this.db.query(query, [organizationId, limit]);
    return result.rows;
  }
}