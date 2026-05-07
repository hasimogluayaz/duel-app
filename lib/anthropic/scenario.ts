import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })

export async function generateDailyScenario(): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `Sen Türkçe konuşan gençler için eğlenceli, günlük hayattan senaryolar üreten bir AI'sın.
Her gün farklı bir konu seç: iş, aşk, aile, arkadaşlık, sosyal medya, alışveriş, ulaşım, teknoloji, yemek, tatil vb.
Senaryo komik, tartışmalı veya utandırıcı ama zararsız bir durum olmalı. Maksimum 2 cümle.
Örnekler:
- "Yanlış kişiye mesaj attın ve fark ettin. Ne yazarsın?"
- "Kasiyerde para bitmişini öğrendin. Arkandaki kuyruğa ne söylersin?"
- "Patronuna yanlışlıkla emoji göndermişsin. Nasıl kurtarırsın?"
- "Sokakta birini tanıdığını sandın ve selamladın ama tanımıyormuşsun. Ne yaparsın?"
Sadece JSON formatında döndür: {"scenario": "senaryo metni"}

Bugünkü senaryoyu üret.`,
      },
    ],
    temperature: 0.9,
    max_tokens: 200,
    response_format: { type: 'json_object' },
  })

  const text = completion.choices[0]?.message?.content ?? ''
  try {
    const parsed = JSON.parse(text) as { scenario: string }
    return parsed.scenario
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return (JSON.parse(match[0]) as { scenario: string }).scenario
    if (text.length > 10) return text
    throw new Error('AI yanıtı geçersiz format döndürdü.')
  }
}
