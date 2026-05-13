import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'
import Groq from 'groq-sdk'

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new ApiError('Yapay zeka servisi şu an kullanılamıyor.', 503, 'SERVICE_UNAVAILABLE')
  return new Groq({ apiKey })
}

export const POST = withAuth(async (req) => {
  const body = await parseBody<{ content?: unknown; category?: unknown; scenario_type?: unknown }>(req)

  const content = String(body.content ?? '').trim()
  if (content.length < 10) throw new ApiError('Senaryo çok kısa.', 400, 'VALIDATION')
  if (content.length > 280) throw new ApiError('Senaryo çok uzun.', 400, 'VALIDATION')

  const category = String(body.category ?? 'genel')
  const type = String(body.scenario_type ?? 'scenario')

  const typeLabels: Record<string, string> = {
    scenario:  'Senaryo (ne yaparsın tarzı)',
    debate:    'Tartışma (iki taraflı)',
    emoji:     'Emoji (emoji ile yanıtlanır)',
    character: 'Karakter (rol yapma)',
  }

  const groq = getGroq()

  const prompt = `Sen Türk sosyal medya içerik editörüsün. Kullanıcının yazdığı senaryoyu viral potansiyelini artıracak şekilde geliştir.

Orijinal senaryo: "${content}"
Tür: ${typeLabels[type] ?? type}
Kategori: ${category}

Kurallar:
- Orijinal fikri ve anlamı koru
- Türkçe kal, konuşma diline uygun yaz
- Maksimum 280 karakter
- Daha merak uyandırıcı, daha "ikiye bölen" bir hale getir
- Hiçbir açıklama ekleme, sadece geliştirilmiş senaryoyu yaz

Geliştirilmiş senaryo:`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 150,
  })

  const improved = completion.choices[0]?.message?.content?.trim() ?? ''
  if (!improved || improved.length < 10) {
    throw new ApiError('Geliştirilemedi, tekrar dene.', 500, 'AI_ERROR')
  }

  // Trim to 280 chars
  return NextResponse.json({ improved: improved.slice(0, 280) })
})
