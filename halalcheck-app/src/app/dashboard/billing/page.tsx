'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
// Removed Supabase imports for mock implementation

type UserProfile = any // Mock type for demonstration

export default function BillingPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Removed Supabase client for mock implementation

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      // Use mock data for demonstration
      const mockProfile = {
        id: 'demo-user-id',
        email: 'demo@halalcheck.ai',
        full_name: 'Demo User',
        company_name: 'Demo Certification Body',
        trial_started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        trial_analyses_used: 23,
        trial_analyses_limit: 50,
        subscription_status: 'trial' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setProfile(mockProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrialStatus = () => {
    if (!profile) return { status: 'unknown', message: '' }
    
    const trialEnd = new Date(profile.trial_ends_at)
    const now = new Date()
    const trialExpired = trialEnd < now
    const usageExceeded = (profile.trial_analyses_used || 0) >= (profile.trial_analyses_limit || 50)
    
    if (trialExpired) {
      return { 
        status: 'expired', 
        message: `Your trial expired on ${trialEnd.toLocaleDateString()}`
      }
    } else if (usageExceeded) {
      return { 
        status: 'usage_exceeded', 
        message: `You've used all ${profile.trial_analyses_limit} trial analyses`
      }
    } else {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { 
        status: 'active', 
        message: `${daysLeft} days remaining in your trial`
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const trialStatus = getTrialStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial Status */}
        <div className={`rounded-xl border p-6 mb-8 ${
          trialStatus.status === 'active' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-xl font-bold ${
                trialStatus.status === 'active' ? 'text-green-900' : 'text-red-900'
              }`}>
                {trialStatus.status === 'active' ? 'Trial Active' : 'Trial Ended'}
              </h2>
              <p className={`mt-1 ${
                trialStatus.status === 'active' ? 'text-green-700' : 'text-red-700'
              }`}>
                {trialStatus.message}
              </p>
              {profile && (
                <div className="mt-4 text-sm">
                  <p>Analyses used: {profile.trial_analyses_used || 0} / {profile.trial_analyses_limit || 50}</p>
                </div>
              )}
            </div>
            {trialStatus.status !== 'active' && (
              <div className="text-right">
                <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Starter Plan */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">€99</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                100 analyses per month
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Professional PDF reports
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Email support
              </li>
            </ul>
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
              Choose Starter
            </button>
          </div>

          {/* Professional Plan */}
          <div className="bg-green-50 rounded-xl shadow-lg border-2 border-green-500 p-6 relative transform scale-105">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Professional</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">€299</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                500 analyses per month
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                API access
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Priority support
              </li>
            </ul>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Choose Professional
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h3>
            <div className="mb-4">
              <span className="text-3xl font-bold text-gray-900">€899</span>
              <span className="text-gray-600 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-6 text-sm text-gray-600">
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Unlimited analyses
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Custom features
              </li>
              <li className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Phone support
              </li>
            </ul>
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">
              Contact Sales
            </button>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help Choosing?</h3>
          <p className="text-gray-600 mb-4">
            Our team can help you select the right plan for your certification needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              Contact Sales
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}