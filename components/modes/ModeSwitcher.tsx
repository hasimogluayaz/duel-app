'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MODES = [
  { href: '/oyun',     label: 'Senaryo', emoji: '📝' },
  { href: '/emoji',    label: 'Emoji',   emoji: '😂' },
  { href: '/karakter', label: 'Karakter', emoji: '🎭' },
  { href: '/tartisma', label: 'Tartışma', emoji: '🔥' },
]

export function ModeSwitcher() {
  const pathname = usePathname()

  return (
    <div className="flex border-b border-stroke -mx-4 px-4 mb-1">
      {MODES.map(m => (
        <Link
          key={m.href}
          href={m.href}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
            pathname === m.href
              ? 'border-fg text-fg'
              : 'border-transparent text-fg-subtle hover:text-fg-muted'
          }`}
        >
          <span className="text-sm">{m.emoji}</span>
          <span className="hidden sm:inline">{m.label}</span>
        </Link>
      ))}
    </div>
  )
}
