'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { X, Swords, Link2, Share2, Check } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  userId: string | null
}

type Status = 'idle' | 'loading' | 'guest' | 'not-answered' | 'ready' | 'error'

const STEPS = [
  { n: 1, title: 'Cevabını yaz', desc: 'Sen ne yapardın? Anlat.' },
  { n: 2, title: 'Linki arkadaşına gönder', desc: 'O da kendi cevabını yazsın.' },
  { n: 3, title: 'Topluluk karar versin', desc: 'Kimin cevabı daha çok beğenildi görün.' },
]

export function DuelloDrawer({ open, onClose, userId }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [duelCode, setDuelCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) { setStatus('idle'); setDuelCode(null); return }
    if (!userId) { setStatus('guest'); return }
    void initDuel()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function initDuel() {
    setStatus('loading')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/duel/invite', { method: 'POST' })
      const data = await res.json() as { code?: string; error?: string; code_name?: string }

      if (!res.ok) {
        if (data.code_name === 'NOT_ANSWERED' || data.error?.includes('cevap')) {
          setStatus('not-answered')
        } else {
          setErrorMsg(data.error ?? 'Bir hata oluştu.')
          setStatus('error')
        }
        return
      }

      if (data.code) {
        setDuelCode(data.code)
        setStatus('ready')
      } else {
        setStatus('error')
      }
    } catch {
      setErrorMsg('Bağlantı hatası. İnternet bağlantını kontrol et.')
      setStatus('error')
    }
  }

  async function handleCopy() {
    if (!duelCode) return
    await navigator.clipboard.writeText(`https://kapisio.com/d/${duelCode}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const duelUrl = duelCode ? `https://kapisio.com/d/${duelCode}` : ''
  const waUrl = duelUrl
    ? `https://wa.me/?text=Kapisio%20d%C3%BCellosuna%20davet%20edildin%3A%20${encodeURIComponent(duelUrl)}`
    : ''

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer — bottom sheet on mobile, right panel on sm+ */}
      <div className="fixed z-50 bg-surface shadow-2xl
        bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] overflow-y-auto
        sm:bottom-auto sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:w-[400px] sm:rounded-none sm:rounded-l-2xl
        animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">

        {/* Header */}
        <div className="sticky top-0 bg-surface flex items-center justify-between px-5 py-4 border-b border-stroke">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Swords size={18} className="text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-fg">Arkadaşını çağır</h2>
              <p className="text-xs text-fg-subtle">Aynı senaryoyu birlikte cevaplayın.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface-2 transition-colors"
            aria-label="Kapat"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          {/* Steps */}
          <div className="flex flex-col gap-3">
            {STEPS.map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm font-bold">
                  {s.n}
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">{s.title}</p>
                  <p className="text-xs text-fg-muted">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="h-px bg-stroke" />

          {/* Dynamic content based on status */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-fg-muted">Link oluşturuluyor…</p>
            </div>
          )}

          {status === 'guest' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-fg-muted">
                Düello linki oluşturmak için giriş yapmalısın.
              </p>
              <Link href="/giris" className="w-full">
                <Button className="w-full btn-gradient">Giriş Yap</Button>
              </Link>
            </div>
          )}

          {status === 'not-answered' && (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-center">
                <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-1">
                  Önce bugünün senaryosuna cevap ver
                </p>
                <p className="text-xs text-fg-muted">
                  Düello başlatmak için önce cevabını yazman gerekiyor.
                </p>
              </div>
              <Link href="/" onClick={onClose} className="w-full">
                <Button className="w-full btn-gradient">Cevapla →</Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm text-red-400">
                {errorMsg ?? 'Bir hata oluştu.'}
              </p>
              <Button onClick={initDuel} variant="ghost" className="text-sm text-fg-muted">
                Tekrar dene
              </Button>
            </div>
          )}

          {status === 'ready' && duelCode && (
            <div className="flex flex-col gap-3">
              {/* Readonly link input */}
              <div className="flex items-center gap-2 bg-bg border border-stroke rounded-xl px-3 py-2.5">
                <Link2 size={14} className="text-fg-subtle shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={duelUrl}
                  className="flex-1 text-sm text-fg-muted font-mono bg-transparent focus:outline-none min-w-0"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
              </div>

              <Button onClick={handleCopy} className="w-full btn-gradient gap-2" size="lg">
                {copied
                  ? <><Check size={16} /> Kopyalandı ✓</>
                  : <><Link2 size={16} /> Yeniden kopyala</>}
              </Button>

              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                <Button
                  className="w-full gap-2 bg-[#25D366] hover:bg-[#1fbd5a] text-white border-transparent"
                  size="lg"
                >
                  <Share2 size={16} />
                  WhatsApp&apos;a gönder
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
