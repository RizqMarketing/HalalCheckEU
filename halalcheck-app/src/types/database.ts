// HalalCheck AI - Database Type Definitions
// Auto-generated TypeScript types for Supabase database

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string
          user_id: string
          analysis_type: 'single' | 'bulk' | 'image_ocr'
          input_text: string | null
          input_filename: string | null
          input_file_url: string | null
          overall_status: 'HALAL' | 'HARAM' | 'MASHBOOH'
          confidence_score: number | null
          analysis_duration_seconds: number | null
          cost_savings_euros: number | null
          ingredients_analyzed: Json | null
          high_risk_ingredients: string[] | null
          requires_expert_review: boolean | null
          ai_reasoning: string | null
          islamic_references: string | null
          recommendations: string | null
          pdf_report_url: string | null
          email_template: string | null
          created_at: string
          updated_at: string
          search_vector: unknown | null
          analysis_version: string | null
        }
        Insert: {
          id?: string
          user_id: string
          analysis_type: 'single' | 'bulk' | 'image_ocr'
          input_text?: string | null
          input_filename?: string | null
          input_file_url?: string | null
          overall_status: 'HALAL' | 'HARAM' | 'MASHBOOH'
          confidence_score?: number | null
          analysis_duration_seconds?: number | null
          cost_savings_euros?: number | null
          ingredients_analyzed?: Json | null
          high_risk_ingredients?: string[] | null
          requires_expert_review?: boolean | null
          ai_reasoning?: string | null
          islamic_references?: string | null
          recommendations?: string | null
          pdf_report_url?: string | null
          email_template?: string | null
          created_at?: string
          updated_at?: string
          search_vector?: unknown | null
          analysis_version?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          analysis_type?: 'single' | 'bulk' | 'image_ocr'
          input_text?: string | null
          input_filename?: string | null
          input_file_url?: string | null
          overall_status?: 'HALAL' | 'HARAM' | 'MASHBOOH'
          confidence_score?: number | null
          analysis_duration_seconds?: number | null
          cost_savings_euros?: number | null
          ingredients_analyzed?: Json | null
          high_risk_ingredients?: string[] | null
          requires_expert_review?: boolean | null
          ai_reasoning?: string | null
          islamic_references?: string | null
          recommendations?: string | null
          pdf_report_url?: string | null
          email_template?: string | null
          created_at?: string
          updated_at?: string
          search_vector?: unknown | null
          analysis_version?: string | null
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          name: string
          key_hash: string
          key_prefix: string
          permissions: string[] | null
          rate_limit_per_hour: number | null
          is_active: boolean | null
          last_used_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          name: string
          key_hash: string
          key_prefix: string
          permissions?: string[] | null
          rate_limit_per_hour?: number | null
          is_active?: boolean | null
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          name?: string
          key_hash?: string
          key_prefix?: string
          permissions?: string[] | null
          rate_limit_per_hour?: number | null
          is_active?: boolean | null
          last_used_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      failed_auth_attempts: {
        Row: {
          id: string
          email: string
          ip_address: string
          user_agent: string | null
          attempt_count: number | null
          last_attempt_at: string
          blocked_until: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          ip_address: string
          user_agent?: string | null
          attempt_count?: number | null
          last_attempt_at?: string
          blocked_until?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          ip_address?: string
          user_agent?: string | null
          attempt_count?: number | null
          last_attempt_at?: string
          blocked_until?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'trial_reminder' | 'trial_expired' | 'payment_failed' | 'analysis_complete' | 'system_update'
          title: string
          message: string
          action_url: string | null
          read_at: string | null
          sent_via_email: boolean | null
          email_sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'trial_reminder' | 'trial_expired' | 'payment_failed' | 'analysis_complete' | 'system_update'
          title: string
          message: string
          action_url?: string | null
          read_at?: string | null
          sent_via_email?: boolean | null
          email_sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'trial_reminder' | 'trial_expired' | 'payment_failed' | 'analysis_complete' | 'system_update'
          title?: string
          message?: string
          action_url?: string | null
          read_at?: string | null
          sent_via_email?: boolean | null
          email_sent_at?: string | null
          created_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'analyst' | 'member' | null
          permissions: string[] | null
          invited_by: string | null
          invited_at: string
          joined_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'analyst' | 'member' | null
          permissions?: string[] | null
          invited_by?: string | null
          invited_at?: string
          joined_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'analyst' | 'member' | null
          permissions?: string[] | null
          invited_by?: string | null
          invited_at?: string
          joined_at?: string | null
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          subscription_plan: 'starter' | 'professional' | 'enterprise' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          monthly_analysis_limit: number | null
          user_limit: number | null
          logo_url: string | null
          brand_color: string | null
          custom_domain: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          subscription_plan?: 'starter' | 'professional' | 'enterprise' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_analysis_limit?: number | null
          user_limit?: number | null
          logo_url?: string | null
          brand_color?: string | null
          custom_domain?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          subscription_plan?: 'starter' | 'professional' | 'enterprise' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          monthly_analysis_limit?: number | null
          user_limit?: number | null
          logo_url?: string | null
          brand_color?: string | null
          custom_domain?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      security_events: {
        Row: {
          id: string
          event_type: 'login_success' | 'login_failed' | 'password_change' | 'email_change' | 'file_upload' | 'analysis_request' | 'rate_limit_hit' | 'suspicious_activity' | 'account_locked' | 'trial_abuse' | 'api_key_used' | 'data_export'
          user_id: string | null
          ip_address: string
          user_agent: string | null
          details: Json | null
          risk_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: 'login_success' | 'login_failed' | 'password_change' | 'email_change' | 'file_upload' | 'analysis_request' | 'rate_limit_hit' | 'suspicious_activity' | 'account_locked' | 'trial_abuse' | 'api_key_used' | 'data_export'
          user_id?: string | null
          ip_address: string
          user_agent?: string | null
          details?: Json | null
          risk_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: 'login_success' | 'login_failed' | 'password_change' | 'email_change' | 'file_upload' | 'analysis_request' | 'rate_limit_hit' | 'suspicious_activity' | 'account_locked' | 'trial_abuse' | 'api_key_used' | 'data_export'
          user_id?: string | null
          ip_address?: string
          user_agent?: string | null
          details?: Json | null
          risk_score?: number | null
          created_at?: string
        }
      }
      suspicious_files: {
        Row: {
          id: string
          user_id: string
          original_filename: string
          file_hash: string
          mime_type: string | null
          file_size_bytes: number | null
          threat_type: string | null
          scan_result: Json | null
          quarantined: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          original_filename: string
          file_hash: string
          mime_type?: string | null
          file_size_bytes?: number | null
          threat_type?: string | null
          scan_result?: Json | null
          quarantined?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          original_filename?: string
          file_hash?: string
          mime_type?: string | null
          file_size_bytes?: number | null
          threat_type?: string | null
          scan_result?: Json | null
          quarantined?: boolean | null
          created_at?: string
        }
      }
      uploaded_files: {
        Row: {
          id: string
          user_id: string
          analysis_id: string | null
          filename: string
          original_filename: string
          file_size_bytes: number | null
          mime_type: string | null
          file_extension: string | null
          supabase_storage_path: string
          public_url: string | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed' | null
          processing_error: string | null
          ocr_text: string | null
          ocr_confidence: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          analysis_id?: string | null
          filename: string
          original_filename: string
          file_size_bytes?: number | null
          mime_type?: string | null
          file_extension?: string | null
          supabase_storage_path: string
          public_url?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
          processing_error?: string | null
          ocr_text?: string | null
          ocr_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          analysis_id?: string | null
          filename?: string
          original_filename?: string
          file_size_bytes?: number | null
          mime_type?: string | null
          file_extension?: string | null
          supabase_storage_path?: string
          public_url?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed' | null
          processing_error?: string | null
          ocr_text?: string | null
          ocr_confidence?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          action_type: 'analysis' | 'pdf_download' | 'api_call' | 'login' | 'file_upload'
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          request_path: string | null
          billable: boolean | null
          credits_used: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id?: string | null
          action_type: 'analysis' | 'pdf_download' | 'api_call' | 'login' | 'file_upload'
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          request_path?: string | null
          billable?: boolean | null
          credits_used?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string | null
          action_type?: 'analysis' | 'pdf_download' | 'api_call' | 'login' | 'file_upload'
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          request_path?: string | null
          billable?: boolean | null
          credits_used?: number | null
          created_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          company_type: 'certification_body' | 'food_manufacturer' | 'restaurant' | 'importer' | 'consultant' | 'other' | null
          country: string | null
          phone: string | null
          trial_started_at: string
          trial_ends_at: string
          trial_analyses_used: number | null
          trial_analyses_limit: number | null
          subscription_status: 'trial' | 'active' | 'cancelled' | 'expired' | null
          subscription_plan: 'starter' | 'professional' | 'enterprise' | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
          last_login_at: string | null
          notification_email: boolean | null
          notification_trial_reminders: boolean | null
          preferred_language: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          company_type?: 'certification_body' | 'food_manufacturer' | 'restaurant' | 'importer' | 'consultant' | 'other' | null
          country?: string | null
          phone?: string | null
          trial_started_at?: string
          trial_ends_at?: string
          trial_analyses_used?: number | null
          trial_analyses_limit?: number | null
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired' | null
          subscription_plan?: 'starter' | 'professional' | 'enterprise' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          notification_email?: boolean | null
          notification_trial_reminders?: boolean | null
          preferred_language?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          company_type?: 'certification_body' | 'food_manufacturer' | 'restaurant' | 'importer' | 'consultant' | 'other' | null
          country?: string | null
          phone?: string | null
          trial_started_at?: string
          trial_ends_at?: string
          trial_analyses_used?: number | null
          trial_analyses_limit?: number | null
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'expired' | null
          subscription_plan?: 'starter' | 'professional' | 'enterprise' | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
          notification_email?: boolean | null
          notification_trial_reminders?: boolean | null
          preferred_language?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_security_data: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_analysis_stats: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      get_user_security_summary: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      increment_trial_usage: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_ip_blocked: {
        Args: {
          p_email: string
          p_ip_address: string
        }
        Returns: boolean
      }
      is_trial_active: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      is_user_rate_limited: {
        Args: {
          user_id: string
          action_type: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_user_id?: string
          p_ip_address?: string
          p_user_agent?: string
          p_details?: Json
          p_risk_score?: number
        }
        Returns: string
      }
      quarantine_file: {
        Args: {
          p_user_id: string
          p_filename: string
          p_file_hash: string
          p_threat_type: string
          p_scan_result?: Json
        }
        Returns: string
      }
      record_failed_auth: {
        Args: {
          p_email: string
          p_ip_address: string
          p_user_agent?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}