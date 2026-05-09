'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import { Send, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils/cn'

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id: string | null
  author: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
}

interface Props {
  scenarioId: string
  userId: string | null
}

export default function ScenarioComments({ scenarioId, userId }: Props) {
  const toast = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyTo, setReplyTo] = useState<Comment | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/scenarios/${scenarioId}/comments`)
    const json = await res.json()
    setComments(json.comments ?? [])
    setLoading(false)
  }, [scenarioId])

  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const res = await fetch(`/api/scenarios/${scenarioId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text.trim(), parent_id: replyTo?.id ?? null }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error ?? 'Yorum gönderilemedi.', 'error'); setSending(false); return }
    setComments(prev => [...prev, json.comment])
    setText('')
    setReplyTo(null)
    setSending(false)
  }

  async function deleteComment(id: string) {
    const res = await fetch(`/api/scenarios/${scenarioId}/comments?comment_id=${id}`, { method: 'DELETE' })
    if (res.ok) setComments(prev => prev.filter(c => c.id !== id))
    else toast('Silinemedi.', 'error')
  }

  const topLevel = comments.filter(c => !c.parent_id)
  const replies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  return (
    <div id="comments" className="mt-6">
      <h2 className="text-sm font-semibold text-fg-subtle uppercase tracking-wider mb-4">
        💬 {comments.length} Yorum
      </h2>

      {/* Input */}
      {userId ? (
        <form onSubmit={submit} className="mb-5">
          {replyTo && (
            <div className="flex items-center gap-2 mb-2 text-xs text-fg-subtle">
              <span>@{replyTo.author?.username} için yanıt yazıyorsun</span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-fg hover:text-primary ml-1">×</button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={replyTo ? `@${replyTo.author?.username} için yanıt...` : 'Bir yorum yaz...'}
              maxLength={500}
              rows={2}
              className="flex-1 bg-surface border border-stroke rounded-xl px-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-fg/30 transition-colors resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="btn-gradient text-white px-3 rounded-xl disabled:opacity-50 transition-opacity shrink-0 self-end h-10"
            >
              {sending ? <Spinner size="sm" /> : <Send size={15} />}
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-5 text-center py-4 bg-surface border border-stroke rounded-xl">
          <p className="text-sm text-fg-subtle">
            Yorum yapmak için{' '}
            <Link href="/giris" className="font-semibold text-fg hover:text-primary transition-colors">giriş yap</Link>
          </p>
        </div>
      )}

      {/* Comment list */}
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : topLevel.length === 0 ? (
        <p className="text-center text-sm text-fg-subtle py-8">Henüz yorum yok. İlk yorumu sen yap!</p>
      ) : (
        <div className="space-y-3">
          {topLevel.map(comment => (
            <div key={comment.id}>
              <CommentRow
                comment={comment}
                userId={userId}
                onReply={setReplyTo}
                onDelete={deleteComment}
              />
              {replies(comment.id).length > 0 && (
                <div className="ml-8 mt-2 space-y-2 border-l-2 border-stroke pl-4">
                  {replies(comment.id).map(reply => (
                    <CommentRow
                      key={reply.id}
                      comment={reply}
                      userId={userId}
                      onReply={setReplyTo}
                      onDelete={deleteComment}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CommentRow({
  comment, userId, onReply, onDelete, isReply = false,
}: {
  comment: Comment
  userId: string | null
  onReply: (c: Comment) => void
  onDelete: (id: string) => void
  isReply?: boolean
}) {
  const isOwn = comment.author?.id === userId

  return (
    <div className={cn('flex gap-2.5', isReply && 'opacity-90')}>
      <Link href={`/profil/${comment.author?.username}`} className="shrink-0">
        <Avatar src={comment.author?.avatar_url ?? null} username={comment.author?.username ?? '?'} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link href={`/profil/${comment.author?.username}`} className="text-sm font-semibold text-fg hover:text-primary transition-colors">
            {comment.author?.display_name || comment.author?.username}
          </Link>
          <span className="text-xs text-fg-subtle">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-fg-muted leading-relaxed">{comment.content}</p>
        <div className="flex items-center gap-3 mt-1">
          {userId && !isOwn && (
            <button
              onClick={() => onReply(comment)}
              className="text-xs text-fg-subtle hover:text-fg transition-colors"
            >
              Yanıtla
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-fg-subtle hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
