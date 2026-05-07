'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-8xl font-black text-zinc-800 mb-4">500</div>
        <div className="text-5xl mb-4">⚡</div>
        <h2 className="text-2xl font-black text-fg mb-3">Bir Şeyler Ters Gitti</h2>
        <p className="text-fg-muted mb-8 max-w-sm">
          Beklenmedik bir hata oluştu. Lütfen tekrar dene.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={reset}>Tekrar Dene</Button>
          <Button variant="secondary" onClick={() => window.location.href = '/'}>
            Ana Sayfa
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-zinc-700 mt-6 font-mono">Hata ID: {error.digest}</p>
        )}
      </div>
    </div>
  )
}
