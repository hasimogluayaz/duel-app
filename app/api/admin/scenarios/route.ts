import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — list recent scenarios
export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data } = await service
    .from('scenarios')
    .select('*')
    .order('active_date', { ascending: false })
    .limit(30)

  return NextResponse.json({ scenarios: data ?? [] })
}

// POST — create scenario manually
export async function POST(request: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { content, active_date } = body

  if (!content?.trim() || !active_date) {
    return NextResponse.json({ error: 'content ve active_date zorunlu.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('scenarios')
    .upsert({ content: content.trim(), active_date }, { onConflict: 'active_date' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scenario: data })
}

// DELETE /api/admin/scenarios?id=...
export async function DELETE(request: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('scenarios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
