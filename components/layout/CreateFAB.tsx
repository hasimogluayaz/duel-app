'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

// Only show FAB on browsing pages where scenario creation is contextual
const SHOW_ON = ['/kesfet', '/arsiv']

export function CreateFAB() {
  const pathname = usePathname()
  if (!SHOW_ON.some(p => pathname.startsWith(p))) return null

  return (
    <Link
      href="/senaryo-olustur"
      className="md:hidden fixed bottom-20 right-3 z-30 w-11 h-11 bg-primary rounded-full flex items-center justify-center border border-primary active:scale-95 transition-transform"
      aria-label="Senaryo oluştur"
      style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
    >
      <Plus size={20} className="text-white" strokeWidth={2.5} />
    </Link>
  )
}
