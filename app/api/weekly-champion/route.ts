import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'

function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export async function GET() {
  const supabase = createApiClient()
  const weekStart = getWeekStart()

  // Check if already computed for this week
  const { data: existing } = await supabase
    .from('weekly_champions')
    .select(`
      *,
      user:profiles!weekly_champions_user_id_fkey(username, display_name, avatar_url, total_points),
      answer:answers!weekly_champions_answer_id_fkey(content, vote_count, verdict_count, scenario_id)
    `)
    .eq('week_start', weekStart)
    .single()

  if (existing) return NextResponse.json({ champion: existing, week_start: weekStart })

  // Compute: find answer with most votes this week
  const weekStartDate = new Date(weekStart)

  // Get all answers created this week
  const { data: answers } = await supabase
    .from('answers')
    .select('id, user_id, content, vote_count, verdict_count, scenario_id')
    .gte('created_at', weekStartDate.toISOString())
    .order('vote_count', { ascending: false })
    .limit(1)

  if (!answers?.length) return NextResponse.json({ champion: null, week_start: weekStart })

  const top = answers[0] as any

  // Get scenario content
  const { data: scenario } = await supabase
    .from('scenarios').select('content').eq('id', top.scenario_id).single()

  // Insert champion record
  const { data: champion } = await supabase
    .from('weekly_champions')
    .upsert({
      week_start: weekStart,
      user_id: top.user_id,
      answer_id: top.id,
      vote_count: top.vote_count,
      scenario_content: scenario?.content ?? null,
    }, { onConflict: 'week_start' })
    .select(`
      *,
      user:profiles!weekly_champions_user_id_fkey(username, display_name, avatar_url, total_points),
      answer:answers!weekly_champions_answer_id_fkey(content, vote_count, verdict_count, scenario_id)
    `)
    .single()

  // Give champion badge if first time
  if (champion) {
    await supabase.from('achievements').upsert({
      user_id: top.user_id,
      type: 'weekly_champion',
      earned_at: new Date().toISOString(),
    }).catch(() => {})

    await supabase.from('notifications').insert({
      user_id: top.user_id,
      type: 'weekly_champion',
      title: '🏆 Haftanın Şampiyonu!',
      message: 'Bu haftanın en çok oy alan cevabı senindi. Tebrikler!',
      data: { week_start: weekStart },
    }).catch(() => {})
  }

  return NextResponse.json({ champion, week_start: weekStart })
}
