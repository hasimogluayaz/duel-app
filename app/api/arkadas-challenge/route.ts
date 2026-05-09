import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

/**
 * GET /api/arkadas-challenge?token=xxx
 * Public — returns challenge details for the landing page
 */
export const GET = optionalAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const token = new URL(req.url).searchParams.get('token')
  if (!token) throw new ApiError('Token gerekli.', 400, 'VALIDATION')

  const { data: challenge } = await (supabase.from('friend_challenges' as any) as any)
    .select(`
      id, token, expires_at, friend_answer_id,
      challenger:profiles!friend_challenges_challenger_id_fkey(username, display_name, avatar_url, total_points),
      scenario:scenarios!friend_challenges_scenario_id_fkey(id, content, category),
      challenger_answer:answers!friend_challenges_challenger_answer_id_fkey(id, content, vote_count)
    `)
    .eq('token', token)
    .single()

  if (!challenge) throw new ApiError('Challenge bulunamadı veya süresi doldu.', 404, 'NOT_FOUND')
  if (new Date(challenge.expires_at) < new Date()) {
    throw new ApiError('Bu meydan okumanın süresi dolmuş.', 410, 'EXPIRED')
  }

  // If friend already answered, return their answer too
  let friendAnswer = null
  if (challenge.friend_answer_id) {
    const { data: fa } = await supabase
      .from('answers').select('id, content, vote_count, user_id').eq('id', challenge.friend_answer_id).single()
    friendAnswer = fa
  }

  // Compatibility score (if both answered)
  let compatibilityScore: number | null = null
  if (challenge.challenger_answer && friendAnswer) {
    compatibilityScore = computeCompatibility(
      challenge.challenger_answer.content,
      friendAnswer.content,
    )
  }

  return NextResponse.json({ challenge, friendAnswer, compatibilityScore, userId })
})

/**
 * POST /api/arkadas-challenge — Create a challenge link
 * { scenario_id, answer_id }
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ scenario_id?: unknown; answer_id?: unknown }>(req)

  const scenarioId = String(body.scenario_id ?? '')
  const answerId   = String(body.answer_id   ?? '')

  if (!scenarioId || !answerId) throw new ApiError('Eksik alan.', 400, 'VALIDATION')

  // Verify answer belongs to user + scenario
  const { data: answer } = await supabase
    .from('answers').select('id').eq('id', answerId).eq('user_id', userId).eq('scenario_id', scenarioId).single()
  if (!answer) throw new ApiError('Cevap bulunamadı.', 404, 'NOT_FOUND')

  // Check if already have a live challenge for this answer
  const { data: existing } = await (supabase.from('friend_challenges' as any) as any)
    .select('token').eq('challenger_answer_id', answerId).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (existing) return NextResponse.json({ token: existing.token })

  const { data: challenge, error } = await (supabase.from('friend_challenges' as any) as any)
    .insert({ challenger_id: userId, scenario_id: scenarioId, challenger_answer_id: answerId })
    .select('token').single()

  if (error || !challenge) throw new ApiError('Link oluşturulamadı.', 500, 'DB_ERROR')

  return NextResponse.json({ token: challenge.token }, { status: 201 })
})

/**
 * PATCH /api/arkadas-challenge — Friend submits their answer
 * { token, content } — no auth required (anonymous allowed)
 */
export async function PATCH(req: Request) {
  const supabase = createApiClient()
  const { token, content } = await req.json()

  if (!token || !content?.trim()) {
    return NextResponse.json({ error: 'Token ve cevap gerekli.' }, { status: 400 })
  }

  const { data: challenge } = await (supabase.from('friend_challenges' as any) as any)
    .select('id, scenario_id, challenger_answer_id, friend_answer_id, challenger_id')
    .eq('token', token).single()

  if (!challenge) return NextResponse.json({ error: 'Geçersiz link.' }, { status: 404 })
  if (new Date() > new Date(challenge.expires_at)) {
    return NextResponse.json({ error: 'Süre dolmuş.' }, { status: 410 })
  }
  if (challenge.friend_answer_id) {
    // Already answered — return existing
    const { data: fa } = await supabase.from('answers').select('*').eq('id', challenge.friend_answer_id).single()
    const { data: ca } = await supabase.from('answers').select('*').eq('id', challenge.challenger_answer_id).single()
    return NextResponse.json({
      already_answered: true,
      friend_answer: fa,
      challenger_answer: ca,
      compatibility: computeCompatibility(ca?.content ?? '', fa?.content ?? ''),
    })
  }

  // Get current user if logged in
  const { data: { user } } = await supabase.auth.getUser()

  // Insert anonymous or authed answer
  let userId = user?.id
  if (!userId) {
    // Use challenger as placeholder — create "anonymous" answer linked to challenger's scenario
    // Actually: store as a special anonymous answer with user_id = challenger_id for now
    // Better approach: require no auth, just store content
    userId = challenge.challenger_id // fallback
  }

  // Don't let challenger answer their own challenge
  if (userId === challenge.challenger_id && user) {
    return NextResponse.json({ error: 'Kendi meydan okumana cevap veremezsin.' }, { status: 403 })
  }

  const { data: friendAnswer, error } = await supabase
    .from('answers')
    .insert({ user_id: userId, scenario_id: challenge.scenario_id, content: content.trim() })
    .select().single()

  if (error) return NextResponse.json({ error: 'Cevap kaydedilemedi.' }, { status: 500 })

  // Link friend answer to challenge
  await (supabase.from('friend_challenges' as any) as any)
    .update({ friend_answer_id: friendAnswer.id, friend_user_id: userId })
    .eq('token', token)

  // Get challenger answer for comparison
  const { data: challengerAnswer } = await supabase
    .from('answers').select('id, content').eq('id', challenge.challenger_answer_id).single()

  const compatibility = computeCompatibility(challengerAnswer?.content ?? '', content)

  // Notify challenger
  if (user) {
    await supabase.from('notifications').insert({
      user_id: challenge.challenger_id,
      type: 'friend_challenge_answered',
      title: '👥 Arkadaşın cevapladı!',
      message: `Meydan okumana cevap verildi. Uyum skoru: %${compatibility}`,
      data: { token, compatibility },
    })
  }

  return NextResponse.json({
    friend_answer: friendAnswer,
    challenger_answer: challengerAnswer,
    compatibility,
  })
}

/** Simple text similarity score 0-100 */
function computeCompatibility(textA: string, textB: string): number {
  if (!textA || !textB) return 0
  const wordsA = textA.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const wordsB = textB.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const setB = new Set(wordsB)
  const intersection = wordsA.filter(w => setB.has(w)).length
  const allWords = Array.from(new Set([...wordsA, ...wordsB]))
  if (allWords.length === 0) return 50
  const jaccard = intersection / allWords.length
  // Scale: 0 = completely different (but still interesting), 100 = identical
  // Map jaccard 0→30 and 1→95 so it's never 0 or 100
  return Math.round(30 + jaccard * 65)
}
