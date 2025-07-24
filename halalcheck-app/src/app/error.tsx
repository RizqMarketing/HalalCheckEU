'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Filter out wallet-related errors
    const isWalletError = error.message?.includes('MetaMask') || 
                         error.message?.includes('ethereum') || 
                         error.message?.includes('wallet') ||
                         error.stack?.includes('chrome-extension')

    if (isWalletError) {
      console.warn('Wallet extension error filtered in error page:', error.message)
      // Auto-reset for wallet errors
      setTimeout(() => reset(), 100)
      return
    }

    console.error('Application error:', error)
  }, [error, reset])

  // Don't show error page for wallet-related errors
  const isWalletError = error.message?.includes('MetaMask') || 
                       error.message?.includes('ethereum') || 
                       error.message?.includes('wallet') ||
                       error.stack?.includes('chrome-extension')

  if (isWalletError) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="mt-4 text-lg font-medium text-gray-900">Something went wrong</h2>
            <p className="mt-2 text-sm text-gray-600">
              An unexpected error occurred in the application.
            </p>
            <div className="mt-6 space-y-4">
              <button
                onClick={reset}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}