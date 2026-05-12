'use client'

type Mode = 'senaryo' | 'emoji' | 'karakter' | 'tartisma'

const MODE_INFO: Record<Mode, { label: string; emoji: string; color: string }> = {
  senaryo:  { label: 'Senaryo',  emoji: '📝', color: 'var(--k-mode-senaryo)' },
  emoji:    { label: 'Emoji',    emoji: '😀', color: 'var(--k-mode-emoji)' },
  karakter: { label: 'Karakter', emoji: '🎭', color: 'var(--k-mode-karakter)' },
  tartisma: { label: 'Tartışma', emoji: '🔥', color: 'var(--k-mode-tartisma)' },
}

interface Props {
  mode: Mode
  size?: 'sm' | 'lg'
}

/**
 * Mode chip — Senaryo / Emoji / Karakter / Tartışma
 * Design: pill with colored dot + tinted background (12% of color over white)
 */
export function ModeChip({ mode, size = 'sm' }: Props) {
  const info = MODE_INFO[mode] ?? MODE_INFO.senaryo
  const isLg = size === 'lg'
  return (
    <span
      className="inline-flex items-center gap-[5px] rounded-full font-semibold"
      style={{
        background: `color-mix(in oklab, ${info.color} 12%, white)`,
        color: info.color,
        height: isLg ? 26 : 22,
        padding: isLg ? '0 10px' : '0 8px',
        fontSize: isLg ? 12 : 11,
        letterSpacing: '0.02em',
        lineHeight: 1,
      }}
    >
      <span
        className="rounded-full"
        style={{ width: 6, height: 6, background: info.color }}
      />
      {info.label}
    </span>
  )
}

export type { Mode }
