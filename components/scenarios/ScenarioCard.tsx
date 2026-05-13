'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/lib/utils/cn'
import { timeAgo } from '@/lib/utils/formatting'
import BookmarkButton from '@/components/bookmarks/BookmarkButton'
import { ContentMenu } from '@/components/ui/ContentMenu'
import { useToast } from '@/components/ui/Toast'
import { Eye, EyeOff, MessageCircle, ThumbsUp, Swords, Share2, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ChallengeModal } from '@/components/scenarios/ChallengeModal'

const CATEGORY_EMOJI: Record<string, string> = {
  genel: '🌍', ask: '❤️', is: '💼', aile: '👨‍👩‍👧',
  sosyal: '👥', teknoloji: '💻', dunya: '🌏', mizah: '😂',
  felsefe: '🤔', kariyer: '💼', etik: '⚖️', tartisma: '🔥', spor: '⚽',
}

const MODE_EMOJI: Record<string, string> = {
  scenario: '💭', debate: '🔥', emoji: '😊', character: '🎭',
}

export interface ScenarioData {
  id: string
  content: string
  category: string
  answer_count: number
  comment_count?: number
  upvotes?: number
  generated_at?: string
  created_at?: string
  is_user_created: boolean
  is_approved?: boolean
  tags?: string[]
  debate_question?: string
  scenario_type?: string
  author?: { username: string; display_name: string | null; avatar_url: string | null } | null
  answered?: boolean
}

interface Props {
  scenario: ScenarioData
  userId: string | null
  mode?: 'feed' | 'detail'
  initialUpvoted?: boolean
  showAnswer?: boolean
  isOwnScenario?: boolean
}

