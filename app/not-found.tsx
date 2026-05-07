import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-8xl font-black text-zinc-800 mb-4">404</div>
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-fg mb-3">Sayfa Bulunamadı</h1>
        <p className="text-fg-muted mb-8 max-w-sm">
          Aradığın sayfa yok, taşınmış veya silinmiş olabilir.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/">
            <Button>Ana Sayfaya Dön</Button>
          </Link>
          <Link href="/oyun">
            <Button variant="secondary">Oyna ⚔️</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
