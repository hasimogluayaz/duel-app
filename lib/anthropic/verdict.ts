import Groq from 'groq-sdk'
import type { AIVerdictResponse } from '@/types'

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('[Groq] Missing GROQ_API_KEY environment variable')
  }
  return new Groq({ apiKey })
}

export async function generateVerdict(
  scenario: string,
  answerA: string,
  answerB: string,
  votesA: number,
  votesB: number,
): Promise<AIVerdictResponse> {
  const groq = getGroqClient()

  const prompt = `Sen bir düello hakemisin. İki kişinin cevabını, topluluk oylarını ve senaryoyu değerlendirerek kazananı ilan edeceksin.
Kazanan için kısa ve eğlenceli bir açıklama yaz. Kaybeden için komik ama hafif bir roast yaz.
Türkçe yaz. Hakaret etme, sadece eğlenceli ol.
JSON formatında döndür: {"winner": "A" veya "B", "verdict": "kazanan açıklaması (max 100 karakter)", "roast": "kaybedene roast (max 150 karakter)"}

Senaryo: ${scenario}

Cevap A: "${answerA}"
Oy A: ${votesA}

Cevap B: "${answerB}"
Oy B: ${votesB}

Kazananı ilan et ve kaybedeni roast'la. Sadece JSON döndür.`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(text) as AIVerdictResponse
    // Validate required fields
    if (!parsed.winner || !parsed.verdict || !parsed.roast) {
      throw new Error('Incomplete verdict response')
    }
    return parsed
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as AIVerdictResponse
    throw new Error(`[Groq] Invalid verdict response: ${text.slice(0, 100)}`)
  }
}
