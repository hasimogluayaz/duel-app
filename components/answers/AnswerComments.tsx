'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Image from 'next/image'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    username: string
    display_name: string | null
    avatar_url: string | null
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'az önce'
  if (min < 60) return `${min}dk`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}sa`
  return `${Math.floor(h / 24)}g`
}

interface Props {
  answerId: string
  currentUserId?: string | null
  initialCount?: number
}

export default function AnswerComments({ answerId, currentUserId, initialCount = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (loaded) return
    setLoading(true)
    const res = await fetch(`/api/answer/comments?answer_id=${answerId}`)
    const d = await res.json()
    setComments(d.comments ?? [])
    setCount(d.comments?.length ?? count)
    setLoading(false)
    setLoaded(true)
  }

  const toggle = () => {
    if (!open) load()
    setOpen(o => !o)
  }

  const submit = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch('/api/answer/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer_id: answerId, content: text.trim() }),
    })
    const d = await res.json()
    if (d.comment) {
      setComments(prev => [...prev, d.comment])
      setCount(c => c + 1)
      setText('')
    }
    setSending(false)
  }

  const remove = async (id: string) => {
    await fetch(`/api/answer/comments?id=${id}`, { method: 'DELETE' })
    setComments(prev => prev.filter(c => c.id !== id))
    setCount(c => Math.max(0, c - 1))
  }

  return (
    <div className="mt-2">
      {/* Toggle button */}
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg-muted transition-colors py-1"
      >
        <MessageSquare size={12} />
        <span>{count > 0 ? `${count} yorum` : 'Yorum yap'}</span>
        {count > 0 && (open ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {/* Comment list */}
          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-6 h-6 rounded-full bg-surface-2" />
                  <div className="flex-1 h-8 bg-surface-2 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map(c => (
                <div key={c.id} className="flex items-start gap-2 group">
                  {/* Avatar */}
                  <div className="w-6 h-6 rounded-full bg-surface-2 shrink-0 overflow-hidden">
                    {c.user?.avatar_url ? (
                      <Image src={c.user.avatar_url} alt="" width={24} height={24} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-fg-subtle">
                        {(c.user?.display_name ?? c.user?.username ?? '?')[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className="flex-1 bg-surface-2 rounded-xl px-3 py-2 relative">
                    <div className="flex items-baseline gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-fg-muted">{c.user?.display_name ?? c.user?.username}</span>
                      <span className="text-[9px] text-fg-subtle">{timeAgo(c.created_at)}</span>
                    </div>
                    <p className="text-xs text-fg-muted leading-relaxed">{c.content}</p>

                    {/* Delete (own comment) */}
                    {currentUserId && (
                      <button
                        onClick={() => remove(c.id)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          {currentUserId && (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Yorum ekle..."
                maxLength={300}
                className="flex-1 bg-surface border border-stroke rounded-xl px-3 py-2 text-xs text-fg placeholder-fg-subtle focus:outline-none focus:border-violet-500/50"
              />
              <button
                onClick={submit}
                disabled={!text.trim() || sending}
                className="w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Send size={12} className="text-white" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
