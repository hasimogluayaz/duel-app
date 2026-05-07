import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'Kapisio gizlilik politikası, KVKK bilgilendirmesi ve veri işleme koşulları.',
}

export default function GizlilikPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-fg mb-2">Gizlilik Politikası</h1>
      <p className="text-fg-muted text-sm mb-2">Son güncelleme: Mayıs 2025</p>
      <p className="text-fg-subtle text-xs mb-10">
        Bu politika, 6698 sayılı KVKK ve AB GDPR gerekliliklerine uygun olarak hazırlanmıştır.
      </p>

      <div className="space-y-8 text-fg-muted leading-relaxed">

        <section className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm text-amber-300 font-semibold mb-2">⚠️ Önemli Bilgilendirme</p>
          <p className="text-sm text-fg-muted">
            Kapisio&apos;yu kullanarak yazdığınız cevaplar ve diğer içerikler, yapay zeka
            değerlendirmesi için ABD merkezli Anthropic ve Google altyapılarına iletilmektedir.
            Platforma kayıt olurken bu konuda açık rızanız alınmaktadır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">1. Veri Sorumlusu</h2>
          <p>
            Kapisio platformu kapsamında kişisel verilerinizin işlenmesinden sorumlu taraf,
            platform işleticisidir. İletişim için:{' '}
            <a href="mailto:info@kapisio.com" className="text-primary hover:underline">
              info@kapisio.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">2. Toplanan Kişisel Veriler</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-stroke">
                  <th className="text-left py-2 pr-4 text-fg font-semibold">Veri</th>
                  <th className="text-left py-2 pr-4 text-fg font-semibold">Amaç</th>
                  <th className="text-left py-2 text-fg font-semibold">Dayanak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke/40">
                {[
                  ['E-posta adresi', 'Kimlik doğrulama, bildirim', 'Sözleşme ifası'],
                  ['Kullanıcı adı / görünen ad', 'Profil ve oyun sistemi', 'Sözleşme ifası'],
                  ['Avatar URL (isteğe bağlı)', 'Profil görseli', 'Açık rıza'],
                  ['Oyun cevapları', 'Düello sistemi, AI değerlendirme', 'Açık rıza'],
                  ['Oy kayıtları', 'Düello sonuçları', 'Sözleşme ifası'],
                  ['Giriş zamanları / IP adresi', 'Güvenlik, dolandırıcılık önleme', 'Meşru menfaat'],
                  ['Biyografi (isteğe bağlı)', 'Profil sayfası', 'Açık rıza'],
                ].map(([veri, amac, dayanak]) => (
                  <tr key={veri}>
                    <td className="py-2 pr-4 text-fg text-xs font-medium">{veri}</td>
                    <td className="py-2 pr-4 text-xs">{amac}</td>
                    <td className="py-2 text-xs text-purple-400">{dayanak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">3. Verilerin Saklandığı Yerler</h2>
          <div className="flex flex-col gap-3">
            {[
              {
                name: 'Supabase',
                location: 'Frankfurt, Almanya (AB)',
                what: 'Veritabanı (profil, cevap, oy, bildirim, mesaj), kimlik doğrulama',
                privacy: 'https://supabase.com/privacy',
                flag: '🇩🇪',
              },
              {
                name: 'Vercel',
                location: 'Sunucu: Frankfurt (fra1)',
                what: 'Web uygulaması sunucusu, API routes',
                privacy: 'https://vercel.com/legal/privacy-policy',
                flag: '🇩🇪',
              },
              {
                name: 'Anthropic (Claude API)',
                location: 'ABD',
                what: 'Senaryo üretimi, düello değerlendirmesi, kişilik analizi — cevaplar bu servise iletilir',
                privacy: 'https://www.anthropic.com/privacy',
                flag: '🇺🇸',
              },
              {
                name: 'Google (Gemini API)',
                location: 'ABD',
                what: 'Ek AI işlemleri',
                privacy: 'https://policies.google.com/privacy',
                flag: '🇺🇸',
              },
            ].map(item => (
              <div key={item.name} className="flex gap-3 p-3 bg-surface border border-stroke rounded-xl">
                <span className="text-2xl shrink-0">{item.flag}</span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-bold text-fg">{item.name}</span>
                    <span className="text-xs text-fg-subtle">{item.location}</span>
                  </div>
                  <p className="text-xs text-fg-muted">{item.what}</p>
                  <a href={item.privacy} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline mt-0.5 inline-block">
                    Gizlilik politikası →
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-fg-subtle mt-3">
            ABD&apos;ye aktarım, kayıt sırasında alınan açık rızanıza dayalı olarak KVKK Madde 9
            çerçevesinde gerçekleştirilmektedir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">4. AI ve Kullanıcı Cevapları</h2>
          <p className="mb-3">
            Platforma yazdığınız tüm cevaplar (senaryolara yanıtlar) aşağıdaki amaçlarla
            yapay zeka servislerine gönderilebilir:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Günlük senaryo üretimi</li>
            <li>Düello kazananını belirleme ve roast metni oluşturma</li>
            <li>Kişilik tipi analizi (her 10 cevaptan sonra)</li>
          </ul>
          <p className="mt-3 text-sm">
            AI servislerine gönderilen veriler anonim bağlam bilgisi içermez; yalnızca
            cevap metni iletilir. Anthropic ve Google&apos;ın kendi gizlilik politikaları
            bu veriler için geçerlidir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">5. Kullanıcı İçerik Sorumluluğu</h2>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm">
            <p className="text-fg font-semibold mb-2">Önemli Yasal Uyarı</p>
            <p className="text-fg-muted">
              Platform üzerinde paylaştığınız tüm içerikler (cevaplar, biyografi, mesajlar)
              <strong className="text-fg"> yalnızca size aittir</strong> ve bunların yasal
              sorumluluğu tamamen kullanıcıya aittir. Kapisio, kullanıcı tarafından oluşturulan
              içeriklerden hukuki olarak sorumlu tutulamaz. Türk Ceza Kanunu, FSEK ve diğer
              ilgili mevzuat kapsamındaki yükümlülükler kullanıcıya aittir.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">6. KVKK Kapsamındaki Haklarınız</h2>
          <p className="mb-3">
            6698 sayılı KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong className="text-fg">Bilgi edinme:</strong> Verilerinizin işlenip işlenmediğini öğrenme</li>
            <li><strong className="text-fg">Erişim:</strong> İşlenen verilerinizin kopyasını talep etme</li>
            <li><strong className="text-fg">Düzeltme:</strong> Hatalı verilerin güncellenmesini isteme</li>
            <li><strong className="text-fg">Silme:</strong> Verilerinizin silinmesini talep etme (hesap silme ile tümü silinir)</li>
            <li><strong className="text-fg">İtiraz:</strong> Meşru menfaat kapsamındaki işlemlere itiraz etme</li>
            <li><strong className="text-fg">Şikayet:</strong> KVKK&apos;nın ihlal edildiği düşünüldüğünde Kişisel Verileri Koruma Kurulu&apos;na şikayette bulunma</li>
          </ul>
          <p className="mt-3 text-sm">
            Haklarınızı kullanmak için{' '}
            <a href="mailto:info@kapisio.com" className="text-primary hover:underline">
              info@kapisio.com
            </a>{' '}
            adresine yazabilirsiniz. Talepler 30 gün içinde yanıtlanır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">7. Hesap ve Veri Silme</h2>
          <p>
            Profil &gt; Ayarlar &gt; Tehlikeli Bölge üzerinden hesabınızı kalıcı olarak silebilirsiniz.
            Silme işleminde e-posta, cevaplar, oy kayıtları, mesajlar ve tüm kişisel veriler
            derhal silinir. Silme geri alınamaz. Anonimleştirilmiş toplu istatistikler (toplam
            düello sayısı gibi) saklanabilir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">8. Veri Güvenliği</h2>
          <ul className="list-disc pl-5 space-y-1.5 text-sm">
            <li>Tüm bağlantılar TLS/HTTPS ile şifrelenmektedir</li>
            <li>Şifreler bcrypt ile hashlenerek saklanmakta, düz metin tutulmamaktadır</li>
            <li>Supabase Row Level Security (RLS) ile her kullanıcı yalnızca kendi verisine erişebilir</li>
            <li>API anahtarları sunucu tarafında tutulur, istemciye iletilmez</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">9. Çerezler</h2>
          <p>
            Oturum yönetimi için zorunlu çerezler kullanılmaktadır. Reklam veya izleme
            amaçlı üçüncü taraf çerezleri kullanılmamaktadır. Ayrıntılar için{' '}
            <Link href="/cerez-politikasi" className="text-primary hover:underline">
              Çerez Politikamızı
            </Link>{' '}
            inceleyiniz.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">10. Politika Değişiklikleri</h2>
          <p>
            Bu politika önceden bildirim yapılmaksızın güncellenebilir. Önemli değişikliklerde
            kayıtlı kullanıcılara e-posta ile bildirim yapılmaya çalışılır. Güncel politika
            her zaman bu sayfada yayımlanır.
          </p>
        </section>

        <div className="border-t border-stroke pt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/kullanim-kosullari" className="text-primary hover:underline">Kullanım Koşulları</Link>
          <Link href="/cerez-politikasi" className="text-primary hover:underline">Çerez Politikası</Link>
          <Link href="/iletisim" className="text-primary hover:underline">İletişim</Link>
        </div>
      </div>
    </div>
  )
}
