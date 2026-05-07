import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const [
    { count: userCount },
    { count: duelCount },
    { count: answerCount },
    { count: activeCount },
    { count: bannedCount },
    { data: recentUsers },
    { data: topUsers },
  ] = await Promise.all([
    service.from('profiles').select('*', { count: 'exact', head: true }),
    service.from('duels').select('*', { count: 'exact', head: true }),
    service.from('answers').select('*', { count: 'exact', head: true }),
    service.from('duels').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    service.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
    service.from('profiles')
      .select('id, username, display_name, avatar_url, total_points, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    service.from('profiles')
      .select('id, username, display_name, avatar_url, total_points')
      .order('total_points', { ascending: false })
      .limit(5),
  ])

  return NextResponse.json({
    stats: {
      users: userCount ?? 0,
      duels: duelCount ?? 0,
      answers: answerCount ?? 0,
      activeDuels: activeCount ?? 0,
      bannedUsers: bannedCount ?? 0,
    },
    recentUsers: recentUsers ?? [],
    topUsers: topUsers ?? [],
  })
}
