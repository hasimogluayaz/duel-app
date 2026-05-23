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

// PATCH /api/admin/scenarios — edit content or toggle is_approved
export async function PATCH(request: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json() as { id?: string; content?: string; is_approved?: boolean }
  const { id, content, is_approved } = body

  if (!id) return NextResponse.json({ error: 'id gerekli' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (content !== undefined) updates.content = content.trim()
  if (is_approved !== undefined) updates.is_approved = is_approved

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('scenarios')
    .update(updates)
    .eq('id', id)
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
