import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { BottomNav } from '@/components/layout/BottomNav'
import { LeftSidebar } from '@/components/layout/LeftSidebar'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { CreateFAB } from '@/components/layout/CreateFAB'
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
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
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

            {initialProfile ? (
              /* ── Logged-in: Twitter 3-column layout ── */
              <div className="flex min-h-screen">

                {/* Left sidebar — desktop only */}
                <LeftSidebar profile={initialProfile} />

                {/* Main content */}
                <main className="flex-1 lg:ml-64 xl:mr-80 min-h-screen pb-20 md:pb-0 lg:pt-14">
                  {children}
                </main>

                {/* Right sidebar — xl only */}
                <RightSidebar />

                {/* Mobile bottom nav */}
                <BottomNav userId={initialProfile.id} username={initialProfile.username} />

                {/* Mobile FAB */}
                <CreateFAB />

                {/* Mobile top bar (logo + notifications) */}
                <Navbar initialProfile={initialProfile} />
              </div>
            ) : (
              /* ── Guest: classic full-width layout ── */
              <div className="flex flex-col min-h-screen">
                <Navbar initialProfile={null} />
                <main className="flex-1 pb-16 md:pb-0">
                  {children}
                </main>
                <Footer />
              </div>
            )}

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
