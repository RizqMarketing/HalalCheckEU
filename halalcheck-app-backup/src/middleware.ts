// HalalCheck AI - Security Middleware
// Enterprise-grade security for all requests

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Security headers for all responses
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`)
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://unpkg.com https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.supabase.co https://pllewdnptglldpkuexxt.supabase.co",
    "connect-src 'self' https://pllewdnptglldpkuexxt.supabase.co https://api.openai.com https://api.stripe.com",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Supabase client for session management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: any) {
          response.cookies.delete(name)
        }
      }
    }
  )

  // Get user session
  const { data: { user }, error } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/privacy',
    '/terms',
    '/about',
    '/pricing',
    '/_next',
    '/favicon.ico',
    '/api/health'
  ]

  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // API routes security
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Rate limiting headers
    const clientIp = request.ip || request.headers.get('X-Forwarded-For') || 'unknown'
    response.headers.set('X-Client-IP', clientIp)
    
    // API authentication check (except public endpoints)
    const publicApiRoutes = ['/api/health', '/api/auth']
    const isPublicApiRoute = publicApiRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )
    
    if (!isPublicApiRoute && !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Protected routes redirect
  if (!isPublicRoute && !user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Dashboard access control
  if (request.nextUrl.pathname.startsWith('/dashboard') && user) {
    // Check if user profile exists and is complete
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Redirect to profile completion
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Check trial status for trial users
      if (profile.subscription_status === 'trial') {
        const trialExpired = new Date(profile.trial_ends_at) < new Date()
        const trialUsageExceeded = (profile.trial_analyses_used || 0) >= (profile.trial_analyses_limit || 50)

        if (trialExpired || trialUsageExceeded) {
          // Allow access to billing page but redirect from other dashboard pages
          if (!request.nextUrl.pathname.startsWith('/dashboard/billing')) {
            return NextResponse.redirect(new URL('/dashboard/billing', request.url))
          }
        }
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
    }
  }

  // Admin routes protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Add admin role check here when implemented
    // For now, block all admin routes
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}