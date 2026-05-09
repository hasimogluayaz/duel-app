'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FollowButton } from '@/components/profile/FollowButton'
import { formatDate, formatPoints } from '@/lib/utils/formatting'
import { getTier, getTierProgress, getAllTiers } from '@/lib/utils/tier'
import { ACHIEVEMENT_LABELS } from '@/types'
import {
  Settings, Trophy, Swords, Flame, Star, Calendar, Target,
  TrendingUp, Zap, Crown, MessageCircle, Share2, CheckCircle2,
  Medal, BarChart3, Sparkles, Pin, PinOff, Activity,
} from 'lucide-react'
import DuelStatsPanel from '@/components/duel/DuelStatsPanel'
import ActivityFeed from '@/components/activity/ActivityFeed'
import BlockButton from '@/components/profile/BlockButton'

type Tab = 'vitrin' | 'genel' | 'duellolar' | 'cevaplar' | 'senaryolar' | 'basarimlar' | 'istatistik' | 'aktivite'

interface Props {
  profile: any
  currentUserId?: string
  isFollowing: boolean
  duelCount: number
  winCount: number
  achievements: any[]
  recentDuels: any[]
  recentAnswers: any[]
  userScenarios?: any[]
  pinnedAnswers?: any[]
}

export default function ProfilClient({
  profile, currentUserId, isFollowing,
  duelCount, winCount, achievements, recentDuels, recentAnswers,
  userScenarios = [], pinnedAnswers = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('genel')
  const [copied, setCopied] = useState(false)
  const [localPinned, setLocalPinned] = useState<any[]>(pinnedAnswers)
  const [pinning, setPinning] = useState<string | null>(null)

  const isOwnProfile = currentUserId === profile.id
  const tier = getTier(profile.total_points)
  const tierProgress = getTierProgress(profile.total_points)
  const allTiers = getAllTiers()
  const winRate = duelCount > 0 ? Math.round((winCount / duelCount) * 100) : 0
  const loseCount = duelCount - winCount

  const form: string[] = (recentDuels ?? [])
    .filter((d: any) => d.status === 'completed')
    .slice(0, 5)
    .map((d: any): string => d.winner_id === profile.id ? 'W' : 'L')

  function copyProfile() {
    navigator.clipboard.writeText(`${window.location.origin}/profil/${profile.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function togglePin(answer: any) {
    if (!isOwnProfile) return
    setPinning(answer.id)
    const isPinned = localPinned.some(a => a.id === answer.id)
    const res = await fetch('/api/profile/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer_id: answer.id, action: isPinned ? 'unpin' : 'pin' }),
    })
    if (res.ok) {
      setLocalPinned(prev => isPinned ? prev.filter(a => a.id !== answer.id) : [...prev, answer])
    }
    setPinning(null)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    ...(localPinned.length > 0 || isOwnProfile ? [{ id: 'vitrin' as Tab, label: 'Vitrin', icon: <Pin size={14} /> }] : []),
    { id: 'genel', label: 'Genel', icon: <BarChart3 size={14} /> },
    { id: 'duellolar', label: `Düellolar`, icon: <Swords size={14} /> },
    { id: 'cevaplar', label: 'Cevaplar', icon: <Star size={14} /> },
    ...(userScenarios.length > 0 ? [{ id: 'senaryolar' as Tab, label: 'Senaryolar', icon: <Sparkles size={14} /> }] : []),
    { id: 'basarimlar', label: `Başarımlar`, icon: <Medal size={14} /> },
    { id: 'istatistik' as Tab, label: 'İstatistik', icon: <BarChart3 size={14} /> },
    { id: 'aktivite' as Tab, label: 'Aktivite', icon: <Activity size={14} /> },
  ]

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Banner ── */}
      <div className="relative">
        <div className={`h-40 sm:h-52 bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-12 left-20 w-36 h-36 bg-white/5 rounded-full" />
          <div className="absolute top-6 left-8 text-5xl opacity-10 rotate-12 select-none">⚔️</div>
          <div className="absolute bottom-4 right-20 text-3xl opacity-8 select-none">🏆</div>
          <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-15`} />
          {isOwnProfile && (
            <Link href="/profil/ayarlar" className="absolute top-3 right-3">
              <div className="flex items-center gap-1.5 text-xs text-white/90 bg-black/30 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1.5 hover:bg-black/40 transition-all font-medium">
                <Settings size={12} />
                Düzenle
              </div>
            </Link>
          )}
        </div>

        {/* ── Avatar row ── */}
        <div className="px-4 pb-0">
          <div className="flex items-end justify-between -mt-12 sm:-mt-14 mb-3">
            <div className={`p-1 bg-bg rounded-full ring-4 ${tier.ringColor} shadow-2xl`}>
              <Avatar src={profile.avatar_url} username={profile.username} size="xl" className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={copyProfile}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-subtle hover:text-fg"
                title="Profili paylaş"
              >
                {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Share2 size={16} />}
              </button>

              {!isOwnProfile && currentUserId && (
                <>
                  <Link href={`/mesajlar/${profile.username}`}>
                    <button className="w-9 h-9 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-subtle hover:text-fg">
                      <MessageCircle size={16} />
                    </button>
                  </Link>
                  <FollowButton targetId={profile.id} initialFollowing={isFollowing} />
                  <Link href="/oyun">
                    <Button size="sm" className="btn-gradient h-9 px-4 text-xs font-bold">
                      <Swords size={13} />
                      Düello
                    </Button>
                  </Link>
                  <BlockButton targetUserId={profile.id} />
                </>
              )}
            </div>
          </div>

          {/* ── Name + badges ── */}
          <div className="mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-fg">{profile.display_name || profile.username}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
                {tier.emoji} {tier.label}
              </span>
              {profile.is_premium && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300">
                  <Crown size={10} className="fill-amber-400" /> Premium
                </span>
              )}
            </div>
            <p className="text-fg-subtle text-sm">@{profile.username}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-fg-muted text-sm leading-relaxed mb-2">{profile.bio}</p>
          )}

          {/* Personality */}
          {profile.personality_type && (
            <div className="mb-2">
              <Badge variant="info">🧠 {profile.personality_type}</Badge>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 text-xs text-fg-subtle mb-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatDate(profile.created_at)} katıldı
            </span>
            {form.length > 0 && (
              <span className="flex items-center gap-1">
                Son form:
                {form.map((r, i) => (
                  <span key={i} className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                    r === 'W' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>{r}</span>
                ))}
              </span>
            )}
          </div>

          {/* ── Followers/Following — Twitter style ── */}
          <div className="flex items-center gap-5 mb-4 text-sm">
            <Link href={`/profil/${profile.username}/takip`} className="hover:underline text-left">
              <span className="font-black text-fg">{profile.following_count ?? 0}</span>
              <span className="text-fg-subtle ml-1">Takip</span>
            </Link>
            <Link href={`/profil/${profile.username}/takipciler`} className="hover:underline text-left">
              <span className="font-black text-fg">{profile.follower_count ?? 0}</span>
              <span className="text-fg-subtle ml-1">Takipçi</span>
            </Link>
            <span>
              <span className="font-black text-fg">{duelCount}</span>
              <span className="text-fg-subtle ml-1">Düello</span>
            </span>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-stroke px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-purple-500 text-fg'
                  : 'border-transparent text-fg-subtle hover:text-fg hover:border-fg-subtle/30'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 py-5">

        {/* VITRIN TAB */}
        {activeTab === 'vitrin' && (
          <div className="space-y-3">
            {isOwnProfile && (
              <div className="rounded-xl bg-violet-500/8 border border-violet-500/15 p-3 text-xs text-violet-300">
                <p className="font-semibold mb-0.5">📌 Profil Vitrini</p>
                <p className="text-violet-400/70">En iyi cevaplarından en fazla 3 tanesini buraya sabitle. Ziyaretçiler önce bunları görür.</p>
              </div>
            )}
            {localPinned.length === 0 ? (
              <EmptyState
                icon={<Pin size={28} className="text-fg-subtle opacity-50" />}
                text={isOwnProfile ? 'Henüz sabitlenmiş cevap yok' : 'Vitrin boş'}
              />
            ) : localPinned.map((a: any, i: number) => {
              const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
              const totalVotes = (a.vote_count ?? 0) + (a.verdict_count ?? 0)
              return (
                <Card key={a.id} className="border-violet-500/20 bg-violet-500/3 relative">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-0.5">
                      <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {sc?.content && (
                        <p className="text-xs text-fg-subtle mb-1.5 line-clamp-1 italic">&ldquo;{sc.content}&rdquo;</p>
                      )}
                      <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-fg-subtle">
                        <span className="flex items-center gap-1">
                          <Star size={10} className="fill-amber-400 text-amber-400" />
                          {totalVotes} puan
                        </span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => togglePin(a)}
                        disabled={pinning === a.id}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-fg-subtle hover:text-red-400 transition-all"
                        title="Sabitlemeden kaldır"
                      >
                        {pinning === a.id ? <Zap size={14} className="animate-pulse" /> : <PinOff size={14} />}
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
            {/* Pin from answers tab */}
            {isOwnProfile && localPinned.length < 3 && recentAnswers.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-fg-subtle mb-2 font-semibold">Cevaplarından sabitle:</p>
                <div className="space-y-2">
                  {(recentAnswers as any[])
                    .filter(a => !localPinned.some(p => p.id === a.id))
                    .slice(0, 5)
                    .map((a: any) => {
                      const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
                      return (
                        <Card key={a.id} className="opacity-70 hover:opacity-100 transition-opacity">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {sc?.content && <p className="text-xs text-fg-subtle mb-1 line-clamp-1 italic">&ldquo;{sc.content}&rdquo;</p>}
                              <p className="text-sm text-fg line-clamp-2">{a.content}</p>
                            </div>
                            <button
                              onClick={() => togglePin(a)}
                              disabled={pinning === a.id}
                              className="shrink-0 p-1.5 rounded-lg hover:bg-violet-500/10 text-fg-subtle hover:text-violet-400 transition-all"
                              title="Sabitle"
                            >
                              {pinning === a.id ? <Zap size={14} className="animate-pulse" /> : <Pin size={14} />}
                            </button>
                          </div>
                        </Card>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GENEL TAB */}
        {activeTab === 'genel' && (
          <div className="space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: <Star size={18} className="text-amber-400 fill-amber-400/30" />, value: formatPoints(profile.total_points), label: 'Toplam Puan', accent: 'hover:border-amber-500/30' },
                { icon: <Trophy size={18} className="text-green-400" />, value: `%${winRate}`, label: 'Kazanma', accent: 'hover:border-green-500/30' },
                { icon: <Target size={18} className="text-purple-400" />, value: `${winCount}/${loseCount}`, label: 'G/K', accent: 'hover:border-purple-500/30' },
                { icon: <Flame size={18} className="text-orange-400" />, value: profile.streak_count, label: 'Seri', accent: 'hover:border-orange-500/30' },
              ].map(stat => (
                <Card key={stat.label} className={`text-center py-4 transition-colors ${stat.accent}`}>
                  <div className="flex justify-center mb-1.5">{stat.icon}</div>
                  <div className="text-2xl font-black text-fg">{stat.value}</div>
                  <div className="text-xs text-fg-subtle mt-0.5">{stat.label}</div>
                </Card>
              ))}
            </div>

            {/* Tier progress */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-fg flex items-center gap-2">
                  <TrendingUp size={15} className="text-purple-400" />
                  Tier İlerlemesi
                </h2>
                <span className={`text-sm font-black ${tier.color}`}>{tier.emoji} {tier.label}</span>
              </div>
              {tierProgress.next ? (
                <>
                  <div className="flex items-center justify-between text-xs text-fg-subtle mb-1.5">
                    <span>{formatPoints(profile.total_points)} puan</span>
                    <span>{tierProgress.pointsNeeded} puan → {tierProgress.next.emoji} {tierProgress.next.label}</span>
                  </div>
                  <div className="h-2 rounded-full bg-stroke overflow-hidden mb-3">
                    <div className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all`} style={{ width: `${tierProgress.progress}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-xs text-yellow-300 font-bold mb-3">👑 Maksimum tier — Efsane!</p>
              )}
              <div className="flex items-center justify-between gap-1">
                {allTiers.map(t => (
                  <div key={t.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                      profile.total_points >= t.minPoints ? `${t.bg} ${t.color}` : 'bg-surface border-stroke text-fg-subtle opacity-40'
                    }`}>{t.emoji}</div>
                    <span className={`text-[9px] font-semibold hidden sm:block ${profile.total_points >= t.minPoints ? t.color : 'text-fg-subtle opacity-40'}`}>{t.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top answers preview */}
            {(recentAnswers ?? []).filter((a: any) => a.vote_count > 0).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-fg flex items-center gap-2">
                    <Star size={14} className="text-amber-400 fill-amber-400/30" />
                    En Beğenilen Cevaplar
                  </h2>
                  <button onClick={() => setActiveTab('cevaplar')} className="text-xs text-purple-400 hover:text-purple-300">Tümünü gör →</button>
                </div>
                <div className="space-y-2">
                  {(recentAnswers as any[]).filter(a => a.vote_count > 0).slice(0, 2).map((a: any, i: number) => {
                    const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
                    return (
                      <Card key={a.id} className="hover:border-amber-500/20 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {sc?.content && <p className="text-xs text-fg-subtle mb-1 line-clamp-1 italic">&ldquo;{sc.content}&rdquo;</p>}
                            <p className="text-sm text-fg line-clamp-2">{a.content}</p>
                          </div>
                          <div className="shrink-0 text-center">
                            <span className="text-base">{i === 0 ? '🥇' : '🥈'}</span>
                            <p className="text-xs font-bold text-amber-400">{a.vote_count}</p>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent duels preview */}
            {(recentDuels ?? []).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-fg flex items-center gap-2">
                    <Swords size={14} className="text-purple-400" />
                    Son Düellolar
                  </h2>
                  <button onClick={() => setActiveTab('duellolar')} className="text-xs text-purple-400 hover:text-purple-300">Tümünü gör →</button>
                </div>
                <div className="space-y-2">
                  {(recentDuels as any[]).slice(0, 3).map(duel => <DuelRow key={duel.id} duel={duel} profileId={profile.id} />)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DUELLOLAR TAB */}
        {activeTab === 'duellolar' && (
          <div className="space-y-2">
            {(!recentDuels || recentDuels.length === 0) ? (
              <EmptyState icon={<Swords size={28} className="text-fg-subtle opacity-50" />} text="Henüz düello yok" />
            ) : (
              (recentDuels as any[]).map(duel => <DuelRow key={duel.id} duel={duel} profileId={profile.id} />)
            )}
          </div>
        )}

        {/* CEVAPLAR TAB */}
        {activeTab === 'cevaplar' && (
          <div className="space-y-2">
            {(!recentAnswers || recentAnswers.length === 0) ? (
              <EmptyState icon={<Star size={28} className="text-fg-subtle opacity-50" />} text="Henüz cevap yok" />
            ) : (
              (recentAnswers as any[]).map((a: any, i: number) => {
                const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
                return (
                  <Card key={a.id} className="hover:border-amber-500/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {sc?.content && <p className="text-xs text-fg-subtle mb-1.5 line-clamp-1 italic">&ldquo;{sc.content}&rdquo;</p>}
                        <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                        <p className="text-xs text-fg-subtle mt-2">{formatDate(a.created_at)}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐'}</span>
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                          <Star size={9} className="fill-amber-400" />{a.vote_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {/* SENARYOLAR TAB */}
        {activeTab === 'senaryolar' && (
          <div className="space-y-3">
            {userScenarios.length === 0 ? (
              <EmptyState icon={<Sparkles size={28} className="text-fg-subtle opacity-50" />} text="Henüz senaryo oluşturulmadı" />
            ) : userScenarios.map((s: any) => (
              <Link key={s.id} href={`/arsiv/${s.id}`}>
                <Card className="hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-fg leading-relaxed flex-1">{s.content}</p>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-purple-400">{s.answer_count}</div>
                      <div className="text-xs text-fg-subtle">cevap</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-surface border border-stroke px-2 py-0.5 rounded-full text-fg-subtle">
                      {s.category}
                    </span>
                    <span className="text-xs text-fg-subtle">{new Date(s.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* İSTATİSTİK TAB */}
        {activeTab === 'istatistik' && (
          <DuelStatsPanel username={profile.username} isOwnProfile={isOwnProfile} />
        )}

        {/* AKTİVİTE TAB */}
        {activeTab === 'aktivite' && (
          <ActivityFeed username={profile.username} />
        )}

        {/* BAŞARIMLAR TAB */}
        {activeTab === 'basarimlar' && (
          <div>
            {(!achievements || achievements.length === 0) ? (
              <EmptyState icon={<Medal size={28} className="text-fg-subtle opacity-50" />} text="Henüz başarım kazanılmadı" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(achievements as any[]).map((a: any) => {
                  const info = ACHIEVEMENT_LABELS[a.type as keyof typeof ACHIEVEMENT_LABELS]
                  if (!info) return null
                  return (
                    <div key={a.id} className="flex items-center gap-3 bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl px-4 py-3 hover:border-amber-500/40 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-xl shrink-0">{info.emoji}</div>
                      <div>
                        <p className="text-sm font-bold text-fg">{info.label}</p>
                        <p className="text-xs text-fg-subtle">{info.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DuelRow({ duel, profileId }: { duel: any; profileId: string }) {
  const isChallenger = duel.challenger_id === profileId
  const opponent = isChallenger ? duel.challenged : duel.challenger
  const opponentTier = getTier(opponent?.total_points ?? 0)
  const won = duel.winner_id === profileId
  const lost = duel.winner_id && duel.winner_id !== profileId

  return (
    <Link href={`/duel/${duel.share_token}`}>
      <Card className="hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
            duel.status === 'completed'
              ? won ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-surface border border-stroke text-fg-subtle'
          }`}>
            {duel.status === 'completed' ? (won ? 'W' : 'L') : '?'}
          </div>
          <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-fg group-hover:text-purple-300 transition-colors truncate">
                vs {opponent?.display_name || opponent?.username}
              </p>
              <span className={`text-xs font-bold ${opponentTier.color} shrink-0`}>{opponentTier.emoji}</span>
            </div>
            {duel.scenario?.content && (
              <p className="text-xs text-fg-subtle line-clamp-1 mt-0.5 italic">{duel.scenario.content}</p>
            )}
          </div>
          <div className="shrink-0">
            {duel.status === 'completed' && won && <Badge variant="success" className="text-xs">🏆</Badge>}
            {duel.status === 'completed' && lost && <Badge variant="danger" className="text-xs">😅</Badge>}
            {duel.status === 'active' && <Badge variant="info" className="text-xs">⚡</Badge>}
            {duel.status === 'pending' && <Badge variant="warning" className="text-xs">⏳</Badge>}
          </div>
        </div>
      </Card>
    </Link>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Card className="text-center py-14 border-dashed">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-fg font-semibold">{text}</p>
    </Card>
  )
}
