import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return profile?.is_admin ? supabase : null
}

// PATCH — mark as read/unread
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { error } = await supabase.from('contact_messages').update({ is_read: body.is_read }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE — remove message
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await requireAdmin()
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('contact_messages').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
