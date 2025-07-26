'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useOrganization, useOrganizationText } from '@/contexts/organization-context'
import { trackOnboarding, trackFeatureUsage } from '@/lib/analytics-tracker'

interface OnboardingWelcomeProps {
  isVisible: boolean
  onComplete: () => void
}

export default function OnboardingWelcome({ isVisible, onComplete }: OnboardingWelcomeProps) {
  const { organizationType, config } = useOrganization()
  const orgText = useOrganizationText()
  const [currentStep, setCurrentStep] = useState(0)
  const [showWelcome, setShowWelcome] = useState(isVisible)

  const getWelcomeSteps = () => {
    switch (organizationType) {
      case 'certification-body':
        return [
          {
            title: 'Welcome to Your Certification Hub',
            description: 'Your platform is configured for halal certification management with Islamic jurisprudence integration.',
            icon: '🏛️',
            features: [
              'Application pipeline with certification workflow',
              'Islamic jurisprudence references and Quranic citations',
              'Professional halal certificate generation',
              'Comprehensive audit trail and compliance tracking'
            ],
            nextAction: 'Start by exploring the Analysis Tool',
            actionLink: '/dashboard/analyze'
          },
          {
            title: 'Your Certification Pipeline',
            description: 'Applications flow through: New → Under Review → Approved → Certified',
            icon: '📋',
            features: [
              'Drag-and-drop pipeline management',
              'Automatic certificate generation upon certification',
              'Client communication and status updates',
              'Comprehensive reporting and analytics'
            ],
            nextAction: 'View your Applications Pipeline',
            actionLink: '/dashboard/applications'
          },
          {
            title: 'Professional Certificates',
            description: 'Generate official halal certificates with Islamic compliance context.',
            icon: '📜',
            features: [
              'Arabic text and Islamic terminology',
              'Quranic references and scholarly basis',
              'Professional certificate numbering (HC-2024-XXX)',
              'Print-ready PDF generation'
            ],
            nextAction: 'See Certificate Examples',
            actionLink: '/dashboard/certificates'
          }
        ]

      case 'food-manufacturer':
        return [
          {
            title: 'Welcome to Product Development',
            description: 'Your platform is optimized for halal product development and pre-certification.',
            icon: '🏭',
            features: [
              'Product development pipeline with validation stages',
              'Pre-certification compliance reports',
              'Development recommendations and next steps',
              'Certification readiness evaluation'
            ],
            nextAction: 'Start analyzing your first product',
            actionLink: '/dashboard/analyze'
          },
          {
            title: 'Your Development Pipeline',
            description: 'Products progress through: Recipe → Testing → Documentation → Certification Ready',
            icon: '⚙️',
            features: [
              'Stage-based product development tracking',
              'Compliance validation at each stage',
              'Development milestone management',
              'Ready-to-certify product portfolio'
            ],
            nextAction: 'View your Product Pipeline',
            actionLink: '/dashboard/applications'
          },
          {
            title: 'Pre-Certification Reports',
            description: 'Generate detailed development reports with certification roadmaps.',
            icon: '📊',
            features: [
              'Development recommendations and action items',
              'Ingredient risk assessment and alternatives',
              'Certification preparation guidelines',
              'Professional report numbering (PCR-2024-XXX)'
            ],
            nextAction: 'See Report Examples',
            actionLink: '/dashboard/certificates'
          }
        ]

      case 'import-export':
        return [
          {
            title: 'Welcome to Trade Compliance',
            description: 'Your platform supports international halal trade compliance and documentation.',
            icon: '🚢',
            features: [
              'Trade compliance certificate generation',
              'International standards integration',
              'Multi-country regulatory compliance',
              'Supply chain documentation management'
            ],
            nextAction: 'Analyze your first trade product',
            actionLink: '/dashboard/analyze'
          },
          {
            title: 'Global Trade Support',
            description: 'Compliance management for international halal trade operations.',
            icon: '🌍',
            features: [
              'MS 1500:2019 and OIC standard compliance',
              'Export/import clearance support',
              'Multi-market regulatory alignment',
              'Customs documentation assistance'
            ],
            nextAction: 'View Trade Pipeline',
            actionLink: '/dashboard/applications'
          },
          {
            title: 'Trade Certificates',
            description: 'International trade compliance certificates for halal products.',
            icon: '📋',
            features: [
              'Internationally-recognized certificates',
              'Trade compliance statements',
              'Multi-country acceptance',
              'Certificate numbering (CC-2024-XXX)'
            ],
            nextAction: 'See Trade Certificates',
            actionLink: '/dashboard/certificates'
          }
        ]

      default:
        return []
    }
  }

  const steps = getWelcomeSteps()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Track step completion
      trackOnboarding('step_completed', { 
        step: currentStep + 1,
        stepTitle: steps[currentStep].title,
        organizationType 
      })
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      trackOnboarding('step_back', { 
        fromStep: currentStep + 1,
        toStep: currentStep,
        organizationType 
      })
    }
  }

  const handleComplete = () => {
    setShowWelcome(false)
    onComplete()
    // Mark onboarding as completed
    localStorage.setItem('onboarding-completed', 'true')
    
    // Track onboarding completion
    trackOnboarding('completed', { 
      totalSteps: steps.length,
      completedSteps: currentStep + 1,
      organizationType,
      timeSpent: Date.now() - parseInt(localStorage.getItem('onboarding-start-time') || '0')
    })
  }

  const handleSkip = () => {
    trackOnboarding('skipped', { 
      atStep: currentStep + 1,
      organizationType 
    })
    handleComplete()
  }

  useEffect(() => {
    setShowWelcome(isVisible)
    setCurrentStep(0)
    
    // Track onboarding start
    if (isVisible) {
      localStorage.setItem('onboarding-start-time', Date.now().toString())
      trackOnboarding('started', { 
        organizationType,
        totalSteps: steps.length 
      })
    }
  }, [isVisible, organizationType, steps.length])

  if (!showWelcome || steps.length === 0) return null

  const currentStepData = steps[currentStep]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-3xl">{currentStepData.icon}</div>
              <div>
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                <p className="text-green-100 text-sm">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="text-green-100 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-lg mb-6">
            {currentStepData.description}
          </p>

          <div className="space-y-4 mb-8">
            <h3 className="font-semibold text-gray-900">What you can do:</h3>
            <div className="grid gap-3">
              {currentStepData.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="mb-6">
            <Link
              href={currentStepData.actionLink}
              onClick={() => {
                trackFeatureUsage('onboarding_action_button', { 
                  step: currentStep + 1,
                  actionLink: currentStepData.actionLink,
                  organizationType 
                })
                handleComplete()
              }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              <span>{currentStepData.nextAction}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Progress Indicators */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep
                      ? 'bg-green-600'
                      : index < currentStep
                      ? 'bg-green-300'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            <div className="flex space-x-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>

        {/* Organization-specific tips */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pro Tip</p>
              <p className="text-sm text-gray-600">
                {organizationType === 'certification-body' 
                  ? 'Start with the Analysis Tool to familiarize yourself with the Islamic jurisprudence integration before processing real applications.'
                  : organizationType === 'food-manufacturer'
                  ? 'Begin by analyzing your existing product formulations to identify any compliance issues early in your development process.'
                  : 'Use the analysis tool to verify your products meet international halal trade requirements before shipment.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}