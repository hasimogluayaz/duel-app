import { createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { sendWeeklyDigestEmail } from '@/lib/email/resend'

// Vercel cron: every Monday at 08:00 UTC (= 11:00 Turkey)
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ message: 'RESEND_API_KEY not set, skipping.' })
  }

  const supabase = createServiceClient()

  // Top 3 scenarios from the last 7 days by answer_count
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: topScenarios } = await supabase
    .from('scenarios')
    .select('id, content, answer_count')
    .eq('is_approved', true)
    .gte('created_at', weekAgo)
    .order('answer_count', { ascending: false })
    .limit(3)

  if (!topScenarios?.length) {
    return NextResponse.json({ message: 'No scenarios this week.' })
  }

  // Get all active users
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('is_banned', false)
    .limit(2000)

  if (!profiles?.length) return NextResponse.json({ message: 'No users.' })

  let sent = 0
  let failed = 0

  for (const profile of profiles) {
    try {
      const { data: authData } = await (supabase.auth as any).admin.getUserById(profile.id)
      const email = authData?.user?.email
      if (!email) continue

      await sendWeeklyDigestEmail({
        to: email,
        username: profile.username,
        scenarios: topScenarios as Array<{ content: string; answer_count: number; id: string }>,
      })
      sent++
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 120))
    } catch {
      failed++
    }
  }

  return NextResponse.json({ sent, failed, scenarioCount: topScenarios.length })
}
