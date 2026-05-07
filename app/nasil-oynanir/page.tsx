export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nasıl Oynanır' }

export default function NasilOynanirPage() {
  const steps = [
    {
      no: '01', emoji: '📝', title: 'Günlük Senaryo',
      desc: 'Her gün gece yarısı yapay zeka tarafından yeni ve eğlenceli bir senaryo üretilir. Senaryo gerçek hayat durumları, komik ikilemler veya sosyal durumlar içerir.',
    },
    {
      no: '02', emoji: '✍️', title: 'Cevabını Yaz',
      desc: 'Senaryoya maksimum 280 karakterde cevabını yaz. Yaratıcı, komik veya farklı düşün — her tarz işe yarayabilir!',
    },
    {
      no: '03', emoji: '⚔️', title: 'Düelloya Çağır',
      desc: 'Cevabını yazdıktan sonra bir arkadaşını düelloya davet et. Davet edilen kişi de aynı senaryoya cevap verir.',
    },
    {
      no: '04', emoji: '🗳️', title: 'Topluluk Oy Kullanır',
      desc: 'Düello bağlantısı herkese açık paylaşılabilir. Giriş yapmış kullanıcılar 24 saat boyunca favori cevabına oy verebilir.',
    },
    {
      no: '05', emoji: '🤖', title: 'AI Karar Verir',
      desc: 'Süre dolunca veya oy farkı %70\'i aşınca yapay zeka devreye girer. Kazananı ilan eder ve kaybedeni komik şekilde "roast" yapar.',
    },
    {
      no: '06', emoji: '🏆', title: 'Puan Kazan',
      desc: 'Kazanmak +50, katılmak bile +10 puan kazandırır. Günlük cevap +5, her oy aldığında +2 puan. 7 ve 30 günlük seriler büyük bonus verir!',
    },
  ]

  const faq = [
    { q: 'Günde kaç kez cevap yazabilirm?', a: 'Her gün sadece 1 cevap yazabilirsin. Cevabını düzenleyemezsin, dikkatli yaz!' },
    { q: 'Kaç düelloya oy kullanabilirim?', a: 'Günde maksimum 10 farklı düelloya oy kullanabilirsin.' },
    { q: 'Kendi düelloma oy verebilir miyim?', a: 'Hayır, kendi düellona oy veremezsin. Bu tarafsızlığı korumak içindir.' },
    { q: 'Düello bağlantısını herkesle paylaşabilir miyim?', a: 'Evet! Her düellonun benzersiz bir paylaşım bağlantısı var. Sosyal medyada paylaşarak daha fazla oy toplayabilirsin.' },
    { q: 'Kişilik tipim nasıl belirleniyor?', a: 'Her 10 cevabından sonra yapay zeka cevaplarını analiz ederek sana bir kişilik tipi atar (örn: "Komedi Ustası", "Filozofik Kaosçu").' },
    { q: 'Streak nasıl çalışıyor?', a: 'Her gün cevap yazarsan serin devam eder. Bir gün atlarsam seri sıfırlanır. 7 ve 30 günlük seriler özel puanlar kazandırır.' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-black text-fg mb-3">Nasıl Oynanır?</h1>
        <p className="text-fg-muted">DUEL\'de oynamak çok kolay — ama kazanmak ayrı hikaye!</p>
      </div>

      {/* Steps */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-fg mb-6">Oyun Adımları</h2>
        <div className="flex flex-col gap-4">
          {steps.map(s => (
            <div key={s.no} className="flex gap-5 p-5 bg-surface border border-stroke rounded-xl">
              <div className="flex-shrink-0 text-3xl">{s.emoji}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-fg-subtle">{s.no}</span>
                  <h3 className="font-bold text-fg">{s.title}</h3>
                </div>
                <p className="text-sm text-fg-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="mb-16">
        <h2 className="text-xl font-bold text-fg mb-6">Puan Sistemi</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { label: 'Düello Kazanmak', pts: '+50', color: 'text-amber-400' },
            { label: 'Düello Kaybetmek', pts: '+10', color: 'text-fg-muted' },
            { label: 'Günlük Cevap', pts: '+5', color: 'text-purple-400' },
            { label: 'Her Oy Almak', pts: '+2', color: 'text-purple-400' },
            { label: '7 Günlük Seri', pts: '+100 bonus', color: 'text-orange-400' },
            { label: '30 Günlük Seri', pts: '+500 bonus', color: 'text-amber-400' },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between p-4 bg-surface border border-stroke rounded-xl">
              <span className="text-sm text-fg-muted">{p.label}</span>
              <span className={`font-black text-sm ${p.color}`}>{p.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-xl font-bold text-fg mb-6">Sık Sorulan Sorular</h2>
        <div className="flex flex-col gap-4">
          {faq.map(item => (
            <div key={item.q} className="p-5 bg-surface border border-stroke rounded-xl">
              <p className="font-semibold text-fg mb-2">{item.q}</p>
              <p className="text-sm text-fg-muted leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link href="/kayit">
          <Button size="lg">Hemen Başla ⚔️</Button>
        </Link>
      </div>
    </div>
  )
}
