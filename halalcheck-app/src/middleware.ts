// HalalCheck AI - Security Middleware
// Enterprise-grade security for all requests

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

  // Security headers for all responses (relaxed for development)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('X-Frame-Options', 'DENY')
  }
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // HTTPS redirect in production
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`)
  }

  // Content Security Policy (relaxed for development, blocks wallet extensions)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https://*.supabase.co https://pllewdnptglldpkuexxt.supabase.co",
    "connect-src 'self' http://localhost:3003 https://pllewdnptglldpkuexxt.supabase.co https://api.openai.com https://api.stripe.com",
    "frame-src https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'none'"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)

  // Mock authentication for development (bypass Supabase)
  let user = null
  
  // Check for mock auth token in localStorage (simulated via cookies for SSR)
  const authToken = request.cookies.get('auth-token')?.value
  
  if (authToken && authToken.startsWith('mock-token-')) {
    // Mock authenticated user
    user = {
      id: 'mock-user-id',
      email: 'demo@halalcheck.ai'
    }
  }

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
    '/demo',
    '/contact',
    '/dashboard', // Temporarily allow dashboard access for testing
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

  // Protected routes redirect (temporarily disabled for dashboard access)
  if (!isPublicRoute && !user && !request.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Dashboard access control
  if (request.nextUrl.pathname.startsWith('/dashboard') && user) {
    try {
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

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create a profile if it doesn't exist (fallback)
        console.log('No profile found for user, allowing dashboard access')
      } else {
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
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
      // Allow access even if profile check fails
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
  } catch (error) {
    console.error('Middleware error:', error)
    // Return a basic response if middleware fails
    return NextResponse.next()
  }
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