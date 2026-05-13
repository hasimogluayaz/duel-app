'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import type { Message, Profile } from '@/types'
import { ArrowLeft, Send, Swords, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

function DuelInviteCard({ msg, isMine, onAccept, onDecline }: {
  msg: Message
  isMine: boolean
  onAccept?: () => void
  onDecline?: () => void
}) {
  const data: any = (msg as any).metadata ?? {}
  return (
    <div style={{
      maxWidth: 280, borderRadius: 16, overflow: 'hidden',
      border: '1px solid var(--k-blue-200, #b8cfff)',
      background: 'var(--k-blue-50, #eef4ff)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1442a8, #2a6cf0)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Swords size={14} style={{ color: '#fff' }} />
        <span style={{ font: '700 13px -apple-system, sans-serif', color: '#fff' }}>Düello Çağrısı</span>
      </div>
      {/* Body */}
      <div style={{ padding: '12px 14px' }}>
        <p style={{ margin: '0 0 10px', font: '500 13px/1.4 -apple-system, sans-serif', color: 'var(--fg)' }}>
          {data.scenario_content || msg.content}
        </p>
        {!isMine && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onAccept}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                background: '#16a34a', color: '#fff',
                font: '600 12px -apple-system, sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <CheckCircle size={12} /> Kabul et
            </button>
            <button
              onClick={onDecline}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8, border: '1px solid var(--stroke)',
                background: 'transparent', color: 'var(--fg-muted)',
                font: '600 12px -apple-system, sans-serif', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              }}
            >
              <XCircle size={12} /> Reddet
            </button>
          </div>
        )}
        {isMine && (
          <p style={{ font: '400 11px monospace', color: 'var(--fg-subtle)', margin: 0 }}>
            Yanıt bekleniyor...
          </p>
        )}
      </div>
    </div>
  )
}

export default function ConversationPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const username = params.username as string

  const [messages, setMessages] = useState<Message[]>([])
  const [partner, setPartner] = useState<Profile | null>(null)
  const [partnerOnline, setPartnerOnline] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      setMyId(user.id)

      const res = await fetch(`/api/messages/${username}`)
      if (!res.ok) { router.push('/mesajlar'); return }
      const json = await res.json()
      setMessages(json.messages ?? [])
      setPartner(json.partner)
      setLoading(false)

      // Check if partner was active in the last 5 minutes via presence
      if (json.partner?.last_seen) {
        const diff = Date.now() - new Date(json.partner.last_seen).getTime()
        setPartnerOnline(diff < 5 * 60 * 1000)
      }
    }
    load()
  }, [username])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Realtime subscription
  useEffect(() => {
    if (!myId || !partner) return

    const channel = supabase
      .channel(`messages:${[myId, partner.id].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${myId}`,
        },
        (payload: { new: unknown }) => {
          const msg = payload.new as Message
          if (msg.sender_id !== partner.id) return
          setMessages(prev => [...prev, msg])
          // Mark as read
          supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {})
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myId, partner])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    setInput('')

    const res = await fetch(`/api/messages/${username}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    const json = await res.json()

    if (res.ok && json.message) {
      setMessages(prev => [...prev, json.message])
    }
    setSending(false)
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <Spinner size="lg" />
    </div>
  )

  if (!partner) return null

  return (
    <div className="max-w-xl mx-auto flex flex-col h-[calc(100vh-4rem)]">

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-stroke bg-surface/90 backdrop-blur-md sticky z-10"
        style={{ top: 54 }}
      >
        <Link href="/mesajlar" className="p-2 -ml-2 rounded-xl hover:bg-surface-2 transition-colors text-fg-muted hover:text-fg shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <Link href={`/profil/${partner.username}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <div className="relative shrink-0">
            <Avatar src={partner.avatar_url} username={partner.username} size="sm" />
            {partnerOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-surface" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-fg truncate">{partner.display_name || partner.username}</p>
            <p className="text-[12px]" style={{ color: partnerOnline ? 'var(--k-success, #16a34a)' : 'var(--fg-subtle)' }}>
              {partnerOnline ? '● çevrimiçi' : `@${partner.username}`}
            </p>
          </div>
        </Link>
        <Link
          href="/oyun"
          className="shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-full border border-stroke text-xs font-semibold text-fg-muted hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Swords size={12} /> Düello
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <Avatar src={partner.avatar_url} username={partner.username} size="xl" className="mb-4" />
            <p className="font-bold text-fg">{partner.display_name || partner.username}</p>
            <p className="text-sm text-fg-subtle mt-1">Konuşmayı başlat</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id === myId
            const prevMsg = messages[idx - 1]
            const sameGroup = prevMsg && prevMsg.sender_id === msg.sender_id &&
              new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() < 60_000

            return (
              <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start', sameGroup ? 'mt-0.5' : 'mt-3')}>
                {!isMine && !sameGroup && (
                  <Avatar src={partner.avatar_url} username={partner.username} size="xs" className="mr-2 mt-auto mb-1 shrink-0" />
                )}
                {!isMine && sameGroup && <div className="w-6 mr-2 shrink-0" />}
                <div className={cn('max-w-[75%] flex flex-col', isMine ? 'items-end' : 'items-start')}>
                  {(msg as any).type === 'duel_invite' ? (
                    <DuelInviteCard
                      msg={msg}
                      isMine={isMine}
                      onAccept={() => router.push('/oyun')}
                      onDecline={() => {}}
                    />
                  ) : (
                    <div className={cn(
                      'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                      isMine
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-surface border border-stroke text-fg rounded-bl-sm'
                    )}>
                      {msg.content}
                    </div>
                  )}
                  {(!messages[idx + 1] || messages[idx + 1].sender_id !== msg.sender_id) && (
                    <p className="text-[11px] text-fg-subtle mt-1 px-1">{timeAgo(msg.created_at)}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex items-end gap-2 px-4 py-3 border-t border-stroke bg-surface/80 backdrop-blur-md">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage(e as unknown as React.FormEvent)
            }
          }}
          placeholder="Mesaj yaz..."
          rows={1}
          maxLength={500}
          className="flex-1 bg-surface-2 border border-stroke rounded-2xl px-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary resize-none max-h-32 transition-colors"
          style={{ height: 'auto' }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-2xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--k-blue-400), var(--k-blue-600))' }}
        >
          <Send size={16} className="text-white" />
        </button>
      </form>
    </div>
  )
}
