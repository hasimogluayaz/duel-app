import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET /api/admin/scenarios/[id]  — detailed scenario breakdown for admin panel
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { id } = params

  const [
    { data: scenario },
    { data: answers },
    { data: duels },
  ] = await Promise.all([
    service.from('scenarios').select('*').eq('id', id).single(),

    service.from('answers')
      .select(`
        id, content, vote_count, created_at,
        user:profiles(id, username, display_name, avatar_url, total_points)
      `)
      .eq('scenario_id', id)
      .order('vote_count', { ascending: false })
      .limit(50),

    service.from('duels')
      .select(`
        id, share_token, status, created_at, winner_id, vote_deadline,
        challenger_id, challenged_id,
        challenger:profiles!duels_challenger_id_fkey(id, username, display_name, avatar_url),
        challenged:profiles!duels_challenged_id_fkey(id, username, display_name, avatar_url),
        winner_profile:profiles!duels_winner_id_fkey(id, username, display_name)
      `)
      .eq('scenario_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!scenario) return NextResponse.json({ error: 'Senaryo bulunamadı.' }, { status: 404 })

  // Get vote counts per duel
  const duelIds = (duels ?? []).map((d: any) => d.id)
  let totalVotes = 0
  let duelsWithVotes: any[] = duels ?? []

  if (duelIds.length > 0) {
    const { data: voteRows } = await service
      .from('votes')
      .select('duel_id, voted_for_id')
      .in('duel_id', duelIds)

    const votesA: Record<string, number> = {}
    const votesB: Record<string, number> = {}

    for (const v of voteRows ?? [] as any[]) {
      const duel = (duels ?? []).find((d: any) => d.id === v.duel_id) as any
      if (!duel) continue
      totalVotes++
      if (v.voted_for_id === duel.challenger_id) {
        votesA[v.duel_id] = (votesA[v.duel_id] ?? 0) + 1
      } else {
        votesB[v.duel_id] = (votesB[v.duel_id] ?? 0) + 1
      }
    }

    duelsWithVotes = (duels ?? []).map((d: any) => ({
      ...d,
      votesA: votesA[d.id] ?? 0,
      votesB: votesB[d.id] ?? 0,
      total_votes: (votesA[d.id] ?? 0) + (votesB[d.id] ?? 0),
    }))
  }

  const completedCount = (duels ?? []).filter((d: any) => d.status === 'completed').length
  const activeCount    = (duels ?? []).filter((d: any) => d.status === 'active').length

  return NextResponse.json({
    scenario,
    answers: answers ?? [],
    duels: duelsWithVotes,
    stats: {
      total_answers:   (answers ?? []).length,
      total_duels:     (duels ?? []).length,
      active_duels:    activeCount,
      completed_duels: completedCount,
      total_votes:     totalVotes,
    },
  })
}
