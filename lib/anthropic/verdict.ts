import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIVerdictResponse } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

export async function generateVerdict(
  scenario: string,
  answerA: string,
  answerB: string,
  votesA: number,
  votesB: number
): Promise<AIVerdictResponse> {
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

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned) as AIVerdictResponse
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as AIVerdictResponse
    throw new Error('AI yanıtı geçersiz format döndürdü.')
  }
}
