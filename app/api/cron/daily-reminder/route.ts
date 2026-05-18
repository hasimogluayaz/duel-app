import { createServiceClient } from '@/lib/supabase/typed'
import { sendPushNotification } from '@/lib/push/webpush'
import { NextResponse } from 'next/server'

// Vercel cron: every day at 17:00 UTC = 20:00 Turkey time
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  // Get today's scenario
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('id, content')
    .eq('active_date', today)
    .single()

  if (!scenario) return NextResponse.json({ message: 'No scenario today.' })

  // Users who already answered today
  const { data: answeredUsers } = await supabase
    .from('answers')
    .select('user_id')
    .eq('scenario_id', scenario.id)

  const answeredIds = new Set((answeredUsers ?? []).map((a: any) => a.user_id))

  // All push subscriptions — users who haven't answered
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth')

  if (!subs?.length) return NextResponse.json({ message: 'No subscriptions.' })

  const pending = subs.filter((s: any) => !answeredIds.has(s.user_id))

  const scenarioPreview = scenario.content.length > 80
    ? scenario.content.slice(0, 80) + '…'
    : scenario.content

  let sent = 0
  let failed = 0

  for (const sub of pending) {
    try {
      await sendPushNotification(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        {
          title: 'Bugünkü senaryoyu cevaplamadın',
          body: scenarioPreview,
          url: '/',
        }
      )
      sent++
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: pending.length })
}
