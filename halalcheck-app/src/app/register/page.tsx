'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { OrganizationType, getOrganizationConfig, mapRegistrationTypeToOrganization } from '@/lib/organization-context'
// Removed Supabase imports for mock implementation

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    companyType: 'certification_body' as const,
    industry: '',
    teamSize: '',
    mainGoals: [] as string[],
    country: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [showOnboardingGuide, setShowOnboardingGuide] = useState(false)
  
  const router = useRouter()
  // Removed Supabase client for mock implementation

  // Get organization-specific guidance
  const getOrganizationGuidance = (companyType: string) => {
    const orgType = mapRegistrationTypeToOrganization(companyType)
    const config = getOrganizationConfig(orgType)
    
    const guidanceMap: Record<OrganizationType, {
      title: string
      description: string
      features: string[]
      setupSteps: string[]
      expectedOutcomes: string[]
      pricing: string
    }> = {
      'certification-body': {
        title: 'Halal Certification Body Platform',
        description: 'Professional halal certification management with Islamic jurisprudence integration',
        features: [
          'Islamic jurisprudence references with Quranic citations',
          'Professional halal certificate generation',
          'Application pipeline: New → Review → Approved → Certified',
          'Multi-client certification management',
          'Audit trail and compliance tracking'
        ],
        setupSteps: [
          'Set up your certification authority profile',
          'Configure your certification pipeline stages',
          'Import existing client database',
          'Customize certificate templates',
          'Train your team on the platform'
        ],
        expectedOutcomes: [
          'Streamline certification processing workflow',
          'Automate repetitive analysis tasks',
          'Generate professional Islamic-compliant certificates',
          'Maintain comprehensive audit trails',
          'Scale your certification operations'
        ],
        pricing: 'Starting at €299/month for 200 analyses'
      },
      'food-manufacturer': {
        title: 'Product Development Platform',
        description: 'Halal compliance validation for product development and pre-certification',
        features: [
          'Product development pipeline with validation stages',
          'Pre-certification compliance reports',
          'Development recommendations and next steps',
          'Ingredient risk assessment and alternatives',
          'Certification readiness evaluation'
        ],
        setupSteps: [
          'Set up your product development workflow',
          'Configure product categories and goals',
          'Import your current product formulations',
          'Set up development milestones',
          'Connect with certification partners'
        ],
        expectedOutcomes: [
          'Accelerate product development validation',
          'Identify compliance issues early in development',
          'Generate professional pre-certification reports',
          'Build certification-ready product portfolio',
          'Streamline regulatory approval process'
        ],
        pricing: 'Starting at €299/month for 200 product analyses'
      },
      'import-export': {
        title: 'Trade Compliance Platform',
        description: 'International halal trade compliance and documentation management',
        features: [
          'Trade compliance certificate generation',
          'International standards integration (MS 1500, OIC)',
          'Multi-country regulatory compliance',
          'Supply chain documentation management',
          'Export/import clearance support'
        ],
        setupSteps: [
          'Configure your trade routes and markets',
          'Set up supplier and client databases',
          'Configure compliance requirements by country',
          'Set up documentation templates',
          'Integrate with customs and regulatory systems'
        ],
        expectedOutcomes: [
          'Streamline trade documentation workflow',
          'Ensure compliance across multiple markets',
          'Generate internationally-recognized certificates',
          'Streamline customs clearance processes',
          'Expand into new halal markets confidently'
        ],
        pricing: 'Starting at €799/month for trade operations'
      }
    }
    
    return guidanceMap[orgType] || guidanceMap['certification-body']
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      setError('Please fill in all required fields')
      return false
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions')
      return false
    }

    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      // Register with the backend API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.fullName.split(' ')[0] || formData.fullName,
          lastName: formData.fullName.split(' ').slice(1).join(' ') || '',
          organizationName: formData.companyName || 'Personal',
          organizationType: formData.companyType.toUpperCase(),
          country: formData.country || 'Unknown',
          phone: formData.phone || '',
          acceptTerms: acceptedTerms
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store authentication token if provided
        if (data.accessToken) {
          localStorage.setItem('auth-token', data.accessToken)
          localStorage.setItem('user-email', formData.email)
          
          // Store organization type for immediate dashboard configuration
          const orgType = mapRegistrationTypeToOrganization(formData.companyType)
          localStorage.setItem('user-organization-type', orgType)
          
          // Also set as cookie for middleware
          document.cookie = `auth-token=${data.accessToken}; path=/; max-age=86400` // 24 hours
        }
        
        // Success - redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        setError(data.message || 'Registration failed. Please try again.')
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError('Unable to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError(null)

    try {
      // Mock Google registration
      console.log('Mock Google registration')
      
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🕌</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
              HalalCheck AI
            </div>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Get Started Today
          </h2>
          <p className="text-gray-600">
            Start your 14-day free trial with 50 analyses included
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full name *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company name
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your company name"
              />
            </div>

            {/* Company Type */}
            <div>
              <label htmlFor="companyType" className="block text-sm font-medium text-gray-700 mb-2">
                Company type
              </label>
              <div className="relative">
                <select
                  id="companyType"
                  name="companyType"
                  value={formData.companyType}
                  onChange={(e) => {
                    handleChange(e)
                    setShowOnboardingGuide(true)
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="certification_body">🏛️ Halal Certification Body</option>
                  <option value="food_manufacturer">🏭 Food Manufacturer</option>
                  <option value="import_export">🚢 Import/Export Company</option>
                  <option value="restaurant">🍽️ Restaurant/Food Service</option>
                  <option value="consultant">👨‍💼 Halal Consultant</option>
                  <option value="other">📋 Other</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowOnboardingGuide(!showOnboardingGuide)}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-700"
                  title="View platform guidance for your organization type"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Organization-specific onboarding guide */}
            {showOnboardingGuide && (
              <div className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 border border-green-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getOrganizationGuidance(formData.companyType).title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowOnboardingGuide(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-700">
                  {getOrganizationGuidance(formData.companyType).description}
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">✨ Key Features</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {getOrganizationGuidance(formData.companyType).features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-green-600 mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">🎯 Expected Outcomes</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {getOrganizationGuidance(formData.companyType).expectedOutcomes.map((outcome, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-gray-900 mb-2">🚀 Getting Started</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    {getOrganizationGuidance(formData.companyType).setupSteps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="text-sm font-medium text-gray-900">Pricing: </span>
                    <span className="text-sm text-gray-700">{getOrganizationGuidance(formData.companyType).pricing}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    14-day free trial included
                  </div>
                </div>
              </div>
            )}

            {/* Country */}
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Enter your country"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Create a password (min 8 characters)"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center">
              <input
                id="acceptedTerms"
                name="acceptedTerms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptedTerms" className="ml-2 block text-sm text-gray-700">
                I agree to the{' '}
                <Link href="/terms" className="text-green-600 hover:text-green-700 font-medium">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating account...</span>
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          {/* Google Register */}
          <button
            onClick={handleGoogleRegister}
            disabled={loading}
            className="mt-4 w-full bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}