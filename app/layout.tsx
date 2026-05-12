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

            {initialProfile ? (
              /* ── Logged-in: Twitter 3-column layout ── */
              <>
                {/* Navbar OUTSIDE flex container — mobile sticky bar must not be a flex sibling */}
                <Navbar initialProfile={initialProfile} />

                <div className="flex min-h-screen w-full max-w-full">

                  {/* Left sidebar — desktop only */}
                  <LeftSidebar profile={initialProfile} />

                  {/* Main content — lg:pt-14 offsets the fixed desktop top bar (h-14 = 56px) */}
                  <main className="flex-1 min-w-0 lg:ml-64 xl:mr-80 min-h-screen pb-24 md:pb-6 lg:pt-14">
                    {children}
                  </main>

                  {/* Right sidebar — xl only */}
                  <RightSidebar />

                  {/* Mobile bottom nav (fixed) */}
                  <BottomNav userId={initialProfile.id} username={initialProfile.username} />

                  {/* Mobile FAB (fixed, only on browse pages) */}
                  <CreateFAB />
                </div>
              </>
            ) : (
              /* ── Guest: classic full-width layout ── */
              <div className="flex flex-col min-h-screen">
                <Navbar initialProfile={null} />
                <main className="flex-1">
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
