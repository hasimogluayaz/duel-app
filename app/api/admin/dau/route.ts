import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

/**
 * GET /api/admin/dau?days=30
 * Returns daily active users (unique users who played), new signups, and new answers
 * for the last N days.
 */
export async function GET(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const days = Math.min(parseInt(new URL(req.url).searchParams.get('days') ?? '30'), 90)
  const service = createServiceClient()

  // Build array of dates
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    dates.push(d.toISOString().slice(0, 10))
  }

  const since = `${dates[0]}T00:00:00.000Z`

  // Fetch raw data in parallel: answers (proxy for DAU), signups
  const [answersRes, signupsRes, duelsRes] = await Promise.all([
    service
      .from('answers')
      .select('user_id, created_at')
      .gte('created_at', since),
    service
      .from('profiles')
      .select('created_at')
      .gte('created_at', since),
    service
      .from('duels')
      .select('created_at')
      .gte('created_at', since),
  ])

  const answers = answersRes.data ?? []
  const signups = signupsRes.data ?? []
  const duels = duelsRes.data ?? []

  // Aggregate per day
  const dauMap = new Map<string, Set<string>>()
  const signupMap = new Map<string, number>()
  const duelMap = new Map<string, number>()

  for (const date of dates) {
    dauMap.set(date, new Set())
    signupMap.set(date, 0)
    duelMap.set(date, 0)
  }

  for (const a of answers) {
    const day = (a.created_at as string).slice(0, 10)
    if (dauMap.has(day)) dauMap.get(day)!.add(a.user_id as string)
  }

  for (const s of signups) {
    const day = (s.created_at as string).slice(0, 10)
    if (signupMap.has(day)) signupMap.set(day, (signupMap.get(day) ?? 0) + 1)
  }

  for (const d of duels) {
    const day = (d.created_at as string).slice(0, 10)
    if (duelMap.has(day)) duelMap.set(day, (duelMap.get(day) ?? 0) + 1)
  }

  const chartData = dates.map(date => ({
    date,
    dau: dauMap.get(date)?.size ?? 0,
    signups: signupMap.get(date) ?? 0,
    duels: duelMap.get(date) ?? 0,
  }))

  // Summary stats
  const totalDau = chartData.reduce((s, d) => s + d.dau, 0)
  const totalSignups = chartData.reduce((s, d) => s + d.signups, 0)
  const totalDuels = chartData.reduce((s, d) => s + d.duels, 0)
  const peakDau = Math.max(...chartData.map(d => d.dau), 0)
  const avgDau = chartData.length ? Math.round(totalDau / chartData.length) : 0

  return NextResponse.json({
    chartData,
    summary: { totalDau, totalSignups, totalDuels, peakDau, avgDau },
  })
}
