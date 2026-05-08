import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/utils/formatting'

export async function POST(_req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const today = new Date().toISOString().split('T')[0]

    // Get today's scenario
    const { data: scenario } = await supabase
      .from('scenarios')
      .select('id')
      .eq('active_date', today)
      .single()

    if (!scenario) return NextResponse.json({ error: 'Bugün senaryo yok.' }, { status: 404 })

    // Get user's answer for today
    const { data: myAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', user.id)
      .eq('scenario_id', scenario.id)
      .single()

    if (!myAnswer) {
      return NextResponse.json({ error: 'Önce bugünkü senaryoya cevap vermelisin.' }, { status: 400 })
    }

    // Find users already dueled with today
    const { data: existingDuels } = await supabase
      .from('duels')
      .select('challenger_id, challenged_id')
      .eq('scenario_id', scenario.id)
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)

    const excludedIds = new Set<string>([user.id])
    existingDuels?.forEach((d: { challenger_id: string; challenged_id: string }) => {
      excludedIds.add(d.challenger_id)
      excludedIds.add(d.challenged_id)
    })

    // Find random opponent who answered today
    const { data: candidates } = await supabase
      .from('answers')
      .select('user_id')
      .eq('scenario_id', scenario.id)
      .neq('user_id', user.id)
      .limit(50)

    const eligible = (candidates ?? []).filter((a: { user_id: string }) => !excludedIds.has(a.user_id))

    if (eligible.length === 0) {
      return NextResponse.json({ error: 'Şu an müsait rakip yok. Birazdan tekrar dene!' }, { status: 404 })
    }

    // Pick random opponent
    const opponent = eligible[Math.floor(Math.random() * eligible.length)]

    // Get opponent's answer
    const { data: opponentAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', opponent.user_id)
      .eq('scenario_id', scenario.id)
      .single()

    if (!opponentAnswer) {
      return NextResponse.json({ error: 'Rakip bulunamadı.' }, { status: 404 })
    }

    // Create duel (auto-active since both answers exist)
    const shareToken = generateShareToken()
    const voteDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const { data: duel, error: duelError } = await supabase
      .from('duels')
      .insert({
        scenario_id: scenario.id,
        challenger_id: user.id,
        challenged_id: opponent.user_id,
        challenger_answer_id: myAnswer.id,
        challenged_answer_id: opponentAnswer.id,
        status: 'active',
        share_token: shareToken,
        vote_deadline: voteDeadline,
      } as any)
      .select()
      .single()

    if (duelError || !duel) {
      return NextResponse.json({ error: 'Düello oluşturulamadı.' }, { status: 500 })
    }

    // Notify opponent
    await supabase.from('notifications').insert({
      user_id: opponent.user_id,
      type: 'duel_invite',
      title: '⚔️ Hızlı Düello Başladı!',
      message: 'Birisi seninle düello başlattı. Oylamanı bekliyor!',
      data: { duel_id: (duel as any).id, share_token: shareToken },
    } as any)

    return NextResponse.json({ duel })
  } catch (_err) {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
