import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// PATCH /api/admin/users/[id] — ban/unban/toggle-admin
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const service = createServiceClient()

  // Prevent self-modification
  if (params.id === admin.id) {
    return NextResponse.json({ error: 'Kendinizi değiştiremezsiniz.' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.is_banned === 'boolean') updates.is_banned = body.is_banned
  if (typeof body.is_admin === 'boolean') updates.is_admin = body.is_admin

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Güncellenecek alan yok.' }, { status: 400 })
  }

  const { error } = await service.from('profiles').update(updates).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// DELETE /api/admin/users/[id] — delete user account
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (params.id === admin.id) {
    return NextResponse.json({ error: 'Kendinizi silemezsiniz.' }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
