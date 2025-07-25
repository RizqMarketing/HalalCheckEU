-- HalalCheck EU Database Schema
-- PostgreSQL 14+ with UUID support
-- CRITICAL: This stores religious dietary compliance data

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'CERTIFICATION_BODY', 'FOOD_MANUFACTURER', 'SUPERMARKET_CHAIN',
        'IMPORT_EXPORT', 'RESTAURANT_CHAIN', 'GOVERNMENT', 'CONSULTANT', 'OTHER'
    )),
    country VARCHAR(3) NOT NULL, -- ISO country code
    region VARCHAR(50) NOT NULL DEFAULT 'EU',
    
    -- Contact information
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Subscription details
    subscription_plan VARCHAR(20) NOT NULL DEFAULT 'STARTER' CHECK (subscription_plan IN (
        'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'
    )),
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'TRIAL' CHECK (subscription_status IN (
        'ACTIVE', 'TRIAL', 'SUSPENDED', 'CANCELLED'
    )),
    subscription_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    subscription_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_email VARCHAR(255) NOT NULL,
    
    -- Certification body specific
    certification_standards TEXT[], -- Array of standards like ['JAKIM', 'MUI', 'HFCE']
    license_numbers TEXT[],
    accreditation_bodies TEXT[],
    
    -- Usage limits
    monthly_analysis_limit INTEGER NOT NULL DEFAULT 100,
    current_month_usage INTEGER NOT NULL DEFAULT 0,
    usage_reset_date DATE NOT NULL DEFAULT DATE_TRUNC('month', NOW() + INTERVAL '1 month'),
    
    -- Security settings
    requires_mfa BOOLEAN NOT NULL DEFAULT FALSE,
    allowed_domains TEXT[],
    ip_whitelist INET[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    
    -- Personal information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    phone VARCHAR(50),
    
    -- Authentication
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- MFA
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    mfa_backup_codes TEXT[],
    
    -- Authorization
    role VARCHAR(20) NOT NULL CHECK (role IN (
        'SUPER_ADMIN', 'ADMIN', 'CERTIFIER', 'ANALYST', 'MANUFACTURER', 'VIEWER'
    )),
    permissions TEXT[] NOT NULL DEFAULT '{}',
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_VERIFICATION' CHECK (status IN (
        'ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'
    )),
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_password_change TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Preferences
    language VARCHAR(5) NOT NULL DEFAULT 'en',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Amsterdam',
    preferred_certification_standards TEXT[] DEFAULT '{}',
    
    -- Professional credentials
    certifications TEXT[],
    qualifications TEXT[],
    years_of_experience INTEGER,
    
    -- API access
    api_key_hash VARCHAR(255),
    api_key_created_at TIMESTAMP WITH TIME ZONE,
    api_key_last_used TIMESTAMP WITH TIME ZONE,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID,
    last_modified_by UUID
);

-- Ingredients table - CRITICAL for halal compliance
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    e_number VARCHAR(10), -- EU E-numbers like E471
    cas_number VARCHAR(20), -- Chemical Abstract Service number
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'MEAT', 'DAIRY', 'PLANT', 'ADDITIVE', 'EMULSIFIER', 
        'PRESERVATIVE', 'FLAVORING', 'COLORING', 'VITAMIN', 
        'ENZYME', 'ALCOHOL', 'GELATIN', 'OTHER'
    )),
    
    -- Default classification
    default_status VARCHAR(20) NOT NULL CHECK (default_status IN (
        'HALAL', 'HARAM', 'MASHBOOH', 'REQUIRES_REVIEW'
    )),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN (
        'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
    )),
    
    -- Detailed information
    description TEXT NOT NULL,
    common_uses TEXT[] DEFAULT '{}',
    alternative_names TEXT[] DEFAULT '{}',
    
    -- Cross-contamination
    cross_contamination_risk BOOLEAN NOT NULL DEFAULT FALSE,
    cross_contamination_notes TEXT,
    
    -- Certification requirements
    requires_certificate BOOLEAN NOT NULL DEFAULT FALSE,
    certificate_types TEXT[] DEFAULT '{}',
    
    -- Expert review
    requires_expert_review BOOLEAN NOT NULL DEFAULT FALSE,
    expert_review_reason TEXT,
    
    -- Verification sources
    sources_references TEXT[] DEFAULT '{}',
    islamic_rulings TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_reviewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_by VARCHAR(255) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || array_to_string(alternative_names, ' '))
    ) STORED
);

-- Ingredient sources table
CREATE TABLE ingredient_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    source_type VARCHAR(20) NOT NULL CHECK (source_type IN (
        'ANIMAL', 'PLANT', 'SYNTHETIC', 'MINERAL', 'MICROBIAL'
    )),
    animal_type VARCHAR(20) CHECK (animal_type IN (
        'BEEF', 'PORK', 'CHICKEN', 'FISH', 'INSECT', 'OTHER'
    )),
    is_halal BOOLEAN NOT NULL,
    certification_required BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT
);

