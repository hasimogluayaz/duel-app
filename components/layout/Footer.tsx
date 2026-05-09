import Link from 'next/link'
import Image from 'next/image'
import { Lock, Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-stroke bg-bg mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 font-black text-xl mb-3 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="Kapisio" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="text-gradient">Kapisio</span>
            </Link>
            <p className="text-sm text-fg-subtle leading-relaxed">
              Türkiye'nin günlük tartışma platformu. Her gün yeni senaryo, gerçek insanlar, yapay zeka hakemi.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/oyun" className="text-sm text-fg-subtle hover:text-fg transition-colors">Oyna</Link></li>
              <li><Link href="/kesfet" className="text-sm text-fg-subtle hover:text-fg transition-colors">Keşfet</Link></li>
              <li><Link href="/liderlik" className="text-sm text-fg-subtle hover:text-fg transition-colors">Liderlik</Link></li>
              <li><Link href="/arsiv" className="text-sm text-fg-subtle hover:text-fg transition-colors">Senaryo Arşivi</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Bilgi</h4>
            <ul className="space-y-2">
              <li><Link href="/nasil-oynanir" className="text-sm text-fg-subtle hover:text-fg transition-colors">Nasıl Oynanır</Link></li>
              <li><Link href="/hakkinda" className="text-sm text-fg-subtle hover:text-fg transition-colors">Hakkında</Link></li>
              <li><Link href="/iletisim" className="text-sm text-fg-subtle hover:text-fg transition-colors">İletişim</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Yasal</h4>
            <ul className="space-y-2">
              <li><Link href="/gizlilik" className="text-sm text-fg-subtle hover:text-fg transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/kullanim-kosullari" className="text-sm text-fg-subtle hover:text-fg transition-colors">Kullanım Koşulları</Link></li>
              <li><Link href="/cerez-politikasi" className="text-sm text-fg-subtle hover:text-fg transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stroke flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-fg-subtle">
            © {new Date().getFullYear()} Kapisio. Tüm hakları saklıdır. · Türkiye
          </p>
          <div className="flex items-center gap-4 text-xs text-fg-subtle">
            <span className="flex items-center gap-1">
              <Lock size={11} />
              SSL Korumalı
            </span>
            <span className="flex items-center gap-1">
              <Shield size={11} />
              KVKK Uyumlu
            </span>
            <span>Yapay zeka destekli</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
