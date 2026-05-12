'use client'

interface Props {
  warm: number  // percentage 0-100
  cool: number  // percentage 0-100
  compact?: boolean
  dark?: boolean  // for hero (dark bg)
}

export function TugBar({ warm, cool, compact = false, dark = false }: Props) {
  const barH = compact ? 10 : 12
  const labelSize = compact ? 12 : 14
  const metaSize = compact ? 11 : 12

  return (
    <div>
      {/* Labels row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: compact ? 6 : 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          font: `700 ${labelSize}px 'Geist', sans-serif`,
          color: dark ? '#ffd4b3' : 'var(--k3-warm-600, #c8540e)',
        }}>
          🔥 Sıcak{' '}
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontWeight: 500,
            fontSize: metaSize, opacity: dark ? 0.85 : 1,
          }}>{warm}%</span>
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          font: `700 ${labelSize}px 'Geist', sans-serif`,
          color: dark ? '#cbe2ff' : 'var(--k-blue-700, #1442a8)',
        }}>
          <span style={{
            fontFamily: 'Geist Mono, monospace', fontWeight: 500,
            fontSize: metaSize, opacity: dark ? 0.85 : 1,
          }}>{cool}%</span> Soğuk ❄️
        </span>
      </div>

      {/* Bar */}
      <div style={{
        position: 'relative',
        height: barH,
        borderRadius: 99,
        overflow: 'hidden',
        background: dark ? 'rgba(255,255,255,0.12)' : 'var(--surface-2, #eef1f6)',
      }}>
        {/* Fill */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          <div style={{
            width: warm + '%',
            background: dark
              ? 'linear-gradient(90deg, #f58a3c, #ed6f1c)'
              : 'linear-gradient(90deg, var(--k3-warm-400, #f58a3c), var(--k3-warm-500, #ed6f1c))',
          }} />
          <div style={{
            flex: 1,
            background: 'linear-gradient(90deg, var(--k-blue-500, #2a6cf0), var(--k-blue-400, #5188fa))',
          }} />
        </div>
        {/* Rope marker */}
        <div style={{
          position: 'absolute',
          top: -3,
          bottom: -3,
          left: warm + '%',
          width: 4,
          background: dark ? '#fff' : 'var(--fg, #0a0f1e)',
          transform: 'translateX(-2px)',
          borderRadius: 4,
          boxShadow: dark ? '0 0 12px rgba(255,255,255,0.7)' : '0 0 0 2px #fff',
        }} />
      </div>
    </div>
  )
}
