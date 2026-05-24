import Groq from 'groq-sdk'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('[Groq] Missing GROQ_API_KEY environment variable')
  return new Groq({ apiKey })
}

// ── Content moderation — these scenarios are regenerated ──────────────────────
const BANNED_PATTERNS = [
  /aldatm/i,
  /yasadışı/i,
  /intihar/i,
  /şiddet/i,
]

// Foreign words AI sometimes leaks in (German, English)
const FOREIGN_WORDS = [
  /\bnicht[s]?\b/i, /\baber\b/i, /\bund\b/i, /\boder\b/i, /\bdas\b/i,
  /\bokay\b/i, /\bsorry\b/i, /\bplease\b/i, /\bbut\b/i,
]

function hasForeignWord(text: string): boolean {
  return FOREIGN_WORDS.some(re => re.test(text))
}

/**
 * Detect joined / hallucinated Turkish words.
 * The model occasionally smashes things together: "görümceaneyi", "annemhep",
 * "evdebir". Heuristics that reject this without false-positiving real
 * compound Turkish words:
 *   - any single word longer than 22 chars (real Turkish words rarely exceed
 *     this; only specific suffix chains do)
 *   - 4+ consonants in a row mid-word (Turkish has vowel harmony, this is
 *     almost never legitimate)
 *   - known seam patterns: lowercase letter pairs that signal two roots joined
 */
const KNOWN_BAD_SEAMS = [
  /eane\w/i,          // ".eane.." (görümce + ane)
  /ehep\w/i,          // ".ehep..." (.e + hep)
  /\wim\d/i,          // suffix + digit
]

function hasJoinedWords(text: string): boolean {
  const words = text.split(/\s+/)
  for (const w of words) {
    // Strip punctuation
    const clean = w.replace(/[.,!?;:()'"–—-]/g, '')
    if (clean.length > 22) return true
    // 4+ consonants in a row (Turkish consonants only)
    if (/[bcçdfgğhjklmnpqrsştvwxyz]{4,}/i.test(clean)) return true
  }
  return KNOWN_BAD_SEAMS.some(re => re.test(text))
}

function isValid(scenario: string): boolean {
  if (hasForeignWord(scenario)) return false
  if (BANNED_PATTERNS.some(re => re.test(scenario))) return false
  if (hasJoinedWords(scenario)) return false
  if (scenario.length > 350) return false
  if (scenario.length < 40) return false
  // Must have a question mark at the end (Ne yaparsın?)
  if (!scenario.trim().endsWith('?')) return false
  // Reasonable word count
  const wordCount = scenario.split(/\s+/).length
  if (wordCount < 12 || wordCount > 50) return false
  return true
}

// ── Categories (rotated by date) ───────────────────────────────────────────────
const CATEGORIES = [
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

/**
 * Generate today's scenario.
 *
 * @param avoidRecent  Last N scenarios (full content) to tell the model "do
 *                     not repeat the SUBJECT or KEY ROLES of these". Pulled
 *                     by the route from the DB.
 * @param category     Optional override; if omitted, rotates by date.
 */
export async function generateDailyScenario(
  avoidRecent: string[] = [],
  category?: string,
): Promise<string> {
  const groq = getGroqClient()

  const dateStr = new Date().toISOString().split('T')[0]
  const dateNum = parseInt(dateStr.replace(/-/g, ''), 10)
  const chosenCategory = category ?? CATEGORIES[dateNum % CATEGORIES.length]

  const avoidBlock = avoidRecent.length > 0
    ? `\nSON GÜNLERDE ŞU SENARYOLAR YAYINLANDI — bunların ana karakterini, durumunu, kelimelerini TEKRAR ETME:\n${avoidRecent.map((s, i) => `${i + 1}. "${s}"`).join('\n')}\n`
    : ''

  const prompt = `Kapisio için günlük Türk kültürü senaryosu yazıyorsun. Platform: insanlar gerçek hayat kararlarını tartışıyor ve oylanıyor.

BUGÜNÜN KONUSU: ${chosenCategory}
${avoidBlock}
FORMAT — EN KRİTİK KURAL:
Senaryo TAM OLARAK 1 Türkçe cümle. "Ne yaparsın?" ile bitiyor. Başka hiçbir şey yok.
Hedef uzunluk: 20-35 kelime.

YAZIM KURALI — KESİNLİKLE UY:
- Her kelimeyi BOŞLUKLA ayır. "görümceyi" yaz, "görümceaneyi" değil.
- Kelimeleri ASLA birleştirme: "annemhep" YANLIŞ, "annem hep" DOĞRU.
- Türkçe karakter (ç, ğ, ı, ö, ş, ü) kullan, harfleri eksik bırakma.
- 22 harften uzun tek kelime yazma.
- Yazdığın senaryoyu zihinde TEKRAR OKU, yazım hatası varsa düzelt.

TÜRK KÜLTÜRÜNE ÖZGÜ OL — bugünün konusuna göre seç:
- Aile: kayınvalide, görümce, yenge, enişte, dayı, hala, kuzen
- Para: düğün masrafı, takı, kefil, faiz, başlık parası, harçlık
- İş: torpil, kıdem, müdür yeğeni, mesai, sigorta
- Mahalle: kapı komşusu, apartman yöneticisi, balkon kavgası
- Sosyal: WhatsApp grubu, Instagram story, ekran görüntüsü, ifşa

ÇEŞİTLİLİK:
Eğer son senaryolarda "görümce" geçtiyse görümce yazma, "kuzen" veya "yenge" dene.
Eğer "para" geçtiyse para yazma, "yardım" veya "iyilik" dene.
HER GÜN FARKLI bir karakter ve durum.

TAM İKİYE BÖLSÜN:
Yarısı "yaparım" yarısı "yapmam" desin. Herkesin hemfikir olduğu durumlar işe yaramaz.

KESİN YASAKLAR:
- Eşler arası aldatma, sadakatsizlik — ASLA
- Şiddet, intihar, suç — ASLA
- İngilizce / Almanca / yabancı kelime — sadece Türkçe
- 2 veya daha fazla cümle
- Bitişik kelime hatası ("görümceaneyi" tarzı)

İYİ ÖRNEKLER (yazıma dikkat):
"Kayınvalidenin düğüne davet ettiği 30 kişinin masraf faturası sana geldi, eşin 'annem hep böyle yapar' diyerek geçiştiriyor ama 8000 TL senin maaşının yarısı. Ne yaparsın?"
"Kefil olduğun amcanın oğlu 3 aydır kredi taksitini yatırmıyor ve seni engelledi, banka seni arıyor. Ne yaparsın?"
"Apartman yöneticisi sana sormadan ortak alana spor aleti koyma kararı aldı, sen karşı çıkınca grup seni yargılıyor. Ne yaparsın?"

Şimdi "${chosenCategory}" konusunda, 1 cümlelik, tamamen Türkçe, YENİ ve son senaryolardan farklı bir senaryo yaz.

Sadece JSON döndür: {"scenario": "senaryo metni"}`

  // Up to 5 attempts — retry if output fails validation
  let lastInvalid = ''
  for (let attempt = 0; attempt < 5; attempt++) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85 + attempt * 0.05,
      max_tokens: 200,
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

    lastInvalid = scenario ?? '(parse failed)'
    console.warn(`[scenario] attempt ${attempt + 1} failed validation:`, lastInvalid.slice(0, 100))
  }

  throw new Error(`[scenario] 5 attempts failed validation — last: "${lastInvalid.slice(0, 100)}"`)
}
