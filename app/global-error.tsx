'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="tr">
      <body className="bg-bg flex items-center justify-center min-h-screen">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-black text-fg mb-3">Kritik Hata</h2>
          <p className="text-fg-muted mb-6">Uygulama çöktü. Lütfen sayfayı yenileyin.</p>
          <button
            onClick={reset}
            className="bg-purple-600 text-fg px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-500"
          >
            Yenile
          </button>
        </div>
      </body>
    </html>
  )
}
