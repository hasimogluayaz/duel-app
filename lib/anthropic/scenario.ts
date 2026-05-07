import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' })

export async function generateDailyScenario(): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'user',
        content: `Sen Türk üniversite öğrencileri için eğlenceli, günlük hayattan senaryolar üreten bir AI'sın.
Her gün farklı, komik, tartışmalı ama zararsız bir senaryo üret.
Senaryo bir soru veya durum olmalı. Maksimum 2 cümle.
Örnekler:
- "Sınav sabahı hocana ödevini unuttuğunu nasıl anlatırsın? Mesajını buraya yaz."
- "Kafanda harika bir fikir var ama gruba yazmaya çekiniyorsun. Nasıl açarsın konuyu?"
- "Arkadaşından borç isteyeceksin ama utanıyorsun. Ne yazarsın?"
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
