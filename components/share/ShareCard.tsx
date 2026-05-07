'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Download, X } from 'lucide-react'

interface Props {
  duel: any
  winnerProfile: any
  onClose: () => void
}

export function ShareCard({ duel, winnerProfile, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  async function downloadCard() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
        useCORS: true,
        width: 1080,
        height: 1080,
      })
      const link = document.createElement('a')
      link.download = `duel-win-${duel.share_token}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  function shareToStory() {
    if (navigator.share) {
      navigator.share({
        title: 'DUEL\'de kazandım!',
        text: `"${duel.scenario?.content}" sorusuna verdiğim cevapla düelloyu kazandım!`,
        url: `${window.location.origin}/duel/${duel.share_token}`,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface border border-stroke rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-fg">Paylaşılabilir Kart</h3>
          <button onClick={onClose} className="text-fg-muted hover:text-fg">
            <X size={20} />
          </button>
        </div>

        {/* Preview card (1:1 ratio) */}
        <div className="mb-4 rounded-xl overflow-hidden border border-stroke">
          <div
            ref={cardRef}
            className="relative w-full aspect-square flex flex-col items-center justify-center p-8 text-center"
            style={{
              background: 'linear-gradient(135deg, #0a0a0a 0%, #111118 100%)',
              width: 1080,
              height: 1080,
              transform: 'scale(0.35)',
              transformOrigin: 'top left',
              marginBottom: '-702px',
            }}
          >
            {/* Background glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl" />

            {/* Logo */}
            <div className="relative mb-10">
              <span style={{ fontSize: 72 }}>⚔️</span>
              <p style={{ fontSize: 36, fontWeight: 900, color: '#ffffff', marginTop: 8, letterSpacing: 8 }}>Kapisio</p>
            </div>

            {/* Scenario */}
            <p style={{ fontSize: 24, color: '#71717a', marginBottom: 32, maxWidth: 800, lineHeight: 1.4 }}>
              &ldquo;{duel.scenario?.content}&rdquo;
            </p>

            {/* Winner answer */}
            <div style={{ background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)', borderRadius: 24, padding: '40px 60px', marginBottom: 40, maxWidth: 900 }}>
              <p style={{ fontSize: 32, color: '#ffffff', fontWeight: 700, lineHeight: 1.5 }}>
                {winnerProfile?.display_name || winnerProfile?.username} bu cevabı verdi ve kazandı:
              </p>
              <p style={{ fontSize: 40, color: '#a5b4fc', fontWeight: 800, marginTop: 24, lineHeight: 1.4 }}>
                &ldquo;{(winnerProfile?.id === duel.challenger_id ? duel.challenger_answer : duel.challenged_answer)?.content}&rdquo;
              </p>
            </div>

            {/* AI roast */}
            {duel.ai_roast && (
              <p style={{ fontSize: 22, color: '#f59e0b', fontStyle: 'italic', marginBottom: 40, maxWidth: 800 }}>
                🤖 &ldquo;{duel.ai_roast}&rdquo;
              </p>
            )}

            {/* Footer */}
            <p style={{ fontSize: 22, color: '#52525b', marginTop: 'auto' }}>
              duel.app&apos;da oyna →
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={downloadCard} loading={downloading} className="flex-1">
            <Download size={16} />
            PNG İndir
          </Button>
          <Button onClick={shareToStory} variant="secondary" className="flex-1">
            <span>📤</span>
            Paylaş
          </Button>
        </div>
      </div>
    </div>
  )
}
