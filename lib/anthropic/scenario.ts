import Groq from 'groq-sdk'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('[Groq] Missing GROQ_API_KEY environment variable')
  return new Groq({ apiKey })
}

// ── Content moderation ────────────────────────────────────────────────────────
const BANNED_PATTERNS = [
  /aldatm/i,
  /yasadışı/i,
  /intihar/i,
  /şiddet/i,
]

const FOREIGN_WORDS = [
  /\bnicht[s]?\b/i, /\baber\b/i, /\bund\b/i, /\boder\b/i, /\bdas\b/i,
  /\bokay\b/i, /\bsorry\b/i, /\bplease\b/i, /\bbut\b/i,
]

function hasForeignWord(text: string): boolean {
  return FOREIGN_WORDS.some(re => re.test(text))
}

const KNOWN_BAD_SEAMS = [/eane\w/i, /ehep\w/i, /\wim\d/i]

function hasJoinedWords(text: string): boolean {
  const words = text.split(/\s+/)
  for (const w of words) {
    const clean = w.replace(/[.,!?;:()'"–—-]/g, '')
    if (clean.length > 22) return true
    if (/[bcçdfgğhjklmnpqrsştvwxyz]{4,}/i.test(clean)) return true
  }
  return KNOWN_BAD_SEAMS.some(re => re.test(text))
}

/**
 * Reject scenarios that ASSUME the user is married, has a spouse, görümce,
 * kayınvalide, kuzen, çocuk etc. These exclude all single/young users.
 * The scenario must work for "everyone" — a 22-year-old single university
 * student OR a 45-year-old parent should both be able to answer.
 */
const MARRIAGE_ONLY_PATTERNS = [
  /görümce/i, /kayınvalide/i, /kayınpeder/i, /kayınbirader/i, /kayınvalden/i,
  /\beşin\b/i, /\beşiniz\b/i, /\beşinle\b/i, /\beşine\b/i, /\beşinin\b/i, /\beşim\b/i,
  /\bkocanın\b/i, /\bkocan\b/i, /\bkocanız\b/i, /\bkarın\b/i, /\bkarınız\b/i,
  /\bnişanlın\b/i, /\bnişanlınız\b/i, /\bgelinin\b/i, /\bdamadın\b/i,
  /\bçocuğun\b/i, /\bçocuğunuz\b/i, /\boğlunuz\b/i, /\bkızınız\b/i,
  /düğün/i, // weddings — also exclude
]

function isMarriageOnly(text: string): boolean {
  return MARRIAGE_ONLY_PATTERNS.some(re => re.test(text))
}

function isValid(scenario: string): boolean {
  if (hasForeignWord(scenario)) return false
  if (BANNED_PATTERNS.some(re => re.test(scenario))) return false
  if (hasJoinedWords(scenario)) return false
  if (isMarriageOnly(scenario)) return false
  if (scenario.length > 350) return false
  if (scenario.length < 40) return false
  if (!scenario.trim().endsWith('?')) return false
  const wordCount = scenario.split(/\s+/).length
  if (wordCount < 12 || wordCount > 50) return false
  return true
}

// ── Categories — inclusive of single, young, working, student users ──────────
const CATEGORIES = [
  'arkadaşlık ve sırrı tutma',
  'para borç verme ve geri isteme',
  'iş yeri sınırları ve mobbing',
  'sosyal medya itibarı',
  'flört ve buluşma kuralları',
  'aile içi otorite ve özgürlük',
  'komşu ve apartman gerginliği',
  'oda arkadaşı ve ev paylaşımı',
  'üniversite ve sınav baskısı',
  'grup içinde dışlanma',
  'mahremiyet ve özel hayat',
  'kıskançlık ve karşılaştırma',
  'kalabalıkta yardım etme',
  'haksızlığa şahit olma',
  'verdiğin sözü tutma',
]

/**
 * Generate today's scenario.
 *
 * @param avoidRecent  Last N scenarios. Used to push the model away from
 *                     repeating subjects, characters, key nouns.
 * @param category     Optional override; default = date-rotated.
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
    ? `\nSON GÜNLERDE YAYINLANAN SENARYOLAR — bunların KARAKTERİNİ, KONUSUNU, KELİMELERİNİ TEKRAR ETME:\n${avoidRecent.map((s, i) => `${i + 1}. "${s}"`).join('\n')}\n`
    : ''

  const prompt = `Kapisio için günlük Türk kültürü senaryosu yazıyorsun. Platform: her yaştan, her statüden insan gerçek hayat ikilemlerini tartışıyor.

BUGÜNÜN KONUSU: ${chosenCategory}
${avoidBlock}

🚨 EN ÖNEMLİ KURAL — HERKESİ KAPSA:
Senaryo şu kişilere de cevap verebilir olmalı:
- 19 yaşında üniversite öğrencisi (BEKAR, evli değil)
- 25 yaşında çalışan genç (henüz evlenmemiş)
- 30 yaşında bekar profesyonel
- 40 yaşında evli birey
- 60 yaşında emekli

YAPMA — bu kelimeleri ASLA kullanma:
❌ "eşin", "eşinle", "eşinin", "kocan", "karın"
❌ "görümce", "kayınvalide", "kayınpeder", "kayınbirader"
❌ "nişanlın", "düğünün", "gelinin", "damadın"
❌ "çocuğun", "oğlun", "kızın"
❌ Evlilik kabul eden herhangi bir ifade

YAP — bu kişilik/ilişki dinamiklerine odaklan:
✅ Arkadaşlık: yakın arkadaş, grup, ekip, mahalle arkadaşı
✅ Aile (HERKESİN olduğu): anne, baba, kardeş, kuzen, hala, dayı, teyze, amca, dede, nine
✅ İş/okul: ekip arkadaşı, müdür, hoca, sınıf arkadaşı, oda arkadaşı, stajyer
✅ Sosyal: komşu, tanıdık, eski arkadaş, sosyal medya takipçisi
✅ Romantik (kabul eden ama zorunlu olmayan): hoşlandığın biri, çıktığın kişi, eski sevgili — sadece konuya direkt uygunsa

FORMAT KURALLARI:
- TAM 1 Türkçe cümle, 20-35 kelime
- "Ne yaparsın?" ile bit
- Her kelimeyi BOŞLUKLA ayır ("annemin söylediği", "anneminsöylediği" DEĞİL)
- 22 harften uzun tek kelime yazma
- Türkçe karakter (ç, ğ, ı, ö, ş, ü) kullan
- Sadece Türkçe — İngilizce/Almanca kelime yok

ÇEŞİTLİLİK ZORUNLU:
Eğer son senaryolarda "arkadaş" geçtiyse "ekip arkadaşı" yaz.
Eğer "para" geçtiyse "yardım" veya "iyilik" yaz.
HER GÜN farklı bir karakter, farklı bir durum.

TAM İKİYE BÖLSÜN:
Yarısı "yaparım" yarısı "yapmam" desin. Yarısı bir tarafı haklı bulsun, yarısı diğerini.

KESİN YASAKLAR:
- Aldatma, sadakatsizlik, yasadışı ilişki — ASLA
- Şiddet, intihar, suç — ASLA
- 2 veya daha fazla cümle
- Bitişik kelime hatası

İYİ ÖRNEKLER (evlilik yok, herkesi kapsıyor):
"En yakın arkadaşın 3 aydır borçlu ama yeni telefonun fotoğrafını sürekli sosyal medyada paylaşıyor — Sen ne yaparsın?"
"Grup ödevinde sadece sen çalışıyorsun, diğer 3 kişi hiçbir şey yapmıyor ama hoca eşit not verecek — Ne yaparsın?"
"Oda arkadaşın senin yokluğunda eşyalarını sürekli kullanıyor ve karşı çıkınca 'bu kadar bencillik olmaz' diyor — Ne yaparsın?"
"Müdürün toplantıda senin fikrini kendisininmiş gibi sundu, müdür yardımcısı da hemfikir görünüyor — Ne yaparsın?"
"Annenle aynı evdesin, 25 yaşındasın ve her gece nereye gittiğini sorguya çekiyor — Ne yaparsın?"
"Eski arkadaşın yeni bir hayat kurdu ve tüm grup sohbetinden çıktı, sen de takip ediyorsun ama yorum yapmıyor — Ne yaparsın?"
"Otobüste hamile bir kadın ayakta, hiç kimse yer vermiyor, sen sıkıştın ve ayağın çok ağrıyor — Ne yaparsın?"
"Sınavda yanındaki kız kopya çekiyor, hoca o tarafa hiç bakmıyor ve sen aynı sınavdan kötü not alabilirsin — Ne yaparsın?"

Şimdi "${chosenCategory}" konusunda, 1 cümlelik, tamamen Türkçe, EVLİLİK İÇERMEYEN, YENİ ve son senaryolardan farklı bir senaryo yaz.

Sadece JSON döndür: {"scenario": "senaryo metni"}`

  let lastInvalid = ''
  for (let attempt = 0; attempt < 6; attempt++) {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9 + attempt * 0.04,
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

  throw new Error(`[scenario] 6 attempts failed validation — last: "${lastInvalid.slice(0, 100)}"`)
}