-- Regional variations for ingredients
CREATE TABLE ingredient_regional_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    region VARCHAR(20) NOT NULL CHECK (region IN (
        'EU', 'NETHERLANDS', 'BELGIUM', 'FRANCE', 'GERMANY', 'UK'
    )),
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'HALAL', 'HARAM', 'MASHBOOH', 'REQUIRES_REVIEW'
    )),
    certification_standard VARCHAR(20) NOT NULL CHECK (certification_standard IN (
        'JAKIM', 'MUI', 'HFCE', 'HQC', 'HIC', 'ISWA', 'CUSTOM'
    )),
    reasoning TEXT NOT NULL,
    last_reviewed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reviewed_by VARCHAR(255) NOT NULL,
    
    UNIQUE(ingredient_id, region, certification_standard)
);

-- Ingredient translations
CREATE TABLE ingredient_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    language_code VARCHAR(5) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    notes TEXT,
    
    UNIQUE(ingredient_id, language_code)
);

-- Product analyses table
CREATE TABLE product_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL,
    ingredient_text TEXT NOT NULL,
    
    -- Analysis results
    overall_status VARCHAR(20) NOT NULL CHECK (overall_status IN (
        'HALAL', 'HARAM', 'MASHBOOH', 'REQUIRES_REVIEW'
    )),
    overall_risk_level VARCHAR(20) NOT NULL CHECK (overall_risk_level IN (
        'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
    )),
    
    -- Summary statistics
    total_ingredients INTEGER NOT NULL,
    halal_count INTEGER NOT NULL DEFAULT 0,
    haram_count INTEGER NOT NULL DEFAULT 0,
    mashbooh_count INTEGER NOT NULL DEFAULT 0,
    unknown_count INTEGER NOT NULL DEFAULT 0,
    
    -- Flags
    expert_review_required BOOLEAN NOT NULL DEFAULT FALSE,
    has_haram_ingredients BOOLEAN NOT NULL DEFAULT FALSE,
    has_mashbooh_ingredients BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Recommendations
    recommendations TEXT[] DEFAULT '{}',
    
    -- Processing info
    processing_time_ms INTEGER NOT NULL,
    language VARCHAR(5) NOT NULL DEFAULT 'en',
    region VARCHAR(20) NOT NULL DEFAULT 'EU',
    certification_standard VARCHAR(20) NOT NULL DEFAULT 'HFCE',
    
    -- Ownership
    analyzed_by UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Individual ingredient analysis results
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_analysis_id UUID NOT NULL REFERENCES product_analyses(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id), -- NULL for unknown ingredients
    
    -- Detection info
    detected_name VARCHAR(255) NOT NULL,
    confidence NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    match_type VARCHAR(20) NOT NULL CHECK (match_type IN (
        'EXACT', 'FUZZY', 'E_NUMBER', 'AI_SUGGESTED', 'UNKNOWN'
    )),
    
    -- Classification
    status VARCHAR(20) NOT NULL CHECK (status IN (
        'HALAL', 'HARAM', 'MASHBOOH', 'REQUIRES_REVIEW'
    )),
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN (
        'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'
    )),
    
    -- Analysis details
    reasoning TEXT NOT NULL,
    requires_expert_review BOOLEAN NOT NULL DEFAULT FALSE,
    warnings TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_analysis_id UUID NOT NULL REFERENCES product_analyses(id),
    
    -- Report details
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'EXECUTIVE_SUMMARY', 'DETAILED_ANALYSIS', 'CERTIFICATION_READY', 'COMPLIANCE_DASHBOARD'
    )),
    format VARCHAR(10) NOT NULL CHECK (format IN ('PDF', 'EXCEL', 'JSON')),
    language VARCHAR(5) NOT NULL DEFAULT 'en',
    
    -- File information
    file_path VARCHAR(500),
    file_size_bytes INTEGER,
    download_count INTEGER NOT NULL DEFAULT 0,
    
    -- Branding
    includes_branding BOOLEAN NOT NULL DEFAULT FALSE,
    custom_branding JSONB,
    
    -- Metadata
    generated_by UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- For temporary download links
);

-- Refresh tokens for JWT management
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Revoked JWT tokens (for logout/security)
CREATE TABLE revoked_tokens (
    jti VARCHAR(255) PRIMARY KEY, -- JWT ID
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- API keys for programmatic access
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    permissions TEXT[] DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit logs for compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_ingredients_e_number ON ingredients(e_number) WHERE e_number IS NOT NULL;
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_status ON ingredients(default_status);
CREATE INDEX idx_ingredients_search ON ingredients USING gin(search_vector);
CREATE INDEX idx_ingredient_sources_ingredient ON ingredient_sources(ingredient_id);
CREATE INDEX idx_regional_variations_ingredient ON ingredient_regional_variations(ingredient_id);
CREATE INDEX idx_regional_variations_region ON ingredient_regional_variations(region);
CREATE INDEX idx_product_analyses_user ON product_analyses(analyzed_by);
CREATE INDEX idx_product_analyses_org ON product_analyses(organization_id);
CREATE INDEX idx_product_analyses_created ON product_analyses(created_at);
CREATE INDEX idx_analysis_results_product ON analysis_results(product_analysis_id);
CREATE INDEX idx_reports_analysis ON reports(product_analysis_id);
CREATE INDEX idx_reports_user ON reports(generated_by);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Usage reset trigger for organizations
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.usage_reset_date <= CURRENT_DATE THEN
        NEW.current_month_usage = 0;
        NEW.usage_reset_date = DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reset_monthly_usage_trigger BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION reset_monthly_usage();

-- Row Level Security policies (for multi-tenancy)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be implemented in application code based on JWT claims