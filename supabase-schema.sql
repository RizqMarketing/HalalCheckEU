-- HalalCheck AI - Complete Database Schema
-- This schema supports: User management, Analysis tracking, File storage, Trial system, Billing

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    company_type TEXT CHECK (company_type IN ('certification_body', 'food_manufacturer', 'restaurant', 'importer', 'consultant', 'other')),
    country TEXT,
    phone TEXT,
    
    -- Trial & Subscription Management
    trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    trial_analyses_used INTEGER DEFAULT 0,
    trial_analyses_limit INTEGER DEFAULT 50,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'cancelled', 'expired')),
    subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    
    -- Preferences
    notification_email BOOLEAN DEFAULT true,
    notification_trial_reminders BOOLEAN DEFAULT true,
    preferred_language TEXT DEFAULT 'en'
);

-- Analyses table - stores all ingredient analyses
CREATE TABLE public.analyses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Analysis Input
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('single', 'bulk', 'image_ocr')),
    input_text TEXT, -- Original ingredient list
    input_filename TEXT, -- Original uploaded filename
    input_file_url TEXT, -- Supabase Storage URL
    
    -- Analysis Results
    overall_status TEXT NOT NULL CHECK (overall_status IN ('HALAL', 'HARAM', 'MASHBOOH')),
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    analysis_duration_seconds INTEGER,
    cost_savings_euros DECIMAL(8,2), -- Calculated time savings
    
    -- Individual Ingredient Results (JSON)
    ingredients_analyzed JSONB, -- Array of ingredient analysis objects
    high_risk_ingredients TEXT[], -- Array of concerning ingredients
    requires_expert_review BOOLEAN DEFAULT false,
    
    -- AI Response
    ai_reasoning TEXT, -- Full AI explanation
    islamic_references TEXT, -- Quranic/Hadith citations
    recommendations TEXT, -- Suggested actions
    
    -- Generated Documents
    pdf_report_url TEXT, -- Supabase Storage URL for PDF
    email_template TEXT, -- Generated email content
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search and Analytics
    search_vector tsvector, -- For full-text search
    analysis_version TEXT DEFAULT '1.0' -- Track AI model versions
);

-- Files table - track all uploaded files
CREATE TABLE public.uploaded_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE,
    
    -- File Details
    filename TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    file_extension TEXT,
    
    -- Storage
    supabase_storage_path TEXT NOT NULL, -- Path in Supabase Storage
    public_url TEXT, -- Public URL if accessible
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_error TEXT,
    
    -- OCR Results (for images)
    ocr_text TEXT, -- Extracted text from images
    ocr_confidence DECIMAL(3,2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table - for team accounts (future enterprise feature)
CREATE TABLE public.organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    description TEXT,
    
    -- Subscription
    subscription_plan TEXT DEFAULT 'enterprise' CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    
    -- Limits
    monthly_analysis_limit INTEGER DEFAULT 10000,
    user_limit INTEGER DEFAULT 50,
    
    -- Branding (white-label features)
    logo_url TEXT,
    brand_color TEXT,
    custom_domain TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members table
CREATE TABLE public.organization_members (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'analyst', 'member')),
    permissions TEXT[] DEFAULT ARRAY['analyze', 'view_reports'],
    
    invited_by UUID REFERENCES public.user_profiles(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ,
    
    UNIQUE(organization_id, user_id)
);

