'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import type { Conversation } from '@/types'
import { MessageCircle, Search, Swords } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface ConversationListProps {
  activeUsername?: string
}

export function ConversationList({ activeUsername }: ConversationListProps) {
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

      const channel = supabase
        .channel('conv-list-panel')
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

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 py-3 border-b border-stroke shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Konuşma ara..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface border border-stroke rounded-xl pl-9 pr-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10"><Spinner size="md" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageCircle size={28} className="text-fg-subtle opacity-20 mb-3" />
            <p className="text-fg font-semibold text-sm mb-1">
              {conversations.length === 0 ? 'Henüz mesajın yok' : 'Sonuç yok'}
            </p>
            <p className="text-fg-subtle text-xs">
              {conversations.length === 0
                ? 'Bir kullanıcının profiline gidip mesaj gönder'
                : 'Farklı bir arama dene'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-stroke">
            {filtered.map(c => {
              const isActive = c.user.username === activeUsername
              return (
                <Link key={c.user.id} href={`/mesajlar/${c.user.username}`}>
                  <div className={cn(
                    'flex items-center gap-3 px-4 py-3.5 transition-colors',
                    isActive
                      ? 'bg-primary/10'
                      : c.unread_count > 0
                        ? 'bg-primary/5 hover:bg-primary/8'
                        : 'hover:bg-surface-2'
                  )}>
                    <div className="relative shrink-0">
                      <Avatar src={c.user.avatar_url} username={c.user.username} size="md" />
                      {c.unread_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-[1.5px] border-surface">
                          {c.unread_count > 9 ? '9+' : c.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={cn(
                          'text-[13px] font-semibold truncate',
                          isActive ? 'text-primary' : c.unread_count > 0 ? 'text-fg' : 'text-fg-muted'
                        )}>
                          {c.user.display_name || c.user.username}
                        </p>
                        <span className="text-[10px] text-fg-subtle shrink-0">{timeAgo(c.last_message.created_at)}</span>
                      </div>
                      <p className={cn('text-[12px] truncate', c.unread_count > 0 ? 'text-fg-muted font-medium' : 'text-fg-subtle')}>
                        {c.last_message.content}
                      </p>
                      {c.pending_duel && (
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          marginTop: 3, padding: '2px 7px', borderRadius: 99,
                          background: 'var(--k-blue-50, #eef4ff)',
                          font: '600 10.5px -apple-system, sans-serif',
                          color: 'var(--k-blue-600, #1442a8)',
                        }}>
                          <Swords size={10} /> Bekleyen düello çağrısı
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
