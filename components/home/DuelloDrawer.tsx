'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { X, Swords, Users, Bot } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  userId: string | null
}

type Status = 'idle' | 'loading' | 'guest' | 'not-answered' | 'error'
type JudgeMode = 'community' | 'ai'

export function DuelloDrawer({ open, onClose, userId }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('idle')
  const [judgeMode, setJudgeMode] = useState<JudgeMode>('community')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setStatus('idle'); setErrorMsg(null); return }
    if (!userId) { setStatus('guest'); return }
  }, [open, userId])

  async function initDuel() {
    setStatus('loading')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/duel/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ judge_mode: judgeMode }),
      })
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
        // Close drawer and navigate directly to the duel page
        onClose()
        router.push(`/d/${data.code}`)
      } else {
        setErrorMsg('Kod alınamadı. Tekrar dene.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('Bağlantı hatası. İnternet bağlantını kontrol et.')
      setStatus('error')
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed z-50 bg-surface shadow-2xl
        bottom-0 left-0 right-0 rounded-t-2xl max-h-[90vh] overflow-y-auto
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
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Steps */}
          <div className="flex flex-col gap-3">
            {[
              { n: 1, title: 'Cevabını yaz', desc: 'Sen ne yapardın? Anlat.' },
              { n: 2, title: 'Linki arkadaşına gönder', desc: 'O da kendi cevabını yazsın.' },
              {
                n: 3,
                title: 'Kazanan belli olsun',
                desc: judgeMode === 'ai'
                  ? 'Yapay zeka okur ve kazananı belirler.'
                  : 'Kimin cevabı daha çok beğenildi görün.',
              },
            ].map(s => (
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

          {/* Guest */}
          {status === 'guest' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-fg-muted">Düello linki oluşturmak için giriş yapmalısın.</p>
              <Link href="/giris" className="w-full">
                <Button className="w-full btn-gradient">Giriş Yap</Button>
              </Link>
            </div>
          )}

          {/* Not answered */}
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

          {/* Idle — mode picker + create button */}
          {status === 'idle' && userId && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wide">
                  Kazananı kim belirlesin?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setJudgeMode('community')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                      judgeMode === 'community'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-stroke bg-surface-2 text-fg-muted hover:border-primary/40'
                    }`}
                  >
                    <Users size={20} />
                    <span>Topluluk</span>
                    <span className="text-[10px] font-normal text-current opacity-70">Herkes oy verir</span>
                  </button>
                  <button
                    onClick={() => setJudgeMode('ai')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                      judgeMode === 'ai'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                        : 'border-stroke bg-surface-2 text-fg-muted hover:border-amber-500/40'
                    }`}
                  >
                    <Bot size={20} />
                    <span>Yapay Zeka</span>
                    <span className="text-[10px] font-normal text-current opacity-70">AI okur & karar verir</span>
                  </button>
                </div>
              </div>

              <Button onClick={initDuel} className="w-full btn-gradient" size="lg">
                <Swords size={16} />
                Düello Oluştur
              </Button>
            </div>
          )}

          {/* Loading — navigating to duel page */}
          {status === 'loading' && (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-fg">Düello oluşturuluyor…</p>
              <p className="text-xs text-fg-subtle mt-1">Düello sayfasına yönlendiriliyorsun</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="flex flex-col gap-3 text-center py-4">
              <p className="text-sm text-red-400">{errorMsg ?? 'Bir hata oluştu.'}</p>
              <Button
                onClick={() => setStatus('idle')}
                variant="ghost"
                className="text-sm text-fg-muted"
              >
                Tekrar dene
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
