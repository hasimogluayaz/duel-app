'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'

const HIDE_ON = ['/giris', '/kayit', '/sifre-sifirla', '/admin', '/senaryo-olustur']

export function CreateFAB() {
  const pathname = usePathname()
  if (HIDE_ON.some(p => pathname.startsWith(p))) return null

  return (
    <Link
      href="/senaryo-olustur"
      className="md:hidden fixed bottom-[4.5rem] right-4 z-30 w-12 h-12 btn-gradient rounded-full flex items-center justify-center shadow-lg shadow-purple-900/40 hover:scale-105 active:scale-95 transition-transform"
      aria-label="Senaryo oluştur"
    >
      <Plus size={22} className="text-white" strokeWidth={2.5} />
    </Link>
  )
}
