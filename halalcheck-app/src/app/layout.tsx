import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HalalCheck AI - Professional Halal Ingredient Analysis',
  description: 'Enterprise-grade AI-powered halal ingredient analysis for certification bodies, food manufacturers, and restaurants. Instant analysis, professional reports, and Islamic jurisprudence references.',
  keywords: 'halal, ingredient analysis, food certification, Islamic, AI, professional',
  authors: [{ name: 'HalalCheck AI' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'HalalCheck AI - Professional Halal Ingredient Analysis',
    description: 'Enterprise-grade AI-powered halal ingredient analysis for certification bodies and food manufacturers.',
    type: 'website',
    url: 'https://halalcheck.eu',
    siteName: 'HalalCheck AI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HalalCheck AI - Professional Halal Ingredient Analysis',
    description: 'Enterprise-grade AI-powered halal ingredient analysis for certification bodies and food manufacturers.',
  },
  other: {
    'referrer': 'strict-origin-when-cross-origin',
    'format-detection': 'telephone=no',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://pllewdnptglldpkuexxt.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <ErrorBoundary>
          <div className="min-h-full">
            {children}
          </div>
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent wallet connection errors
              window.addEventListener('error', function(e) {
                if (e.error && (
                  e.error.message?.includes('MetaMask') ||
                  e.error.message?.includes('ethereum') ||
                  e.error.message?.includes('wallet') ||
                  e.error.stack?.includes('chrome-extension')
                )) {
                  console.warn('Wallet extension error filtered:', e.error.message);
                  e.preventDefault();
                  e.stopPropagation();
                  return false;
                }
              });
              
              // Prevent unhandled promise rejections from wallet extensions
              window.addEventListener('unhandledrejection', function(e) {
                if (e.reason && (
                  e.reason.message?.includes('MetaMask') ||
                  e.reason.message?.includes('ethereum') ||
                  e.reason.message?.includes('wallet') ||
                  e.reason.stack?.includes('chrome-extension')
                )) {
                  console.warn('Wallet extension promise rejection filtered:', e.reason.message);
                  e.preventDefault();
                  return false;
                }
              });
            `,
          }}
        />
      </body>
    </html>
  )
}
