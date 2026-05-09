import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: duel } = await supabase
    .from('duels')
    .select(`
      challenger:profiles!duels_challenger_id_fkey(username, display_name),
      challenged:profiles!duels_challenged_id_fkey(username, display_name),
      scenario:scenarios(content)
    `)
    .eq('share_token', params.id)
    .single()

  const challenger = duel?.challenger as any
  const challenged = duel?.challenged as any
  const scenario = duel?.scenario as any

  const a = challenger?.display_name || challenger?.username || '?'
  const b = challenged?.display_name || challenged?.username || '?'
  const scenarioText: string = scenario?.content || ''

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0c0a18 0%, #150d2e 60%, #0c0a18 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle top accent line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #7c3aed, #a855f7, #ec4899)',
        }} />

        {/* Logo */}
        <div style={{
          position: 'absolute',
          top: '32px',
          left: '48px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{
            color: '#a855f7',
            fontSize: '22px',
            fontWeight: 900,
            letterSpacing: '-0.5px',
          }}>Kapisio</div>
        </div>

        {/* Scenario */}
        {scenarioText && (
          <div style={{
            background: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '16px',
            padding: '24px 36px',
            marginBottom: '48px',
            maxWidth: '900px',
            textAlign: 'center',
          }}>
            <p style={{
              color: '#c4b5e8',
              fontSize: '22px',
              lineHeight: 1.5,
              margin: 0,
              fontStyle: 'italic',
            }}>
              {scenarioText.length > 130 ? scenarioText.slice(0, 130) + '…' : scenarioText}
            </p>
          </div>
        )}

        {/* VS Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px 48px',
            textAlign: 'center',
            minWidth: '220px',
          }}>
            <p style={{ color: '#f0eeff', fontSize: '34px', fontWeight: 800, margin: 0 }}>{a}</p>
          </div>

          <div style={{
            color: '#4a4466',
            fontSize: '28px',
            fontWeight: 900,
            letterSpacing: '2px',
          }}>VS</div>

          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '28px 48px',
            textAlign: 'center',
            minWidth: '220px',
          }}>
            <p style={{ color: '#f0eeff', fontSize: '34px', fontWeight: 800, margin: 0 }}>{b}</p>
          </div>
        </div>

        {/* CTA */}
        <p style={{
          color: '#7c6ca8',
          fontSize: '18px',
          marginTop: '44px',
          letterSpacing: '0.3px',
        }}>
          Kim haklı? Oy ver ve kazananı belirle — kapisio.com
        </p>
      </div>
    ),
    { ...size }
  )
}
