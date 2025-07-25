-- HalalCheck AI - Enhanced Database Security
-- Run this AFTER the main schema to add advanced security measures

-- ========================================
-- 1. ENHANCED RLS POLICIES
-- ========================================

-- Drop existing basic policies and create more secure ones
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON public.analyses;

-- Enhanced analysis policies with additional security checks
CREATE POLICY "Users can view own analyses with time limit" ON public.analyses
    FOR SELECT USING (
        auth.uid() = user_id AND
        created_at > (NOW() - INTERVAL '2 years') -- Data retention policy
    );

CREATE POLICY "Users can insert analyses with rate limiting" ON public.analyses
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        -- Check trial limits using our function
        (
            SELECT COUNT(*) 
            FROM public.analyses 
            WHERE user_id = auth.uid() 
            AND created_at > (NOW() - INTERVAL '1 hour')
        ) < 20 -- Max 20 analyses per hour
    );

CREATE POLICY "Users can update own recent analyses only" ON public.analyses
    FOR UPDATE USING (
        auth.uid() = user_id AND
        created_at > (NOW() - INTERVAL '24 hours') -- Can only edit recent analyses
    );

-- Enhanced file policies with security checks
DROP POLICY IF EXISTS "Users can view own files" ON public.uploaded_files;
DROP POLICY IF EXISTS "Users can insert own files" ON public.uploaded_files;

CREATE POLICY "Users can view own files with audit" ON public.uploaded_files
    FOR SELECT USING (
        auth.uid() = user_id AND
        processing_status != 'failed' -- Hide failed/suspicious files
    );

CREATE POLICY "Users can insert files with validation" ON public.uploaded_files
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        file_size_bytes <= 52428800 AND -- 50MB limit
        file_extension IN ('.txt', '.csv', '.pdf', '.xls', '.xlsx', '.doc', '.docx', '.rtf', '.jpg', '.jpeg', '.png', '.webp')
    );

-- ========================================
-- 2. SECURITY AUDIT TABLES
-- ========================================

-- Security events logging
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'login_success', 'login_failed', 'password_change', 'email_change',
        'file_upload', 'analysis_request', 'rate_limit_hit', 'suspicious_activity',
        'account_locked', 'trial_abuse', 'api_key_used', 'data_export'
    )),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    details JSONB,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Failed authentication attempts tracking
CREATE TABLE IF NOT EXISTS public.failed_auth_attempts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempt_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suspicious file uploads
CREATE TABLE IF NOT EXISTS public.suspicious_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    mime_type TEXT,
    file_size_bytes BIGINT,
    threat_type TEXT, -- 'malware', 'oversized', 'invalid_type', 'suspicious_content'
    scan_result JSONB,
    quarantined BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 3. SECURITY FUNCTIONS
-- ========================================

