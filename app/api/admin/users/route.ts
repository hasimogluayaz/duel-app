import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET(request: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') ?? ''
  const filter = searchParams.get('filter') ?? 'all' // all | banned | admin
  const page = Number(searchParams.get('page') ?? '1')
  const limit = 25
  const offset = (page - 1) * limit

  const service = createServiceClient()
  let query = service
    .from('profiles')
    .select('id, username, display_name, avatar_url, total_points, streak_count, is_admin, is_banned, created_at, last_played_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (q) query = query.or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
  if (filter === 'banned') query = query.eq('is_banned', true)
  if (filter === 'admin') query = query.eq('is_admin', true)

  const { data, count } = await query
  return NextResponse.json({ users: data ?? [], total: count ?? 0, page, limit })
}
