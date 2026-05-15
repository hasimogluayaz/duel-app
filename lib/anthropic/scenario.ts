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
  ]
  const category = categories[new Date().getDay() % categories.length]

  const prompt = `Sen Kapisio için günlük senaryo yazıyorsun. Kapisio, insanların gerçek hayat durumlarında ne yapacaklarını tartıştığı bir platform.

Bugünkü konu: ${category}

İYİ SENARYO KURALI — hepsini karşılamalısın:
1. SOMUT: Gerçek bir yer, gerçek bir ilişki, gerçek bir rakam olsun. "Bir arkadaşın" değil, "5 yıllık en iyi arkadaşın" de.
2. İKİYE BÖLEN: Okuyanların yarısı "kesinlikle A yapardım", yarısı "kesinlikle B yapardım" desin. Herkes hemfikirse senaryo kötüdür.
3. DUYGUSAL: Hafif rahatsız edici olsun. Haksızlık, ihanet, utanç, vicdan azabı, kıskançlık — bunlardan biri olsun.
4. KISA: 2-3 cümle. Son cümle mutlaka "Ne yaparsın?" veya "Ne yapardın?" ile bitsin.
5. TÜRKÇE KONUŞMA DİLİ: Resmi değil, doğal.

KÖTÜ ÖRNEK (çok genel, tartışma doğurmaz):
"Arkadaşın senden para istedi ama daha önce verdiğini geri ödemedi. Ne yaparsın?"

İYİ ÖRNEK:
"3 yıldır birlikte çalıştığın iş arkadaşın, senin fikirlerini toplantıda kendi fikirleri gibi sundu ve müdürden övgü aldı. Öğle yemeğinde seninle oturmak istiyor. Ne yaparsın?"

İYİ ÖRNEK 2:
"Sevgilinin telefonu masada açık kaldı. Kilit ekranında eski sevgilisinden 'özledim' mesajı gördün. Sevgilin hâlâ duşta. Ne yaparsın?"

Şimdi ${category} kategorisinde, yukarıdaki kurallara uyan YENİ bir senaryo yaz. Daha önce yazılmış örnekleri tekrar etme.

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
