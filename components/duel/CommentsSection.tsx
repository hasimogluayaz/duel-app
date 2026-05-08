'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/utils/formatting'
import { MessageCircle, Send, Trash2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  profiles: { id: string; username: string; display_name: string | null; avatar_url: string | null }
}

interface Props {
  duelId: string
  userId: string | null
}

export function CommentsSection({ duelId, userId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    fetch(`/api/comments?duel_id=${duelId}`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .finally(() => setLoading(false))
  }, [duelId])

  async function submit() {
    if (!text.trim() || !userId) return
    setSubmitting(true)
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duel_id: duelId, content: text.trim() }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Yorum gönderilemedi.', 'error'); setSubmitting(false); return }
    setComments(prev => [...prev, json.comment])
    setText('')
    setSubmitting(false)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function deleteComment(id: string) {
    setDeleting(id)
    const res = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== id))
    else toast('Silinemedi.', 'error')
    setDeleting(null)
  }

  const visible = showAll ? comments : comments.slice(-5)

  return (
    <div className="mt-6 border-t border-stroke pt-5">
      <h3 className="text-sm font-bold text-fg mb-3 flex items-center gap-2">
        <MessageCircle size={15} className="text-purple-400" />
        Yorumlar
        {comments.length > 0 && (
          <span className="text-xs font-normal bg-surface border border-stroke px-2 py-0.5 rounded-full text-fg-subtle">
            {comments.length}
          </span>
        )}
      </h3>

      {loading && (
        <div className="text-center py-4">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-fg-subtle text-sm text-center py-4">Henüz yorum yok. İlk yorumu yaz!</p>
      )}

      {!loading && comments.length > 5 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold mb-3 transition-colors"
        >
          Önceki {comments.length - 5} yorumu göster
        </button>
      )}

      <div className="flex flex-col gap-2.5">
        {visible.map(c => (
          <div key={c.id} className="flex items-start gap-2.5 group">
            <Avatar src={c.profiles?.avatar_url} username={c.profiles?.username || '?'} size="sm" />
            <div className="flex-1 min-w-0 bg-surface rounded-xl px-3 py-2 border border-stroke/60">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-fg">
                  {c.profiles?.display_name || c.profiles?.username}
                </span>
                <span className="text-xs text-fg-subtle ml-auto">{timeAgo(c.created_at)}</span>
                {userId === c.profiles?.id && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    disabled={deleting === c.id}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-fg-subtle hover:text-red-400 ml-1"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
              <p className="text-sm text-fg-muted leading-relaxed">{c.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {userId ? (
        <div className="flex items-end gap-2 mt-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Yorum yaz... (Enter ile gönder)"
            rows={2}
            maxLength={300}
            className="flex-1 bg-bg border border-stroke rounded-xl px-3 py-2 text-sm text-fg placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <Button
            size="sm"
            className="btn-gradient shrink-0"
            loading={submitting}
            disabled={!text.trim()}
            onClick={submit}
          >
            <Send size={13} />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-fg-subtle text-center mt-3">
          Yorum yazmak için{' '}
          <a href="/giris" className="text-purple-400 hover:underline">giriş yap</a>.
        </p>
      )}
    </div>
  )
}
