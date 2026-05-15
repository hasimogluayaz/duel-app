import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CookieBanner } from '@/components/layout/CookieBanner'
import { ToastProvider } from '@/components/ui/Toast'
import { ServiceWorkerRegister } from '@/components/layout/ServiceWorkerRegister'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import { PushSubscriber } from '@/components/push/PushSubscriber'
import { PostHogProvider } from '@/components/analytics/PostHogProvider'
import { PostHogPageView } from '@/components/analytics/PostHogPageView'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { createClient } from '@/lib/supabase/server'
import { Analytics } from '@vercel/analytics/next'
import type { Profile } from '@/types'

export const metadata: Metadata = {
  title: {
    default: 'Kapisio — Günlük Senaryo Kapışmaları',
    template: '%s | Kapisio',
  },
  description: 'Her gün yeni senaryo, arkadaşınla kapış, topluluktan oy topla, AI kazananı ilan etsin! Türkiye\'nin tartışma platformu.',
  keywords: ['kapisio', 'kapışma', 'oyun', 'ai', 'yapay zeka', 'türkçe', 'senaryo', 'tartışma'],
  authors: [{ name: 'Kapisio' }],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    title: 'Kapisio — Günlük Senaryo Kapışmaları',
    description: 'Her gün yeni senaryo, arkadaşınla kapış ve kazan!',
    siteName: 'Kapisio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kapisio — Günlük Senaryo Kapışmaları',
    description: 'Her gün yeni senaryo, arkadaşınla kapış ve kazan!',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let initialProfile: Profile | null = null
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      initialProfile = data
    }
  } catch {
    // session yok veya fetch başarısız
  }

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-fg">
        <PostHogProvider>
        <ThemeProvider>
          <ToastProvider>

            <div className="flex flex-col min-h-screen">
              <Navbar initialProfile={initialProfile} />
              <main className="flex-1">
                {children}
              </main>
              {!initialProfile && <Footer />}
            </div>

            <CookieBanner />
            <ServiceWorkerRegister />
            <InstallPrompt />
            {initialProfile && <PushSubscriber />}
            <Suspense fallback={null}><PostHogPageView /></Suspense>
            <Analytics />
          </ToastProvider>
        </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
