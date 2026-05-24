'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY = 'kapisio_install_prompt'
const COOLDOWN_DAYS = 7

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIosSafari, setIsIosSafari] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const { until } = JSON.parse(stored) as { until: number }
        if (Date.now() < until) return
      } catch {}
    }

    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((navigator as any).standalone) return

    const ua = navigator.userAgent
    const iosSafari = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS/.test(ua)
    if (iosSafari) {
      setIsIosSafari(true)
      const t = setTimeout(() => setShow(true), 30_000)
      return () => clearTimeout(t)
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 15_000)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  function snooze() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ until: Date.now() + COOLDOWN_DAYS * 86_400_000 }),
    )
    setShow(false)
  }

  async function install() {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ until: Date.now() + 365 * 86_400_000 }))
    }
    setShow(false)
    setDeferred(null)
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-6 sm:right-6 sm:max-w-sm z-40 rounded-2xl border border-stroke bg-surface shadow-2xl animate-in slide-in-from-bottom duration-300"
      role="dialog"
      aria-label="Uygulamayı yükle"
    >
      <button
        onClick={snooze}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
        aria-label="Kapat"
      >
        <X size={14} />
      </button>

      <div className="p-4 pr-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Smartphone size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-fg">Kapisio'yu telefonuna ekle</p>
            <p className="text-xs text-fg-muted mt-0.5 leading-relaxed">
              {isIosSafari
                ? 'Safari Paylaş menüsünden "Ana Ekrana Ekle" — uygulama gibi açılsın.'
                : 'Tek dokunuşla aç, bildirim al, offline çalışsın.'}
            </p>
          </div>
        </div>

        {!isIosSafari ? (
          <div className="flex items-center gap-2 mt-3">
            <Button onClick={install} className="flex-1 btn-gradient gap-1.5" size="sm">
              <Download size={13} />
              Yükle
            </Button>
            <Button onClick={snooze} variant="ghost" size="sm" className="text-fg-muted">
              Sonra
            </Button>
          </div>
        ) : (
          <Button onClick={snooze} variant="ghost" size="sm" className="w-full mt-3 text-fg-muted">
            Anladım
          </Button>
        )}
      </div>
    </div>
  )
}
