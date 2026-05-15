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

  const { data: newDuel, error } = await supabase
    .from('duels')
    .insert({
      code,
      scenario_id: scenario.id,
      creator_id: userId,
      creator_response_id: answer.id,
    })
    .select('code')
    .single()

  if (error) {
    console.error('[duel/invite POST]', error)
    throw new ApiError('Düello oluşturulamadı. Tekrar dene.', 500, 'DB_ERROR')
  }

  return NextResponse.json({
    code: newDuel.code,
    url: `https://kapisio.com/d/${newDuel.code}`,
  })
})