-- Usage tracking table
CREATE TABLE public.usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    
    -- Action tracking
    action_type TEXT NOT NULL CHECK (action_type IN ('analysis', 'pdf_download', 'api_call', 'login', 'file_upload')),
    resource_id UUID, -- ID of analysis, file, etc.
    
    -- Request details
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    
    -- Billing
    billable BOOLEAN DEFAULT true,
    credits_used INTEGER DEFAULT 1,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    type TEXT NOT NULL CHECK (type IN ('trial_reminder', 'trial_expired', 'payment_failed', 'analysis_complete', 'system_update')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    
    -- Status
    read_at TIMESTAMPTZ,
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys table (for API access)
CREATE TABLE public.api_keys (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Key details
    name TEXT NOT NULL, -- User-friendly name
    key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
    key_prefix TEXT NOT NULL, -- First 8 chars for identification
    
    -- Permissions
    permissions TEXT[] DEFAULT ARRAY['analyze'],
    rate_limit_per_hour INTEGER DEFAULT 100,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_trial_status ON public.user_profiles(subscription_status, trial_ends_at);
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX idx_analyses_status ON public.analyses(overall_status);
CREATE INDEX idx_analyses_search ON public.analyses USING gin(search_vector);
CREATE INDEX idx_uploaded_files_user_analysis ON public.uploaded_files(user_id, analysis_id);
CREATE INDEX idx_usage_logs_user_date ON public.usage_logs(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read_at) WHERE read_at IS NULL;

-- Update search vector trigger for analyses
CREATE OR REPLACE FUNCTION update_analysis_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.input_text, '') || ' ' ||
        COALESCE(NEW.input_filename, '') || ' ' ||
        COALESCE(NEW.ai_reasoning, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_analysis_search_vector
    BEFORE INSERT OR UPDATE ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION update_analysis_search_vector();

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for analyses
CREATE POLICY "Users can view own analyses" ON public.analyses
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.analyses
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for uploaded_files
CREATE POLICY "Users can view own files" ON public.uploaded_files
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON public.uploaded_files
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert usage logs" ON public.usage_logs
    FOR INSERT WITH CHECK (true);

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for api_keys
CREATE POLICY "Users can manage own API keys" ON public.api_keys
    FOR ALL USING (auth.uid() = user_id);

-- Functions for business logic

-- Function to check trial status
CREATE OR REPLACE FUNCTION public.is_trial_active(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_record public.user_profiles%ROWTYPE;
BEGIN
    SELECT * INTO profile_record FROM public.user_profiles WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    RETURN (
        profile_record.subscription_status = 'trial' AND 
        profile_record.trial_ends_at > NOW() AND
        profile_record.trial_analyses_used < profile_record.trial_analyses_limit
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment trial usage
CREATE OR REPLACE FUNCTION public.increment_trial_usage(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
BEGIN
    SELECT trial_analyses_used, trial_analyses_limit 
    INTO current_usage, usage_limit
    FROM public.user_profiles 
    WHERE id = user_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    IF current_usage >= usage_limit THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.user_profiles 
    SET trial_analyses_used = trial_analyses_used + 1,
        updated_at = NOW()
    WHERE id = user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's analysis stats
CREATE OR REPLACE FUNCTION public.get_user_analysis_stats(user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_analyses', COUNT(*),
        'halal_count', COUNT(*) FILTER (WHERE overall_status = 'HALAL'),
        'haram_count', COUNT(*) FILTER (WHERE overall_status = 'HARAM'),
        'mashbooh_count', COUNT(*) FILTER (WHERE overall_status = 'MASHBOOH'),
        'this_month', COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())),
        'total_savings_euros', COALESCE(SUM(cost_savings_euros), 0),
        'avg_confidence', ROUND(AVG(confidence_score), 2)
    ) INTO result
    FROM public.analyses
    WHERE analyses.user_id = get_user_analysis_stats.user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data will be created when real users sign up through authentication

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles with trial and subscription management';
COMMENT ON TABLE public.analyses IS 'Complete analysis records with AI results and generated documents';
COMMENT ON TABLE public.uploaded_files IS 'File tracking with OCR support and storage management';
COMMENT ON TABLE public.usage_logs IS 'Comprehensive usage tracking for analytics and billing';
COMMENT ON TABLE public.notifications IS 'User notification system for trials and updates';
COMMENT ON FUNCTION public.is_trial_active IS 'Check if user has active trial with remaining analyses';
COMMENT ON FUNCTION public.increment_trial_usage IS 'Safely increment trial usage counter';
COMMENT ON FUNCTION public.get_user_analysis_stats IS 'Get comprehensive analysis statistics for user dashboard';