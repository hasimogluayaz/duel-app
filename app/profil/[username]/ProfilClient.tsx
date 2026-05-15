'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { FollowButton } from '@/components/profile/FollowButton'
import { formatDate } from '@/lib/utils/formatting'
import { Settings, Swords, Star, MessageCircle } from 'lucide-react'
import { getTier } from '@/lib/utils/tier'

type Tab = 'cevaplar' | 'duellolar'

interface Props {
  profile: any
  currentUserId?: string
  isFollowing: boolean
  duelCount: number
  winCount: number
  achievements: any[]
  recentDuels: any[]
  recentAnswers: any[]
  totalVotes: number
  answerCount: number
  answeredToday?: boolean
  userScenarios?: any[]
  pinnedAnswers?: any[]
}

export default function ProfilClient({
  profile, currentUserId, isFollowing,
  duelCount, recentDuels, recentAnswers,
  totalVotes, answerCount, answeredToday = true,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('cevaplar')

  const isOwnProfile = currentUserId === profile.id

  return (
    <div className="max-w-xl mx-auto px-4 py-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} username={profile.username} size="xl" className="w-16 h-16 sm:w-20 sm:h-20" />
          <div>
            <h1 className="text-xl font-black text-fg tracking-tight leading-tight">
              {profile.display_name || profile.username}
            </h1>
            <p className="text-sm text-fg-subtle mt-0.5">@{profile.username}</p>
            {profile.bio && (
              <p className="text-sm text-fg-muted mt-2 max-w-xs leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isOwnProfile ? (
            <Link href="/profil/ayarlar">
              <button className="w-9 h-9 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-muted">
                <Settings size={15} />
              </button>
            </Link>
          ) : currentUserId ? (
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
          ) : null}
        </div>
      </div>

      {/* ── 3 istatistik ── */}
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

      {/* ── Bugün cevap vermediyse banner ── */}
      {!answeredToday && isOwnProfile && (
        <div
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3 mb-2"
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

      {/* ── Sekme çubuğu ── */}
      <div className="flex border-b border-stroke mb-5">
        {([
          { id: 'cevaplar' as Tab, label: 'Cevaplarım' },
          { id: 'duellolar' as Tab, label: 'Düellolarım' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-2.5 text-sm font-semibold transition-colors"
            style={{
              color: activeTab === tab.id ? 'var(--fg)' : 'var(--fg-subtle)',
              borderBottom: `2px solid ${activeTab === tab.id ? 'var(--k-blue-500, #2a6cf0)' : 'transparent'}`,
              marginBottom: -1,
              background: 'transparent',
              border: 'none',
              borderBottomWidth: 2,
              borderBottomStyle: 'solid',
              borderBottomColor: activeTab === tab.id ? 'var(--k-blue-500, #2a6cf0)' : 'transparent',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Cevaplar ── */}
      {activeTab === 'cevaplar' && (
        <div className="flex flex-col gap-2">
          {recentAnswers.length === 0 ? (
            <EmptyState text="Henüz cevap yok" />
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

      {/* ── Düellolar ── */}
      {activeTab === 'duellolar' && (
        <div className="flex flex-col gap-2">
          {recentDuels.length === 0 ? (
            <EmptyState text="Henüz düello yok" />
          ) : recentDuels.map((duel: any) => {
            const isChallenger = duel.challenger_id === profile.id
            const opponent = isChallenger ? duel.challenged : duel.challenger
            const won = duel.winner_id === profile.id
            const lost = duel.winner_id && duel.winner_id !== profile.id
            return (
              <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                <div className="border border-stroke rounded-2xl px-4 py-3 bg-surface hover:bg-surface-2 transition-colors flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                    duel.status === 'completed'
                      ? won ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                             : 'bg-red-500/15 text-red-400 border border-red-500/20'
                      : 'bg-surface-2 border border-stroke text-fg-subtle'
                  }`}>
                    {duel.status === 'completed' ? (won ? 'W' : 'L') : duel.status === 'active' ? '●' : '·'}
                  </div>
                  <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-fg truncate">
                      {opponent?.display_name || opponent?.username}
                    </p>
                    {duel.scenario?.content && (
                      <p className="text-xs text-fg-subtle line-clamp-1 mt-0.5">{duel.scenario.content}</p>
                    )}
                  </div>
                  <span className="text-xs font-semibold shrink-0">
                    {duel.status === 'completed' && won && <span className="text-green-400">Kazandı</span>}
                    {duel.status === 'completed' && lost && <span className="text-red-400">Kaybetti</span>}
                    {duel.status === 'active' && <span className="text-blue-400">Devam</span>}
                    {duel.status === 'pending' && <span className="text-amber-400">Bekliyor</span>}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-fg-muted">{text}</p>
    </div>
  )
}
