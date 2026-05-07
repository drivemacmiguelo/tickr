import type { Metadata, Viewport } from 'next'
import './globals.css'
import TitleBar from '@/components/TitleBar'
import ThemeProvider from '@/components/ThemeProvider'
import SwRegister from '@/components/SwRegister'

export const metadata: Metadata = {
  title: 'Tickr — Trading Game',
  description: 'Trade stocks, build your empire, and climb the global ranking.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tickr',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#08090f',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased h-screen flex flex-col overflow-hidden">
        <ThemeProvider>
          <TitleBar />
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            {children}
          </div>
        </ThemeProvider>
        <SwRegister />
      </body>
    </html>
  )
}
