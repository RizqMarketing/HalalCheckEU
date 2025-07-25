/**
 * HalalCheck EU - Authentication & Authorization Types
 * 
 * Enterprise-grade security for halal certification platform
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CERTIFIER = 'CERTIFIER',
  ANALYST = 'ANALYST',
  MANUFACTURER = 'MANUFACTURER',
  VIEWER = 'VIEWER'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION'
}

export enum OrganizationType {
  CERTIFICATION_BODY = 'CERTIFICATION_BODY',
  FOOD_MANUFACTURER = 'FOOD_MANUFACTURER',
  SUPERMARKET_CHAIN = 'SUPERMARKET_CHAIN',
  IMPORT_EXPORT = 'IMPORT_EXPORT',
  RESTAURANT_CHAIN = 'RESTAURANT_CHAIN',
  GOVERNMENT = 'GOVERNMENT',
  CONSULTANT = 'CONSULTANT',
  OTHER = 'OTHER'
}

export enum SubscriptionPlan {
  STARTER = 'STARTER',        // €299/month
  PROFESSIONAL = 'PROFESSIONAL', // €899/month
  ENTERPRISE = 'ENTERPRISE',     // €2999/month
  CUSTOM = 'CUSTOM'              // Custom pricing
}

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  country: string;
  region: string;
  
  // Contact information
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website?: string;
  
  // Subscription details
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED';
  subscriptionStartDate: Date;
  subscriptionEndDate: Date;
  billingEmail: string;
  
  // Certification body specific
  certificationStandards?: string[];
  licenseNumbers?: string[];
  accreditationBodies?: string[];
  
  // Usage limits based on plan
  monthlyAnalysisLimit: number;
  currentMonthUsage: number;
  
  // Security settings
  requiresMFA: boolean;
  allowedDomains?: string[];
  ipWhitelist?: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  
  // Personal information
  firstName: string;
  lastName: string;
  title?: string;
  phone?: string;
  
  // Authentication
  passwordHash: string;
  salt: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // MFA
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  
  // Authorization
  role: UserRole;
  permissions: string[];
  organizationId: string;
  organization?: Organization;
  
  // Subscription details
  subscriptionPlan?: {
    name: string;
    monthlyLimit: number;
    price: number;
    currency: string;
    features: string[];
  };
  
  // Status
  status: UserStatus;
  lastLoginAt?: Date;
  lastPasswordChange: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  
  // Preferences
  language: string;
  timezone: string;
  preferredCertificationStandards: string[];
  
  // Professional credentials
  certifications?: string[];
  qualifications?: string[];
  yearsOfExperience?: number;
  
  // API access
  apiKeyHash?: string;
  apiKeyCreatedAt?: Date;
  apiKeyLastUsed?: Date;
  
  // Audit trail
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  lastModifiedBy?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number; // seconds
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
  organizationType: OrganizationType;
  country: string;
  phone: string;
  acceptTerms: boolean;
  subscriptionPlan?: SubscriptionPlan;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  title?: string;
  phone?: string;
  language?: string;
  timezone?: string;
  preferredCertificationStandards?: string[];
}

export interface JWTPayload {
  sub: string; // user ID
  email: string;
  role: UserRole;
  organizationId: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Permission constants
export const PERMISSIONS = {
  // Analysis permissions
  ANALYZE_INGREDIENTS: 'analyze:ingredients',
  VIEW_ANALYSIS_HISTORY: 'view:analysis_history',
  EXPORT_REPORTS: 'export:reports',
  
  // Organization management
  MANAGE_USERS: 'manage:users',
  VIEW_USERS: 'view:users',
  MANAGE_ORGANIZATION: 'manage:organization',
  VIEW_BILLING: 'view:billing',
  
  // Admin permissions
  MANAGE_ALL_ORGANIZATIONS: 'admin:manage_organizations',
  VIEW_SYSTEM_STATS: 'admin:view_stats',
  MANAGE_INGREDIENTS_DB: 'admin:manage_ingredients',
  
  // API access
  API_ACCESS: 'api:access',
  WEBHOOK_MANAGE: 'webhook:manage'
} as const;

// Role-based permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [UserRole.ADMIN]: [
    PERMISSIONS.ANALYZE_INGREDIENTS,
    PERMISSIONS.VIEW_ANALYSIS_HISTORY,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_ORGANIZATION,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.API_ACCESS,
    PERMISSIONS.WEBHOOK_MANAGE
  ],
  [UserRole.CERTIFIER]: [
    PERMISSIONS.ANALYZE_INGREDIENTS,
    PERMISSIONS.VIEW_ANALYSIS_HISTORY,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_USERS
  ],
  [UserRole.ANALYST]: [
    PERMISSIONS.ANALYZE_INGREDIENTS,
    PERMISSIONS.VIEW_ANALYSIS_HISTORY,
    PERMISSIONS.EXPORT_REPORTS
  ],
  [UserRole.MANUFACTURER]: [
    PERMISSIONS.ANALYZE_INGREDIENTS,
    PERMISSIONS.VIEW_ANALYSIS_HISTORY,
    PERMISSIONS.EXPORT_REPORTS
  ],
  [UserRole.VIEWER]: [
    PERMISSIONS.VIEW_ANALYSIS_HISTORY
  ]
};