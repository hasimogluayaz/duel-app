import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'

/**
 * Trending scenarios: most answers in last 48 hours
 */
export async function GET() {
  const supabase = createApiClient()

  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  // Count answers per scenario in last 48h
  const { data: recentAnswers } = await supabase
    .from('answers')
    .select('scenario_id')
    .gte('created_at', since)

  if (!recentAnswers?.length) {
    // Fallback: just return most answered scenarios overall
    const { data } = await supabase
      .from('scenarios')
      .select('id, content, category, answer_count, created_at, active_date')
      .eq('is_approved', true)
      .order('answer_count', { ascending: false })
      .limit(5)
    return NextResponse.json({ scenarios: data ?? [] })
  }

  // Count by scenario_id
  const counts: Record<string, number> = {}
  for (const a of recentAnswers) {
    counts[a.scenario_id] = (counts[a.scenario_id] ?? 0) + 1
  }

  const topIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, content, category, answer_count, created_at, active_date')
    .in('id', topIds)
    .eq('is_approved', true)

  // Sort by recent activity count
  const sorted = (scenarios ?? []).sort(
    (a: any, b: any) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0)
  )

  return NextResponse.json({ scenarios: sorted, counts })
}
