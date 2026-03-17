import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Safety AI Dashboard | HSE Analytics',
  description: 'AI-powered Health, Safety, and Environment dashboard for oil and gas operations. Real-time incident analytics, predictive insights, and safety recommendations.',
  keywords: ['HSE', 'safety', 'oil and gas', 'incident management', 'AI analytics', 'Kazakhstan'],
}

export const viewport: Viewport = {
  themeColor: '#f8f9fa',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
