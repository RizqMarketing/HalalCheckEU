import Link from 'next/link'
import { CheckIcon } from '@heroicons/react/24/outline'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-xl">🕌</span>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-800 to-green-600 bg-clip-text text-transparent">
                HalalCheck AI
              </div>
            </Link>
            <div className="flex items-center space-x-4">
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
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your certification needs. All plans include our AI-powered analysis and professional reports.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Starter Plan */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">Perfect for small certification bodies</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">€99</span>
                <span className="text-lg text-gray-600 ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">100 analyses per month</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Professional PDF reports</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Email support</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Basic dashboard</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Up to 3 team members</span>
              </li>
            </ul>

            <Link
              href="/register"
              className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Professional Plan - Featured */}
          <div className="bg-white rounded-2xl shadow-xl border-2 border-green-500 p-8 relative transform scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-500 text-white px-6 py-2 text-sm font-semibold rounded-full">
                Most Popular
              </span>
            </div>
            
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
              <p className="text-gray-600 mb-6">For growing certification businesses</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">€299</span>
                <span className="text-lg text-gray-600 ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">500 analyses per month</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Professional PDF reports</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Priority email support</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Advanced dashboard & analytics</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Up to 10 team members</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">API access</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Bulk upload & processing</span>
              </li>
            </ul>

            <Link
              href="/register"
              className="block w-full text-center bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
              <p className="text-gray-600 mb-6">For large certification organizations</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">€899</span>
                <span className="text-lg text-gray-600 ml-2">/month</span>
              </div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Unlimited analyses</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Custom branded reports</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">24/7 phone & email support</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">White-label dashboard</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Unlimited team members</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Full API access & webhooks</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Custom integrations</span>
              </li>
              <li className="flex items-center">
                <CheckIcon className="flex-shrink-0 w-5 h-5 text-green-500 mr-3" />
                <span className="text-gray-700">Dedicated account manager</span>
              </li>
            </ul>

            <Link
              href="/register"
              className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What's included in the free trial?</h4>
              <p className="text-gray-600 text-sm">14 days of full access to your chosen plan, including 50 free analyses.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change plans anytime?</h4>
              <p className="text-gray-600 text-sm">Yes, you can upgrade or downgrade your plan at any time with prorated billing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What file formats do you support?</h4>
              <p className="text-gray-600 text-sm">We support 25+ formats including PDFs, images, Excel files, and plain text.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is my data secure?</h4>
              <p className="text-gray-600 text-sm">Yes, we use bank-grade encryption and are SOC 2 compliant with full audit trails.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Certification Process?
          </h3>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of certification professionals who trust HalalCheck AI to streamline their workflows and improve accuracy.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
          >
            Start Your Free Trial Today
          </Link>
        </div>
      </div>
    </div>
  )
}