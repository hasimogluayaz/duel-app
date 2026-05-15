export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nasıl Oynanır' }

const STEPS = [
  {
    n: 1,
    title: 'Senaryoyu oku',
    desc: 'Her gün yeni bir gerçek hayat senaryosu yayınlanır. İş, aşk, aile, para — herkesin yaşadığı durumlar.',
  },
  {
    n: 2,
    title: 'Cevabını yaz',
    desc: 'Sen ne yapardın? Açık konuş, kimse seni tanımıyor. Anonim de yazabilirsin.',
  },
  {
    n: 3,
    title: 'Gönder, kilidi aç',
    desc: 'Cevabını göndermeden başkalarının cevabını göremezsin. Önce sen söyle, sonra diğerlerini gör.',
  },
  {
    n: 4,
    title: 'Beğen, sırala',
    desc: 'Her cevabın solunda ▲ butonu var. Beğendiğine bas, o cevap yukarı çıkar. Downvote yok — sadece beğeni var. En çok oy alan en üste çıkar.',
  },
  {
    n: 5,
    title: 'Arkadaşını çağır',
    desc: 'Düello linki oluştur, arkadaşın aynı senaryoya cevap versin. Topluluk kimin cevabını daha çok beğendi — birlikte görün.',
  },
]

export default function NasilOynanirPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-black text-fg mb-2">Nasıl oynanır?</h1>
        <p className="text-fg-muted">2 dakikada öğren, her gün oyna.</p>
      </div>

      {/* Steps — vertical list with large numbered circles */}
      <div className="flex flex-col">
        {STEPS.map((step, i) => (
          <div key={step.n} className="flex gap-5">
            {/* Left: number + connecting line */}
            <div className="flex flex-col items-center">
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-white text-base font-black">{step.n}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-px flex-1 bg-stroke my-2" />
              )}
            </div>

            {/* Right: content */}
            <div className={`flex-1 ${i < STEPS.length - 1 ? 'pb-8' : ''}`}>
              <h3 className="text-base font-bold text-fg mb-1.5 mt-2.5">{step.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10">
        <Link href="/">
          <Button size="lg" className="w-full btn-gradient text-base">
            Bugünün Senaryosuna Git →
          </Button>
        </Link>
      </div>
    </div>
  )
}
