import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIPersonalityResponse } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function analyzePersonality(answers: string[]): Promise<AIPersonalityResponse> {
  const prompt = `Sen bir kişilik analiz uzmanısın. Kullanıcının cevaplarını analiz ederek eğlenceli bir kişilik tipi belirleyeceksin.
Örnekler: "Filozofik Kaosçu", "Pratik Düşünür", "Komedi Ustası", "Sessiz Bilge", "Kaotik İyi", "Stratejik Dahi"
Türkçe yaz. Kısa ve eğlenceli ol.
JSON formatında döndür: {"personality_type": "kişilik tipi adı", "description": "kısa açıklama (max 80 karakter)"}

Bu kullanıcının son ${answers.length} cevabını analiz et ve kişilik tipini belirle:

${answers.map((a, i) => `${i + 1}. "${a}"`).join('\n')}

Sadece JSON döndür.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    return JSON.parse(cleaned) as AIPersonalityResponse
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as AIPersonalityResponse
    throw new Error('AI yanıtı geçersiz format döndürdü.')
  }
}
