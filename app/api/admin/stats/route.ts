import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

function iso(date: Date) { return date.toISOString() }
function day(d: Date) { return d.toISOString().split('T')[0] }

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const now = new Date()
  const today = day(now)
  const todayStart = new Date(`${today}T00:00:00Z`)
  const weekStart = new Date(now.getTime() - 7 * 86400_000)
  const monthStart = new Date(now.getTime() - 30 * 86400_000)
  const yesterdayStart = new Date(todayStart.getTime() - 86400_000)

  // ── Parallel queries ─────────────────────────────────────────────────────
  const [
    // Users
    { count: userTotal },
    { count: userToday },
    { count: userWeek },
    { count: userMonth },
    { count: userBanned },
    { count: userAdmin },

    // DAU/WAU/MAU (distinct users who answered something)
    { data: dauRaw },
    { data: wauRaw },
    { data: mauRaw },

    // Scenarios
    { count: scenarioTotal },
    { count: scenarioApproved },
    { count: scenarioPending },
    { data: todaysScenario },

    // Answers
    { count: answerTotal },
    { count: answerToday },
    { count: answerWeek },
    { count: answerAnonymous },

    // Duels
    { count: duelTotal },
    { count: duelToday },
    { count: duelAi },
    { count: duelCommunity },

    // Votes
    { count: voteToday },

    // Comments
    { count: commentsToday },

    // Reports
    { count: reportsPending },

    // Top users
    { data: recentUsers },
    { data: topUsers },
  ] = await Promise.all([
    // Users
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', iso(todayStart)),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', iso(weekStart)),
    service.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', iso(monthStart)),
    service.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
    service.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),

    // DAU/WAU/MAU
    service.from('answers').select('user_id').gte('created_at', iso(todayStart)).not('user_id', 'is', null),
    service.from('answers').select('user_id').gte('created_at', iso(weekStart)).not('user_id', 'is', null),
    service.from('answers').select('user_id').gte('created_at', iso(monthStart)).not('user_id', 'is', null),

    // Scenarios
    service.from('scenarios').select('*', { count: 'exact', head: true }),
    service.from('scenarios').select('*', { count: 'exact', head: true }).eq('is_approved', true),
    service.from('scenarios').select('*', { count: 'exact', head: true }).eq('is_approved', false),
    service.from('scenarios').select('id, content, answer_count').eq('active_date', today).single(),

    // Answers
    service.from('answers').select('*', { count: 'exact', head: true }),
    service.from('answers').select('*', { count: 'exact', head: true }).gte('created_at', iso(todayStart)),
    service.from('answers').select('*', { count: 'exact', head: true }).gte('created_at', iso(weekStart)),
    service.from('answers').select('*', { count: 'exact', head: true }).is('user_id', null),

    // Duels
    service.from('duels').select('*', { count: 'exact', head: true }),
    service.from('duels').select('*', { count: 'exact', head: true }).gte('created_at', iso(todayStart)),
    service.from('duels').select('*', { count: 'exact', head: true }).eq('judge_mode', 'ai'),
    service.from('duels').select('*', { count: 'exact', head: true }).eq('judge_mode', 'community'),

    // Votes
    service.from('answer_likes').select('*', { count: 'exact', head: true }).gte('created_at', iso(todayStart)),

    // Comments
    service.from('comments').select('*', { count: 'exact', head: true }).gte('created_at', iso(todayStart)),

    // Reports pending
    service.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),

    // Top/recent users
    service.from('profiles')
      .select('id, username, display_name, avatar_url, total_points, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    service.from('profiles')
      .select('id, username, display_name, avatar_url, total_points, streak_count')
      .eq('is_banned', false)
      .order('total_points', { ascending: false })
      .limit(8),
  ])

  // DAU/WAU/MAU = unique user count
  const dau = new Set((dauRaw ?? []).map((r: any) => r.user_id)).size
  const wau = new Set((wauRaw ?? []).map((r: any) => r.user_id)).size
  const mau = new Set((mauRaw ?? []).map((r: any) => r.user_id)).size

  // Missing scenarios in next 14 days
  const next14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() + i * 86400_000)
    return day(d)
  })
  const { data: scheduled } = await service
    .from('scenarios')
    .select('active_date')
    .in('active_date', next14)
  const scheduledDates = new Set((scheduled ?? []).map((s: any) => s.active_date))
  const missingDates = next14.filter(d => !scheduledDates.has(d))

  // Last 7 days new-user series for trend sparkline
  const userTrend = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 86400_000)
      const dayStr = day(d)
      const dStart = new Date(`${dayStr}T00:00:00Z`)
      const dEnd = new Date(dStart.getTime() + 86400_000)
      const { count } = await service
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', iso(dStart))
        .lt('created_at', iso(dEnd))
      return { date: dayStr, count: count ?? 0 }
    })
  )

  return NextResponse.json({
    users: {
      total: userTotal ?? 0,
      today: userToday ?? 0,
      week: userWeek ?? 0,
      month: userMonth ?? 0,
      banned: userBanned ?? 0,
      admin: userAdmin ?? 0,
    },
    engagement: {
      dau, wau, mau,
      answersToday: answerToday ?? 0,
      answersWeek: answerWeek ?? 0,
      answersTotal: answerTotal ?? 0,
      answersAnonymous: answerAnonymous ?? 0,
      votesToday: voteToday ?? 0,
      commentsToday: commentsToday ?? 0,
    },
    scenarios: {
      total: scenarioTotal ?? 0,
      approved: scenarioApproved ?? 0,
      pending: scenarioPending ?? 0,
      today: todaysScenario
        ? { id: (todaysScenario as any).id, content: (todaysScenario as any).content, answerCount: (todaysScenario as any).answer_count ?? 0 }
        : null,
      missingDates,
    },
    duels: {
      total: duelTotal ?? 0,
      today: duelToday ?? 0,
      aiMode: duelAi ?? 0,
      communityMode: duelCommunity ?? 0,
    },
    health: {
      reportsPending: reportsPending ?? 0,
      missingScenarios: missingDates.length,
    },
    userTrend,
    recentUsers: recentUsers ?? [],
    topUsers: topUsers ?? [],
  })
}
