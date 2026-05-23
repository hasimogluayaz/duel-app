import { createApiClient, createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { generateShareToken } from '@/lib/utils/formatting'
import { sendDuelInviteEmail } from '@/lib/email/resend'
import { pushToUser } from '@/lib/push/notify'
import { checkRateLimit } from '@/lib/redis/ratelimit'
import { checkQuota } from '@/lib/quota/check'
import { logActivity } from '@/lib/activity/log'
import { updateWeeklyMission } from '@/lib/missions/weekly'

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

    // Redis rate limit (hourly sliding window)
    const rl = await checkRateLimit('duel', user.id)
    if (!rl.success) {
      return NextResponse.json({ error: 'Çok fazla düello isteği. Biraz bekle.' }, { status: 429 })
    }

    // Quota check (tier-based daily limit)
    try {
      await checkQuota(supabase, user.id, 'duels_per_day')
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 429 })
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

    // Activity log + weekly mission (fire-and-forget)
    logActivity({ supabase, userId: user.id, type: 'duel_created', targetId: duel.id, targetType: 'duel',
      data: { challenged_id, scenario_id } }).catch(() => {})
    updateWeeklyMission(supabase, user.id, 'weekly_duels').catch(() => {})

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

    // Send email to challenged user (fire-and-forget, uses service role for auth.admin)
    if (process.env.RESEND_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      ;(async () => {
        try {
          const admin = createServiceClient()
          const [{ data: challengedUser }, { data: authData }] = await Promise.all([
            admin.from('profiles').select('username').eq('id', challenged_id).single(),
            admin.auth.admin.getUserById(challenged_id),
          ])
          const email = authData?.user?.email
          if (email && challengedUser) {
            await sendDuelInviteEmail({
              to: email,
              username: challengedUser.username,
              challengerName: challenger?.display_name || challenger?.username || '?',
              duelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/duel/${shareToken}`,
            })
          }
        } catch (e) {
          console.error('[duel/create email]', e)
        }
      })()
    }

    return NextResponse.json({ duel })
  } catch (_err) {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
