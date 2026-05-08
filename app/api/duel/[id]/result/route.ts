import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { generateVerdict } from '@/lib/anthropic/verdict'
import { POINTS } from '@/types'
import { pushToUser } from '@/lib/push/notify'
import { sendDuelResultEmail } from '@/lib/email/resend'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createApiClient()

    const { data: duelRaw } = await supabase
      .from('duels')
      .select(`
        *,
        scenario:scenarios(content),
        challenger_answer:answers!duels_challenger_answer_id_fkey(content),
        challenged_answer:answers!duels_challenged_answer_id_fkey(content)
      `)
      .eq('id', params.id)
      .single()

    const duel = duelRaw as any
    if (!duel) return NextResponse.json({ error: 'Düello bulunamadı.' }, { status: 404 })
    if (duel.status === 'completed') return NextResponse.json({ duel })
    if (duel.status !== 'active') return NextResponse.json({ error: 'Düello aktif değil.' }, { status: 400 })

    const isExpired = duel.vote_deadline && new Date(duel.vote_deadline) < new Date()

    const { count: votesA } = await supabase
      .from('votes').select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id).eq('voted_for_id', duel.challenger_id)
    const { count: votesB } = await supabase
      .from('votes').select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id).eq('voted_for_id', duel.challenged_id)

    const vA = votesA ?? 0
    const vB = votesB ?? 0
    const total = vA + vB
    const maxVotes = Math.max(vA, vB)
    const highDiff = total >= 5 && maxVotes / total >= 0.7

    if (!isExpired && !highDiff) {
      return NextResponse.json({ message: 'Düello hâlâ devam ediyor.' })
    }

    // Generate AI verdict
    const verdict = await generateVerdict(
      duel.scenario?.content ?? '',
      duel.challenger_answer?.content ?? '',
      duel.challenged_answer?.content ?? '',
      vA, vB
    )

    const winnerId = verdict.winner === 'A' ? duel.challenger_id : duel.challenged_id
    const loserId = verdict.winner === 'A' ? duel.challenged_id : duel.challenger_id

    await supabase.from('duels').update({
      status: 'completed',
      winner_id: winnerId,
      ai_verdict: verdict.verdict,
      ai_roast: verdict.roast,
    } as any).eq('id', duel.id)

    // Award points
    const [{ data: winnerProfile }, { data: loserProfile }] = await Promise.all([
      supabase.from('profiles').select('total_points, weekly_points').eq('id', winnerId).single(),
      supabase.from('profiles').select('total_points, weekly_points').eq('id', loserId).single(),
    ])

    await Promise.all([
      winnerProfile && supabase.from('profiles').update({
        total_points: (winnerProfile.total_points || 0) + POINTS.DUEL_WIN,
        weekly_points: (winnerProfile.weekly_points || 0) + POINTS.DUEL_WIN,
      } as any).eq('id', winnerId),
      loserProfile && supabase.from('profiles').update({
        total_points: (loserProfile.total_points || 0) + POINTS.DUEL_LOSE,
        weekly_points: (loserProfile.weekly_points || 0) + POINTS.DUEL_LOSE,
      } as any).eq('id', loserId),
    ])

    // Check achievements
    const { count: winCount } = await supabase
      .from('duels').select('*', { count: 'exact', head: true }).eq('winner_id', winnerId)

    const wc = winCount ?? 0
    if (wc >= 1 && wc - 1 < 1) {
      await supabase.from('achievements').upsert({
        user_id: winnerId, type: 'first_win' as const, earned_at: new Date().toISOString()
      } as any)
    }
    if (wc >= 10 && wc - 1 < 10) {
      await supabase.from('achievements').upsert({
        user_id: winnerId, type: 'roast_master' as const, earned_at: new Date().toISOString()
      } as any)
    }

    const duelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/duel/${duel.share_token}`

    // In-app notifications
    await Promise.all([
      supabase.from('notifications').insert({
        user_id: winnerId,
        type: 'duel_result',
        title: '🏆 Düelloyu Kazandın!',
        message: `AI yorumu: "${verdict.verdict}"`,
        data: { duel_id: duel.id, share_token: duel.share_token },
      } as any),
      supabase.from('notifications').insert({
        user_id: loserId,
        type: 'duel_result',
        title: '😅 Düelloyu Kaybettin',
        message: `AI roast: "${verdict.roast}"`,
        data: { duel_id: duel.id, share_token: duel.share_token },
      } as any),
    ])

    // Push notifications (fire-and-forget)
    const [{ data: winnerProf }, { data: loserProf }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', winnerId).single(),
      supabase.from('profiles').select('username').eq('id', loserId).single(),
    ])

    Promise.all([
      pushToUser(winnerId, { title: '🏆 Düelloyu Kazandın!', body: `AI: "${verdict.verdict.slice(0, 80)}"`, url: duelUrl }),
      pushToUser(loserId, { title: '😅 Düelloyu Kaybettin', body: `AI: "${verdict.roast.slice(0, 80)}"`, url: duelUrl }),
    ]).catch(() => {})

    // Email notifications (fire-and-forget)
    ;(async () => {
      try {
        const [{ data: winnerAuth }, { data: loserAuth }] = await Promise.all([
          (supabase.auth as any).admin.getUserById(winnerId),
          (supabase.auth as any).admin.getUserById(loserId),
        ])
        const tasks: Promise<unknown>[] = []
        if (winnerAuth?.user?.email && winnerProf) {
          tasks.push(sendDuelResultEmail({ to: winnerAuth.user.email, username: winnerProf.username, won: true, verdict: verdict.verdict, duelUrl }))
        }
        if (loserAuth?.user?.email && loserProf) {
          tasks.push(sendDuelResultEmail({ to: loserAuth.user.email, username: loserProf.username, won: false, verdict: verdict.roast, duelUrl }))
        }
        await Promise.allSettled(tasks)
      } catch {}
    })()

    return NextResponse.json({ verdict, winnerId })
  } catch (_err) {
    console.error('Result error:', _err)
    return NextResponse.json({ error: 'Sonuç hesaplanamadı.' }, { status: 500 })
  }
}
