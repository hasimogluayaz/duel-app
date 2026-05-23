'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { FollowButton } from '@/components/profile/FollowButton'
import { formatDate } from '@/lib/utils/formatting'
import {
  Settings, Swords, Star, MessageCircle,
  Clock, Users, Bot, ChevronRight, Trophy, Crown,
} from 'lucide-react'
import { isPremiumActive } from '@/lib/premium/check'

type Tab = 'cevaplar' | 'duellolar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DuelParticipant {
  user_id: string | null
  profile: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null
  answer: { id: string; vote_count: number } | null
}

interface InviteDuel {
  id: string
  code: string
  creator_id: string
  created_at: string
  judge_mode: string
  ai_verdict: string | null
  winner_id: string | null
  scenario: { id: string; content: string; active_date: string } | null
  participants: DuelParticipant[]
}

interface Props {
  profile: any
  currentUserId?: string
  viewerIsAdmin?: boolean
  isFollowing: boolean
  inviteDuels: InviteDuel[]
  recentAnswers: any[]
  totalVotes: number
  answerCount: number
  answeredToday?: boolean
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ProfilClient({
  profile, currentUserId, viewerIsAdmin = false, isFollowing,
  inviteDuels, recentAnswers,
  totalVotes, answerCount, answeredToday = true,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('cevaplar')
  const [nowMs, setNowMs] = useState(0)

  // Live clock — updates every minute for countdown accuracy
  useEffect(() => {
    setNowMs(Date.now())
    const id = setInterval(() => setNowMs(Date.now()), 60_000)
    return () => clearInterval(id)
  }, [])

  const isOwnProfile = currentUserId === profile.id

  // Separate active vs expired for tab counter
  const today = new Date().toISOString().split('T')[0]
  const activeDuels = inviteDuels.filter(d => d.scenario?.active_date === today)
  const showsPremium = isPremiumActive(profile)

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar src={profile.avatar_url} username={profile.username} size="xl" className="w-16 h-16 sm:w-20 sm:h-20" />
            {showsPremium && (
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-bg flex items-center justify-center shadow">
                <Crown size={12} className="text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-xl font-black text-fg tracking-tight leading-tight">
                {profile.display_name || profile.username}
              </h1>
              {showsPremium && (
                <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm">
                  ⚡ PREMIUM
                </span>
              )}
            </div>
            <p className="text-sm text-fg-subtle mt-0.5">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-fg-muted mt-2 max-w-xs leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isOwnProfile ? (
            <Link href="/profil/ayarlar">
              <button className="w-9 h-9 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-muted">
                <Settings size={15} />
              </button>
            </Link>
          ) : currentUserId && !viewerIsAdmin ? (
            <>
              <Link href={`/mesajlar/${profile.username}`}>
                <button className="w-9 h-9 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-muted">
                  <MessageCircle size={15} />
                </button>
              </Link>
              <FollowButton targetId={profile.id} initialFollowing={isFollowing} />
              <Button size="sm" className="btn-gradient h-8 px-3 text-xs font-bold gap-1">
                <Swords size={12} />
                Düello
              </Button>
            </>
          ) : viewerIsAdmin ? (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-500">
              Admin Görünümü
            </span>
          ) : null}
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────── */}
      <div
        className="grid grid-cols-3 rounded-2xl border overflow-hidden mb-6"
        style={{ borderColor: 'var(--stroke)' }}
      >
        {[
          { emoji: '🔥', label: 'Seri', value: profile.streak_count ?? 0 },
          { emoji: '▲', label: 'Toplam Oy', value: totalVotes },
          { emoji: '📅', label: 'Senaryo', value: answerCount },
        ].map((s, i) => (
          <div
            key={s.label}
            className="flex flex-col items-center py-4 px-2"
            style={{ borderRight: i < 2 ? '1px solid var(--stroke)' : 'none' }}
          >
            <div className="text-[11px] text-fg-subtle font-medium mb-1">{s.emoji} {s.label}</div>
            <div className="text-2xl font-black text-fg tabular-nums">{s.value.toLocaleString('tr-TR')}</div>
          </div>
        ))}
      </div>

      {/* ── Today banner ────────────────────────────────────── */}
      {!answeredToday && isOwnProfile && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 mb-4"
          style={{ background: 'linear-gradient(135deg, #0f1f55 0%, #1a3a8f 100%)' }}
        >
          <p className="text-sm text-white font-medium leading-snug">
            🔥 <strong>{profile.streak_count ?? 0} günlük</strong> serin devam ediyor. Bugünün senaryosuna cevap ver!
          </p>
          <Link
            href="/"
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg text-white border border-white/30 hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Cevapla →
          </Link>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex border-b border-stroke mb-5">
        {([
          { id: 'cevaplar' as Tab, label: 'Cevaplarım' },
          {
            id: 'duellolar' as Tab,
            label: `Düellolarım${inviteDuels.length > 0 ? ` (${inviteDuels.length})` : ''}`,
            dot: activeDuels.length > 0,
          },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors relative"
            style={{
              color: activeTab === tab.id ? 'var(--fg)' : 'var(--fg-subtle)',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--k-blue-500, #2a6cf0)' : 'transparent'}`,
              marginBottom: -1,
              cursor: 'pointer',
            }}
          >
            <span className="flex items-center justify-center gap-1.5">
              {tab.label}
              {'dot' in tab && tab.dot && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* ── Cevaplar ────────────────────────────────────────── */}
      {activeTab === 'cevaplar' && (
        <div className="flex flex-col gap-2">
          {recentAnswers.length === 0 ? (
            <AnswerEmptyState />
          ) : recentAnswers.map((a: any) => {
            const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
            return (
              <div key={a.id} className="border border-stroke rounded-2xl p-4 bg-surface">
                {sc?.content && (
                  <p className="text-xs text-fg-subtle mb-2 line-clamp-1">{sc.content}</p>
                )}
                <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-fg-subtle">
                  <span className="flex items-center gap-1 font-semibold text-amber-400">
                    <Star size={10} className="fill-amber-400" />
                    {a.vote_count ?? 0}
                  </span>
                  <span>{formatDate(a.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Düellolar ───────────────────────────────────────── */}
      {activeTab === 'duellolar' && (
        <div className="flex flex-col gap-3">
          {inviteDuels.length === 0 ? (
            <DuelEmptyState isOwnProfile={isOwnProfile} />
          ) : (
            <>
              {/* Active duels first */}
              {activeDuels.length > 0 && (
                <p className="text-[10px] font-bold text-fg-subtle uppercase tracking-widest px-1">
                  ● Aktif Bugün
                </p>
              )}
              {inviteDuels.map(duel => (
                <DuelCard
                  key={duel.id}
                  duel={duel}
                  profileId={profile.id}
                  currentUserId={currentUserId}
                  nowMs={nowMs}
                  today={today}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Duel Card ──────────────────────────────────────────────────────────────────

function DuelCard({
  duel, profileId, currentUserId, nowMs, today,
}: {
  duel: InviteDuel
  profileId: string
  currentUserId?: string
  nowMs: number
  today: string
}) {
  const activeDate = duel.scenario?.active_date ?? ''
  const isActive = activeDate === today

  // Time remaining string
  let timeLeft = ''
  if (isActive && nowMs > 0) {
    const expiry = new Date(`${activeDate}T23:59:59Z`).getTime()
    const diff = expiry - nowMs
    if (diff > 0) {
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      timeLeft = h > 0 ? `${h}sa ${m}dk` : `${m}dk`
    }
  }

  const isAiMode = duel.judge_mode === 'ai'
  const hasVerdict = !!duel.ai_verdict
  const viewerId = currentUserId ?? profileId
  const isWinner = !!duel.winner_id && duel.winner_id === viewerId
  const hasLost = !!duel.winner_id && duel.winner_id !== viewerId
  const totalVotes = duel.participants.reduce((s, p) => s + (p.answer?.vote_count ?? 0), 0)
  const myParticipant = duel.participants.find(p => p.user_id === viewerId)
  const myVotes = myParticipant?.answer?.vote_count ?? 0
  const myPct = totalVotes > 0 ? Math.round((myVotes / totalVotes) * 100) : null

  // Border color based on result
  const borderColor = isWinner
    ? 'rgba(245,158,11,0.45)'   // amber — winner
    : hasLost
    ? 'var(--stroke)'
    : isActive
    ? 'rgba(34,197,94,0.35)'    // green — active
    : 'var(--stroke)'

  const cardBg = isWinner
    ? 'color-mix(in oklab, #f59e0b 5%, var(--surface))'
    : 'var(--surface)'

  return (
    <Link href={`/d/${duel.code}`}>
      <div
        className="rounded-2xl p-4 border transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 flex flex-col gap-3.5 cursor-pointer"
        style={{ background: cardBg, borderColor }}
      >

        {/* ── Row 1: Status + Judge mode badge ── */}
        <div className="flex items-center justify-between gap-2">
          {/* Status */}
          {isActive ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-xs font-bold text-green-400">
                Aktif{timeLeft ? ` · ${timeLeft} kaldı` : ''}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-fg-subtle font-medium">
              <Clock size={10} />
              <span>Süresi doldu</span>
            </div>
          )}

          {/* Judge mode badge */}
          <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isAiMode
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            {isAiMode ? <><Bot size={9} /> AI Modu</> : <><Users size={9} /> Topluluk</>}
          </div>
        </div>

        {/* ── Row 2: Scenario text ── */}
        {duel.scenario && (
          <p className="text-[14px] font-semibold text-fg leading-snug line-clamp-2">
            {duel.scenario.content}
          </p>
        )}

        {/* ── Row 3: Participant avatars + count ── */}
        <div className="flex items-center justify-between">
          {/* Overlapping avatars */}
          <div className="flex items-center" style={{ paddingLeft: 0 }}>
            {duel.participants.slice(0, 4).map((p, i) => (
              <div
                key={i}
                className="rounded-full border-2"
                style={{
                  width: 28, height: 28,
                  marginLeft: i === 0 ? 0 : -8,
                  borderColor: 'var(--surface)',
                  zIndex: 10 - i,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Avatar
                  src={p.profile?.avatar_url ?? null}
                  username={p.profile?.display_name || p.profile?.username || '?'}
                  size="xs"
                />
              </div>
            ))}
            {/* Empty placeholder slots */}
            {Array.from({ length: Math.max(0, 4 - duel.participants.length) }).map((_, i) => (
              <div
                key={`slot-${i}`}
                className="rounded-full border-2 border-dashed flex items-center justify-center"
                style={{
                  width: 28, height: 28,
                  marginLeft: (duel.participants.length + i) === 0 ? 0 : -8,
                  borderColor: 'var(--stroke)',
                  background: 'var(--surface-2)',
                  zIndex: 6 - i,
                  position: 'relative',
                }}
              >
                <span className="text-[9px] text-fg-subtle">+</span>
              </div>
            ))}
          </div>

          <span className="text-xs text-fg-subtle tabular-nums">
            {duel.participants.length}/4 katılımcı
          </span>
        </div>

        {/* ── Row 4: Result / bottom strip ── */}
        <div
          className="flex items-center justify-between pt-3 border-t"
          style={{ borderColor: 'var(--stroke)' }}
        >
          {/* Left: result info */}
          <div className="flex items-center gap-1.5 min-w-0">
            {isWinner ? (
              <span className="flex items-center gap-1 text-xs font-black text-amber-400">
                <Trophy size={12} />
                Kazandın! 🏆
              </span>
            ) : isAiMode ? (
              hasVerdict ? (
                <span className="text-xs font-semibold text-fg-muted">AI karar verdi</span>
              ) : duel.participants.length < 2 ? (
                <span className="text-xs text-fg-subtle">⏳ Katılımcı bekleniyor</span>
              ) : (
                <span className="text-xs text-fg-subtle">🤖 AI karar bekliyor</span>
              )
            ) : (
              totalVotes > 0 ? (
                myPct !== null ? (
                  <span className="text-xs text-fg-muted truncate">
                    Oyların <strong className="text-fg">%{myPct}</strong>'i sende · {totalVotes} toplam
                  </span>
                ) : (
                  <span className="text-xs text-fg-muted">{totalVotes} toplam oy</span>
                )
              ) : (
                <span className="text-xs text-fg-subtle">⏳ Oy bekleniyor</span>
              )
            )}
          </div>

          {/* Right: CTA arrow */}
          <span className="text-xs font-bold text-primary flex items-center gap-0.5 shrink-0 ml-2">
            {isActive ? 'Devam Et' : 'Görüntüle'}
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Empty states ───────────────────────────────────────────────────────────────

function AnswerEmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-fg-muted">Henüz cevap yok</p>
    </div>
  )
}

function DuelEmptyState({ isOwnProfile }: { isOwnProfile: boolean }) {
  return (
    <div className="text-center py-14 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-stroke flex items-center justify-center">
        <Swords size={24} className="text-fg-subtle/40" />
      </div>
      <div>
        <p className="text-sm font-semibold text-fg-muted">Henüz düello yok</p>
        {isOwnProfile && (
          <p className="text-xs text-fg-subtle mt-1">
            Bugünün senaryosuna cevap ver, ardından Düello başlat
          </p>
        )}
      </div>
      {isOwnProfile && (
        <Link href="/">
          <Button size="sm" className="btn-gradient gap-1.5 mt-1">
            <Swords size={13} />
            Düello Başlat
          </Button>
        </Link>
      )}
    </div>
  )
}
