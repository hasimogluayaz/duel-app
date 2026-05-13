'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

// Show FAB on all main browsing pages
const SHOW_ON = ['/oyun', '/kesfet', '/arsiv', '/liderlik']

export function CreateFAB() {
  const pathname = usePathname()
  if (!SHOW_ON.some(p => pathname.startsWith(p))) return null

  return (
    <Link
      href="/senaryo-olustur"
      aria-label="Senaryo oluştur"
      className="md:hidden fixed z-30 flex items-center justify-center text-white active:scale-95 transition-transform"
      style={{
        bottom: 84,
        right: 16,
        width: 52,
        height: 52,
        borderRadius: 16,
        background: 'linear-gradient(140deg, #4aa8ff 0%, #1442a8 100%)',
        boxShadow: '0 8px 22px -4px rgba(42,108,240,0.55)',
      }}
    >
      <Plus size={22} strokeWidth={2.5} />
    </Link>
  )
}
