import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

const VALID_EMOJIS = ['🔥', '💯', '😂', '🤔', '😮'] as const

/**
 * GET /api/reactions?answer_id=...
 * Returns emoji counts + which ones current user has reacted with
 */
export const GET = optionalAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const answerId = new URL(req.url).searchParams.get('answer_id')
  if (!answerId) throw new ApiError('answer_id gerekli.', 400, 'VALIDATION')

  const { data: reactions } = await supabase
    .from('answer_reactions')
    .select('emoji, user_id')
    .eq('answer_id', answerId)

  // Aggregate
  const counts: Record<string, number> = {}
  const mine: string[] = []
  for (const r of reactions ?? []) {
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1
    if (userId && r.user_id === userId) mine.push(r.emoji)
  }

  return NextResponse.json({ counts, mine })
})

/**
 * POST /api/reactions
 * { answer_id, emoji } — toggles (add if not exists, remove if exists)
 */
export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ answer_id?: unknown; emoji?: unknown }>(req)

  const answerId = String(body.answer_id ?? '')
  const emoji    = String(body.emoji ?? '')

  if (!answerId || !VALID_EMOJIS.includes(emoji as typeof VALID_EMOJIS[number])) {
    throw new ApiError('Geçersiz veri.', 400, 'VALIDATION')
  }

  // Can't react to own answer
  const { data: answer } = await supabase
    .from('answers').select('id, user_id').eq('id', answerId).single()
  if (!answer) throw new ApiError('Cevap bulunamadı.', 404, 'NOT_FOUND')
  if (answer.user_id === userId) throw new ApiError('Kendi cevabına tepki veremezsin.', 403, 'FORBIDDEN')

  // Check if already reacted with this emoji
  const { data: existing } = await supabase
    .from('answer_reactions')
    .select('id')
    .eq('user_id', userId)
    .eq('answer_id', answerId)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    // Toggle off
    await supabase.from('answer_reactions').delete().eq('id', existing.id)
    return NextResponse.json({ action: 'removed', emoji })
  }

  // Add reaction
  await supabase.from('answer_reactions').insert({ user_id: userId, answer_id: answerId, emoji })

  // Notify answer owner (non-blocking, only first time for this emoji)
  notifyReaction(supabase, answer.user_id, userId, answerId, emoji).catch(() => {})

  return NextResponse.json({ action: 'added', emoji })
})

async function notifyReaction(supabase: any, ownerId: string, reactorId: string, answerId: string, emoji: string) {
  if (ownerId === reactorId) return
  // Count total reactions for this emoji on this answer
  const { count } = await supabase.from('answer_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('answer_id', answerId).eq('emoji', emoji)

  // Notify at 5, 10, 25
  const milestones = [5, 10, 25]
  if (!milestones.includes(count ?? 0)) return

  await supabase.from('notifications').insert({
    user_id: ownerId,
    type: 'reaction_milestone',
    title: `${emoji} Tepki Patlaması!`,
    message: `Cevabın ${count} kişiden ${emoji} tepkisi aldı!`,
    data: { answer_id: answerId, emoji, count },
  })
}
