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
import { Search, Flame, Star, Users, TrendingUp, Swords, MessageCircle, Trophy, Zap, Layers } from 'lucide-react'
import BookmarkButton from '@/components/bookmarks/BookmarkButton'
import { cn } from '@/lib/utils/cn'
import { getTier } from '@/lib/utils/tier'
import FollowSuggestions from '@/components/social/FollowSuggestions'
import TrendingScenarios from '@/components/social/TrendingScenarios'

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
      <Card className="hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group">

        {/* Scenario */}
        {duel.scenario?.content && (
          <p className="text-xs text-fg-subtle italic mb-3 line-clamp-1 border-l-2 border-purple-500/40 pl-2">
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
                <span className="ml-1">{challengerTier.emoji}</span>
              </p>
              {duel.challenger_answer && (
                <p className="text-[11px] text-fg-subtle line-clamp-1 mt-0.5">{duel.challenger_answer.content}</p>
              )}
            </div>
            {duel.status === 'completed' && duel.winner_id === duel.challenger_id && (
              <Trophy size={12} className="text-yellow-400 shrink-0" />
            )}
            <span className="text-xs font-black text-purple-300 shrink-0">
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
                <span className="ml-1">{challengedTier.emoji}</span>
              </p>
              {duel.challenged_answer && (
                <p className="text-[11px] text-fg-subtle line-clamp-1 mt-0.5">{duel.challenged_answer.content}</p>
              )}
            </div>
            {duel.status === 'completed' && duel.winner_id === duel.challenged_id && (
              <Trophy size={12} className="text-yellow-400 shrink-0" />
            )}
            <span className="text-xs font-black text-purple-300 shrink-0">
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
              <Badge variant="info" className="text-[10px] py-0">⚡ Aktif</Badge>
            ) : (
              <Badge variant="success" className="text-[10px] py-0">✓ Bitti</Badge>
            )}
            <span>{timeAgo(duel.created_at)}</span>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(id)
  }, [query])

  const search = useCallback(async (q: string) => {
    setLoading(true)
    const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`)
    const json = await res.json()
    setUsers(json.users ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { search(debouncedQuery) }, [debouncedQuery, search])

  return (
    <>
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
        <input
          type="text"
          placeholder="Kullanıcı adı veya isim ara..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-3 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-purple-500 transition-colors"
          autoFocus
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        {query.length >= 2 ? (
          <><Search size={14} className="text-fg-subtle" /><span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">&quot;{query}&quot; için sonuçlar</span></>
        ) : (
          <><TrendingUp size={14} className="text-fg-subtle" /><span className="text-xs font-medium text-fg-subtle uppercase tracking-wide">En İyi Oyuncular</span></>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <Card className="text-center py-14 border-dashed">
          <Users size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
          <p className="text-fg font-semibold">Kullanıcı bulunamadı</p>
          <p className="text-fg-subtle text-sm mt-1">Farklı bir arama dene</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((user, idx) => (
            <Link key={user.id} href={`/profil/${user.username}`}>
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-surface border border-stroke hover:border-purple-500/40 hover:bg-purple-500/5 transition-all cursor-pointer group">
                {!query && (
                  <span className="text-sm font-bold text-fg-subtle w-5 text-center flex-shrink-0">{idx + 1}</span>
                )}
                <Avatar src={user.avatar_url} username={user.username} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-fg text-sm group-hover:text-purple-300 transition-colors truncate">
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
      <div className="flex gap-2 mb-4">
        {(['today', 'week'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex-1 py-2 rounded-xl text-sm font-semibold transition-all',
              period === p
                ? 'bg-purple-600 text-white'
                : 'bg-surface border border-stroke text-fg-subtle hover:border-purple-500/40'
            )}
          >
            {p === 'today' ? '⚡ Bugün' : '📅 Bu Hafta'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : duels.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Swords size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
          <p className="text-fg font-semibold mb-1">Henüz düello yok</p>
          <p className="text-fg-subtle text-sm">
            {period === 'today' ? 'Bugün henüz düello başlamadı.' : 'Bu hafta henüz düello yok.'}
          </p>
          <Link href="/oyun" className="inline-flex items-center gap-1.5 mt-4 text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            <Zap size={14} />
            İlk düelloyu sen başlat
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {duels.map(duel => <FeedCard key={duel.id} duel={duel} />)}
          </div>

          {hasMore && (
            <button
              onClick={() => load(period)}
              disabled={loadingMore}
              className="w-full mt-4 py-3 rounded-xl border border-stroke text-sm text-fg-subtle hover:border-purple-500/40 hover:text-fg transition-all disabled:opacity-50"
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
  const [answers, setAnswers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/feed/friends')
      .then((r) => r.json())
      .then((d) => {
        setAnswers(d.answers ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  if (answers.length === 0) {
    return (
      <Card className="text-center py-16 border-dashed">
        <Users size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
        <p className="text-fg font-semibold mb-1">Takip ettiğin kimse yok</p>
        <p className="text-fg-subtle text-sm">
          Oyuncular sekmesinden insanları takip et — cevaplarını burada gör.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {answers.map((a: any) => (
        <Card key={a.id} className="hover:border-purple-500/30 transition-colors">
          {a.scenario_content && (
            <p className="text-xs text-fg-subtle italic mb-2 border-l-2 border-purple-500/40 pl-2 line-clamp-2">
              &ldquo;{a.scenario_content}&rdquo;
            </p>
          )}
          <div className="flex items-start gap-3">
            <Link href={`/profil/${a.username}`}>
              <Avatar src={a.avatar_url} username={a.username} size="sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Link href={`/profil/${a.username}`} className="text-sm font-semibold text-fg hover:text-purple-300 transition-colors">
                  {a.display_name || a.username}
                </Link>
                <span className="text-xs text-fg-subtle">@{a.username}</span>
                <span className="text-xs text-fg-subtle">· {timeAgo(a.created_at)}</span>
              </div>
              <p className="text-sm text-fg-muted leading-relaxed">{a.content}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-fg-subtle">
                  <Star size={11} className="text-amber-400" />
                  {a.vote_count} oy
                </span>
                {a.scenario_id && (
                  <Link href={`/arsiv/${a.scenario_id}`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Cevaplara bak →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'genel',      emoji: '🌍', label: 'Genel' },
  { key: 'ask',        emoji: '❤️', label: 'Aşk' },
  { key: 'is',         emoji: '💼', label: 'İş' },
  { key: 'aile',       emoji: '👨‍👩‍👧', label: 'Aile' },
  { key: 'sosyal',     emoji: '👥', label: 'Sosyal' },
  { key: 'teknoloji',  emoji: '💻', label: 'Teknoloji' },
  { key: 'dunya',      emoji: '🌏', label: 'Dünya' },
  { key: 'mizah',      emoji: '😂', label: 'Mizah' },
  { key: 'felsefe',    emoji: '🤔', label: 'Felsefe' },
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
                    <p className="text-sm text-white/85 leading-relaxed">{s.content}</p>
                    <BookmarkButton type="scenario" id={s.id} size={14} />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/35">
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
        <p className="text-xs text-white/40 font-bold mb-3 uppercase tracking-wider">Kategoriler</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelected(s => s === cat.key ? null : cat.key)}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all text-sm font-semibold ${
                selected === cat.key
                  ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                  : 'bg-white/3 border-white/8 text-white/60 hover:bg-white/6 hover:border-white/15'
              }`}
            >
              <span className="text-xl">{cat.emoji}</span>
              <span className="text-xs">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category results */}
      {selected && (
        <div>
          <p className="text-xs text-white/40 font-semibold mb-2">
            {CATEGORIES.find(c => c.key === selected)?.emoji} {CATEGORIES.find(c => c.key === selected)?.label} Senaryoları
          </p>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />)}
            </div>
          ) : scenarios.length === 0 ? (
            <p className="text-center text-sm text-white/25 py-8">Bu kategoride henüz senaryo yok</p>
          ) : (
            <div className="space-y-2">
              {scenarios.map(s => (
                <Link key={s.id} href={`/arsiv/${s.id}`}>
                  <div className="bg-white/3 border border-white/8 rounded-xl p-3 hover:border-violet-500/30 transition-colors cursor-pointer flex items-start justify-between gap-3">
                    <p className="text-sm text-white/80 leading-relaxed flex-1">{s.content}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-white/30">{s.answer_count}</span>
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KesfetPage() {
  const [tab, setTab] = useState<'feed' | 'friends' | 'users' | 'kategoriler'>('feed')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <TrendingUp size={22} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Keşfet</h1>
          <p className="text-sm text-fg-subtle">Topluluk akışı ve oyuncular</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-stroke rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('feed')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'feed' ? 'bg-purple-600 text-white shadow-sm' : 'text-fg-subtle hover:text-fg'
          )}
        >
          <Swords size={14} />
          Akış
        </button>
        <button
          onClick={() => setTab('friends')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'friends' ? 'bg-purple-600 text-white shadow-sm' : 'text-fg-subtle hover:text-fg'
          )}
        >
          <Users size={14} />
          Arkadaşlar
        </button>
        <button
          onClick={() => setTab('users')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'users' ? 'bg-purple-600 text-white shadow-sm' : 'text-fg-subtle hover:text-fg'
          )}
        >
          <Search size={14} />
          Ara
        </button>
        <button
          onClick={() => setTab('kategoriler')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all',
            tab === 'kategoriler' ? 'bg-purple-600 text-white shadow-sm' : 'text-fg-subtle hover:text-fg'
          )}
        >
          <Layers size={14} />
          Kategoriler
        </button>
      </div>

      {tab === 'feed' && (
        <div className="space-y-5">
          <TrendingScenarios />
          <FeedTab />
        </div>
      )}
      {tab === 'friends' && <FriendsTab />}
      {tab === 'users' && (
        <div className="space-y-5">
          <FollowSuggestions />
          <UsersTab />
        </div>
      )}
      {tab === 'kategoriler' && <CategoriesTab />}
    </div>
  )
}
