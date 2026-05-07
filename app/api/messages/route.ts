import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/messages — inbox (all conversations with last message + unread count)
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all unique conversation partners
  const { data: sent } = await supabase
    .from('messages')
    .select('receiver_id')
    .eq('sender_id', user.id)

  const { data: received } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('receiver_id', user.id)

  const partnerIds = new Set<string>()
  sent?.forEach((m: { receiver_id: string }) => partnerIds.add(m.receiver_id))
  received?.forEach((m: { sender_id: string }) => partnerIds.add(m.sender_id))

  if (partnerIds.size === 0) return NextResponse.json({ conversations: [] })

  // For each partner, get their profile + last message + unread count
  const conversations = await Promise.all(
    Array.from(partnerIds).map(async (partnerId) => {
      const [{ data: profile }, { data: lastMsgs }, { count: unread }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_admin, is_banned, total_points, weekly_points, streak_count, bio, last_played_at, personality_type, personality_updated_at, created_at')
          .eq('id', partnerId)
          .eq('is_admin', false)
          .single(),
        supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: false })
          .limit(1),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', partnerId)
          .eq('receiver_id', user.id)
          .eq('is_read', false),
      ])

      if (!profile || !lastMsgs?.[0]) return null
      return { user: profile, last_message: lastMsgs[0], unread_count: unread ?? 0 }
    })
  )

  const sorted = conversations
    .filter(Boolean)
    .sort((a, b) => new Date(b!.last_message.created_at).getTime() - new Date(a!.last_message.created_at).getTime())

  return NextResponse.json({ conversations: sorted })
}
