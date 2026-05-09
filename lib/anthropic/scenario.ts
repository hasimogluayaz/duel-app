import Groq from 'groq-sdk'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('[Groq] Missing GROQ_API_KEY environment variable')
  }
  return new Groq({ apiKey })
}

export async function generateDailyScenario(): Promise<string> {
  const groq = getGroqClient()

  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Pazar, 1=Pazartesi...
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  const prompt = `Sen Türk gençlere (18-30 yaş) yönelik viral sosyal medya senaryoları üreten bir içerik uzmanısın.
Bugün ${dayNames[dayOfWeek]}.

GÖREV: Aşağıdaki kriterleri karşılayan TEK bir senaryo üret.

VIRAL SENARYO KRİTERLERİ:
1. İnsanları gerçekten ikiye bölen bir durum — net bir "doğru cevap" OLMASIN
2. Herkesin yaşayabileceği ya da tanıdığı bir an
3. Türk kültürüne, sosyal normlarına veya güncel hayata özel referanslar
4. İnsanların "BEN NE YAPARDIN" diye düşünüp yorum yapmak isteyeceği bir his
5. Komik, cringe, utandırıcı, ya da ahlaki çatışma yaratan
6. Maksimum 2 kısa cümle

KAÇINILACAKLAR:
- "Patronuna yanlış mesaj attın" gibi klişe senaryolar
- Çocuk oyunlarını hatırlatan basit sorular
- Siyasi veya nefret içerikli şeyler
- Çok masum / çok sıradan durumlar

VİRAL OLABİLECEK KONULAR (bunlardan birini seç):

💔 İLİŞKİ / ALGI:
- Sevgilinin eski partneriyle arkadaş olmak zorunda kalma
- Tinderdaki eşleşmenin tanıdık biri çıkması
- Birinin seninle değil sosyal çevrenle çıkmak istediğini fark etme
- Partner telefon şifresini paylaşmamanın ne anlama geldiği
- "Sadece arkadaş" diyip kasıtlı kıskanç yapan biri

👨‍👩‍👧 AİLE / TOPLUM BASKISI:
- Ailenin beğenmediği birini seçmek zorunda kalma
- Kaynananın evde olduğu ilk hafta sonu
- Annenin sosyal medyanda yorum yapması
- Düğünde aile kavgasına dahil edilme
- Başarılı akrabanın seni küçümsemesi

💼 İŞ / PARA:
- İşten çıkarılacağını öğrenip son gün nasıl geçireceğini bilmeme
- Zam isteyen arkadaşa referans olmak
- Maaşını öğrenen arkadaşın senden çok kazandığını keşfetme
- Patronun haksız eleştirisine toplantıda cevap verip vermeme
- Hesap ödemekte yarışan ama sonra "paylaşalım" diyen birisi

📱 SOSYAL MEDYA / DİJİTAL:
- "Görüldü" atıp saatlerce cevap vermemenin kabul görür nedenleri
- İnstagrama koymamak için güzel anı yaşamamayı tercih etme
- Eski sevgilinin yeni partnerini stalk etme vs. hayatına devam etme
- Subtweet attığını bilen biriyle yüz yüze gelme
- Arkadaşın işteki rezaletini TikTok'ta izleme

🍽️ GÜNLÜK SOSYAL:
- Sipariş yanlış gelince iade mi etmek yoksa yememek mi
- Arkadaşın kötü kararı için "iyi fikir!" mi demek yoksa dürüst olmak mı
- Restoranda rezalet çıkaran arkadaşı savunmak
- Hemşehrinin yanlış bir şey yapmasına izin verip vermeme
- Parayı asla geri vermeyeceğini bildiğin yakına borç vermek

🎓 GENÇLİK / YENİ NESİL:
- Lise arkadaşının düğününe gidemeyeceğini hissettiren servet uçurumu
- İşe girmek için "bağlantı" kullanmak zorunda kalma
- Herkesten önce başarıya ulaşmanın yalnızlaştırması
- Tanımadığın biriyle aynı Spotify şarkısında bağ kurma
- "Çok çalış" diyen ama hiç çalışmadan miras bekleyen biri

BUGÜN GÜNÜN: ${dayNames[dayOfWeek]} — hafta ${dayOfWeek >= 5 ? 'sonu' : 'içi'}

Senaryo yazarken dikkat et:
- Okuyucu "acaba ne yapardım?" diye gerçekten duraksasın
- İki taraf da haklı sayılabilsin
- Özgün ol, internette daha önce görülmemiş bir şey yaz
- Türkçe konuşma diline uygun, ama kaba olmayan bir dil kullan

JSON formatında döndür: {"scenario": "senaryo metni", "category": "kategori"}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 1.0,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(text) as { scenario: string; category?: string }
    if (!parsed.scenario || typeof parsed.scenario !== 'string') {
      throw new Error('Missing scenario field')
    }
    return parsed.scenario.trim()
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return (JSON.parse(match[0]) as { scenario: string }).scenario
    if (text.length > 10) return text.trim()
    throw new Error(`[Groq] Invalid scenario response: ${text.slice(0, 100)}`)
  }
}
