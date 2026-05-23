import Groq from 'groq-sdk'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('[Groq] Missing GROQ_API_KEY environment variable')
  return new Groq({ apiKey })
}

export async function generateDailyScenario(): Promise<string> {
  const groq = getGroqClient()

  const categories = [
    'aile ve akraba baskısı',
    'aşk ve aldatma',
    'para ve borç',
    'arkadaşlık ve ihanet',
    'iş yeri ve hiyerarşi',
    'gurur ve özür',
    'sosyal medya ve dedikodu',
    'adalet ve vicdan',
    'kıskançlık ve rekabet',
    'mahalle ve komşuluk',
    'düğün ve nişan kültürü',
    'sır ve sadakat',
  ]

  const today = new Date().toISOString().split('T')[0]
  const dateNum = parseInt(today.replace(/-/g, ''), 10)
  const category = categories[dateNum % categories.length]

  const prompt = `Kapisio için günlük Türk kültürü senaryosu yazıyorsun. Platform: insanlar gerçek hayat kararlarını tartışıyor ve oylanıyor.

Konu: ${category}

FORMAT KURALI — EN ÖNEMLİ:
Senaryo TAM OLARAK 1 cümle olacak. Nokta yok, virgül yok; tek cümle, "Ne yaparsın?" ile bitiyor.
Örnek uzunluk: "Anneni ziyarete gittiğinde kayınvalidenin sana bıraktığı 5.000 TL'yi buluyorsun — ama eşin bundan habersiz. Ne yaparsın?"

TÜRK KÜLTÜRÜNE ÖZGÜ OL:
Aşağıdaki gerçekleri doğal kullan — hepsini değil, sadece konuya uyanı:
- Kayınvalide, görümce, enişte, yenge dinamikleri
- Düğün parası, takı, mehir, çeyiz
- Askerlik, kayırmacılık, torpil
- Komşu dedikodusu, mahalle baskısı
- Borç vermek/almak, kefil olmak
- Sosyal medyada ifşa, ekran görüntüsü
- Büyüklere saygı vs. kişisel sınır çatışması
- İstanbul / taşra / göç gerilimi
- İş yerinde yaş hiyerarşisi, "abicim" kültürü

TAM İKİYE BÖLSÜN:
İnsanların yarısı "kesinlikle yaparım", yarısı "asla yapmam" desin. Herkesin aynı cevabı vereceği durumlar yasak.

YASAK:
- 2 veya daha fazla cümle — sadece 1 cümle
- "Ne düşünürsün?" — sadece "Ne yaparsın?"
- Yapay, resmi, genel Türkçe — sokak dili kullan
- Yabancı kelime
- Çözümü belli olan durumlar

KÖTÜ (çok genel, 2 cümle, kültürsüz):
"İş arkadaşın fikirlerini çaldı. Ne yaparsın?"

İYİ (1 cümle, Türk kültürü, ikiye böler):
"Düğün günü kayınvaliden tarafı için hazırladığın 120 kişilik yemeği kendi anneleri yapmış gibi herkese anlatıyor — ama eşin 'geç kalsın annem mutlu olsun' diyor. Ne yaparsın?"

"Askerliğini erken bitirmek için kaymakamlıkta tanıdığı olan bir amcanoğlu 'bana 15 bin ver hallederim' dedi — devlet sınavında kazanmak için 3 aydır çalışıyorsun. Ne yaparsın?"

Şimdi "${category}" konusunda, yukarıdaki kurallara tam uyan, 1 cümlelik YENİ bir senaryo yaz.

Sadece JSON döndür: {"scenario": "senaryo metni"}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 150,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(text) as { scenario: string }
    if (!parsed.scenario || typeof parsed.scenario !== 'string') throw new Error('Missing scenario field')
    return parsed.scenario.trim()
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return (JSON.parse(match[0]) as { scenario: string }).scenario
    if (text.length > 10) return text.trim()
    throw new Error(`[Groq] Invalid scenario response: ${text.slice(0, 100)}`)
  }
}
