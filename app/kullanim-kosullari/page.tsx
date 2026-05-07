import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'Kapisio kullanım koşulları ve hizmet şartları.',
}

export default function KullanimKosullariPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-fg mb-2">Kullanım Koşulları</h1>
      <p className="text-fg-muted text-sm mb-10">Son güncelleme: Mayıs 2025</p>

      <div className="space-y-8 text-fg-muted leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-fg mb-3">1. Hizmetin Amacı</h2>
          <p>
            Kapisio, kullanıcıların günlük senaryolara cevap yazıp birbirleriyle kapışabildiği,
            topluluk oylaması ve yapay zeka değerlendirmesiyle eğlenceli bir rekabet ortamı sunan
            Türkçe bir web platformudur.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">2. Kullanıcı Yükümlülükleri</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Platformu yalnızca kişisel, ticari olmayan amaçlarla kullanabilirsiniz.</li>
            <li>Hesabınızı başkasına devredemez veya paylaşamazsınız.</li>
            <li>Gerçek ve doğru bilgilerle kayıt olmanız gerekmektedir.</li>
            <li>Hesabınızın güvenliğinden siz sorumlusunuz.</li>
            <li>Otomatik araçlar veya botlarla platforma erişemezsiniz.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">3. Yasak İçerikler</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Hakaret, küfür veya kişilik haklarını zedeleyen ifadeler</li>
            <li>Irk, din, cinsiyet veya etnik köken temelli ayrımcılık</li>
            <li>Şiddeti öven veya teşvik eden içerikler</li>
            <li>Kişisel bilgi paylaşımı (telefon, adres vb.)</li>
            <li>Spam, reklam veya ticari içerikler</li>
            <li>Başkasının kimliğine bürünme</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">4. İçerik Moderasyonu</h2>
          <p>
            Kapisio, yasak içerik barındırdığı değerlendirilen cevapları veya profil bilgilerini
            önceden bildirimde bulunmaksızın kaldırma hakkını saklı tutar.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">5. Hesap Askıya Alma ve Silme</h2>
          <p className="mb-3">
            Kapisio, bu koşulların ihlali, platforma zarar verecek davranışlar veya uzun süreli
            inaktiflik (12+ ay) durumunda hesabı askıya alabilir veya silebilir. Hesap silindiğinde
            tüm veriler kalıcı olarak silinir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">6. Fikri Mülkiyet</h2>
          <p>
            Platform tasarımı, logosu ve yazılım kodu Kapisio&apos;ya aittir. Kullanıcı içerikleri
            sahiplerine ait olmaya devam eder; ancak kullanıcılar bu içeriklerin platform içinde
            gösterilmesine ve yapay zeka servislerine gönderilmesine onay vermiş sayılır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">7. Yapay Zeka Kullanımı</h2>
          <p>
            Platform, senaryo üretimi ve düello değerlendirmesi için üçüncü taraf yapay zeka
            servisleri kullanmaktadır. Kullanıcı cevapları bu amaçlarla ilgili servislere
            iletilebilir. Yapay zeka sonuçları yalnızca eğlence amaçlıdır.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">8. Sorumluluk Reddi</h2>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm mb-3">
            <p className="text-fg font-semibold mb-2">Yasal Uyarı — Lütfen Dikkatle Okuyun</p>
            <ul className="space-y-2 text-fg-muted">
              <li>
                <strong className="text-fg">İçerik sorumluluğu:</strong> Kullanıcıların platform üzerinde
                oluşturduğu tüm içerikler (cevaplar, mesajlar, profil bilgileri) yalnızca ilgili
                kullanıcıya aittir. Kapisio, kullanıcı içeriklerinden <strong className="text-fg">hiçbir koşulda</strong> hukuki
                olarak sorumlu tutulamaz.
              </li>
              <li>
                <strong className="text-fg">AI sonuçları:</strong> Yapay zekanın ürettiği tüm içerikler
                (kazanan kararı, roast metni, kişilik analizi) yalnızca eğlence amaçlıdır; hukuki,
                kişisel veya mesleki değerlendirme niteliği taşımaz.
              </li>
              <li>
                <strong className="text-fg">Hizmet sürekliliği:</strong> Platform &quot;olduğu gibi&quot; sunulmakta
                olup kesintisiz veya hatasız çalışacağı garanti edilmemektedir. Hizmet kesintilerinden
                doğan kayıplardan Kapisio sorumlu değildir.
              </li>
              <li>
                <strong className="text-fg">Üçüncü taraf servisler:</strong> Anthropic, Google, Supabase ve
                Vercel&apos;e ait olası kesinti veya gizlilik ihlallerinden Kapisio sorumlu tutulamaz.
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">9. Değişiklik Hakkı</h2>
          <p>
            Kapisio, bu koşulları önceden haber vermeksizin değiştirebilir. Platformu kullanmaya
            devam etmek, güncel koşulların kabul edildiği anlamına gelir.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-fg mb-3">10. Uygulanacak Hukuk</h2>
          <p>
            Bu koşullar Türkiye Cumhuriyeti mevzuatına tabidir. Uyuşmazlıklarda Türk mahkemeleri yetkilidir.
          </p>
        </section>

        <div className="border-t border-stroke pt-6 flex flex-wrap gap-4 text-sm">
          <Link href="/gizlilik" className="text-primary hover:underline">Gizlilik Politikası</Link>
          <Link href="/cerez-politikasi" className="text-primary hover:underline">Çerez Politikası</Link>
          <Link href="/iletisim" className="text-primary hover:underline">İletişim</Link>
        </div>
      </div>
    </div>
  )
}
