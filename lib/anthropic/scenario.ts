import Groq from 'groq-sdk'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('[Groq] Missing GROQ_API_KEY environment variable')
  return new Groq({ apiKey })
}

// Content moderation — these scenarios are regenerated
const BANNED_PATTERNS = [
  /aldatm/i,       // aldatma, aldatıyor, aldattı…
  /yasadışı/i,
  /intihar/i,
  /şiddet/i,
]

// Specific foreign words that AI sometimes injects (German, English)
const FOREIGN_WORDS = [
  /\bnicht[s]?\b/i, /\baber\b/i, /\bund\b/i, /\boder\b/i, /\bdas\b/i,  // German
  /\bokay\b/i, /\bsorry\b/i, /\bplease\b/i, /\bbut\b/i,                 // English
]

function hasForeignWord(text: string): boolean {
  return FOREIGN_WORDS.some(re => re.test(text))
}

function isValid(scenario: string): boolean {
  if (hasForeignWord(scenario)) return false
  if (BANNED_PATTERNS.some(re => re.test(scenario))) return false
  if (scenario.length > 350) return false
  if (scenario.length < 40) return false
  return true
}

export async function generateDailyScenario(): Promise<string> {
  const groq = getGroqClient()

  const categories = [
    'aile ve akraba baskısı',
    'para ve borç',
    'arkadaşlık ve sadakat',
    'iş yeri ve hiyerarşi',
    'gurur ve özür',
    'sosyal medya ve dedikodu',
    'adalet ve vicdan',
    'kıskançlık ve rekabet',
    'mahalle ve komşuluk',
    'düğün ve nişan kültürü',
    'sır ve sadakat',
    'aşk ve ilişki kararları',
  ]

  const today = new Date().toISOString().split('T')[0]
  const dateNum = parseInt(today.replace(/-/g, ''), 10)
  const category = categories[dateNum % categories.length]

  const prompt = `Kapisio için günlük Türk kültürü senaryosu yazıyorsun. Platform: insanlar gerçek hayat kararlarını tartışıyor ve oylanıyor.

Konu: ${category}

FORMAT — EN KRİTİK KURAL:
Senaryo TAM OLARAK 1 Türkçe cümle. "Ne yaparsın?" ile bitiyor. Başka hiçbir şey yok.
Hedef uzunluk: 20-35 kelime.

TÜRK KÜLTÜRÜNE ÖZGÜ OL:
Şunları doğal kullan (konuya uyanı seç):
- Kayınvalide, görümce, yenge, enişte dinamikleri
- Düğün parası, takı, mehir, başlık
- Torpil, kefil, borç, faiz
- Komşu dedikodusu, mahalle baskısı
- Büyüklere saygı vs. kişisel sınır
- İş yerinde yaş hiyerarşisi, adam kayırma
- Sosyal medyada ifşa, ekran görüntüsü

TAM İKİYE BÖLSÜN:
Yarısı "yaparım" yarısı "yapmam" desin. Herkesin hemfikir olduğu durumlar işe yaramaz.

KESİN YASAKLAR:
- Eşler arası aldatma, sadakatsizlik, yasadışı ilişki — bunları ASLA yazma
- Şiddet, intihar, suç içeriği
- İngilizce, Almanca veya başka dil kelimeler — sadece Türkçe
- 2 veya daha fazla cümle
- "Ne düşünürsün?" — sadece "Ne yaparsın?"

KÖTÜ (yabancı kelime var, aldatma içeriyor): yasak
KÖTÜ (2 cümle): yasak
KÖTÜ (çok genel): "Arkadaşın senden para istedi. Ne yaparsın?"

İYİ ÖRNEKLER (1 cümle, kültürel, ikiye böler):
"Kayınvalidenin düğüne davet ettiği 30 kişinin masraf faturası sana geldi, eşin 'annem hep böyle yapar' diyerek geçiştiriyor — ama 8.000 TL senin maaşının yarısı. Ne yaparsın?"
"Kefil olduğun amcanın oğlu 3 aydır kredi taksitini yatırmıyor ve seni engeledi — banka seni arıyor. Ne yaparsın?"
"İş yerinde senden kıdemsiz ama müdürün yeğeni olan biri terfi etti, sendikaya şikâyet etmeni isteyen arkadaşların var ama işini kaybetmekten korkuyorsun. Ne yaparsın?"

Şimdi "${category}" konusunda, 1 cümlelik, tamamen Türkçe, YENİ bir senaryo yaz.

Sadece JSON döndür: {"scenario": "senaryo metni"}`

  // Up to 4 attempts — retry if output fails validation
  for (let attempt = 0; attempt < 4; attempt++) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85 + attempt * 0.05, // slightly more random on retry
      max_tokens: 180,
      response_format: { type: 'json_object' },
    })

    const text = completion.choices[0]?.message?.content ?? ''

    let scenario: string | null = null
    try {
      const parsed = JSON.parse(text) as { scenario: string }
      if (parsed.scenario && typeof parsed.scenario === 'string') {
        scenario = parsed.scenario.trim()
      }
    } catch {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        try { scenario = (JSON.parse(match[0]) as { scenario: string }).scenario?.trim() } catch {}
      }
    }

    if (scenario && isValid(scenario)) return scenario

    console.warn(`[scenario] attempt ${attempt + 1} failed validation:`, scenario?.slice(0, 80))
  }

  throw new Error('[scenario] 4 attempts failed validation — check prompt or banned patterns')
}
