import Groq from 'groq-sdk'
import type { AIPersonalityResponse } from '@/types'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })

export async function analyzePersonality(answers: string[]): Promise<AIPersonalityResponse> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `Sen bir kişilik analiz uzmanısın. Kullanıcının cevaplarını analiz ederek eğlenceli bir kişilik tipi belirleyeceksin.
Örnekler: "Filozofik Kaosçu", "Pratik Düşünür", "Komedi Ustası", "Sessiz Bilge", "Kaotik İyi", "Stratejik Dahi"
Türkçe yaz. Kısa ve eğlenceli ol.
JSON formatında döndür: {"personality_type": "kişilik tipi adı", "description": "kısa açıklama (max 80 karakter)"}

Bu kullanıcının son ${answers.length} cevabını analiz et ve kişilik tipini belirle:

${answers.map((a, i) => `${i + 1}. "${a}"`).join('\n')}

Sadece JSON döndür.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''
  try {
    return JSON.parse(text) as AIPersonalityResponse
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as AIPersonalityResponse
    throw new Error('AI yanıtı geçersiz format döndürdü.')
  }
}
