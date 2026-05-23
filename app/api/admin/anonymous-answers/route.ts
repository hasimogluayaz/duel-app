import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10) || 100, 500)

  const service = createServiceClient()

  // Fetch anonymous answers + the scenarios they reference
  const { data: answers, error } = await service
    .from('answers')
    .select('id, content, scenario_id, ip_address, user_agent, created_at, scenario:scenarios(id, content, active_date)')
    .is('user_id', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[admin/anonymous-answers]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Group repeat IPs so admins can spot a single person spamming multiple anonymous answers
  const ipCounts = new Map<string, number>()
  for (const a of (answers ?? []) as any[]) {
    if (a.ip_address) ipCounts.set(a.ip_address, (ipCounts.get(a.ip_address) ?? 0) + 1)
  }

  const ipSummary = Array.from(ipCounts.entries())
    .map(([ip, count]) => ({ ip, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  return NextResponse.json({ answers: answers ?? [], ipSummary })
}

// DELETE — hide an anonymous answer (admin moderation)
export async function DELETE(req: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id?: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('answers').delete().eq('id', id).is('user_id', null)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
