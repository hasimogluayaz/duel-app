'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { formatPoints, timeAgo } from '@/lib/utils/formatting'
import type { Profile } from '@/types'
import Link from 'next/link'
import { Search, Flame, Star, Users, TrendingUp, Swords, MessageCircle, Trophy, FileText, Plus } from 'lucide-react'
import BookmarkButton from '@/components/bookmarks/BookmarkButton'
import { cn } from '@/lib/utils/cn'
import { getTier } from '@/lib/utils/tier'
import FollowSuggestions from '@/components/social/FollowSuggestions'
import TrendingTags from '@/components/social/TrendingTags'
import ScenarioCard from '@/components/scenarios/ScenarioCard'
import { DuelFeedCard } from '@/components/feed/DuelFeedCard'
import { StoriesBar } from '@/components/feed/StoriesBar'

// ─── Feed Types ───────────────────────────────────────────────────────────────
type FeedDuel = {
  id: string
  share_token: string
  status: 'active' | 'completed'
  created_at: string
  vote_deadline: string | null
  comment_count: number
  winner_id: string | null
  challenger_id: string
  challenged_id: string
  challenger: { id: string; username: string; display_name: string | null; avatar_url: string | null; total_points: number }
  challenged: { id: string; username: string; display_name: string | null; avatar_url: string | null; total_points: number }
  challenger_answer: { content: string; vote_count: number } | null
  challenged_answer: { content: string; vote_count: number } | null
  scenario: { content: string } | null
}

