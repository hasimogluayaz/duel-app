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

  const categories = [
    'iş hayatı ve kariyer',
    'aşk ve ilişkiler',
    'aile baskısı',
    'para ve borç',
    'arkadaşlık ve sadakat',
    'sosyal medya ve itibar',
    'adalet ve dürüstlük',
    'kıskançlık ve rekabet',
    'gurur ve özür',
    'sır ve ihanet',
    'çocukluk ve geçmiş',
    'iş arkadaşı ve hiyerarşi',
  ]

  // Use date-based index for variety — different category each day, not just 8-day repeat
  const today = new Date().toISOString().split('T')[0]
  const dateNum = parseInt(today.replace(/-/g, ''), 10)
  const category = categories[dateNum % categories.length]

  const prompt = `Sen Kapisio için günlük senaryo yazıyorsun. Kapisio, insanların gerçek hayat durumlarında ne yapacaklarını tartıştığı Türk sosyal platformu.

Bugünkü konu: ${category}

ZORUNLU KURALLAR (hepsine uy):
1. SOMUT DETAY: "Bir arkadaşın" değil "5 yıllık en iyi arkadaşın", "bir miktar para" değil "3.000 TL" de.
2. TAM İKİYE BÖLSÜN: Okuyanların yarısı kesinlikle A, yarısı kesinlikle B yapardım desin. "Herkes aynı şeyi yapardı" diyebileceğin senaryo kötüdür.
3. DUYGUSAL YÜKLÜ: Aşağıdakilerden biri olsun — ihanet, utanç, vicdan azabı, kıskançlık, haksızlık, sadakat çatışması.
4. KISA: Tam 2-3 cümle. Son cümle "Ne yaparsın?" veya "Ne yapardın?" ile bitmeli.
5. DOĞAL TÜRKÇE: Resmi ya da yapay bir dil kullanma.

YASAK:
- "Ne düşünürsün?" ile bitirme — "Ne yaparsın?" ile bitir
- Çözümü belli olan durumlar yazma
- İngilizce veya Türkçe olmayan kelime kullanma
- Önceki örnekleri tekrar etme

KÖTÜ ÖRNEK (çok genel, ikiye bölmez):
"Arkadaşın senden para istedi ama daha önce verdiğini geri ödemedi. Ne yaparsın?"

İYİ ÖRNEK (somut, ikiye böler, duygusal):
"3 yıldır birlikte çalıştığın iş arkadaşın, toplantıda senin fikirlerini kendi fikirleri gibi sundu ve müdürden övgü aldı. Öğle yemeğinde seninle oturmak istiyor. Ne yaparsın?"

İYİ ÖRNEK 2 (somut, merak uyandırır):
"Sevgilinin telefonu masada açık kaldı. Kilit ekranında eski sevgilisinden 'özledim' mesajı gördün. Sevgilin hâlâ duşta. Ne yaparsın?"

Şimdi "${category}" kategorisinde, yukarıdaki kurallara uyan YENİ ve özgün bir senaryo yaz.

Sadece JSON döndür: {"scenario": "senaryo metni"}`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.85,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(text) as { scenario: string }
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
