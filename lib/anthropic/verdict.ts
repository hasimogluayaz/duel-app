import Groq from 'groq-sdk'
import type { AIVerdictResponse } from '@/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })

export async function generateVerdict(
  scenario: string,
  answerA: string,
  answerB: string,
  votesA: number,
  votesB: number
): Promise<AIVerdictResponse> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `Sen bir düello hakemisin. İki kişinin cevabını, topluluk oylarını ve senaryoyu değerlendirerek kazananı ilan edeceksin.
Kazanan için kısa ve eğlenceli bir açıklama yaz. Kaybeden için komik ama hafif bir roast yaz.
Türkçe yaz. Hakaret etme, sadece eğlenceli ol.
JSON formatında döndür: {"winner": "A" veya "B", "verdict": "kazanan açıklaması (max 100 karakter)", "roast": "kaybedene roast (max 150 karakter)"}

Senaryo: ${scenario}

Cevap A: "${answerA}"
Oy A: ${votesA}

Cevap B: "${answerB}"
Oy B: ${votesB}

Kazananı ilan et ve kaybedeni roast'la. Sadece JSON döndür.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''
  try {
    return JSON.parse(text) as AIVerdictResponse
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as AIVerdictResponse
    throw new Error('AI yanıtı geçersiz format döndürdü.')
  }
}
