import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

export async function generateDailyScenario(): Promise<string> {
  const prompt = `Sen Türk üniversite öğrencileri için eğlenceli, günlük hayattan senaryolar üreten bir AI'sın.
Her gün farklı, komik, tartışmalı ama zararsız bir senaryo üret.
Senaryo bir soru veya durum olmalı. Maksimum 2 cümle.
Örnekler:
- "Sınav sabahı hocana ödevini unuttuğunu nasıl anlatırsın? Mesajını buraya yaz."
- "Kafanda harika bir fikir var ama gruba yazmaya çekiniyorsun. Nasıl açarsın konuyu?"
- "Arkadaşından borç isteyeceksin ama utanıyorsun. Ne yazarsın?"
Sadece JSON formatında döndür: {"scenario": "senaryo metni"}

Bugünkü senaryoyu üret.`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // JSON'u temizle (bazen ```json ``` bloğu gelir)
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned) as { scenario: string }
    return parsed.scenario
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0]) as { scenario: string }
      return parsed.scenario
    }
    // If JSON fails entirely, the text itself may be the scenario
    if (cleaned.length > 10 && !cleaned.startsWith('{')) return cleaned
    throw new Error('AI yanıtı geçersiz format döndürdü.')
  }
}
