import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { generateDailyScenario } from '@/lib/anthropic/scenario'

export async function POST(req: Request) {
  try {
    // Validate cron secret
    const auth = req.headers.get('authorization')
    const isInternal = req.headers.get('x-internal') === 'true'
    const cronSecret = process.env.CRON_SECRET

    if (!isInternal && auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    }

    const supabase = createApiClient()
    const today = new Date().toISOString().split('T')[0]

    // Check if today's scenario already exists
    const { data: existing } = await supabase
      .from('scenarios')
      .select('*')
      .eq('active_date', today)
      .single()

    if (existing) {
      return NextResponse.json({ scenario: existing, cached: true })
    }

    // Generate new scenario via Anthropic
    const content = await generateDailyScenario()

    const { data: scenario, error } = await supabase
      .from('scenarios')
      .insert({ content, active_date: today })
      .select()
      .single()

    if (error) {
      // Might be a race condition, try to fetch existing
      const { data: race } = await supabase
        .from('scenarios').select('*').eq('active_date', today).single()
      if (race) return NextResponse.json({ scenario: race })
      return NextResponse.json({ error: 'Senaryo kaydedilemedi.' }, { status: 500 })
    }

    return NextResponse.json({ scenario })
  } catch (_err) {
    console.error('Scenario generation error:', _err)
    return NextResponse.json({ error: 'Senaryo üretilemedi.' }, { status: 500 })
  }
}
