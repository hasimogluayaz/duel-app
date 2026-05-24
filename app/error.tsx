'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AlertTriangle, Home, RefreshCw, MessageCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    if (typeof window !== 'undefined') {
      (window as any).__LAST_ERROR__ = { message: error.message, stack: error.stack, digest: error.digest }
    }
  }, [error])

  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-4 py-16">
      <div className="max-w-md w-full">
        <div className="relative inline-block mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
            <AlertTriangle size={32} className="text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 text-2xl">💥</div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-fg mb-3 tracking-tight">
          Bir şeyler ters gitti
        </h1>
        <p className="text-fg-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          Beklenmedik bir hata oluştu. Genellikle birkaç saniye sonra düzelir.
        </p>

        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full btn-gradient gap-2" size="lg">
            <RefreshCw size={16} />
            Tekrar Dene
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/">
              <Button variant="ghost" className="w-full gap-1.5">
                <Home size={14} /> Ana Sayfa
              </Button>
            </Link>
            <Link href="/iletisim">
              <Button variant="ghost" className="w-full gap-1.5">
                <MessageCircle size={14} /> Bildir
              </Button>
            </Link>
          </div>
        </div>

        {error.digest && (
          <p className="text-[10px] text-fg-subtle mt-8 font-mono opacity-50">
            Hata kodu: #{error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
