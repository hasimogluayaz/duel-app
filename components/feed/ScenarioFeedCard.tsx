'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { TugBar } from '@/components/ui/TugBar'
import { timeAgo } from '@/lib/utils/formatting'
import { ChevronUp, ChevronDown, MessageCircle, Flame, Bookmark, Share2, MoreHorizontal } from 'lucide-react'

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODE_META = {
  senaryo:  { label: 'Senaryo',  cls: 'k-mode-senaryo' },
  tartisma: { label: 'Tartışma', cls: 'k-mode-tartisma' },
  emoji:    { label: 'Emoji',    cls: 'k-mode-emoji'    },
  karakter: { label: 'Karakter', cls: 'k-mode-karakter' },
} as const
type Mode = keyof typeof MODE_META

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ScenarioFeedItem {
  id: string
  mode: Mode
  scenario_content: string
  created_at: string
  vote_count: number
  comment_count?: number
  answer_preview?: string | null  // top answer or user's answer
  author?: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
  } | null
  // For Tartışma / duel type cards
  is_duel?: boolean
  share_token?: string | null
  challenger?: { username: string; display_name: string | null; avatar_url: string | null } | null
  challenged?: { username: string; display_name: string | null; avatar_url: string | null } | null
  sicak_pct?: number
  soguk_pct?: number
  // current user state
  user_voted?: boolean
}

interface Props {
  item: ScenarioFeedItem
  userId?: string | null
  onUpvote?: (id: string, newCount: number) => void
}

