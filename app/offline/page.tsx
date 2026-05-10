export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-6xl mb-6">📡</div>
        <h1 className="text-2xl font-black text-fg mb-3">İnternet Bağlantısı Yok</h1>
        <p className="text-fg-muted mb-6">Bağlantın geri geldiğinde DUEL&apos;e devam edebilirsin.</p>
        <a
          href="/"
          className="inline-block bg-primary text-fg px-6 py-2.5 rounded-xl font-semibold hover:bg-primary transition-colors"
        >
          Yeniden Dene
        </a>
      </div>
    </div>
  )
}
