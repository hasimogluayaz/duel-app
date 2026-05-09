import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth, optionalAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'
import { checkQuota } from '@/lib/quota/check'

const CATEGORIES = ['genel', 'ask', 'is', 'aile', 'sosyal', 'teknoloji', 'dunya', 'mizah'] as const
const MIN_CONTENT_LEN = 20
const MAX_CONTENT_LEN = 280

export const GET = optionalAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const url = new URL(req.url)
  const category = url.searchParams.get('category')
  const cursor = url.searchParams.get('cursor') // ISO date string for pagination
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 50)
  const sort = url.searchParams.get('sort') ?? 'recent' // recent | popular

  let query = supabase
    .from('scenarios')
    .select(`
      id, content, category, active_date, answer_count, created_at, is_user_created,
      author:profiles!scenarios_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq('is_approved', true)

  if (category && CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    query = query.eq('category', category)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  if (sort === 'popular') {
    query = query.order('answer_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query.limit(limit)

  if (error) {
    console.error('[scenarios GET]', error)
    throw new ApiError('Senaryolar yüklenemedi.', 500, 'DB_ERROR')
  }

  // If user logged in, fetch which ones they've already answered
  let answeredIds: string[] = []
  if (userId && data?.length) {
    const ids = data.map((s: any) => s.id)
    const { data: answers } = await supabase
      .from('answers')
      .select('scenario_id')
      .eq('user_id', userId)
      .in('scenario_id', ids)
    answeredIds = (answers ?? []).map((a: any) => a.scenario_id)
  }

  const scenarios = (data ?? []).map((s: any) => ({
    ...s,
    answered: answeredIds.includes(s.id),
  }))

  const nextCursor = data && data.length === limit
    ? data[data.length - 1].created_at
    : null

  return NextResponse.json({ scenarios, nextCursor })
})

export const POST = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<{ content?: unknown; category?: unknown }>(req)

  const content = String(body.content ?? '').trim()
  if (content.length < MIN_CONTENT_LEN) {
    throw new ApiError(`Senaryo en az ${MIN_CONTENT_LEN} karakter olmalı.`, 400, 'VALIDATION')
  }
  if (content.length > MAX_CONTENT_LEN) {
    throw new ApiError(`Senaryo en fazla ${MAX_CONTENT_LEN} karakter olabilir.`, 400, 'VALIDATION')
  }

  const category = String(body.category ?? 'genel')
  if (!CATEGORIES.includes(category as typeof CATEGORIES[number])) {
    throw new ApiError('Geçersiz kategori.', 400, 'VALIDATION')
  }

  // Quota check (tier-based daily limit)
  await checkQuota(supabase, userId, 'scenarios_per_day')

  const { data: scenario, error } = await supabase
    .from('scenarios')
    .insert({
      content,
      category,
      user_id: userId,
      is_user_created: true,
      is_approved: true,
    })
    .select(`
      id, content, category, answer_count, created_at, is_user_created,
      author:profiles!scenarios_user_id_fkey(username, display_name, avatar_url)
    `)
    .single()

  if (error || !scenario) {
    console.error('[scenarios POST]', error)
    throw new ApiError('Senaryo oluşturulamadı.', 500, 'DB_ERROR')
  }

  // Award mission progress
  await awardMission(supabase, userId, 'create_scenario')

  return NextResponse.json({ scenario }, { status: 201 })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function awardMission(supabase: any, userId: string, missionType: string) {
  const today = new Date().toISOString().split('T')[0]
  const goals: Record<string, { goal: number; points: number }> = {
    create_scenario: { goal: 1, points: 30 },
  }
  const cfg = goals[missionType]
  if (!cfg) return

  const { data: existing } = await supabase
    .from('user_daily_missions')
    .select('progress, completed')
    .eq('user_id', userId)
    .eq('date', today)
    .eq('mission_type', missionType)
    .maybeSingle()

  if (existing?.completed) return
  const newProgress = (existing?.progress ?? 0) + 1
  const completed = newProgress >= cfg.goal

  await supabase.from('user_daily_missions').upsert({
    user_id: userId, date: today, mission_type: missionType,
    progress: newProgress, completed,
    ...(completed ? { completed_at: new Date().toISOString(), points_awarded: cfg.points } : {}),
  }, { onConflict: 'user_id,date,mission_type' })
}
