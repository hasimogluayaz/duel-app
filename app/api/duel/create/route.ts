import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/utils/formatting'
import { sendDuelInviteEmail } from '@/lib/email/resend'
import { pushToUser } from '@/lib/push/notify'

// Rate limit: max 5 duels per day per user
async function checkDuelRateLimit(supabase: any, userId: string): Promise<boolean> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('duels')
    .select('*', { count: 'exact', head: true })
    .eq('challenger_id', userId)
    .gte('created_at', today.toISOString())

  return (count ?? 0) < 5
}

export async function POST(req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await req.json()
    const { challenged_id, scenario_id, challenger_answer_id } = body

    if (!challenged_id || !scenario_id || !challenger_answer_id) {
      return NextResponse.json({ error: 'Eksik alan.' }, { status: 400 })
    }

    if (challenged_id === user.id) {
      return NextResponse.json({ error: 'Kendinizi düelloya çağıramazsınız.' }, { status: 400 })
    }

    // Rate limit check
    const canCreate = await checkDuelRateLimit(supabase, user.id)
    if (!canCreate) {
      return NextResponse.json({ error: 'Günlük düello limitine ulaştınız (5/gün).' }, { status: 429 })
    }

    // Check if duel already exists between these users for this scenario
    const { data: existing } = await supabase
      .from('duels')
      .select('id, share_token')
      .eq('scenario_id', scenario_id)
      .or(`and(challenger_id.eq.${user.id},challenged_id.eq.${challenged_id}),and(challenger_id.eq.${challenged_id},challenged_id.eq.${user.id})`)
      .single()

    if (existing) {
      return NextResponse.json({ duel: existing, message: 'Zaten düello var.' })
    }

    // Check if challenged user has an answer for this scenario
    const { data: challengedAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', challenged_id)
      .eq('scenario_id', scenario_id)
      .single()

    const voteDeadline = new Date()
    voteDeadline.setHours(voteDeadline.getHours() + 24)

    const shareToken = generateShareToken()

    const { data: duel, error } = await supabase
      .from('duels')
      .insert({
        scenario_id,
        challenger_id: user.id,
        challenged_id,
        challenger_answer_id,
        challenged_answer_id: challengedAnswer?.id || null,
        status: challengedAnswer ? 'active' : 'pending',
        vote_deadline: challengedAnswer ? voteDeadline.toISOString() : null,
        share_token: shareToken,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Düello oluşturulamadı.' }, { status: 500 })

    // Get challenger's profile for notification
    const { data: challenger } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', user.id)
      .single()

    // Send in-app notification to challenged user
    await supabase.from('notifications').insert({
      user_id: challenged_id,
      type: 'duel_invite',
      title: '⚔️ Düello Daveti!',
      message: `${challenger?.display_name || challenger?.username} seni düelloya çağırdı!`,
      data: { duel_id: duel.id, share_token: shareToken, challenger_id: user.id },
    })

    // Push notification to challenged user (fire-and-forget)
    pushToUser(challenged_id, {
      title: '⚔️ Düello Daveti!',
      body: `${challenger?.display_name || challenger?.username} seni düelloya çağırdı!`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/duel/${shareToken}`,
    }).catch(() => {})

    // Send email to challenged user (fire-and-forget)
    const { data: challengedUser } = await supabase
      .from('profiles').select('username').eq('id', challenged_id).single()
    const { data: { user: authUser } } = await supabase.auth.admin
      ? { data: { user: null } }
      : { data: { user: null } }
    // Get email via service role
    supabase.auth.admin?.getUserById?.(challenged_id)
      .then(({ data }: { data: { user: { email?: string } | null } | null }) => {
        if (data?.user?.email && challengedUser) {
          sendDuelInviteEmail({
            to: data.user.email,
            username: challengedUser.username,
            challengerName: challenger?.display_name || challenger?.username || '?',
            duelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/duel/${shareToken}`,
          }).catch(() => {})
        }
      }).catch(() => {})

    return NextResponse.json({ duel })
  } catch (_err) {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
