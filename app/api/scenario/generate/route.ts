import { createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { generateDailyScenario } from '@/lib/anthropic/scenario'
import { turkeyDate, lastNTurkeyDates } from '@/lib/utils/time'
import { createClient } from '@/lib/supabase/server'

async function handler(req: Request) {
  try {
    const auth = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Allow cron callers (Vercel sends Bearer token)
    let authorized = auth === `Bearer ${cronSecret}`

    // Also allow admin users
    if (!authorized) {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
        authorized = profile?.is_admin === true
      }
    }

    if (!authorized) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const url = new URL(req.url)
    // Admin can pass ?date=YYYY-MM-DD to generate for a specific date
    // Cron with no date → uses Turkey time so transitions happen at TR midnight
    const targetDate = url.searchParams.get('date') ?? turkeyDate()
    // ?force=true skips the "already exists" cache and overwrites
    const force = url.searchParams.get('force') === 'true'

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      return NextResponse.json({ error: 'Geçersiz tarih formatı. YYYY-MM-DD bekleniyor.' }, { status: 400 })
    }

    const supabase = createServiceClient()

    if (!force) {
      const { data: existing } = await supabase
        .from('scenarios')
        .select('*')
        .eq('active_date', targetDate)
        .single()

      if (existing) {
        return NextResponse.json({ scenario: existing, cached: true })
      }
    }

    // Fetch last 7 days of scenarios — pass to AI so it doesn't repeat subjects
    const recentDates = lastNTurkeyDates(7).filter(d => d !== targetDate)
    const { data: recent } = await supabase
      .from('scenarios')
      .select('content')
      .in('active_date', recentDates)
      .order('active_date', { ascending: false })
      .limit(7)

    const avoidRecent = (recent ?? []).map((r: any) => r.content).filter(Boolean)

    // Generate new scenario via AI with context
    const content = await generateDailyScenario(avoidRecent)

    // upsert — overwrites if force=true and scenario already exists for that date
    const { data: scenario, error } = await supabase
      .from('scenarios')
      .upsert(
        { content, active_date: targetDate, is_approved: true },
        { onConflict: 'active_date' }
      )
      .select()
      .single()

    if (error) {
      console.error('Scenario upsert error:', error)
      return NextResponse.json({ error: 'Senaryo kaydedilemedi.' }, { status: 500 })
    }

    return NextResponse.json({ scenario, avoided: avoidRecent.length })
  } catch (_err) {
    const msg = _err instanceof Error ? _err.message : String(_err)
    console.error('Scenario generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Vercel Cron Jobs send GET; admin UI uses POST
export const GET = handler
export const POST = handler