export default function ScenarioCard({ scenario, userId, mode = 'feed', initialUpvoted = false, showAnswer = false, isOwnScenario = false }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [upvotes, setUpvotes] = useState(scenario.upvotes ?? 0)
  const [upvoted, setUpvoted] = useState(initialUpvoted)
  const [upvoting, setUpvoting] = useState(false)
  const [answered, setAnswered] = useState(scenario.answered ?? false)
  const [answer, setAnswer] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(showAnswer)
  const [showChallenge, setShowChallenge] = useState(false)
  const [userAnswerId, setUserAnswerId] = useState<string | null>(null)
  const [loadingAnswerId, setLoadingAnswerId] = useState(false)

  const timestamp = scenario.generated_at ?? scenario.created_at

  const handleUpvote = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!userId) { toast('Beğenmek için giriş yap.', 'error'); return }
    if (upvoting) return
    setUpvoting(true)

    const prev = upvoted
    setUpvoted(!prev)
    setUpvotes(c => prev ? Math.max(0, c - 1) : c + 1)

    const res = await fetch('/api/scenarios/upvote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenario.id }),
    })
    if (!res.ok) {
      setUpvoted(prev)
      setUpvotes(c => prev ? c + 1 : Math.max(0, c - 1))
    }
    setUpvoting(false)
  }, [userId, upvoted, upvoting, scenario.id, toast])

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/arsiv/${scenario.id}`
    if (navigator.share) {
      await navigator.share({ title: 'Kapisio Senaryosu', text: scenario.content, url })
    } else {
      await navigator.clipboard.writeText(url)
      toast('Bağlantı kopyalandı!', 'success')
    }
  }, [scenario.id, scenario.content, toast])

  const handleAnswer = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim() || submitting) return
    setSubmitting(true)
    const res = await fetch('/api/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario_id: scenario.id, content: answer, is_anonymous: isAnonymous }),
    })
    const data = await res.json()
    if (!res.ok) { toast(data.error ?? 'Bir hata oluştu.', 'error'); setSubmitting(false); return }
    setAnswered(true)
    setExpanded(false)
    toast('Cevabın kaydedildi! 🎉', 'success')
    setSubmitting(false)
  }, [answer, isAnonymous, submitting, scenario.id, toast])

  const isDebate = scenario.scenario_type === 'debate'

  const cardContent = (
    <div className={cn(
      'bg-surface border rounded-2xl transition-all',
      mode === 'feed' ? 'border-stroke hover:border-stroke/60 hover:bg-surface-2 cursor-pointer' : 'border-stroke',
      answered && 'border-green-500/20'
    )}>
      <div className="p-4">

        {/* Author header — Twitter style */}
        {scenario.is_user_created && scenario.author ? (
          <div className="flex items-start justify-between gap-3 mb-3" onClick={e => e.stopPropagation()}>
            <Link href={`/profil/${scenario.author.username}`} className="flex items-center gap-2.5 group">
              <Avatar src={scenario.author.avatar_url} username={scenario.author.username} size="sm" />
              <div>
                <p className="text-sm font-semibold text-fg group-hover:text-primary transition-colors leading-tight">
                  {scenario.author.display_name || scenario.author.username}
                </p>
                <p className="text-xs text-fg-subtle">@{scenario.author.username}</p>
              </div>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              {timestamp && (
                <span className="text-xs text-fg-subtle">{timeAgo(timestamp)}</span>
              )}
              {userId && (
                <span onClick={e => e.stopPropagation()}>
                  <ContentMenu
                    targetType="scenario"
                    targetId={scenario.id}
                    userId={userId}
                    isOwn={isOwnScenario}
                    onDelete={async () => {
                      const res = await fetch(`/api/scenarios/${scenario.id}`, { method: 'DELETE' })
                      if (res.ok) { toast('Senaryo silindi.', 'success'); router.refresh() }
                      else toast('Silinemedi.', 'error')
                    }}
                    size={14}
                  />
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-fg-subtle">
                {CATEGORY_EMOJI[scenario.category] ?? '📝'} {scenario.category}
              </span>
              {scenario.scenario_type && scenario.scenario_type !== 'scenario' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-fg-subtle">
                  {MODE_EMOJI[scenario.scenario_type]} {scenario.scenario_type}
                </span>
              )}
            </div>
            {answered && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full shrink-0">
                ✓ Cevaplandı
              </span>
            )}
          </div>
        )}

        {/* Category + type row for user-created scenarios */}
        {scenario.is_user_created && (
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-fg-subtle">
              {CATEGORY_EMOJI[scenario.category] ?? '📝'} {scenario.category}
            </span>
            {scenario.scenario_type && scenario.scenario_type !== 'scenario' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-surface-2 text-fg-subtle">
                {MODE_EMOJI[scenario.scenario_type]} {scenario.scenario_type}
              </span>
            )}
            {answered && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                ✓ Cevaplandı
              </span>
            )}
          </div>
        )}

        {/* Debate question as main heading, content as context */}
        {isDebate && scenario.debate_question ? (
          <>
            <p className="text-fg font-semibold leading-snug text-base mb-1">{scenario.debate_question}</p>
            <p className="text-sm text-fg-subtle italic leading-relaxed border-l-2 border-stroke pl-3">{scenario.content}</p>
          </>
        ) : (
          <p className="text-fg font-medium leading-relaxed">{scenario.content}</p>
        )}

        {/* Tags */}
        {scenario.tags && scenario.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-2">
            {scenario.tags.map(tag => (
              <span key={tag} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-3 -mx-1" onClick={e => e.stopPropagation()}>

          {/* Comments */}
          <Link
            href={`/arsiv/${scenario.id}#comments`}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors text-xs"
          >
            <MessageCircle size={14} />
            <span>{scenario.comment_count ?? scenario.answer_count ?? 0}</span>
          </Link>

          {/* Upvote */}
          <button
            onClick={handleUpvote}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors text-xs',
              upvoted
                ? 'text-green-400 bg-green-500/10 hover:bg-green-500/15'
                : 'text-fg-subtle hover:text-green-400 hover:bg-green-500/10'
            )}
          >
            <ThumbsUp size={14} className={upvoted ? 'fill-green-400' : ''} />
            <span>{upvotes > 0 ? upvotes : ''}</span>
          </button>

          {/* Duel invite / Answer CTA */}
          {userId && (
            answered ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  if (!userAnswerId && !loadingAnswerId) {
                    setLoadingAnswerId(true)
                    try {
                      const res = await fetch(`/api/scenarios/${scenario.id}/my-answer`)
                      if (res.ok) {
                        const json = await res.json()
                        setUserAnswerId(json.answerId ?? null)
                      }
                    } catch {}
                    setLoadingAnswerId(false)
                  }
                  setShowChallenge(true)
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl transition-colors text-xs font-semibold"
                style={{ background: 'var(--k-blue-50)', color: 'var(--k-blue-600)' }}
              >
                {loadingAnswerId
                  ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <Swords size={14} />
                }
                <span className="hidden sm:inline">Meydan Oku</span>
              </button>
            ) : (
              <Link
                href={`/arsiv/${scenario.id}`}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-fg-subtle hover:text-primary hover:bg-primary/10 transition-colors text-xs"
              >
                <Swords size={14} />
                <span className="hidden sm:inline">Cevapla</span>
              </Link>
            )
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors text-xs"
          >
            <Share2 size={14} />
          </button>

          {/* Bookmark */}
          <span className="px-1">
            <BookmarkButton type="scenario" id={scenario.id} size={14} />
          </span>

          {/* Inline reply toggle — detail mode only */}
          {mode === 'detail' && userId && !answered && (
            <button
              onClick={() => setExpanded(v => !v)}
              className={cn(
                'ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
                expanded
                  ? 'bg-surface-2 text-fg-subtle'
                  : 'btn-gradient text-white'
              )}
            >
              {expanded ? 'İptal' : 'Cevapla'}
              <ChevronDown size={12} className={cn('transition-transform', expanded && 'rotate-180')} />
            </button>
          )}

          {/* Answers count link */}
          <Link
            href={`/arsiv/${scenario.id}`}
            className="ml-auto text-xs text-fg-subtle hover:text-fg transition-colors"
          >
            {scenario.answer_count} cevap
          </Link>
        </div>

        {/* Answer form — detail mode */}
        {mode === 'detail' && expanded && !answered && userId && (
          <form onSubmit={handleAnswer} className="mt-3 space-y-2 border-t border-stroke pt-3">
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Cevabını yaz..."
              maxLength={500}
              rows={3}
              className="w-full bg-surface-2 border border-stroke rounded-xl p-3 text-fg placeholder:text-fg-subtle text-sm resize-none focus:outline-none focus:border-fg/30 transition-colors leading-relaxed"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsAnonymous(v => !v)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all',
                  isAnonymous
                    ? 'bg-surface-2 border-fg/20 text-fg-subtle'
                    : 'bg-surface border-stroke text-fg-subtle hover:text-fg'
                )}
              >
                {isAnonymous ? <EyeOff size={12} /> : <Eye size={12} />}
                {isAnonymous ? 'Anonim' : 'İsmim görünsün'}
              </button>
              <button
                type="submit"
                disabled={submitting || answer.trim().length < 3}
                className="btn-gradient text-white text-sm font-semibold px-4 py-1.5 rounded-xl disabled:opacity-50 transition-opacity"
              >
                {submitting ? 'Gönderiliyor...' : 'Gönder'}
              </button>
            </div>
          </form>
        )}

        {/* Login CTA */}
        {!userId && mode === 'detail' && (
          <div className="mt-3 border-t border-stroke pt-3">
            <Link
              href="/giris"
              className="block text-center text-sm text-fg-subtle hover:text-fg transition-colors py-2"
            >
              Cevaplamak için{' '}
              <span className="font-semibold text-fg">giriş yap</span> →
            </Link>
          </div>
        )}

      </div>
    </div>
  )

  const challengeModal = showChallenge && userId ? (
    <ChallengeModal
      scenarioId={scenario.id}
      scenarioContent={scenario.content}
      userAnswerId={userAnswerId}
      userId={userId}
      onClose={() => setShowChallenge(false)}
    />
  ) : null

  if (mode === 'feed') {
    return (
      <>
        <Link href={`/arsiv/${scenario.id}`} className="block">
          {cardContent}
        </Link>
        {challengeModal}
      </>
    )
  }

  return (
    <>
      {cardContent}
      {challengeModal}
    </>
  )
}
