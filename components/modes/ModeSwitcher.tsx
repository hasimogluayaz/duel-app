'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MODES = [
  { href: '/oyun', label: 'Senaryo', emoji: '📝' },
  { href: '/emoji', label: 'Emoji', emoji: '😂' },
  { href: '/karakter', label: 'Karakter', emoji: '🎭' },
  { href: '/tartisma', label: 'Tartışma', emoji: '🔥' },
]

export function ModeSwitcher() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
      {MODES.map(m => (
        <Link
          key={m.href}
          href={m.href}
          className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
            pathname === m.href
              ? 'bg-surface-2 border-fg/20 text-fg'
              : 'border-stroke text-fg-subtle hover:text-fg hover:border-fg/20'
          }`}
        >
          <span>{m.emoji}</span>
          {m.label}
        </Link>
      ))}
    </div>
  )
}
