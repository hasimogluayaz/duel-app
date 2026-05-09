import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'
import { updateWeeklyMission } from '@/lib/missions/weekly'

async function checkVoteRateLimit(supabase: any, userId: string): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('voter_id', userId)
    .gte('created_at', today.toISOString())
  return (count ?? 0) < 10
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await req.json()
    const { voted_for_id } = body

    // Get duel
    const { data: duelRaw } = await supabase
      .from('duels')
      .select('*')
      .eq('id', params.id)
      .single()

    const duel = duelRaw as any
    if (!duel) return NextResponse.json({ error: 'Düello bulunamadı.' }, { status: 404 })
    if (duel.status !== 'active') return NextResponse.json({ error: 'Düello aktif değil.' }, { status: 400 })

    if (duel.challenger_id === user.id || duel.challenged_id === user.id) {
      return NextResponse.json({ error: 'Kendi düellonuza oy veremezsiniz.' }, { status: 403 })
    }

    if (voted_for_id !== duel.challenger_id && voted_for_id !== duel.challenged_id) {
      return NextResponse.json({ error: 'Geçersiz oy.' }, { status: 400 })
    }

    if (duel.vote_deadline && new Date(duel.vote_deadline) < new Date()) {
      return NextResponse.json({ error: 'Oy süresi doldu.' }, { status: 400 })
    }

    const canVote = await checkVoteRateLimit(supabase, user.id)
    if (!canVote) {
      return NextResponse.json({ error: 'Günlük oy limitine ulaştınız (10/gün).' }, { status: 429 })
    }

    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('duel_id', duel.id)
      .eq('voter_id', user.id)
      .single()

    if (existingVote) {
      return NextResponse.json({ error: 'Bu düelloya zaten oy verdiniz.' }, { status: 409 })
    }

    const { error: voteError } = await supabase
      .from('votes')
      .insert({ duel_id: duel.id, voter_id: user.id, voted_for_id } as any)

    if (voteError) return NextResponse.json({ error: 'Oy kaydedilemedi.' }, { status: 500 })

    // Update weekly mission for voter
    updateWeeklyMission(supabase, user.id, 'weekly_votes').catch(() => {})

    // Add points to voted-for user AND to voter
    const [{ data: votedProfile }, { data: voterProfile }] = await Promise.all([
      supabase.from('profiles').select('total_points, weekly_points').eq('id', voted_for_id).single(),
      supabase.from('profiles').select('total_points, weekly_points').eq('id', user.id).single(),
    ])

    await Promise.all([
      votedProfile && supabase.from('profiles').update({
        total_points: (votedProfile.total_points || 0) + POINTS.VOTE_RECEIVED,
        weekly_points: (votedProfile.weekly_points || 0) + POINTS.VOTE_RECEIVED,
      } as any).eq('id', voted_for_id),
      voterProfile && supabase.from('profiles').update({
        total_points: (voterProfile.total_points || 0) + POINTS.VOTE_CAST,
        weekly_points: (voterProfile.weekly_points || 0) + POINTS.VOTE_CAST,
      } as any).eq('id', user.id),
    ])

    // Check vote milestones
    const { count: totalVotes } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id)
      .eq('voted_for_id', voted_for_id)

    const count = totalVotes ?? 0
    const milestone = [10, 50, 100].find(m => count >= m && count - 1 < m)
    if (milestone) {
      await supabase.from('notifications').insert({
        user_id: voted_for_id,
        type: 'vote_milestone',
        title: '⭐ Oy Rekoru!',
        message: `Cevabın ${milestone} oy aldı!`,
        data: { duel_id: duel.id, vote_count: milestone },
      } as any)

      if (milestone === 100) {
        await supabase.from('achievements').upsert({
          user_id: voted_for_id, type: 'popular' as const, earned_at: new Date().toISOString()
        } as any)
      }
    }

    // Check if vote difference > 70% → trigger result
    const { count: votesA } = await supabase
      .from('votes').select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id).eq('voted_for_id', duel.challenger_id)
    const { count: votesB } = await supabase
      .from('votes').select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id).eq('voted_for_id', duel.challenged_id)

    const total = (votesA ?? 0) + (votesB ?? 0)
    const maxVotes = Math.max(votesA ?? 0, votesB ?? 0)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (appUrl && total >= 5 && maxVotes / total >= 0.7) {
      fetch(`${appUrl}/api/duel/${duel.id}/result`, {
        method: 'GET',
        headers: { 'x-internal': 'true' },
      }).catch(() => {})
    }

    return NextResponse.json({ success: true })
  } catch (_err) {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
