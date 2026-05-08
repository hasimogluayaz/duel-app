import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { sendDailyScenarioEmail } from '@/lib/email/resend'

// Vercel cron: every day at 03:05 UTC (= 06:05 Turkey time, after scenario generates at 03:00)
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ message: 'RESEND_API_KEY not set, skipping.' })
  }

  const supabase = createApiClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: scenario } = await supabase
    .from('scenarios').select('content').eq('active_date', today).single()

  if (!scenario) return NextResponse.json({ message: 'No scenario today.' })

  // Get all non-banned users with email_notifications = true (all users for now)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('is_banned', false)
    .limit(1000)

  if (!profiles?.length) return NextResponse.json({ message: 'No users.' })

  let sent = 0
  let failed = 0

  for (const profile of profiles) {
    try {
      // We need email from auth — use service role
      const { data: authData } = await (supabase.auth as any).admin.getUserById(profile.id)
      const email = authData?.user?.email
      if (!email) continue

      await sendDailyScenarioEmail({
        to: email,
        username: profile.username,
        scenario: scenario.content,
      })
      sent++
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 100))
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed })
}
