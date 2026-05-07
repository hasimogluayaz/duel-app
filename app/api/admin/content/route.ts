import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

// GET — recent answers + duels for moderation
export async function GET() {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()

  const [{ data: answers }, { data: duels }] = await Promise.all([
    service
      .from('answers')
      .select('id, content, created_at, user_id, profiles!answers_user_id_fkey(username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(30),
    service
      .from('duels')
      .select('id, status, created_at, share_token, ai_verdict, ai_roast, challenger:profiles!duels_challenger_id_fkey(username), challenged:profiles!duels_challenged_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({ answers: answers ?? [], duels: duels ?? [] })
}

// DELETE /api/admin/content?type=answer&id=...
export async function DELETE(request: Request) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const id = searchParams.get('id')

  if (!id || !type) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const service = createServiceClient()

  if (type === 'answer') {
    const { error } = await service.from('answers').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (type === 'duel') {
    const { error } = await service.from('duels').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
