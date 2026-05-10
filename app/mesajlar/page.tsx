'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import type { Conversation } from '@/types'
import { MessageCircle, Search } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

export default function MesajlarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const myIdRef = useRef<string | null>(null)

  const refreshConversations = async () => {
    const res = await fetch('/api/messages')
    const json = await res.json()
    setConversations(json.conversations ?? [])
  }

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      myIdRef.current = user.id

      await refreshConversations()
      setLoading(false)

      // Realtime: listen for new messages where I'm the receiver
      const channel = supabase
        .channel('messages-list')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          () => { refreshConversations() }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` },
          () => { refreshConversations() }
        )
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }
    load()
  }, [])

  const filtered = conversations.filter(c =>
    c.user.username.toLowerCase().includes(query.toLowerCase()) ||
    (c.user.display_name ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0)

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <MessageCircle size={20} className="text-primary/70" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Mesajlar</h1>
          <p className="text-sm text-fg-subtle">
            {totalUnread > 0 ? `${totalUnread} okunmamış mesaj` : 'Tüm mesajlar okundu'}
          </p>
        </div>
      </div>

      {/* Search */}
      {conversations.length > 3 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Konuşma ara..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary"
          />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <MessageCircle size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
          <p className="text-fg font-semibold mb-1">
            {conversations.length === 0 ? 'Henüz mesajın yok' : 'Sonuç yok'}
          </p>
          <p className="text-fg-subtle text-sm">
            {conversations.length === 0
              ? 'Bir kullanıcının profiline gidip mesaj gönder'
              : 'Farklı bir arama dene'}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-1.5">
          {filtered.map(c => (
            <Link key={c.user.id} href={`/mesajlar/${c.user.username}`}>
              <div className={cn(
                'flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all cursor-pointer',
                c.unread_count > 0
                  ? 'bg-primary/5 border-primary/20 hover:border-primary/40'
                  : 'bg-surface border-stroke hover:border-primary/20 hover:bg-primary/5'
              )}>
                <div className="relative shrink-0">
                  <Avatar src={c.user.avatar_url} username={c.user.username} size="md" />
                  {c.unread_count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {c.unread_count > 9 ? '9+' : c.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className={cn('text-sm font-semibold truncate', c.unread_count > 0 ? 'text-fg' : 'text-fg-muted')}>
                      {c.user.display_name || c.user.username}
                    </p>
                    <span className="text-xs text-fg-subtle shrink-0">{timeAgo(c.last_message.created_at)}</span>
                  </div>
                  <p className={cn('text-sm truncate', c.unread_count > 0 ? 'text-fg-muted font-medium' : 'text-fg-subtle')}>
                    {c.last_message.content}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
