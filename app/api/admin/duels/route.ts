import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') ?? '').trim().toUpperCase()
  const mode = searchParams.get('mode') ?? '' // 'ai' | 'community' | ''
  const range = searchParams.get('range') ?? 'all' // 'today' | 'week' | 'all'
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = 25

  const service = createServiceClient()
  let query = service
    .from('duels')
    .select(`
      id, code, creator_id, scenario_id, judge_mode, ai_verdict, winner_id,
      voting_started_at, created_at,
      scenario:scenarios(id, content, active_date),
      creator:profiles!duels_creator_id_fkey(id, username, display_name, avatar_url),
      participants:duel_participants(id)
    `, { count: 'exact' })

  if (q) query = query.eq('code', q)
  if (mode === 'ai' || mode === 'community') query = query.eq('judge_mode', mode)

  if (range === 'today') {
    const todayStart = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00Z').toISOString()
    query = query.gte('created_at', todayStart)
  } else if (range === 'week') {
    const weekStart = new Date(Date.now() - 7 * 86400_000).toISOString()
    query = query.gte('created_at', weekStart)
  }

  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten participant counts
  const duels = (data ?? []).map((d: any) => ({
    ...d,
    participant_count: Array.isArray(d.participants) ? d.participants.length : 0,
  }))

  return NextResponse.json({ duels, total: count ?? 0, page, limit })
}

export async function DELETE(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('duels').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
