import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import Groq from 'groq-sdk'

function getGroq() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Missing GROQ_API_KEY')
  return new Groq({ apiKey })
}

export const POST = withAuth(async (_req, { userId, params }) => {
  const duelId = params?.id
  if (!duelId) throw new ApiError('Düello ID gerekli.', 400, 'MISSING_FIELD')

  const supabase = createApiClient()

  // Get duel — only creator can trigger
  const { data: duel } = await supabase
    .from('duels')
    .select('id, creator_id, judge_mode, scenario_id, ai_verdict')
    .eq('id', duelId)
    .single()

  if (!duel) throw new ApiError('Düello bulunamadı.', 404, 'NOT_FOUND')
  if (duel.creator_id !== userId) throw new ApiError('Sadece kurucu AI kararı isteyebilir.', 403, 'FORBIDDEN')
  if (duel.judge_mode !== 'ai') throw new ApiError('Bu düello topluluk oyu modunda.', 400, 'WRONG_MODE')
  if (duel.ai_verdict) throw new ApiError('AI zaten karar verdi.', 409, 'ALREADY_JUDGED')

  // Get scenario
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('content')
    .eq('id', duel.scenario_id)
    .single()

  // Get all participants with their answers
  const { data: participants } = await supabase
    .from('duel_participants')
    .select('user_id, answer:answers(content), profile:profiles(username, display_name)')
    .eq('duel_id', duelId)
    .order('joined_at', { ascending: true })

  if (!participants || participants.length < 2) {
    throw new ApiError('AI karar verebilmek için en az 2 cevap gerekli.', 400, 'NOT_ENOUGH_ANSWERS')
  }

  // Build prompt
  const answerList = participants.map((p: any, i: number) => {
    const name = p.profile?.display_name || p.profile?.username || `Katılımcı ${i + 1}`
    const content = p.answer?.content ?? '(cevap yok)'
    return `Katılımcı ${i + 1} (${name}): "${content}"`
  }).join('\n\n')

  const prompt = `Sen bir Türk sosyal platformu için tarafsız bir hakem yapay zekasısın.

SENARYO:
"${scenario?.content ?? ''}"

CEVAPLAR:
${answerList}

GÖREV:
Yukarıdaki cevapları oku. En samimi, en düşündürücü veya en tutarlı cevabı seçerek kazananı belirle.

KURALLAR:
- Tamamen Türkçe yaz
- Kısa ve net ol (3-4 cümle)
- Kazananı açıkça belirt: "Kazanan: Katılımcı X (İsim)"
- Neden kazandığını kısaca açıkla
- Diğer katılımcılara da kısa geri bildirim ver

Sadece JSON döndür:
{
  "verdict": "karar metni buraya",
  "winner_index": 1,
  "winner_user_id": "uuid veya null"
}`

  const groq = getGroq()
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  let verdict = ''
  let winnerUserId: string | null = null

  try {
    const parsed = JSON.parse(raw) as { verdict?: string; winner_index?: number; winner_user_id?: string }
    verdict = parsed.verdict?.trim() ?? ''
    const idx = (parsed.winner_index ?? 1) - 1
    winnerUserId = participants[idx]?.user_id ?? null
  } catch {
    verdict = raw.slice(0, 500)
  }

  if (!verdict) throw new ApiError('AI karar üretemedi. Tekrar dene.', 500, 'AI_FAILED')

  // Save verdict to duel
  await supabase
    .from('duels')
    .update({ ai_verdict: verdict, winner_id: winnerUserId } as any)
    .eq('id', duelId)

  return NextResponse.json({ verdict, winner_user_id: winnerUserId })
})
