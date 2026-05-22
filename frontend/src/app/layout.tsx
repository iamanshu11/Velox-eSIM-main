import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Providers } from './providers'
import ChatWidget from '@/components/ChatWidget'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
}

export const metadata: Metadata = {
  title: 'Velox eSIM - Global eSIM Solutions',
  description: 'Buy affordable eSIM plans with instant activation. Global coverage, local prices.',
  keywords: ['eSIM', 'mobile', 'data', 'topup', 'telecom'],
  authors: [{ name: 'Velox eSIM Team' }],
  icons: {
    icon: [
      { url: '/images/logo-avatar.svg', media: '(prefers-color-scheme: light)' },
      { url: '/images/logo-light-avatar.svg', media: '(prefers-color-scheme: dark)' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://veloxesim.com',
    siteName: 'Velox eSIM',
    title: 'Velox eSIM - Global eSIM Solutions',
    description: 'Buy affordable eSIM plans with instant activation',
    images: [
      {
        url: 'https://veloxesim.com/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Velox eSIM',
    description: 'Buy affordable eSIM plans with instant activation',
  },
}

function RootLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Providers>
        {children}
        <ChatWidget />
      </Providers>
    </>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#43A1F0" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased text-gray-900 overflow-x-hidden bg-primary-50`}
        suppressHydrationWarning
      >
        <div className="relative isolate min-h-screen overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -left-40 -top-32 h-112 w-mdded-full bg-primary-100/35 blur-3xl" />
            <div className="absolute -right-32 top-40 h-96 w-[24rem] rounded-full bg-primary-200/20 blur-3xl" />
            <div className="absolute -bottom-40 left-1/2 h-120 w-120 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
          </div>
          <RootLayoutContent>{children}</RootLayoutContent>
        </div>
      </body>
    </html>
  )
}