-- Function to check if user is rate limited
CREATE OR REPLACE FUNCTION public.is_user_rate_limited(user_id UUID, action_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    analysis_count INTEGER;
    upload_count INTEGER;
    failed_auth_count INTEGER;
BEGIN
    CASE action_type
        WHEN 'analysis' THEN
            SELECT COUNT(*) INTO analysis_count
            FROM public.analyses 
            WHERE analyses.user_id = is_user_rate_limited.user_id 
            AND created_at > (NOW() - INTERVAL '1 hour');
            
            RETURN analysis_count >= 20;
            
        WHEN 'file_upload' THEN
            SELECT COUNT(*) INTO upload_count
            FROM public.uploaded_files 
            WHERE uploaded_files.user_id = is_user_rate_limited.user_id 
            AND created_at > (NOW() - INTERVAL '5 minutes');
            
            RETURN upload_count >= 20;
            
        WHEN 'auth' THEN
            -- Check by user profile email if exists
            SELECT COUNT(*) INTO failed_auth_count
            FROM public.failed_auth_attempts fa
            JOIN public.user_profiles up ON fa.email = up.email
            WHERE up.id = is_user_rate_limited.user_id
            AND fa.last_attempt_at > (NOW() - INTERVAL '15 minutes');
            
            RETURN failed_auth_count >= 5;
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL,
    p_risk_score INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    event_id UUID;
BEGIN
    INSERT INTO public.security_events (
        event_type, user_id, ip_address, user_agent, details, risk_score
    ) VALUES (
        p_event_type, p_user_id, p_ip_address, p_user_agent, p_details, p_risk_score
    ) RETURNING id INTO event_id;
    
    -- Auto-escalate high-risk events
    IF p_risk_score >= 80 THEN
        -- In production: send alert to security team
        RAISE NOTICE 'HIGH RISK SECURITY EVENT: % for user %', p_event_type, p_user_id;
    END IF;
    
    RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record failed authentication
CREATE OR REPLACE FUNCTION public.record_failed_auth(
    p_email TEXT,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    existing_record public.failed_auth_attempts%ROWTYPE;
    should_block BOOLEAN := FALSE;
BEGIN
    -- Check for existing record in last 15 minutes
    SELECT * INTO existing_record
    FROM public.failed_auth_attempts
    WHERE email = p_email 
    AND ip_address = p_ip_address
    AND last_attempt_at > (NOW() - INTERVAL '15 minutes');
    
    IF FOUND THEN
        -- Update existing record
        UPDATE public.failed_auth_attempts
        SET attempt_count = attempt_count + 1,
            last_attempt_at = NOW(),
            blocked_until = CASE 
                WHEN attempt_count >= 4 THEN NOW() + INTERVAL '15 minutes'
                ELSE blocked_until
            END
        WHERE id = existing_record.id;
        
        should_block := existing_record.attempt_count >= 4;
    ELSE
        -- Create new record
        INSERT INTO public.failed_auth_attempts (
            email, ip_address, user_agent, attempt_count, last_attempt_at
        ) VALUES (
            p_email, p_ip_address, p_user_agent, 1, NOW()
        );
    END IF;
    
    -- Log security event
    PERFORM public.log_security_event(
        'login_failed',
        NULL,
        p_ip_address,
        p_user_agent,
        jsonb_build_object('email', p_email, 'blocked', should_block),
        CASE WHEN should_block THEN 70 ELSE 30 END
    );
    
    RETURN should_block;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(
    p_email TEXT,
    p_ip_address INET
)
RETURNS BOOLEAN AS $$
DECLARE
    blocked_until TIMESTAMPTZ;
BEGIN
    SELECT fa.blocked_until INTO blocked_until
    FROM public.failed_auth_attempts fa
    WHERE fa.email = p_email 
    AND fa.ip_address = p_ip_address
    AND fa.blocked_until > NOW()
    ORDER BY fa.last_attempt_at DESC
    LIMIT 1;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to quarantine suspicious files
CREATE OR REPLACE FUNCTION public.quarantine_file(
    p_user_id UUID,
    p_filename TEXT,
    p_file_hash TEXT,
    p_threat_type TEXT,
    p_scan_result JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    quarantine_id UUID;
BEGIN
    INSERT INTO public.suspicious_files (
        user_id, original_filename, file_hash, threat_type, scan_result
    ) VALUES (
        p_user_id, p_filename, p_file_hash, p_threat_type, p_scan_result
    ) RETURNING id INTO quarantine_id;
    
    -- Log security event
    PERFORM public.log_security_event(
        'suspicious_activity',
        p_user_id,
        NULL,
        NULL,
        jsonb_build_object('file', p_filename, 'threat', p_threat_type),
        85 -- High risk score
    );
    
    RETURN quarantine_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user security summary
CREATE OR REPLACE FUNCTION public.get_user_security_summary(user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'recent_logins', (
            SELECT COUNT(*) 
            FROM public.security_events 
            WHERE security_events.user_id = get_user_security_summary.user_id 
            AND event_type = 'login_success' 
            AND created_at > (NOW() - INTERVAL '30 days')
        ),
        'failed_attempts', (
            SELECT COUNT(*) 
            FROM public.security_events 
            WHERE security_events.user_id = get_user_security_summary.user_id 
            AND event_type = 'login_failed' 
            AND created_at > (NOW() - INTERVAL '30 days')
        ),
        'files_uploaded', (
            SELECT COUNT(*) 
            FROM public.uploaded_files 
            WHERE uploaded_files.user_id = get_user_security_summary.user_id 
            AND created_at > (NOW() - INTERVAL '30 days')
        ),
        'analyses_performed', (
            SELECT COUNT(*) 
            FROM public.analyses 
            WHERE analyses.user_id = get_user_security_summary.user_id 
            AND created_at > (NOW() - INTERVAL '30 days')
        ),
        'risk_events', (
            SELECT COUNT(*) 
            FROM public.security_events 
            WHERE security_events.user_id = get_user_security_summary.user_id 
            AND risk_score >= 50 
            AND created_at > (NOW() - INTERVAL '30 days')
        ),
        'account_created', (
            SELECT created_at 
            FROM public.user_profiles 
            WHERE id = get_user_security_summary.user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 4. INDEXES FOR SECURITY PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_security_events_user_type ON public.security_events(user_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_risk ON public.security_events(risk_score DESC, created_at DESC) WHERE risk_score >= 50;
CREATE INDEX IF NOT EXISTS idx_failed_auth_email_ip ON public.failed_auth_attempts(email, ip_address, last_attempt_at DESC);
CREATE INDEX IF NOT EXISTS idx_failed_auth_blocked ON public.failed_auth_attempts(blocked_until) WHERE blocked_until > NOW();
CREATE INDEX IF NOT EXISTS idx_suspicious_files_user ON public.suspicious_files(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_suspicious_files_hash ON public.suspicious_files(file_hash);

-- ========================================
-- 5. RLS POLICIES FOR SECURITY TABLES
-- ========================================

-- Security events - users can only see their own events (limited info)
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own security events" ON public.security_events
    FOR SELECT USING (
        auth.uid() = user_id AND
        event_type NOT IN ('suspicious_activity', 'trial_abuse') -- Hide sensitive events
    );

-- Failed auth attempts - no user access (admin only)
ALTER TABLE public.failed_auth_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No user access to failed auth attempts" ON public.failed_auth_attempts
    FOR ALL USING (false); -- Only accessible via functions

-- Suspicious files - no user access (admin only) 
ALTER TABLE public.suspicious_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No user access to suspicious files" ON public.suspicious_files
    FOR ALL USING (false); -- Only accessible via functions

-- ========================================
-- 6. AUTOMATED SECURITY CLEANUP
-- ========================================

-- Function to clean up old security data
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Clean up old security events (keep 6 months)
    DELETE FROM public.security_events 
    WHERE created_at < (NOW() - INTERVAL '6 months')
    AND risk_score < 50; -- Keep high-risk events longer
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Clean up old failed auth attempts (keep 30 days)
    DELETE FROM public.failed_auth_attempts 
    WHERE created_at < (NOW() - INTERVAL '30 days');
    
    -- Clean up resolved suspicious files (keep 90 days)
    DELETE FROM public.suspicious_files 
    WHERE created_at < (NOW() - INTERVAL '90 days')
    AND quarantined = false;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- 7. TRIGGER FOR AUTOMATIC SECURITY LOGGING
-- ========================================

-- Trigger to log user profile changes
CREATE OR REPLACE FUNCTION log_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Log profile updates
    IF TG_OP = 'UPDATE' THEN
        PERFORM public.log_security_event(
            CASE 
                WHEN OLD.email != NEW.email THEN 'email_change'
                ELSE 'profile_update'
            END,
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object(
                'old_email', OLD.email,
                'new_email', NEW.email,
                'fields_changed', (
                    SELECT array_agg(key) 
                    FROM jsonb_each_text(to_jsonb(OLD)) old_data
                    JOIN jsonb_each_text(to_jsonb(NEW)) new_data ON old_data.key = new_data.key
                    WHERE old_data.value != new_data.value
                )
            ),
            CASE WHEN OLD.email != NEW.email THEN 60 ELSE 20 END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_log_profile_changes
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION log_profile_changes();

-- Comments for documentation
COMMENT ON TABLE public.security_events IS 'Comprehensive security event logging for audit and monitoring';
COMMENT ON TABLE public.failed_auth_attempts IS 'Failed authentication tracking for brute force protection';
COMMENT ON TABLE public.suspicious_files IS 'Quarantined files and malware detection results';
COMMENT ON FUNCTION public.is_user_rate_limited IS 'Check if user has exceeded rate limits for various actions';
COMMENT ON FUNCTION public.log_security_event IS 'Log security events with automatic risk assessment';
COMMENT ON FUNCTION public.record_failed_auth IS 'Record failed authentication attempts with automatic blocking';
COMMENT ON FUNCTION public.quarantine_file IS 'Quarantine suspicious files and log security events';