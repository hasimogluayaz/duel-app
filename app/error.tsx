'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    // Temporary: log to a visible place for debugging
    if (typeof window !== 'undefined') {
      (window as any).__LAST_ERROR__ = { message: error.message, stack: error.stack, digest: error.digest }
    }
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div className="max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-surface border border-stroke flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={28} className="text-fg-subtle" />
        </div>
        <h2 className="text-2xl font-black text-fg mb-3">Bir şeyler ters gitti</h2>
        <p className="text-fg-muted text-sm leading-relaxed mb-8">
          Beklenmedik bir hata oluştu. Birkaç saniye bekleyip tekrar dene.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>Tekrar Dene</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            Ana Sayfa
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-fg-subtle mt-6 font-mono opacity-50">#{error.digest}</p>
        )}
      </div>
    </div>
  )
}
