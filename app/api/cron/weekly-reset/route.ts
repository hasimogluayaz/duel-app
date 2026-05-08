import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

// POST /api/cron/weekly-reset
// Called every Monday at 00:00 UTC via Vercel Cron (vercel.json)
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createApiClient()

  const { error } = await supabase
    .from('profiles')
    .update({ weekly_points: 0 })
    .gt('weekly_points', 0)

  if (error) {
    console.error('Weekly reset error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('Weekly points reset completed:', new Date().toISOString())
  return NextResponse.json({ success: true, resetAt: new Date().toISOString() })
}
