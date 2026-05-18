import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Hakkında',
  description: "Kapisio nedir, nasıl çalışır, neden yapıldı — kısa ve net.",
}

export default function HakkindaPage() {
  const values = [
    {
      title: 'Gerçek Tartışma',
      desc: 'Her senaryo insanları gerçekten ikiye bölen durumlar içerir. Doğru cevabı olmayan sorular, düşündürücü ikilemler.',
    },
    {
      title: 'Topluluk Hakemliği',
      desc: 'Kazananı büyük veri veya algoritmalar değil, gerçek kullanıcılar belirler. Yapay zeka son kararı verir ama topluluk yönlendirir.',
    },
    {
      title: 'Şeffaf Yapay Zeka',
      desc: 'Senaryolar, kişilik analizleri ve düello sonuçlarının tümü yapay zeka tarafından üretilir. Bunu gizlemiyoruz, tam tersine öne çıkarıyoruz.',
    },
    {
      title: 'Gizlilik Saygısı',
      desc: 'Verilerini üçüncü taraflarla satmıyoruz. Kişisel bilgilerin yalnızca platformun çalışması için kullanılır.',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 py-14">

      {/* Header */}
      <div className="mb-14">
        <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Hakkımızda</p>
        <h1 className="text-4xl font-black text-fg mb-4 leading-tight">
          Günlük tartışmanın<br />merkezi
        </h1>
        <p className="text-fg-muted text-lg leading-relaxed">
          Kapisio, Türk gençlerin her gün gerçek hayat senaryolarını tartıştığı, cevaplarını savunduğu ve birbirleriyle kapıştığı bir platform.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12 p-6 bg-surface border border-stroke rounded-2xl">
        <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider mb-3">Misyon</h2>
        <p className="text-fg leading-relaxed">
          İnsanların günlük hayatta karşılaştığı ama nadiren yüksek sesle konuştuğu ikilemler var. Kapisio bu ikilemleri bir platform formatına getiriyor — eğlenceli, meşgul edici ve merak uyandıran bir deneyim olarak.
        </p>
      </section>

      {/* How it started */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider mb-4">Nasıl Ortaya Çıktı?</h2>
        <div className="space-y-4 text-fg-muted leading-relaxed text-[15px]">
          <p>
            "Sen ne yapardın?" sorusu her tartışmanın kalbinde yatar. Arkadaş gruplarında, sosyal medyada, kahve masalarında — insanlar sürekli birbirinin kararlarını sorguluyor ve kendi bakış açısını savunuyor.
          </p>
          <p>
            Kapisio bu dinamiği yapılandırılmış, ölçülebilir ve eğlenceli bir formata taşır. Yapay zekanın günlük senaryo üretmesi, topluluk oylaması ve AI hakemliği sayesinde her gün yeni bir tartışma doğar.
          </p>
        </div>
      </section>

      {/* Tech */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider mb-4">Teknoloji</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { name: 'Next.js 14', desc: 'App Router ile sunucu taraflı rendering' },
            { name: 'Supabase', desc: 'Gerçek zamanlı veritabanı ve kimlik doğrulama' },
            { name: 'Yapay Zeka', desc: 'Senaryo üretimi, kişilik analizi ve düello kararları' },
            { name: 'Vercel', desc: 'Edge network üzerinde global dağıtım' },
          ].map(t => (
            <div key={t.name} className="p-4 bg-surface border border-stroke rounded-xl">
              <p className="text-sm font-bold text-fg">{t.name}</p>
              <p className="text-xs text-fg-muted mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="mb-12">
        <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider mb-4">Değerlerimiz</h2>
        <div className="space-y-3">
          {values.map(v => (
            <div key={v.title} className="flex gap-4 p-4 bg-surface border border-stroke rounded-xl">
              <div className="shrink-0 w-1 rounded-full bg-fg-subtle opacity-20 self-stretch" />
              <div>
                <p className="text-sm font-bold text-fg mb-1">{v.title}</p>
                <p className="text-sm text-fg-muted leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mb-12 p-6 bg-surface border border-stroke rounded-2xl">
        <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider mb-3">İletişim</h2>
        <p className="text-fg-muted text-sm mb-3">
          Soru, öneri veya iş birliği teklifleri için her zaman ulaşabilirsin.
        </p>
        <div className="flex items-center gap-3">
          <a href="mailto:info@kapisio.com" className="text-sm font-semibold text-fg hover:text-fg-muted transition-colors">
            info@kapisio.com
          </a>
          <span className="text-fg-subtle">·</span>
          <Link href="/iletisim" className="text-sm text-fg-subtle hover:text-fg transition-colors">
            İletişim formu
          </Link>
        </div>
      </section>

      <div className="text-center">
        <Link href="/">
          <Button size="lg" className="btn-gradient px-10">Düelloya Gir</Button>
        </Link>
      </div>
    </div>
  )
}
