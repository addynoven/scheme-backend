import type { Metadata } from 'next'
import './globals.css'
import { QueryProvider, ErrorBoundary } from '@/core'

export const metadata: Metadata = {
  title: 'Scheme AI — Government Welfare Navigator',
  description: 'AI-Powered Citizen Welfare Navigator & Sovereign Eligibility Engine',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#09090b] text-zinc-100 antialiased selection:bg-blue-600/30 selection:text-blue-200 min-h-screen">
        <QueryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  )
}
