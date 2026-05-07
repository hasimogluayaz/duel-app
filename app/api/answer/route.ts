import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { validateAnswer } from '@/lib/utils/validation'
import { POINTS } from '@/types'

export async function POST(req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const body = await req.json()
    const { scenario_id, content } = body

    if (!scenario_id || !content) {
      return NextResponse.json({ error: 'Eksik alan.' }, { status: 400 })
    }

    const validation = validateAnswer(content)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Check if already answered
    const { data: existing } = await supabase
      .from('answers')
      .select('id')
      .eq('user_id', user.id)
      .eq('scenario_id', scenario_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Bu senaryoya zaten cevap verdiniz.' }, { status: 409 })
    }

    // Insert answer
    const { data: answer, error } = await supabase
      .from('answers')
      .insert({ user_id: user.id, scenario_id, content: content.trim() } as any)
      .select()
      .single()

    if (error) return NextResponse.json({ error: 'Cevap kaydedilemedi.' }, { status: 500 })

    // Update profile: add points, update streak, last_played_at
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_points, weekly_points, streak_count, last_played_at')
      .eq('id', user.id)
      .single()

    if (profile) {
      const lastPlayed = profile.last_played_at ? new Date(profile.last_played_at) : null
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const isYesterday = lastPlayed &&
        lastPlayed.toDateString() === yesterday.toDateString()
      const isToday = lastPlayed &&
        lastPlayed.toDateString() === today.toDateString()

      const newStreak = isYesterday
        ? (profile.streak_count || 0) + 1
        : isToday
          ? profile.streak_count
          : 1

      let bonusPoints = 0
      if (newStreak === 7) bonusPoints = POINTS.STREAK_7
      if (newStreak === 30) bonusPoints = POINTS.STREAK_30

      await supabase.from('profiles').update({
        total_points: (profile.total_points || 0) + POINTS.DAILY_ANSWER + bonusPoints,
        weekly_points: (profile.weekly_points || 0) + POINTS.DAILY_ANSWER + bonusPoints,
        streak_count: newStreak,
        last_played_at: today.toISOString(),
      } as any).eq('id', user.id)

      if (newStreak === 7) {
        await supabase.from('achievements').upsert({
          user_id: user.id, type: 'streak_7' as const, earned_at: new Date().toISOString()
        } as any)
      }
      if (newStreak === 30) {
        await supabase.from('achievements').upsert({
          user_id: user.id, type: 'streak_30' as const, earned_at: new Date().toISOString()
        } as any)
      }
    }

    return NextResponse.json({ answer })
  } catch (_err) {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