// ─── Feed Card ────────────────────────────────────────────────────────────────
function FeedCard({ duel }: { duel: FeedDuel }) {
  const challengerTier = getTier(duel.challenger.total_points)
  const challengedTier = getTier(duel.challenged.total_points)
  const totalVotes = (duel.challenger_answer?.vote_count ?? 0) + (duel.challenged_answer?.vote_count ?? 0)

  return (
    <Link href={`/duel/${duel.share_token}`}>
      <Card className="hover:bg-surface-2 transition-all cursor-pointer group">

        {/* Scenario */}
        {duel.scenario?.content && (
          <p className="text-xs text-fg-subtle italic mb-3 line-clamp-1 border-l-2 border-primary/40 pl-2">
            &ldquo;{duel.scenario.content}&rdquo;
          </p>
        )}

        {/* VS row */}
        <div className="flex items-center gap-2 mb-3">
          {/* Challenger */}
          <div className={cn(
            'flex-1 flex items-center gap-2 p-2 rounded-xl border transition-colors',
            duel.status === 'completed' && duel.winner_id === duel.challenger_id
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-stroke bg-surface'
          )}>
            <Avatar src={duel.challenger.avatar_url} username={duel.challenger.username} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-fg truncate">
                {duel.challenger.display_name || duel.challenger.username}
                <span className={`ml-1 ${challengerTier.color}`}>{challengerTier.emoji}</span>
              </p>
              {duel.challenger_answer && (
                <p className="text-[11px] text-fg-subtle line-clamp-1 mt-0.5">{duel.challenger_answer.content}</p>
              )}
            </div>
            {duel.status === 'completed' && duel.winner_id === duel.challenger_id && (
              <Trophy size={12} className="text-yellow-400 shrink-0" />
            )}
            <span className="text-xs font-black text-fg-muted shrink-0">
              {duel.challenger_answer?.vote_count ?? 0}
            </span>
          </div>

          <div className="text-xs font-black text-fg-subtle shrink-0">VS</div>

          {/* Challenged */}
          <div className={cn(
            'flex-1 flex items-center gap-2 p-2 rounded-xl border transition-colors',
            duel.status === 'completed' && duel.winner_id === duel.challenged_id
              ? 'border-green-500/30 bg-green-500/5'
              : 'border-stroke bg-surface'
          )}>
            <Avatar src={duel.challenged.avatar_url} username={duel.challenged.username} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-fg truncate">
                {duel.challenged.display_name || duel.challenged.username}
                <span className={`ml-1 ${challengedTier.color}`}>{challengedTier.emoji}</span>
              </p>
              {duel.challenged_answer && (
                <p className="text-[11px] text-fg-subtle line-clamp-1 mt-0.5">{duel.challenged_answer.content}</p>
              )}
            </div>
            {duel.status === 'completed' && duel.winner_id === duel.challenged_id && (
              <Trophy size={12} className="text-yellow-400 shrink-0" />
            )}
            <span className="text-xs font-black text-fg-muted shrink-0">
              {duel.challenged_answer?.vote_count ?? 0}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-fg-subtle">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star size={11} className="text-amber-400" />
              {totalVotes} oy
            </span>
            {duel.comment_count > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle size={11} />
                {duel.comment_count}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {duel.status === 'active' ? (
              <Badge variant="info" className="text-[10px] py-0">Aktif</Badge>
            ) : (
              <Badge variant="success" className="text-[10px] py-0">Bitti</Badge>
            )}
            <span>{timeAgo(duel.created_at)}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ─── Search Tab (users + scenarios) ──────────────────────────────────────────
function SearchTab() {
  const [query, setQuery]               = useState('')
  const [mode, setMode]                 = useState<'users' | 'scenarios'>('users')
  const [users, setUsers]               = useState<Profile[]>([])
  const [scenarios, setScenarios]       = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const search = useCallback(async (q: string, m: 'users' | 'scenarios') => {
    setLoading(true)
    if (m === 'users') {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setUsers(json.users ?? [])
    } else {
      if (q.length < 2) {
        // Show popular scenarios when no query
        const res = await fetch('/api/scenarios?limit=20')
        const json = await res.json()
        setScenarios(json.scenarios ?? [])
      } else {
        const res = await fetch(`/api/search?type=scenarios&q=${encodeURIComponent(q)}`)
        const json = await res.json()
        setScenarios(json.scenarios ?? [])
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { search(debouncedQuery, mode) }, [debouncedQuery, mode, search])

  return (
    <>
      {/* Mode toggle */}
      <div className="flex border-b border-stroke mb-4">
        <button
          onClick={() => setMode('users')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px',
            mode === 'users'
              ? 'border-fg text-fg'
              : 'border-transparent text-fg-subtle hover:text-fg-muted'
          )}
        >
          <Users size={13} />
          Oyuncular
        </button>
        <button
          onClick={() => setMode('scenarios')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px',
            mode === 'scenarios'
              ? 'border-fg text-fg'
              : 'border-transparent text-fg-subtle hover:text-fg-muted'
          )}
        >
          <FileText size={13} />
          Senaryolar
        </button>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
        <input
          type="text"
          placeholder={mode === 'users' ? 'Kullanıcı adı veya isim ara...' : 'Senaryo içeriği ara...'}
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary transition-colors"
          autoFocus
        />
      </div>

      {/* Result label */}
      <div className="flex items-center gap-2 mb-3">
        {query.length >= 2 ? (
          <>
            <Search size={14} className="text-fg-subtle" />
            <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
              &quot;{query}&quot; için sonuçlar
            </span>
          </>
        ) : (
          <>
            <TrendingUp size={14} className="text-fg-subtle" />
            <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">
              {mode === 'users' ? 'En İyi Oyuncular' : 'Popüler Senaryolar'}
            </span>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : mode === 'users' ? (
        users.length === 0 ? (
          <div className="text-center py-16">
            <Users size={28} className="text-fg-subtle opacity-25 mx-auto mb-3" />
            <p className="text-fg-muted font-semibold">Kullanıcı bulunamadı</p>
            <p className="text-fg-subtle text-sm mt-1">Farklı bir arama dene</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {users.map((user, idx) => (
              <Link key={user.id} href={`/profil/${user.username}`}>
                <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-surface border border-stroke hover:bg-surface-2 transition-all cursor-pointer group">
                  {!query && (
                    <span className="text-sm font-bold text-fg-subtle w-5 text-center flex-shrink-0">{idx + 1}</span>
                  )}
                  <Avatar src={user.avatar_url} username={user.username} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-fg text-sm truncate">
                        {user.display_name || user.username}
                      </p>
                      {user.personality_type && (
                        <Badge variant="default" className="text-xs hidden sm:inline-flex shrink-0">🧠 {user.personality_type}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-fg-subtle">@{user.username}</p>
                    {user.bio && <p className="text-xs text-fg-muted mt-1 line-clamp-1">{user.bio}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <div className="flex items-center gap-1 justify-end">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold text-fg">{formatPoints(user.total_points)}</span>
                      </div>
                      <p className="text-xs text-fg-subtle">puan</p>
                    </div>
                    {user.streak_count > 0 && (
                      <div>
                        <div className="flex items-center gap-1 justify-end text-amber-400">
                          <Flame size={11} /><span className="text-sm font-bold">{user.streak_count}</span>
                        </div>
                        <p className="text-xs text-fg-subtle">seri</p>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        scenarios.length === 0 ? (
          <Card className="text-center py-14 border-dashed">
            <FileText size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
            <p className="text-fg font-semibold">Senaryo bulunamadı</p>
            <p className="text-fg-subtle text-sm mt-1">Farklı anahtar kelimeler dene</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {scenarios.map((s: any) => (
              <Link key={s.id} href={`/arsiv/${s.id}`}>
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-surface border border-stroke hover:bg-surface-2 transition-all cursor-pointer group">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText size={14} className="text-primary/70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-fg leading-relaxed line-clamp-2">
                      {s.content}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-fg-subtle">
                      <span>{s.answer_count ?? 0} cevap</span>
                      {s.category && (
                        <>
                          <span>·</span>
                          <span className="capitalize">{s.category}</span>
                        </>
                      )}
                      {s.difficulty && (
                        <>
                          <span>·</span>
                          <span className={
                            s.difficulty === 'hard' ? 'text-red-400' :
                            s.difficulty === 'medium' ? 'text-amber-400' :
                            'text-green-400'
                          }>
                            {s.difficulty === 'hard' ? 'Zor' : s.difficulty === 'medium' ? 'Orta' : 'Kolay'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </>
  )
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────
function FeedTab() {
  const [duels, setDuels] = useState<FeedDuel[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [period, setPeriod] = useState<'today' | 'week'>('today')
  const cursorRef = useRef<string | null>(null)

  const load = useCallback(async (p: 'today' | 'week', reset = false) => {
    if (reset) { setLoading(true); cursorRef.current = null }
    else setLoadingMore(true)

    const params = new URLSearchParams({ period: p })
    if (!reset && cursorRef.current) params.set('cursor', cursorRef.current)

    const res = await fetch(`/api/feed?${params}`)
    const json = await res.json()
    const newDuels: FeedDuel[] = json.duels ?? []

    if (reset) setDuels(newDuels)
    else setDuels(prev => [...prev, ...newDuels])

    setHasMore(newDuels.length === 20)
    if (newDuels.length > 0) cursorRef.current = newDuels[newDuels.length - 1].created_at

    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => { load(period, true) }, [period, load])

  return (
    <>
      {/* Period toggle */}
      <div className="flex border-b border-stroke mb-4">
        {(['today', 'week'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px',
              period === p
                ? 'border-fg text-fg'
                : 'border-transparent text-fg-subtle hover:text-fg-muted'
            )}
          >
            {p === 'today' ? 'Bugün' : 'Bu Hafta'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : duels.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="text-fg font-bold mb-1">
            {period === 'today' ? 'Bugün henüz düello yok' : 'Bu hafta henüz düello yok'}
          </p>
          <p className="text-fg-subtle text-sm mb-4">Bugünkü senaryoya cevap ver ve ilk düelloyu başlat.</p>
          <Link href="/oyun" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #1442a8, #2a6cf0)' }}>
            <Swords size={14} /> Düello Başlat
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {duels.map(duel => (
              <DuelFeedCard
                key={duel.id}
                duel={{
                  ...duel,
                  votesA: duel.challenger_answer?.vote_count ?? 0,
                  votesB: duel.challenged_answer?.vote_count ?? 0,
                  like_count: 0,
                  view_count: 0,
                  user_liked: false,
                }}
                userId={null}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => load(period)}
              disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-xl border border-stroke text-sm text-fg-subtle hover:bg-surface-2 hover:text-fg transition-all disabled:opacity-50"
            >
              {loadingMore ? <Spinner size="sm" className="mx-auto" /> : 'Daha fazla yükle'}
            </button>
          )}
        </>
      )}
    </>
  )
}

// ─── Friends Feed Tab ─────────────────────────────────────────────────────────
function FriendsTab() {
  const [tab, setTab] = useState<'senaryolar' | 'cevaplar'>('senaryolar')
  const [scenarios, setScenarios] = useState<any[]>([])
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/feed/friends').then(r => r.json()),
      fetch('/api/scenarios?user_created=true&sort=recent&limit=20').then(r => r.json()),
    ]).then(([friendsData, scenariosData]) => {
      setAnswers(friendsData.answers ?? [])
      setScenarios(scenariosData.scenarios ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  const hasContent = answers.length > 0 || scenarios.length > 0

  if (!hasContent) {
    return (
      <div className="text-center py-16">
        <Users size={28} className="text-fg-subtle opacity-25 mx-auto mb-3" />
        <p className="text-fg-muted font-semibold mb-1">Takip ettiğin kimse yok</p>
        <p className="text-fg-subtle text-sm">
          Arama sekmesinden insanları takip et — paylaşımlarını burada gör.
        </p>
        <Link href="/kesfet" onClick={() => {}} className="inline-block mt-4 text-sm font-semibold btn-gradient text-white px-4 py-2 rounded-xl">
          Kişi Keşfet
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex border-b border-stroke">
        {([
          { id: 'senaryolar', label: 'Senaryolar' },
          { id: 'cevaplar', label: 'Cevaplar' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              tab === t.id ? 'border-fg text-fg' : 'border-transparent text-fg-subtle hover:text-fg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'senaryolar' && (
        scenarios.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-fg font-bold mb-1">Arkadaşların henüz paylaşmadı</p>
            <p className="text-fg-subtle text-sm mb-4">Daha fazla kişiyi takip et veya sen bir senaryo yaz.</p>
            <Link href="/senaryo-olustur" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: 'var(--k-blue-500)' }}>
              <Plus size={15} /> Senaryo Yaz
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {scenarios.map((s: any) => (
              <ScenarioCard key={s.id} scenario={s} userId={null} mode="feed" />
            ))}
          </div>
        )
      )}

      {tab === 'cevaplar' && (
        answers.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-fg font-bold mb-1">Henüz cevap yok</p>
            <p className="text-fg-subtle text-sm mb-4">Takip ettiğin kişiler bugünkü senaryoya henüz yazmadı.</p>
            <Link href="/oyun" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: 'var(--k-blue-500)' }}>
              Bugün oyna →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {answers.map((a: any) => (
              <div key={a.id} className="border border-stroke rounded-2xl p-4 bg-surface hover:bg-surface-2 transition-colors">
                {a.scenario_content && (
                  <p className="text-xs text-fg-subtle italic mb-3 border-l-2 border-stroke pl-2 line-clamp-2">
                    {a.scenario_content}
                  </p>
                )}
                <div className="flex items-start gap-3">
                  <Link href={`/profil/${a.username}`}>
                    <Avatar src={a.avatar_url} username={a.username} size="sm" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/profil/${a.username}`} className="text-sm font-semibold text-fg hover:text-primary transition-colors">
                        {a.display_name || a.username}
                      </Link>
                      <span className="text-xs text-fg-subtle">· {timeAgo(a.created_at)}</span>
                    </div>
                    <p className="text-sm text-fg-muted leading-relaxed">{a.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-fg-subtle">
                        <Star size={11} className="text-amber-400" />
                        {a.vote_count} oy
                      </span>
                      {a.scenario_id && (
                        <Link href={`/arsiv/${a.scenario_id}`} className="text-xs text-fg-subtle hover:text-fg transition-colors">
                          Cevaplara bak →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'aile',       emoji: '👨‍👩‍👧', label: 'Aile',       count: '1.2k' },
  { key: 'ask',        emoji: '❤️',  label: 'Aşk',        count: '3.2k' },
  { key: 'is',         emoji: '💼',  label: 'İş Hayatı',  count: '940' },
  { key: 'etik',       emoji: '⚖️',  label: 'Etik',       count: '612' },
  { key: 'felsefe',    emoji: '🤔',  label: 'Felsefe',    count: '480' },
  { key: 'dunya',      emoji: '🌍',  label: 'Gündem',     count: '1.4k' },
  { key: 'sosyal',     emoji: '👥',  label: 'Arkadaşlık', count: '860' },
  { key: 'mizah',      emoji: '😂',  label: 'Mizah',      count: '720' },
]

function CategoriesTab() {
  const [selected, setSelected] = useState<string | null>(null)
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editorPicks, setEditorPicks] = useState<any[]>([])
  const [picksLoading, setPicksLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios?editor_pick=true&limit=3')
      .then(r => r.json())
      .then(d => { setEditorPicks(d.scenarios ?? []); setPicksLoading(false) })
      .catch(() => setPicksLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    fetch(`/api/scenarios?category=${selected}&limit=10`)
      .then(r => r.json())
      .then(d => { setScenarios(d.scenarios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected])

  return (
    <div className="space-y-5">
      {/* Editor picks */}
      {!picksLoading && editorPicks.length > 0 && (
        <div>
          <p className="text-xs text-amber-400 font-bold mb-2 flex items-center gap-1.5">
            <Star size={11} className="fill-amber-400" /> Editör Seçimleri
          </p>
          <div className="space-y-2">
            {editorPicks.map(s => (
              <Link key={s.id} href={`/arsiv/${s.id}`}>
                <div className="bg-amber-500/6 border border-amber-500/20 rounded-xl p-3 hover:border-amber-500/40 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-fg leading-relaxed">{s.content}</p>
                    <BookmarkButton type="scenario" id={s.id} size={14} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-fg-subtle">
                    <span>{s.answer_count} cevap</span>
                    <span>·</span>
                    <span className="capitalize">{s.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Category grid */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-subtle)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
          Bölümler
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {CATEGORIES.map((cat, i) => {
            const colors = ['#2a6cf0','#dc2626','#1442a8','#1c2f6e','#16a34a','#1f8df0','#f97316','#8b5cf6']
            const c = colors[i % colors.length]
            return (
              <button
                key={cat.key}
                onClick={() => setSelected((s: string | null) => s === cat.key ? null : cat.key)}
                style={{
                  padding: 14, borderRadius: 14,
                  background: selected === cat.key
                    ? `color-mix(in oklab, ${c} 10%, white)`
                    : 'var(--surface, #fff)',
                  border: selected === cat.key
                    ? `2px solid ${c}`
                    : '1px solid var(--stroke, #e4e7ed)',
                  cursor: 'pointer', textAlign: 'left',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  transition: 'border .12s, background .12s',
                }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `color-mix(in oklab, ${c} 14%, white)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>{cat.emoji}</span>
                <span style={{ font: '600 14px -apple-system, sans-serif', color: 'var(--fg)' }}>{cat.label}</span>
                <span style={{ font: '500 11px monospace', color: 'var(--fg-subtle)' }}>{cat.count} senaryo</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Category results */}
      {selected && (
        <div>
          <p className="text-xs text-fg-subtle font-semibold mb-2">
            {CATEGORIES.find(c => c.key === selected)?.emoji} {CATEGORIES.find(c => c.key === selected)?.label} Senaryoları
          </p>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-2 rounded-xl animate-pulse" />)}
            </div>
          ) : scenarios.length === 0 ? (
            <p className="text-center text-sm text-fg-subtle py-8">Bu kategoride henüz senaryo yok</p>
          ) : (
            <div className="space-y-2">
              {scenarios.map(s => (
                <Link key={s.id} href={`/arsiv/${s.id}`}>
                  <div className="bg-surface border border-stroke rounded-xl p-3 hover:bg-surface-2 transition-colors cursor-pointer flex items-start justify-between gap-3">
                    <p className="text-sm text-fg-muted leading-relaxed flex-1">{s.content}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-fg-subtle">{s.answer_count}</span>
                      <BookmarkButton type="scenario" id={s.id} size={13} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Community Scenarios Tab ──────────────────────────────────────────────────
function SenaryolarTab() {
  const [scenarios, setScenarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [sort, setSort] = useState<'recent' | 'popular'>('recent')
  const [hasMore, setHasMore] = useState(true)
  const cursorRef = useRef<string | null>(null)

  const load = useCallback(async (s: 'recent' | 'popular', reset = false) => {
    if (reset) { setLoading(true); cursorRef.current = null }
    else setLoadingMore(true)

    const params = new URLSearchParams({ sort: s, limit: '15', user_created: 'true' })
    if (!reset && cursorRef.current) params.set('cursor', cursorRef.current)

    const res = await fetch(`/api/scenarios?${params}`)
    const json = await res.json()
    const items: any[] = json.scenarios ?? []

    if (reset) setScenarios(items)
    else setScenarios(prev => [...prev, ...items])

    setHasMore(items.length === 15)
    if (items.length > 0) cursorRef.current = items[items.length - 1].generated_at

    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => { load(sort, true) }, [sort, load])

  return (
    <div className="space-y-4">
      {/* Create CTA */}
      <Link
        href="/senaryo-olustur"
        className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-stroke hover:border-fg/30 hover:bg-surface transition-all group"
      >
        <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0 group-hover:bg-surface border border-stroke">
          <Plus size={18} className="text-fg-subtle" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Senaryo Oluştur</p>
          <p className="text-xs text-fg-subtle mt-0.5">Topluluğa kendi senaryonu sun — +30 puan</p>
        </div>
      </Link>

      {/* Sort toggle */}
      <div className="flex border-b border-stroke">
        {(['recent', 'popular'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              sort === s ? 'border-fg text-fg' : 'border-transparent text-fg-subtle hover:text-fg-muted'
            )}
          >
            {s === 'recent' ? 'Yeni' : 'Popüler'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : scenarios.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-fg font-bold mb-1">İlk senaryoyu sen yaz</p>
          <p className="text-fg-subtle text-sm mb-4">Topluluğa bir soru sun ve tartışma başlat.</p>
          <Link href="/senaryo-olustur" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white" style={{ background: 'var(--k-blue-500)' }}>
            <Plus size={15} /> Senaryo Oluştur
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {scenarios.map((s: any) => (
              <ScenarioCard key={s.id} scenario={s} userId={null} mode="feed" />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => load(sort)}
              disabled={loadingMore}
              className="w-full py-3 rounded-xl border border-stroke text-sm text-fg-subtle hover:bg-surface-2 hover:text-fg transition-all disabled:opacity-50"
            >
              {loadingMore ? <Spinner size="sm" className="mx-auto" /> : 'Daha fazla yükle'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Featured Scenario (Editor's Pick) ───────────────────────────────────────
function FeaturedScenario() {
  const [scenario, setScenario] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios?editor_pick=true&limit=1')
      .then(r => r.json())
      .then(d => { setScenario(d.scenarios?.[0] ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ height: 120, borderRadius: 18, background: 'var(--surface-2)' }} className="animate-pulse" />
  )
  if (!scenario) return null

  return (
    <Link href={`/arsiv/${scenario.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        borderRadius: 18, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #1442a8 0%, #2a6cf0 60%, #4aa8ff 100%)',
        padding: '20px 22px', color: '#fff',
        boxShadow: '0 4px 24px rgba(42,108,240,.25)',
      }}>
        <div aria-hidden style={{
          position: 'absolute', right: -30, top: -30,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Star size={11} style={{ fill: '#fcd34d', color: '#fcd34d' }} />
          <span style={{ font: '700 10px -apple-system, sans-serif', letterSpacing: '.07em', textTransform: 'uppercase', color: '#fcd34d' }}>
            Haftanın Senaryosu · Editör Seçimi
          </span>
        </div>
        <p style={{ margin: 0, font: '600 15px/1.5 -apple-system, sans-serif', color: '#fff', position: 'relative' }}>
          {scenario.content}
        </p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, font: '500 12px -apple-system, sans-serif', color: 'rgba(255,255,255,.75)', position: 'relative' }}>
          <span>{scenario.answer_count} cevap</span>
          <span>·</span>
          <span style={{ textTransform: 'capitalize' }}>{scenario.category}</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            Cevapla <span style={{ fontSize: 14 }}>→</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KesfetPage() {
  const [tab, setTab] = useState<'feed' | 'senaryolar' | 'friends' | 'ara' | 'kategoriler'>('feed')

  const TABS = [
    { id: 'feed',        label: 'Akış' },
    { id: 'senaryolar',  label: 'Senaryolar' },
    { id: 'friends',     label: 'Arkadaşlar' },
    { id: 'ara',         label: 'Ara' },
    { id: 'kategoriler', label: 'Kategoriler' },
  ] as const

  return (
    <div className="max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Stories bar (24h) — sits above everything, edge-to-edge ── */}
      <StoriesBar />

      <div className="px-4 py-6" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0, font: '700 22px -apple-system, BlinkMacSystemFont, sans-serif', letterSpacing: '-0.02em', color: 'var(--fg)' }}>
            Keşfet
          </h1>
          <p style={{ margin: '2px 0 0', font: '400 13px -apple-system, sans-serif', color: 'var(--fg-subtle)' }}>
            Topluluk akışı ve senaryolar
          </p>
        </div>
        <Link
          href="/senaryo-olustur"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 999, border: 'none',
            background: 'var(--k-blue-500, #2a6cf0)', color: '#fff',
            font: '600 13px -apple-system, sans-serif', textDecoration: 'none',
          }}
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Senaryo</span>
        </Link>
      </div>

      {/* ── Tab bar ── */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--stroke)',
        overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20,
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flexShrink: 0, padding: '10px 16px',
              font: `${tab === t.id ? 600 : 500} 13.5px -apple-system, sans-serif`,
              color: tab === t.id ? 'var(--fg)' : 'var(--fg-subtle)',
              background: 'transparent', border: 'none',
              borderBottom: `2px solid ${tab === t.id ? 'var(--k-blue-500, #2a6cf0)' : 'transparent'}`,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'color .12s, border-color .12s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'feed' && (
        <div className="space-y-5">
          {/* Featured scenario — editor's pick */}
          <FeaturedScenario />
          <div className="rounded-2xl bg-surface border border-stroke p-4">
            <div className="flex items-center gap-2 mb-3">
              <Flame size={13} style={{ color: 'var(--k3-warm-500, #ed6f1c)' }} />
              <span className="k3-eyebrow">Gündemdekiler</span>
            </div>
            <TrendingTags />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={13} style={{ color: 'var(--k3-warm-500, #ed6f1c)' }} />
                <span className="k3-eyebrow">Yükselenler · Son 24 saat</span>
              </div>
            </div>
            <FeedTab />
          </div>
        </div>
      )}
      {tab === 'senaryolar' && <SenaryolarTab />}
      {tab === 'friends' && <FriendsTab />}
      {tab === 'ara' && (
        <div className="space-y-5">
          <FollowSuggestions />
          <SearchTab />
        </div>
      )}
      {tab === 'kategoriler' && <CategoriesTab />}
      </div>
    </div>
  )
}
