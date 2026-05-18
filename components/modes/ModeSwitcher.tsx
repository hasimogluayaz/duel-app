'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MODES = [
  { href: '/',     label: 'Senaryo', emoji: '📝' },
  { href: '/emoji',    label: 'Emoji',   emoji: '😂' },
  { href: '/karakter', label: 'Karakter', emoji: '🎭' },
  { href: '/tartisma', label: 'Tartışma', emoji: '🔥' },
]

export function ModeSwitcher() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 bg-surface-2 p-1 rounded-2xl">
      {MODES.map(m => {
        const active = pathname === m.href
        return (
          <Link
            key={m.href}
            href={m.href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl transition-all ${
              active
                ? 'bg-surface shadow-sm text-primary'
                : 'text-fg-subtle hover:text-fg-muted'
            }`}
          >
            <span className="text-base leading-none">{m.emoji}</span>
            <span className="text-[9px] font-bold tracking-wide leading-none">{m.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
