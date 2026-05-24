import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Home, Compass, MessageCircle, Swords } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center text-center px-4 py-16">
      <div className="max-w-md w-full">
        {/* Animated 404 */}
        <div className="relative inline-block mb-6">
          <div className="text-[120px] sm:text-[160px] font-black leading-none bg-gradient-to-br from-primary via-blue-500 to-amber-500 bg-clip-text text-transparent select-none tracking-tighter">
            404
          </div>
          <div className="absolute -top-2 -right-4 text-3xl animate-bounce">🤔</div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-black text-fg mb-3 tracking-tight">
          Sayfa kayıp
        </h1>
        <p className="text-fg-muted text-sm sm:text-base leading-relaxed mb-8 max-w-sm mx-auto">
          Yanlış bir yere mi geldin? Hiç sorun değil — Kapisio dolu dolu, gidecek yer çok.
        </p>

        {/* Primary CTA */}
        <Link href="/" className="block mb-6">
          <Button className="w-full btn-gradient gap-2" size="lg">
            <Home size={16} />
            Bugünkü senaryoya git
          </Button>
        </Link>

        {/* Suggested links grid */}
        <div className="grid grid-cols-3 gap-2">
          <Suggested href="/kesfet" icon={Compass} label="Keşfet" />
          <Suggested href="/liderlik" icon={Swords} label="Liderlik" />
          <Suggested href="/iletisim" icon={MessageCircle} label="İletişim" />
        </div>
      </div>
    </div>
  )
}

function Suggested({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-stroke bg-surface hover:bg-surface-2 hover:border-primary/30 transition-all group"
    >
      <Icon size={16} className="text-fg-subtle group-hover:text-primary transition-colors" />
      <span className="text-xs font-semibold text-fg-muted group-hover:text-fg transition-colors">{label}</span>
    </Link>
  )
}
