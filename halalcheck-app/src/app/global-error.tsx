'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Filter out wallet-related errors
  const isWalletError = error.message?.includes('MetaMask') || 
                       error.message?.includes('ethereum') || 
                       error.message?.includes('wallet') ||
                       error.stack?.includes('chrome-extension')

  if (isWalletError) {
    console.warn('Wallet extension error filtered in global error:', error.message)
    // Auto-reset for wallet errors
    setTimeout(() => reset(), 100)
    return null
  }

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-lg font-medium text-gray-900">Application Error</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Something went wrong with the application.
                </p>
                <div className="mt-6">
                  <button
                    onClick={reset}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}