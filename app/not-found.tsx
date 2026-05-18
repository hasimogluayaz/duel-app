import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center text-center px-4">
      <div className="max-w-sm">
        <div className="text-8xl font-black text-fg-subtle opacity-10 mb-2 leading-none">404</div>
        <div className="w-14 h-14 rounded-2xl bg-surface border border-stroke flex items-center justify-center mx-auto mb-6">
          <Search size={24} className="text-fg-subtle" />
        </div>
        <h1 className="text-2xl font-black text-fg mb-3">Sayfa bulunamadı</h1>
        <p className="text-fg-muted text-sm leading-relaxed mb-8">
          Aradığın sayfa mevcut değil, taşınmış ya da silinmiş olabilir.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>Ana Sayfaya Dön</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">Oyna</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
