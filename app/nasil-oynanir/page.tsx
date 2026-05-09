export const dynamic = 'force-dynamic'

import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nasıl Oynanır' }

export default function NasilOynanirPage() {
  const steps = [
    {
      no: '01',
      title: 'Günlük Senaryo',
      desc: 'Her gün gece yarısı yapay zeka tarafından yeni bir senaryo üretilir. Gerçek hayat durumları, sosyal ikilemler, kültürel çatışmalar — net bir "doğru cevap" olmayan sorular.',
    },
    {
      no: '02',
      title: 'Cevabını Yaz',
      desc: 'Senaryoya maksimum 280 karakterde cevabını yaz. Yaratıcı, dürüst ya da farklı düşün — topluluk özgün cevapları ödüllendirir.',
    },
    {
      no: '03',
      title: 'Düelloya Çağır',
      desc: 'Cevabını yazdıktan sonra aynı senaryoya cevap veren birini düelloya davet et. Rakibin de kendi cevabını verir.',
    },
    {
      no: '04',
      title: 'Topluluk Oy Kullanır',
      desc: 'Düello bağlantısı herkesle paylaşılabilir. Kayıtlı kullanıcılar 24 saat boyunca beğendikleri cevaba oy verir.',
    },
    {
      no: '05',
      title: 'Yapay Zeka Karar Verir',
      desc: 'Süre dolunca veya oy farkı belirli eşiği aşınca yapay zeka devreye girer. Kazananı ilan eder, kaybedene de espirili bir yorum yapar.',
    },
    {
      no: '06',
      title: 'Puan Kazan',
      desc: 'Düello kazanmak +50, katılmak bile +10 puan kazandırır. Günlük cevap, aldığın oylar ve seri bonuslarıyla sıralamada yüksel.',
    },
  ]

  const faq = [
    { q: 'Günde kaç kez cevap yazabilirim?', a: 'Her gün sadece 1 cevap yazabilirsin. Cevabını sonradan düzenleyemezsin, dikkatli yaz.' },
    { q: 'Kaç düelloya oy kullanabilirim?', a: 'Günde maksimum 10 farklı düelloya oy kullanabilirsin.' },
    { q: 'Kendi düelloma oy verebilir miyim?', a: 'Hayır, kendi düellona oy veremezsin. Tarafsızlığı korumak içindir.' },
    { q: 'Düello bağlantısını paylaşabilir miyim?', a: 'Evet. Her düellonun benzersiz bir bağlantısı var. Sosyal medyada paylaşarak daha fazla oy toplayabilirsin.' },
    { q: 'Kişilik tipim nasıl belirleniyor?', a: 'Her 10 cevabından sonra yapay zeka cevaplarını analiz ederek sana bir kişilik tipi atar — örneğin "Komedi Ustası" ya da "Filozofik Kaosçu".' },
    { q: 'Seri nasıl çalışıyor?', a: 'Her gün cevap yazarsan serin devam eder. Bir gün atlarsam seri sıfırlanır. 7 ve 30 günlük seriler özel puan bonusu kazandırır.' },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-black text-fg mb-3">Nasıl Oynanır?</h1>
        <p className="text-fg-muted">Kapisio'da oynamak kolay — ama kazanmak ayrı hikaye.</p>
      </div>

      {/* Steps */}
      <div className="mb-16">
        <h2 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-5">Oyun Adımları</h2>
        <div className="flex flex-col gap-px bg-stroke rounded-2xl overflow-hidden border border-stroke">
          {steps.map(s => (
            <div key={s.no} className="flex gap-5 p-5 bg-surface">
              <div className="shrink-0 w-8 h-8 rounded-lg bg-surface-2 border border-stroke flex items-center justify-center">
                <span className="text-xs font-black text-fg-subtle font-mono">{s.no}</span>
              </div>
              <div>
                <h3 className="font-bold text-fg mb-1">{s.title}</h3>
                <p className="text-sm text-fg-muted leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points */}
      <div className="mb-16">
        <h2 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-5">Puan Sistemi</h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: 'Düello Kazanmak', pts: '+50', accent: 'text-amber-400' },
            { label: 'Düello Kaybetmek', pts: '+10', accent: 'text-fg-muted' },
            { label: 'Günlük Cevap', pts: '+5', accent: 'text-fg-muted' },
            { label: 'Her Oy Almak', pts: '+2', accent: 'text-fg-muted' },
            { label: '7 Günlük Seri', pts: '+100 bonus', accent: 'text-orange-400' },
            { label: '30 Günlük Seri', pts: '+500 bonus', accent: 'text-amber-400' },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between p-4 bg-surface border border-stroke rounded-xl">
              <span className="text-sm text-fg-muted">{p.label}</span>
              <span className={`font-black text-sm ${p.accent}`}>{p.pts}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="mb-12">
        <h2 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-5">Sık Sorulan Sorular</h2>
        <div className="flex flex-col gap-2">
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
          <Button size="lg" className="btn-gradient px-10">Hemen Başla</Button>
        </Link>
      </div>
    </div>
  )
}
