import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? supabase : null
}

export async function GET(request: Request) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const LIMIT = 20
  const offset = (page - 1) * LIMIT

  const [{ data: messages }, { count }] = await Promise.all([
    supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).range(offset, offset + LIMIT - 1),
    supabase.from('contact_messages').select('*', { count: 'exact', head: true }),
  ])

  return NextResponse.json({ messages: messages ?? [], total: count ?? 0 })
}
