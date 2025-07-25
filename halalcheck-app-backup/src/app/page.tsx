import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-xl">🕌</span>
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
                  HalalCheck AI
                </div>
                <div className="hidden sm:block">
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Early Access
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/pricing"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Join Early Access
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2316a34a' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-green-800 bg-green-100 border border-green-200 text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Built by certification industry experts
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
              Save 90% of Your
              <span className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 bg-clip-text text-transparent block mt-2">
                Certification Time
              </span>
              <span className="text-4xl md:text-5xl lg:text-6xl block mt-4 text-gray-700">
                With AI Pre-Screening
              </span>
            </h1>
            
            <p className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-gray-600 leading-relaxed">
              Reduce 3-hour manual ingredient reviews to <span className="font-semibold text-green-700">30 seconds</span>. 
              Pre-screen thousands of products instantly, organize all documents in one dashboard, 
              and focus only on complex cases that need your expert attention.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="group relative inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Join Early Access Program
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-400 to-green-500 opacity-0 group-hover:opacity-20 transition-opacity" />
              </Link>
              
              <Link
                href="/demo"
                className="group inline-flex items-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white/80 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:border-green-300 hover:bg-green-50/50"
              >
                <svg className="w-5 h-5 mr-2 group-hover:text-green-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                See Working Demo
              </Link>
            </div>
            
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Full platform access during development
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Help shape the features
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="relative py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Stop Wasting Time on Routine Reviews
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Let AI Handle 90% of Your Work</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Certification bodies spend 80% of their time on routine ingredient checks. Our AI pre-screens everything instantly, 
                organizes your documents in one place, and flags only the cases that need your expert review.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Save 18 Hours Per Week</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Instead of spending <span className="font-semibold text-green-700">3 hours per product</span> on routine checks, 
                    get instant pre-screening results. Handle 100+ products in the time it previously took to review 5.
                  </p>
                  <div className="flex items-center text-sm text-green-600 font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    €50/hour expert time saved
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">All Documents in One Dashboard</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    No more scattered files and email chains. <span className="font-semibold text-green-700">Centralize everything</span> - 
                    upload history, analysis reports, certificates, and client communications all organized in searchable folders.
                  </p>
                  <div className="flex items-center text-sm text-emerald-600 font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Never lose another document
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="group relative md:col-span-2 lg:col-span-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 via-emerald-500 to-green-700 rounded-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise Security</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    <span className="font-semibold text-green-700">Bank-grade security</span> with encrypted data storage, 
                    comprehensive audit trails, and full GDPR compliance for professional use.
                  </p>
                  <div className="flex items-center text-sm text-green-600 font-semibold">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    SOC 2 compliance ready
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Features Row */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">AI-Powered Intelligence</h4>
                </div>
                <p className="text-gray-700">
                  Our AI understands complex ingredient interactions, E-number classifications, and regional halal standards 
                  to provide the most accurate analysis possible.
                </p>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-8 rounded-2xl border border-emerald-200">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">Built for Teams</h4>
                </div>
                <p className="text-gray-700">
                  Collaborative features for certification teams, with role-based access, shared analysis history, 
                  and streamlined workflows for maximum efficiency.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Honest Social Proof */}
        <div className="relative py-20 bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-white rounded-full shadow-md border border-gray-200 mb-6">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Built for the professionals who matter most
                </span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                The Market Opportunity is 
                <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> Massive</span>
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We've done the research. The halal certification industry needs this solution, and the numbers prove it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {/* Stat 1 */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">245+</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Halal Certification Bodies</div>
                  <div className="text-sm text-gray-600">across Europe (our target market)</div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-green-600 font-semibold uppercase tracking-wide">Market Size</div>
                  </div>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl shadow-lg mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-3">2,000+</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Food Manufacturers</div>
                  <div className="text-sm text-gray-600">requiring halal compliance</div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wide">Customer Base</div>
                  </div>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-400 to-orange-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl shadow-lg mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-5xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">€50K+</div>
                  <div className="text-lg font-semibold text-gray-900 mb-2">Average Recall Cost</div>
                  <div className="text-sm text-gray-600">from wrong certification</div>
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="text-xs text-red-600 font-semibold uppercase tracking-wide">Risk Mitigation</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Honest Messaging */}
            <div className="text-center">
              <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Full Transparency</h3>
                </div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  We're building the platform this industry desperately needs. Currently in development with early access available for forward-thinking certification professionals.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-8 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    No fake testimonials
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Real market research
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Built with industry input
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="mt-20">
          <div className="bg-gray-50 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Planned pricing for launch
              </h2>
              <p className="mt-4 text-lg text-gray-600">
                Early access members get special launch pricing. Final pricing subject to customer feedback.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
              {/* Starter Plan */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900">Starter</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">€99</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">200 analyses per month</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">PDF reports</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Email support</span>
                  </li>
                </ul>
              </div>

              {/* Professional Plan */}
              <div className="bg-green-50 rounded-lg shadow-sm border-2 border-green-200 p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                    Early Access Special
                  </span>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Professional</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">€299</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">1,000 analyses per month</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">API access</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Priority support</span>
                  </li>
                </ul>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900">Enterprise</h3>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-gray-900">€899</span>
                  <span className="text-base font-medium text-gray-500">/month</span>
                </p>
                <ul className="mt-6 space-y-4">
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Unlimited analyses</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Custom features</span>
                  </li>
                  <li className="flex">
                    <CheckIcon className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Phone support</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Be among the first to revolutionize halal certification
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Join our early access program and help shape the future of AI-powered halal analysis. Your feedback will directly influence the platform development.
          </p>
          <div className="mt-8 space-y-4">
            <div className="flex justify-center space-x-4">
              <Link
                href="/register"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Join Early Access Program
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                See Working Demo
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              Early access includes 14-day free trial • Priority feature requests • Direct founder contact
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/pricing" className="text-base text-gray-500 hover:text-gray-900">Pricing</Link></li>
                <li><Link href="/demo" className="text-base text-gray-500 hover:text-gray-900">Demo</Link></li>
                <li><Link href="/features" className="text-base text-gray-500 hover:text-gray-900">Features</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/help" className="text-base text-gray-500 hover:text-gray-900">Help Center</Link></li>
                <li><Link href="/contact" className="text-base text-gray-500 hover:text-gray-900">Contact</Link></li>
                <li><Link href="/api-docs" className="text-base text-gray-500 hover:text-gray-900">API Docs</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/about" className="text-base text-gray-500 hover:text-gray-900">About</Link></li>
                <li><Link href="/blog" className="text-base text-gray-500 hover:text-gray-900">Blog</Link></li>
                <li><Link href="/careers" className="text-base text-gray-500 hover:text-gray-900">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
              <ul className="mt-4 space-y-4">
                <li><Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">Privacy</Link></li>
                <li><Link href="/terms" className="text-base text-gray-500 hover:text-gray-900">Terms</Link></li>
                <li><Link href="/security" className="text-base text-gray-500 hover:text-gray-900">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-base text-gray-400 text-center">
              © 2024 HalalCheck AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}