import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

export const POST = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const today = new Date().toISOString().split('T')[0]

  // Get today's scenario
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id')
    .eq('active_date', today)
    .eq('is_approved', true)
    .single()

  if (!scenario) {
    throw new ApiError('Bugün aktif senaryo yok.', 404, 'NO_SCENARIO')
  }

  // Check if user answered
  const { data: answer } = await supabase
    .from('answers')
    .select('id')
    .eq('user_id', userId)
    .eq('scenario_id', scenario.id)
    .maybeSingle()

  if (!answer) {
    throw new ApiError('Önce bugünün senaryosuna cevap ver.', 400, 'NOT_ANSWERED')
  }

  // Check existing duel
  const { data: existing } = await supabase
    .from('duels')
    .select('code')
    .eq('creator_id', userId)
    .eq('scenario_id', scenario.id)
    .maybeSingle()

  if (existing?.code) {
    return NextResponse.json({
      code: existing.code,
      url: `https://kapisio.com/d/${existing.code}`,
    })
  }

  // Generate unique 6-char code
  let code = ''
  let attempts = 0
  while (attempts < 5) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data: dup } = await supabase
      .from('duels')
      .select('id')
      .eq('code', code)
      .maybeSingle()
    if (!dup) break
    attempts++
  }

  // Try with creator_response_id first (migration 025), fall back without it
  let newDuel: { code: string; id: string } | null = null
  let insertError = null

  const withRef = await supabase
    .from('duels')
    .insert({ code, scenario_id: scenario.id, creator_id: userId, creator_response_id: answer.id })
    .select('code, id')
    .single()

  if (withRef.error) {
    // Column may not exist yet — retry without it
    const withoutRef = await supabase
      .from('duels')
      .insert({ code, scenario_id: scenario.id, creator_id: userId })
      .select('code, id')
      .single()
    newDuel = withoutRef.data
    insertError = withoutRef.error
  } else {
    newDuel = withRef.data
  }

  if (insertError || !newDuel) {
    console.error('[duel/invite POST]', insertError)
    throw new ApiError('Düello oluşturulamadı. Tekrar dene.', 500, 'DB_ERROR')
  }

  // Register creator as participant 1 (ignore error if already exists)
  await supabase
    .from('duel_participants')
    .upsert({ duel_id: newDuel.id, user_id: userId, answer_id: answer.id }, { onConflict: 'duel_id,user_id' })

  return NextResponse.json({
    code: newDuel.code,
    url: `https://kapisio.com/d/${newDuel.code}`,
  })
})
