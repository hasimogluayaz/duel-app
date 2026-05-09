import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import OnboardingModal from '@/components/onboarding/OnboardingModal'
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
    default: 'Kapisio — AI Destekli Günlük Kapışma',
    template: '%s | Kapisio',
  },
  description: 'Her gün yeni senaryo, arkadaşınla kapış, topluluktan oy topla, AI kazananı ilan etsin! Türkiye\'nin eğlenceli kapışma platformu.',
  keywords: ['kapisio', 'kapışma', 'oyun', 'ai', 'yapay zeka', 'türkçe', 'senaryo', 'eğlence'],
  authors: [{ name: 'Kapisio' }],
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    title: 'Kapisio — AI Destekli Günlük Kapışma',
    description: 'Her gün yeni senaryo, arkadaşınla kapış ve kazan!',
    siteName: 'Kapisio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kapisio — AI Destekli Günlük Kapışma',
    description: 'Her gün yeni senaryo, arkadaşınla kapış ve kazan!',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0c0a18',
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
    // session yok veya fetch başarısız — client-side fallback devreye girer
  }

  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-bg text-fg">
        <PostHogProvider>
        <ThemeProvider>
          <ToastProvider>
            <Navbar initialProfile={initialProfile} />
            <main className="flex-1 pb-16 md:pb-0">
              {children}
            </main>
            <Footer />
            <BottomNav userId={initialProfile?.id ?? null} username={initialProfile?.username ?? null} />
            <CookieBanner />
            <ServiceWorkerRegister />
            <InstallPrompt />
            {initialProfile && <PushSubscriber />}
            {initialProfile && <OnboardingModal />}
            <Suspense fallback={null}><PostHogPageView /></Suspense>
            <Analytics />
          </ToastProvider>
        </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
