export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Çerez Politikası' }

export default function CerezPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-14">
      <h1 className="text-3xl font-black text-fg mb-2">Çerez Politikası</h1>
      <p className="text-fg-subtle text-sm mb-10">Son güncelleme: 7 Mayıs 2026</p>

      <div className="space-y-8 text-fg-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-fg mb-3">Çerezler Nedir?</h2>
          <p>
            Çerezler, web siteleri tarafından tarayıcınıza yerleştirilen küçük metin dosyalarıdır.
            Oturum bilgilerini hatırlamak ve kullanıcı deneyimini kişiselleştirmek için kullanılırlar.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-fg mb-3">Kullandığımız Çerezler</h2>

          <div className="overflow-hidden rounded-xl border border-stroke">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface border-b border-stroke">
                  <th className="text-left p-4 font-semibold text-fg">Çerez Adı</th>
                  <th className="text-left p-4 font-semibold text-fg">Tür</th>
                  <th className="text-left p-4 font-semibold text-fg">Amaç</th>
                  <th className="text-left p-4 font-semibold text-fg">Süre</th>
                </tr>
              </thead>
              <tbody className="text-fg-muted">
                {[
                  { name: 'sb-auth-token', type: 'Zorunlu', aim: 'Oturum yönetimi (Supabase Auth)', dur: 'Oturum' },
                  { name: 'cookie_consent', type: 'Zorunlu', aim: 'Çerez onay tercihi', dur: '1 yıl' },
                  { name: 'vercel-analytics', type: 'Analitik', aim: 'Sayfa görüntüleme istatistikleri', dur: '1 yıl' },
                ].map(row => (
                  <tr key={row.name} className="border-b border-stroke last:border-0">
                    <td className="p-4 font-mono text-xs">{row.name}</td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        row.type === 'Zorunlu'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>{row.type}</span>
                    </td>
                    <td className="p-4 text-xs">{row.aim}</td>
                    <td className="p-4 text-xs">{row.dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-fg mb-3">Zorunlu Çerezler</h2>
          <p>
            Oturum yönetimi için zorunlu çerezler her zaman aktiftir ve devre dışı bırakılamaz.
            Bu çerezler olmadan platform düzgün çalışmaz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-fg mb-3">Analitik Çerezler</h2>
          <p>
            Hangi sayfaların ne kadar ziyaret edildiğini anlamak için opsiyonel analitik çerezler
            kullanılmaktadır. Bu çerezleri ilk ziyaret sırasında çıkan banner ile reddedebilirsiniz.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-fg mb-3">Çerez Tercihlerinizi Yönetin</h2>
          <p>
            Tarayıcınızın ayarlarından çerezleri yönetebilirsiniz. Zorunlu çerezleri silmek
            oturumunuzu sonlandırabilir. Çerez tercihlerinizi sıfırlamak için tarayıcı verilerini
            temizlemeniz gerekir.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-fg mb-3">İletişim</h2>
          <p>
            Çerez politikamız hakkında sorularınız için:{' '}
            <a href="mailto:info@kapisio.com" className="text-purple-400 hover:underline">
              info@kapisio.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
