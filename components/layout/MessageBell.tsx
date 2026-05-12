'use client'

import { useState, useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Props { userId: string; size?: number }

export function MessageBell({ userId, size = 18 }: Props) {
  const supabase = createClient()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!userId) return

    const fetchUnread = async () => {
      const res = await fetch('/api/messages/unread-count')
      if (res.ok) {
        const { count } = await res.json()
        setUnread(count ?? 0)
      }
    }

    fetchUnread()

    // Realtime — new message or read update
    let channel: ReturnType<typeof supabase.channel> | null = null
    try {
      channel = supabase
        .channel(`msg-bell:${userId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
          () => setUnread(c => c + 1)
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
          fetchUnread
        )
        .subscribe()
    } catch (e) {
      console.error('[MessageBell] Realtime subscription failed:', e)
    }

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel) } catch {}
      }
    }
  }, [userId])

  return (
    <Link
      href="/mesajlar"
      className="relative p-2 rounded-xl text-fg-muted hover:text-fg hover:bg-surface transition-colors"
      aria-label="Mesajlar"
    >
      <MessageCircle size={size} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
