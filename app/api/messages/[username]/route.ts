import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/ratelimit'

// GET /api/messages/[username] — fetch conversation
export async function GET(_: Request, { params }: { params: { username: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: partner } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, is_admin, is_banned, total_points, weekly_points, streak_count, bio, last_played_at, personality_type, personality_updated_at, created_at')
    .eq('username', params.username)
    .single()

  if (!partner || partner.is_admin) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 })

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partner.id}),and(sender_id.eq.${partner.id},receiver_id.eq.${user.id})`)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark incoming messages as read
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('sender_id', partner.id)
    .eq('receiver_id', user.id)
    .eq('is_read', false)

  return NextResponse.json({ messages: messages ?? [], partner })
}

// POST /api/messages/[username] — send message
export async function POST(request: Request, { params }: { params: { username: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const content = body.content?.trim()

  if (!content || content.length > 500) {
    return NextResponse.json({ error: 'Mesaj 1-500 karakter olmalı.' }, { status: 400 })
  }

  const rl = await checkRateLimit('message', user.id)
  if (!rl.success) {
    return NextResponse.json({ error: 'Çok hızlı mesaj gönderiyorsun. Biraz bekle.' }, { status: 429 })
  }

  const { data: partner } = await supabase
    .from('profiles')
    .select('id, is_admin')
    .eq('username', params.username)
    .single()

  if (!partner || partner.is_admin) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 })
  if (partner.id === user.id) return NextResponse.json({ error: 'Kendinize mesaj gönderemezsiniz.' }, { status: 400 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ sender_id: user.id, receiver_id: partner.id, content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message })
}
