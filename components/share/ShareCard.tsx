'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { X, Download, Link2, Check } from 'lucide-react'

interface Props {
  duel: any
  winnerProfile: any
  onClose: () => void
}

type Format = 'square' | 'story'

const PLATFORMS = [
  {
    id: 'twitter',
    label: 'X / Twitter',
    icon: '𝕏',
    color: 'bg-black hover:bg-zinc-800',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: '💬',
    color: 'bg-[#25D366] hover:bg-[#1ebe5d]',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: '📸',
    color: 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 hover:opacity-90',
  },
]

export function ShareCard({ duel, winnerProfile, onClose }: Props) {
  const squareRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)
  const [format, setFormat] = useState<Format>('square')
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/duel/${duel.share_token}`
    : `https://kapisio.com/duel/${duel.share_token}`

  const challenger = duel.challenger
  const challenged = duel.challenged
  const winnerId = duel.winner_id
  const challengerWon = winnerId === duel.challenger_id

  const winnerAnswer = challengerWon ? duel.challenger_answer?.content : duel.challenged_answer?.content
  const loserAnswer = challengerWon ? duel.challenged_answer?.content : duel.challenger_answer?.content
  const winnerName = (challengerWon ? challenger : challenged)?.display_name || (challengerWon ? challenger : challenged)?.username || '?'
  const loserName = (challengerWon ? challenged : challenger)?.display_name || (challengerWon ? challenged : challenger)?.username || '?'

  const scenario = duel.scenario?.content ?? ''
  const roast = duel.ai_roast ?? ''
  const verdict = duel.ai_verdict ?? ''

  async function downloadImage() {
    const ref = format === 'square' ? squareRef : storyRef
    if (!ref.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const w = format === 'square' ? 1080 : 1080
      const h = format === 'square' ? 1080 : 1920
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#0d0b1e',
        scale: 2,
        useCORS: true,
        width: w,
        height: h,
      })
      const link = document.createElement('a')
      link.download = `kapisio-duel-${format}-${duel.share_token}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      console.error(e)
    }
    setDownloading(false)
  }

  function shareToTwitter() {
    const text = `"${scenario.slice(0, 80)}..." sorusunda ${winnerName} kazandı! 🏆\n\nSen kime oy verirdin?`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
  }

  function shareToWhatsApp() {
    const text = `⚔️ Kapisio'da bir düello sona erdi!\n\n"${scenario.slice(0, 100)}..."\n\n🏆 Kazanan: ${winnerName}\n\nSen kime oy verirdin? → ${shareUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({
        title: `${winnerName} düelloyu kazandı! ⚔️`,
        text: `"${scenario.slice(0, 100)}" sorusunda ${winnerName} kazandı. Sen de oy ver!`,
        url: shareUrl,
      })
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handlePlatform(id: string) {
    if (id === 'twitter') shareToTwitter()
    else if (id === 'whatsapp') shareToWhatsApp()
    else if (id === 'instagram') downloadImage()
  }

  // Card style helpers
  const cardBg = 'linear-gradient(135deg, #0d0b1e 0%, #130f30 50%, #0d0b1e 100%)'
  const accentGlow = 'rgba(139,92,246,0.25)'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="bg-surface border border-stroke rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl shadow-purple-900/30">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="font-black text-fg text-lg">Düelloyu Paylaş</h3>
            <p className="text-xs text-purple-400/70 mt-0.5">Arkadaşlarını düelloya davet et</p>
          </div>
          <button onClick={onClose} className="text-fg-subtle hover:text-fg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Format tabs */}
        <div className="flex gap-2 px-5 mb-4">
          {(['square', 'story'] as Format[]).map(f => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                format === f
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40'
                  : 'bg-surface-2 text-fg-subtle hover:bg-stroke'
              }`}
            >
              {f === 'square' ? '⬛ Kare (1:1)' : '📱 Story (9:16)'}
            </button>
          ))}
        </div>

        {/* Card preview */}
        <div className="px-5 mb-4">
          <div className="rounded-xl overflow-hidden border border-purple-500/20 bg-black">
            {format === 'square' ? (
              <div style={{ width: '100%', paddingBottom: '100%', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                  <div
                    ref={squareRef}
                    style={{
                      background: cardBg,
                      width: 1080,
                      height: 1080,
                      transform: 'scale(var(--card-scale, 0.36))',
                      transformOrigin: 'top left',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '72px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                    className="[--card-scale:0.36]"
                  >
                    <SquareCardContent
                      scenario={scenario}
                      winnerName={winnerName}
                      loserName={loserName}
                      winnerAnswer={winnerAnswer}
                      loserAnswer={loserAnswer}
                      roast={roast}
                      shareUrl={shareUrl}
                      accentGlow={accentGlow}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', paddingBottom: '177.78%', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
                  <div
                    ref={storyRef}
                    style={{
                      background: cardBg,
                      width: 1080,
                      height: 1920,
                      transform: 'scale(var(--card-scale, 0.2))',
                      transformOrigin: 'top left',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '80px 72px',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    <StoryCardContent
                      scenario={scenario}
                      winnerName={winnerName}
                      loserName={loserName}
                      winnerAnswer={winnerAnswer}
                      loserAnswer={loserAnswer}
                      roast={roast}
                      verdict={verdict}
                      shareUrl={shareUrl}
                      accentGlow={accentGlow}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col gap-3">
          {/* Download + Copy row */}
          <div className="flex gap-2">
            <Button onClick={downloadImage} loading={downloading} className="flex-1 btn-gradient font-bold">
              <Download size={15} />
              {format === 'story' ? 'Story İndir' : 'Kare İndir'}
            </Button>
            <button
              onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                copied
                  ? 'bg-green-500/20 border-green-500/40 text-green-400'
                  : 'bg-surface-2 border-stroke text-fg-muted hover:bg-stroke'
              }`}
            >
              {copied ? <Check size={15} /> : <Link2 size={15} />}
              {copied ? 'Kopyalandı!' : 'Link'}
            </button>
          </div>

          {/* Platform buttons */}
          <div className="grid grid-cols-3 gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => handlePlatform(p.id)}
                className={`${p.color} text-white text-xs font-bold py-2.5 rounded-xl transition-all flex flex-col items-center gap-1`}
              >
                <span className="text-base">{p.icon}</span>
                {p.label}
              </button>
            ))}
          </div>

          {/* Native share (mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={shareNative}
              className="w-full py-2.5 rounded-xl bg-surface-2 border border-stroke text-fg-muted text-sm font-medium hover:bg-stroke transition-all"
            >
              📤 Cihazda Paylaş
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SquareCardContent({ scenario, winnerName, loserName, winnerAnswer, loserAnswer, roast, shareUrl, accentGlow }: any) {
  return (
    <>
      {/* Glow orbs */}
      <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: accentGlow, borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 100, right: 100, width: 300, height: 300, background: 'rgba(236,72,153,0.12)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 52, position: 'relative' }}>
        <span style={{ fontSize: 44 }}>⚔️</span>
        <span style={{ fontSize: 44, fontWeight: 900, color: '#ffffff', letterSpacing: 4 }}>Kapisio</span>
      </div>

      {/* Scenario */}
      <div style={{ background: 'rgba(139,92,246,0.12)', border: '1.5px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '36px 44px', marginBottom: 40, position: 'relative' }}>
        <p style={{ fontSize: 30, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
          &ldquo;{scenario.slice(0, 120)}{scenario.length > 120 ? '...' : ''}&rdquo;
        </p>
      </div>

      {/* Answers */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 40, flex: 1, position: 'relative' }}>
        {/* Winner */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(109,40,217,0.15) 100%)', border: '2px solid rgba(139,92,246,0.6)', borderRadius: 20, padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>🏆</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#a78bfa' }}>{winnerName}</span>
          </div>
          <p style={{ fontSize: 26, color: '#ffffff', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
            &ldquo;{(winnerAnswer ?? '').slice(0, 80)}{(winnerAnswer ?? '').length > 80 ? '...' : ''}&rdquo;
          </p>
          <div style={{ marginTop: 16, display: 'inline-block', background: 'rgba(139,92,246,0.3)', borderRadius: 999, padding: '6px 20px' }}>
            <span style={{ fontSize: 20, color: '#c4b5fd', fontWeight: 700 }}>KAZANDI</span>
          </div>
        </div>

        {/* Loser */}
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 28 }}>😅</span>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#94a3b8' }}>{loserName}</span>
          </div>
          <p style={{ fontSize: 24, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
            &ldquo;{(loserAnswer ?? '').slice(0, 80)}{(loserAnswer ?? '').length > 80 ? '...' : ''}&rdquo;
          </p>
        </div>
      </div>

      {/* AI Roast */}
      {roast && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.2)', borderRadius: 16, padding: '24px 36px', marginBottom: 36, position: 'relative' }}>
          <p style={{ fontSize: 24, color: '#fbbf24', fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>
            🤖 &ldquo;{roast.slice(0, 120)}{roast.length > 120 ? '...' : ''}&rdquo;
          </p>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 28, position: 'relative' }}>
        <p style={{ fontSize: 22, color: '#6366f1', margin: 0, fontWeight: 600 }}>kapisio.com</p>
        <p style={{ fontSize: 20, color: '#475569', margin: 0 }}>Sen kime oy verirdin? →</p>
      </div>
    </>
  )
}

function StoryCardContent({ scenario, winnerName, loserName, winnerAnswer, loserAnswer, roast, verdict, shareUrl, accentGlow }: any) {
  return (
    <>
      {/* Glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 700, height: 700, background: accentGlow, borderRadius: '50%', filter: 'blur(150px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: 0, width: 400, height: 400, background: 'rgba(236,72,153,0.1)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 64, position: 'relative' }}>
        <span style={{ fontSize: 56 }}>⚔️</span>
        <span style={{ fontSize: 56, fontWeight: 900, color: '#ffffff', letterSpacing: 6 }}>Kapisio</span>
      </div>

      {/* Scenario */}
      <div style={{ background: 'rgba(139,92,246,0.12)', border: '2px solid rgba(139,92,246,0.3)', borderRadius: 24, padding: '48px 56px', marginBottom: 52, position: 'relative' }}>
        <p style={{ fontSize: 40, color: '#c4b5fd', fontStyle: 'italic', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
          &ldquo;{scenario.slice(0, 160)}{scenario.length > 160 ? '...' : ''}&rdquo;
        </p>
      </div>

      {/* Winner answer */}
      <div style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(109,40,217,0.2) 100%)', border: '2.5px solid rgba(139,92,246,0.7)', borderRadius: 24, padding: '44px 56px', marginBottom: 32, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <span style={{ fontSize: 40 }}>🏆</span>
          <span style={{ fontSize: 38, fontWeight: 900, color: '#a78bfa' }}>{winnerName}</span>
          <span style={{ marginLeft: 'auto', background: 'rgba(139,92,246,0.4)', borderRadius: 999, padding: '8px 24px', fontSize: 24, color: '#c4b5fd', fontWeight: 800 }}>KAZANDI</span>
        </div>
        <p style={{ fontSize: 38, color: '#ffffff', lineHeight: 1.5, margin: 0, fontWeight: 600 }}>
          &ldquo;{(winnerAnswer ?? '').slice(0, 120)}{(winnerAnswer ?? '').length > 120 ? '...' : ''}&rdquo;
        </p>
      </div>

      {/* Loser answer */}
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '40px 56px', marginBottom: 52, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>😅</span>
          <span style={{ fontSize: 34, fontWeight: 700, color: '#94a3b8' }}>{loserName}</span>
        </div>
        <p style={{ fontSize: 34, color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
          &ldquo;{(loserAnswer ?? '').slice(0, 120)}{(loserAnswer ?? '').length > 120 ? '...' : ''}&rdquo;
        </p>
      </div>

      {/* AI verdict */}
      {(verdict || roast) && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '2px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '36px 48px', marginBottom: 52, position: 'relative' }}>
          <p style={{ fontSize: 32, color: '#fbbf24', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
            🤖 &ldquo;{(roast || verdict).slice(0, 150)}{(roast || verdict).length > 150 ? '...' : ''}&rdquo;
          </p>
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 48, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
        <p style={{ fontSize: 36, color: '#ffffff', fontWeight: 800, margin: 0, textAlign: 'center' }}>Sen kime oy verirdin? 🗳️</p>
        <div style={{ background: 'rgba(99,102,241,0.2)', border: '1.5px solid rgba(99,102,241,0.4)', borderRadius: 16, padding: '20px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 28, color: '#818cf8', margin: 0, fontWeight: 600 }}>kapisio.com</p>
        </div>
      </div>
    </>
  )
}