export function ScenarioFeedCard({ item, userId, onUpvote }: Props) {
  const mode = MODE_META[item.mode] ?? MODE_META.senaryo
  const [votes, setVotes] = useState(item.vote_count)
  const [voted, setVoted] = useState(item.user_voted ?? false)
  const [bookmarked, setBookmarked] = useState(false)
  const [shared, setShared] = useState(false)

  const href = item.is_duel && item.share_token
    ? `/duel/${item.share_token}`
    : `/arsiv/${item.id}`

  const handleUpvote = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!userId) return
    const newVoted = !voted
    const delta = newVoted ? 1 : -1
    setVoted(newVoted)
    setVotes(v => v + delta)
    onUpvote?.(item.id, votes + delta)
    // fire-and-forget
    fetch(`/api/scenarios/${item.id}/upvote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: newVoted ? 'up' : 'cancel' }),
    }).catch(() => {
      // revert on error
      setVoted(!newVoted)
      setVotes(v => v - delta)
    })
  }, [userId, voted, votes, item.id, onUpvote])

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    const url = `${window.location.origin}${href}`
    if (navigator.share) {
      await navigator.share({ title: item.scenario_content, url })
    } else {
      await navigator.clipboard.writeText(url)
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }, [href, item.scenario_content])

  const handleBookmark = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setBookmarked(b => !b)
  }, [])

  return (
    <article className="k3-card card-hover" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Top row: mode badge + author + time + menu ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {/* Mode badge */}
          <span className={`k-mode ${mode.cls}`}>
            <span className="k-mode-dot" />
            {mode.label}
          </span>

          {/* Author */}
          {item.is_duel && item.challenger && item.challenged ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <Avatar src={item.challenger.avatar_url} username={item.challenger.username} size="xs" />
              <span style={{ font: '600 12.5px Geist, sans-serif', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
                {item.challenger.display_name || item.challenger.username}
              </span>
              <span style={{ font: '700 11px Geist, sans-serif', color: 'var(--fg-subtle)' }}>VS</span>
              <Avatar src={item.challenged.avatar_url} username={item.challenged.username} size="xs" />
              <span style={{ font: '600 12.5px Geist, sans-serif', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>
                {item.challenged.display_name || item.challenged.username}
              </span>
            </div>
          ) : item.author ? (
            <Link href={`/profil/${item.author.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
              <Avatar src={item.author.avatar_url} username={item.author.username} size="xs" />
              <span style={{ font: '600 12.5px Geist, sans-serif', color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.author.display_name || item.author.username}
              </span>
            </Link>
          ) : (
            <span style={{ font: '600 12px Geist, sans-serif', color: 'var(--fg-subtle)' }}>Topluluk</span>
          )}

          <span style={{ font: '400 11.5px Geist Mono, monospace', color: 'var(--fg-subtle)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            · {timeAgo(item.created_at)}
          </span>
        </div>

        {/* Menu button */}
        <button
          style={{ padding: 4, borderRadius: 8, color: 'var(--fg-subtle)', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
          className="hover:text-fg hover:bg-surface-2 transition-colors"
          onClick={e => e.preventDefault()}
          aria-label="Daha fazla"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* ── Scenario question ── */}
      <Link href={href} style={{ textDecoration: 'none' }}>
        <h3 className="k3-h-2" style={{ margin: 0, fontSize: 15, color: 'var(--fg)', lineHeight: 1.4, letterSpacing: '-0.02em' }}>
          {item.scenario_content}
        </h3>
      </Link>

      {/* ── Answer preview / duel bar ── */}
      {item.is_duel && item.sicak_pct !== undefined ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TugBar warm={item.sicak_pct} cool={item.soguk_pct ?? (100 - item.sicak_pct)} compact />
          <div style={{ display: 'flex', justifyContent: 'space-between', font: '500 12px Geist, sans-serif', color: 'var(--fg-subtle)' }}>
            <span>🔥 Sıcak <b style={{ color: 'var(--k3-warm-500)' }}>{item.sicak_pct}%</b></span>
            <span><b style={{ color: 'var(--k-blue-600)' }}>{item.soguk_pct ?? 100 - item.sicak_pct}%</b> Soğuk ❄️</span>
          </div>
        </div>
      ) : item.answer_preview ? (
        <p style={{
          margin: 0, font: '400 13.5px Geist, sans-serif', color: 'var(--fg-muted)',
          lineHeight: 1.5, letterSpacing: '-0.005em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          &ldquo;{item.answer_preview}&rdquo;
        </p>
      ) : null}

      {/* ── Action row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        {/* Left: upvote / comment / hot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={`k3-tab${voted ? ' active' : ''}`}
            disabled={!userId}
            style={{ color: voted ? 'var(--k-blue-600)' : undefined }}
            title={userId ? (voted ? 'Geri al' : 'Beğen') : 'Beğenmek için giriş yap'}
          >
            <ChevronUp size={13} strokeWidth={2.2} />
            <span className="tab-nums">{votes > 0 ? votes.toLocaleString('tr-TR') : ''}</span>
          </button>

          {/* Downvote */}
          <button
            className="k3-tab"
            disabled={!userId}
            onClick={e => e.preventDefault()}
            style={{ padding: '4px 8px' }}
          >
            <ChevronDown size={13} strokeWidth={2.2} />
          </button>

          {/* Comments */}
          {(item.comment_count ?? 0) > 0 && (
            <Link href={href} className="k3-tab" style={{ textDecoration: 'none' }}>
              <MessageCircle size={12} />
              <span className="tab-nums">{item.comment_count!.toLocaleString('tr-TR')}</span>
            </Link>
          )}

          {/* Hot / streak */}
          {votes >= 50 && (
            <span className="k3-tab" style={{ color: 'var(--k3-warm-500, #ed6f1c)', borderColor: 'var(--k3-warm-100, #ffdcbf)', background: 'var(--k3-warm-50, #fff1e6)' }}>
              <Flame size={12} />
              <span className="tab-nums">{votes >= 1000 ? `${(votes/1000).toFixed(1)}k` : votes}</span>
            </span>
          )}
        </div>

        {/* Right: bookmark + share */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleBookmark}
            style={{
              padding: '5px 7px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer',
              color: bookmarked ? 'var(--k-blue-500)' : 'var(--fg-subtle)',
              transition: 'color .12s',
            }}
            className="hover:text-fg transition-colors"
            title="Kaydet"
          >
            <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleShare}
            style={{ padding: '5px 7px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fg-subtle)', transition: 'color .12s' }}
            className="hover:text-fg transition-colors"
            title="Paylaş"
          >
            {shared ? <span style={{ font: '600 10px Geist', color: 'var(--k-success)' }}>✓</span> : <Share2 size={15} />}
          </button>
        </div>
      </div>
    </article>
  )
}
