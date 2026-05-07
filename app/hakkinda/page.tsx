export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = { title: 'Hakkında' }

export default function HakkindaPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-14">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">⚔️</div>
        <h1 className="text-4xl font-black text-fg mb-3">DUEL Hakkında</h1>
        <p className="text-fg-muted">Günlük AI düello platformu</p>
      </div>

      <div className="prose prose-invert max-w-none space-y-8 text-fg-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-fg">Ne İçin Yapıldı?</h2>
          <p>
            DUEL, insanların günlük hayattaki komik ve düşündürücü durumlara nasıl tepki vereceğini
            keşfetmeleri için tasarlanmış eğlenceli bir platform. Her gün yeni bir senaryo, her gün
            yeni bir düello — ve her gün biraz daha iyi bir cevap yazma fırsatı.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg">Nasıl Çalışır?</h2>
          <p>
            Yapay zeka her gün gerçek hayattan esinlenerek eğlenceli senaryolar üretir. Sen cevabını
            yazarsın, arkadaşını 1v1 düelloya çağırırsın. Topluluk oy verir, yapay zeka kazananı ilan
            eder — ve kaybedeni mizahi bir şekilde "roast" yapar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg">Teknoloji</h2>
          <p>
            DUEL, Anthropic&apos;in Claude yapay zeka modeli ile güçlendirilmiştir. Senaryo üretimi,
            kişilik analizi ve düello sonuç kararları Claude Haiku modeli tarafından gerçekleştirilir.
            Platform Next.js, Supabase ve Tailwind CSS ile inşa edilmiştir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg">Değerlerimiz</h2>
          <ul className="list-disc list-inside space-y-2 text-fg-muted">
            <li>Eğlenceli ama saygılı bir ortam</li>
            <li>Yaratıcılığı ödüllendiren bir sistem</li>
            <li>Tamamen şeffaf yapay zeka kullanımı</li>
            <li>Kullanıcı gizliliğine tam saygı</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg">İletişim</h2>
          <p>
            Sorularınız, önerileriniz veya geri bildirimleriniz için{' '}
            <Link href="/iletisim" className="text-purple-400 hover:text-purple-300 underline">
              iletişim formunu
            </Link>{' '}
            kullanabilirsiniz.
          </p>
        </section>
      </div>

      <div className="mt-12 text-center">
        <Link href="/oyun">
          <Button size="lg">Düelloya Gir ⚔️</Button>
        </Link>
      </div>
    </div>
  )
}
