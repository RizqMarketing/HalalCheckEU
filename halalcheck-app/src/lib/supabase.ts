// HalalCheck AI - Supabase Client Configuration
// Secure client setup with enterprise security features

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Browser client for client-side operations
export const createBrowserSupabaseClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return document.cookie
          .split('; ')
          .find(row => row.startsWith(`${name}=`))
          ?.split('=')[1]
      },
      set(name: string, value: string, options: any) {
        document.cookie = `${name}=${value}; ${Object.entries(options)
          .map(([key, val]) => `${key}=${val}`)
          .join('; ')}`
      },
      remove(name: string, options: any) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; ${Object.entries(options)
          .map(([key, val]) => `${key}=${val}`)
          .join('; ')}`
      }
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'halalcheck-auth-token',
      flowType: 'pkce'
    }
  })
}

// Server client for server-side operations
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: any) {
        cookieStore.delete(name)
      }
    },
    auth: {
      persistSession: false, // Server-side should not persist sessions
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// Admin client for server-side admin operations
export const createAdminSupabaseClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Missing Supabase service role key')
  }

  return createServerClient<Database>(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get() { return undefined },
      set() {},
      remove() {}
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// Utility functions for common operations
export const supabaseUtils = {
  // Get current user from server
  async getCurrentUser() {
    const supabase = createServerSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      console.error('Error getting current user:', error)
      return null
    }
    
    return user
  },

  // Get user profile with trial info
  async getUserProfile(userId: string) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.error('Error getting user profile:', error)
      return null
    }
    
    return data
  },

  // Check if user's trial is active
  async isTrialActive(userId: string) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('is_trial_active', { user_id: userId })
    
    if (error) {
      console.error('Error checking trial status:', error)
      return false
    }
    
    return data
  },

  // Log security event
  async logSecurityEvent(
    eventType: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any,
    riskScore: number = 0
  ) {
    const supabase = createAdminSupabaseClient()
    
    const { error } = await supabase
      .rpc('log_security_event', {
        p_event_type: eventType,
        p_user_id: userId || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null,
        p_details: details ? JSON.stringify(details) : null,
        p_risk_score: riskScore
      })
    
    if (error) {
      console.error('Error logging security event:', error)
    }
  },

  // Check if user is rate limited
  async isUserRateLimited(userId: string, actionType: string) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('is_user_rate_limited', { 
        user_id: userId, 
        action_type: actionType 
      })
    
    if (error) {
      console.error('Error checking rate limit:', error)
      return false
    }
    
    return data
  },

  // Record failed authentication attempt
  async recordFailedAuth(email: string, ipAddress: string, userAgent?: string) {
    const supabase = createAdminSupabaseClient()
    const { data, error } = await supabase
      .rpc('record_failed_auth', {
        p_email: email,
        p_ip_address: ipAddress,
        p_user_agent: userAgent || null
      })
    
    if (error) {
      console.error('Error recording failed auth:', error)
      return false
    }
    
    return data // Returns true if IP should be blocked
  },

  // Check if IP is blocked
  async isIpBlocked(email: string, ipAddress: string) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc('is_ip_blocked', {
        p_email: email,
        p_ip_address: ipAddress
      })
    
    if (error) {
      console.error('Error checking IP block status:', error)
      return false
    }
    
    return data
  }
}

// Export types for convenience
export type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>
export type SupabaseServerClient = ReturnType<typeof createServerSupabaseClient>
export type SupabaseAdminClient = ReturnType<typeof createAdminSupabaseClient>