'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
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

  const tabs: { id: Tab; label: string }[] = [
    ...(localPinned.length > 0 || isOwnProfile ? [{ id: 'vitrin' as Tab, label: 'Vitrin' }] : []),
    { id: 'genel', label: 'Genel' },
    { id: 'duellolar', label: 'Düellolar' },
    { id: 'cevaplar', label: 'Cevaplar' },
    ...(userScenarios.length > 0 || isOwnProfile ? [{ id: 'senaryolar' as Tab, label: 'Senaryolar' }] : []),
    { id: 'basarimlar', label: 'Başarımlar' },
    { id: 'istatistik', label: 'İstatistik' },
    { id: 'aktivite', label: 'Aktivite' },
  ]

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── Banner ── */}
      <div className="relative">
        <div className="h-36 sm:h-44 relative overflow-hidden bg-surface">
          {/* Tier-tinted gradient wash — very subtle */}
          <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-15`} />
          {/* Dark vignette for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/50" />
          {/* Geometric rings — architectural, no emoji */}
          <div className="absolute -top-24 -right-24 w-96 h-96 border border-white/[0.04] rounded-full" />
          <div className="absolute -top-12 -right-12 w-64 h-64 border border-white/[0.04] rounded-full" />
          <div className="absolute -bottom-28 left-8 w-72 h-72 border border-white/[0.03] rounded-full" />
          {/* Tier indicator — bottom-left, text only */}
          <div className={`absolute bottom-3 left-4 text-xs font-semibold ${tier.color} opacity-70 tracking-wide`}>
            {tier.emoji} {tier.label.toUpperCase()}
          </div>
          {isOwnProfile && (
            <Link href="/profil/ayarlar" className="absolute top-3 right-3">
              <div className="flex items-center gap-1.5 text-xs text-white/80 bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5 hover:bg-black/60 transition-all font-medium">
                <Settings size={12} />
                Düzenle
              </div>
            </Link>
          )}
        </div>

        {/* ── Avatar row ── */}
        <div className="px-4">
          <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-4">
            <div className={`p-[3px] bg-bg rounded-full ring-2 ${tier.ringColor} shadow-xl`}>
              <Avatar src={profile.avatar_url} username={profile.username} size="xl" className="w-20 h-20 sm:w-24 sm:h-24" />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pb-1">
              <button
                onClick={copyProfile}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-subtle hover:text-fg"
                title="Profili paylaş"
              >
                {copied ? <CheckCircle2 size={15} className="text-green-400" /> : <Share2 size={15} />}
              </button>

              {!isOwnProfile && currentUserId && (
                <>
                  <Link href={`/mesajlar/${profile.username}`}>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full border border-stroke bg-surface hover:bg-surface-2 transition-colors text-fg-subtle hover:text-fg">
                      <MessageCircle size={15} />
                    </button>
                  </Link>
                  <FollowButton targetId={profile.id} initialFollowing={isFollowing} />
                  <Link href="/oyun">
                    <Button size="sm" className="btn-gradient h-8 px-3 text-xs font-bold">
                      <Swords size={12} />
                      Düello
                    </Button>
                  </Link>
                  <BlockButton targetUserId={profile.id} />
                </>
              )}
            </div>
          </div>

          {/* ── Name ── */}
          <div className="mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-fg tracking-tight">{profile.display_name || profile.username}</h1>
              {profile.is_premium && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-400">
                  <Crown size={9} className="fill-amber-400" /> PRO
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-fg-subtle text-sm">@{profile.username}</p>
              <span className={`text-xs font-semibold ${tier.color}`}>{tier.emoji} {tier.label}</span>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-fg-muted text-sm leading-relaxed mb-2 max-w-sm">{profile.bio}</p>
          )}

          {/* Personality */}
          {profile.personality_type && (
            <p className="text-xs text-fg-subtle mb-2">
              🧠 {profile.personality_type}
            </p>
          )}

          {/* ── Stats strip ── */}
          <div className="flex items-center gap-4 mb-3 text-sm">
            <Link href={`/profil/${profile.username}/takip`} className="hover:underline">
              <span className="font-bold text-fg">{profile.following_count ?? 0}</span>
              <span className="text-fg-subtle ml-1 text-xs">Takip</span>
            </Link>
            <Link href={`/profil/${profile.username}/takipciler`} className="hover:underline">
              <span className="font-bold text-fg">{profile.follower_count ?? 0}</span>
              <span className="text-fg-subtle ml-1 text-xs">Takipçi</span>
            </Link>
            <span>
              <span className="font-bold text-fg">{duelCount}</span>
              <span className="text-fg-subtle ml-1 text-xs">Düello</span>
            </span>
            <span>
              <span className="font-bold text-fg">{formatPoints(profile.total_points)}</span>
              <span className="text-fg-subtle ml-1 text-xs">puan</span>
            </span>
          </div>

          {/* Recent form */}
          {form.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-fg-subtle">Form:</span>
              {form.map((r, i) => (
                <span key={i} className={`w-5 h-5 rounded text-[10px] font-black flex items-center justify-center ${
                  r === 'W' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'
                }`}>{r}</span>
              ))}
            </div>
          )}

          {/* Join date */}
          <div className="flex items-center gap-1 text-xs text-fg-subtle mb-4">
            <Calendar size={11} />
            <span>{formatDate(profile.created_at)} tarihinde katıldı</span>
          </div>
        </div>

        {/* ── Tab bar — scrollable ── */}
        <div className="flex border-b border-stroke overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-fg text-fg'
                  : 'border-transparent text-fg-subtle hover:text-fg-muted hover:border-stroke'
              }`}
            >
              {tab.label}
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
              <p className="text-xs text-fg-subtle mb-4 leading-relaxed">
                En iyi cevaplarından en fazla 3 tanesini vitrine sabitle. Ziyaretçiler önce bunları görür.
              </p>
            )}
            {localPinned.length === 0 ? (
              <EmptyState icon={<Pin size={22} />} text={isOwnProfile ? 'Henüz sabitlenmiş cevap yok' : 'Vitrin boş'} />
            ) : localPinned.map((a: any, i: number) => {
              const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
              const totalVotes = (a.vote_count ?? 0) + (a.verdict_count ?? 0)
              return (
                <div key={a.id} className="border border-stroke rounded-xl p-4 bg-surface hover:bg-surface-2 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-xs font-black text-fg-subtle border border-stroke mt-0.5">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      {sc?.content && (
                        <p className="text-xs text-fg-subtle mb-2 line-clamp-1">{sc.content}</p>
                      )}
                      <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                      <div className="flex items-center gap-2 mt-2.5 text-xs text-fg-subtle">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span>{totalVotes} oy</span>
                      </div>
                    </div>
                    {isOwnProfile && (
                      <button
                        onClick={() => togglePin(a)}
                        disabled={pinning === a.id}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-red-500/10 text-fg-subtle hover:text-red-400 transition-all"
                      >
                        {pinning === a.id ? <Zap size={13} className="animate-pulse" /> : <PinOff size={13} />}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {isOwnProfile && localPinned.length < 3 && recentAnswers.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-fg-subtle uppercase tracking-wider mb-3">Cevaplarından Sabitle</p>
                <div className="space-y-2">
                  {(recentAnswers as any[])
                    .filter(a => !localPinned.some(p => p.id === a.id))
                    .slice(0, 5)
                    .map((a: any) => {
                      const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
                      return (
                        <div key={a.id} className="border border-stroke rounded-xl p-3 bg-surface hover:bg-surface-2 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              {sc?.content && <p className="text-xs text-fg-subtle mb-1 line-clamp-1">{sc.content}</p>}
                              <p className="text-sm text-fg line-clamp-2">{a.content}</p>
                            </div>
                            <button
                              onClick={() => togglePin(a)}
                              disabled={pinning === a.id}
                              className="shrink-0 p-1.5 rounded-lg hover:bg-surface-2 text-fg-subtle hover:text-fg transition-all"
                            >
                              {pinning === a.id ? <Zap size={13} className="animate-pulse" /> : <Pin size={13} />}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GENEL TAB */}
        {activeTab === 'genel' && (
          <div className="space-y-6">

            {/* Stats — editorial connected grid */}
            <div className="grid grid-cols-4 gap-px bg-stroke rounded-2xl overflow-hidden border border-stroke">
              {[
                { value: formatPoints(profile.total_points), label: 'Puan' },
                { value: `${winRate}%`, label: 'Kazanma' },
                { value: `${winCount}/${loseCount}`, label: 'G/K' },
                { value: profile.streak_count ?? 0, label: 'Seri' },
              ].map(stat => (
                <div key={stat.label} className="bg-surface px-3 py-4 text-center">
                  <div className="text-lg sm:text-2xl font-black text-fg tabular-nums">{stat.value}</div>
                  <div className="text-[11px] text-fg-subtle mt-0.5 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tier progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Rütbe</span>
                <span className={`text-sm font-bold ${tier.color}`}>{tier.emoji} {tier.label}</span>
              </div>
              {tierProgress.next ? (
                <>
                  <div className="h-1.5 rounded-full bg-stroke overflow-hidden mb-2">
                    <div className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all`} style={{ width: `${tierProgress.progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-fg-subtle">
                    <span>{formatPoints(profile.total_points)} puan</span>
                    <span>{tierProgress.pointsNeeded} puan → {tierProgress.next.emoji} {tierProgress.next.label}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-amber-400 font-semibold">Maksimum rütbe — Efsane!</p>
              )}
              <div className="flex items-center justify-between mt-3 gap-1">
                {allTiers.map(t => (
                  <div key={t.label} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs border ${
                      profile.total_points >= t.minPoints ? `${t.bg} ${t.color} border-transparent` : 'bg-transparent border-stroke text-fg-subtle opacity-30'
                    }`}>{t.emoji}</div>
                    <span className={`text-[9px] font-medium hidden sm:block ${profile.total_points >= t.minPoints ? t.color : 'text-fg-subtle opacity-30'}`}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Points guide — own profile only */}
            {isOwnProfile && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Puan Kazan</span>
                  <span className="text-xs text-fg-subtle">Nasıl puan birikir?</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'Düello kazan', pts: '+50' },
                    { label: 'Düelloya katıl', pts: '+10' },
                    { label: 'Günlük cevap', pts: '+5' },
                    { label: 'Oy aldığında', pts: '+2' },
                    { label: '7 günlük seri', pts: '+100' },
                    { label: '30 günlük seri', pts: '+500' },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between px-3 py-2 bg-surface border border-stroke rounded-lg">
                      <span className="text-xs text-fg-subtle">{p.label}</span>
                      <span className="text-xs font-bold text-amber-400">{p.pts}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top answers */}
            {(recentAnswers ?? []).filter((a: any) => a.vote_count > 0).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">En Beğenilen</span>
                  <button onClick={() => setActiveTab('cevaplar')} className="text-xs text-fg-muted hover:text-fg transition-colors">Tümü</button>
                </div>
                <div className="space-y-2">
                  {(recentAnswers as any[]).filter(a => a.vote_count > 0).slice(0, 2).map((a: any) => {
                    const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
                    return (
                      <div key={a.id} className="border border-stroke rounded-xl p-4 bg-surface">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {sc?.content && <p className="text-xs text-fg-subtle mb-1.5 line-clamp-1">{sc.content}</p>}
                            <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-amber-400 flex items-center gap-1 pt-0.5">
                            <Star size={9} className="fill-amber-400" />{a.vote_count}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recent duels */}
            {(recentDuels ?? []).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Son Düellolar</span>
                  <button onClick={() => setActiveTab('duellolar')} className="text-xs text-fg-muted hover:text-fg transition-colors">Tümü</button>
                </div>
                <div className="space-y-1.5">
                  {(recentDuels as any[]).slice(0, 3).map(duel => (
                    <DuelRow key={duel.id} duel={duel} profileId={profile.id} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DUELLOLAR TAB */}
        {activeTab === 'duellolar' && (
          <div className="space-y-1.5">
            {(!recentDuels || recentDuels.length === 0) ? (
              <EmptyState icon={<Swords size={22} />} text="Henüz düello yok" />
            ) : (
              (recentDuels as any[]).map(duel => (
                <DuelRow key={duel.id} duel={duel} profileId={profile.id} />
              ))
            )}
          </div>
        )}

        {/* CEVAPLAR TAB */}
        {activeTab === 'cevaplar' && (
          <div className="space-y-2">
            {(!recentAnswers || recentAnswers.length === 0) ? (
              <EmptyState icon={<Star size={22} />} text="Henüz cevap yok" />
            ) : (
              (recentAnswers as any[]).map((a: any) => {
                const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
                return (
                  <div key={a.id} className="border border-stroke rounded-xl p-4 bg-surface hover:bg-surface-2 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {sc?.content && <p className="text-xs text-fg-subtle mb-2 line-clamp-1">{sc.content}</p>}
                        <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                        <p className="text-xs text-fg-subtle mt-2.5">{formatDate(a.created_at)}</p>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                          <Star size={9} className="fill-amber-400" />{a.vote_count ?? 0}
                        </span>
                        {isOwnProfile && (
                          <button
                            onClick={() => {
                              const isPinned = localPinned.some(p => p.id === a.id)
                              if (!isPinned && localPinned.length >= 3) return
                              togglePin(a)
                            }}
                            disabled={pinning === a.id || (!localPinned.some(p => p.id === a.id) && localPinned.length >= 3)}
                            className="p-1 text-fg-subtle hover:text-fg transition-colors disabled:opacity-30"
                            title={localPinned.some(p => p.id === a.id) ? 'Sabitlemeden kaldır' : 'Sabitle'}
                          >
                            {localPinned.some(p => p.id === a.id) ? <PinOff size={12} /> : <Pin size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* SENARYOLAR TAB */}
        {activeTab === 'senaryolar' && (
          <div className="space-y-3">
            {isOwnProfile && (
              <Link href="/senaryo-olustur" className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-dashed border-stroke hover:border-fg/30 hover:bg-surface transition-all group">
                <div className="w-8 h-8 rounded-lg bg-surface-2 border border-stroke flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-fg-subtle" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-fg">Senaryo Oluştur</p>
                  <p className="text-xs text-fg-subtle">Topluluğa kendi soruну sun — +30 puan</p>
                </div>
              </Link>
            )}
            {userScenarios.length === 0 ? (
              !isOwnProfile && <EmptyState icon={<Sparkles size={22} />} text="Henüz senaryo yok" />
            ) : userScenarios.map((s: any) => (
              <Link key={s.id} href={`/arsiv/${s.id}`}>
                <div className="border border-stroke rounded-xl p-4 bg-surface hover:bg-surface-2 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-fg leading-relaxed flex-1">{s.content}</p>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-fg">{s.answer_count}</div>
                      <div className="text-xs text-fg-subtle">cevap</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2.5">
                    <span className="text-xs border border-stroke px-2 py-0.5 rounded-md text-fg-subtle">{s.category}</span>
                    <span className="text-xs text-fg-subtle">{new Date(s.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
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
              <EmptyState icon={<Medal size={22} />} text="Henüz başarım kazanılmadı" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(achievements as any[]).map((a: any) => {
                  const info = ACHIEVEMENT_LABELS[a.type as keyof typeof ACHIEVEMENT_LABELS]
                  if (!info) return null
                  return (
                    <div key={a.id} className="flex items-center gap-3 border border-stroke rounded-xl px-4 py-3 bg-surface hover:bg-surface-2 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center text-lg shrink-0">{info.emoji}</div>
                      <div className="min-w-0">
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
      <div className="flex items-center gap-3 border border-stroke rounded-xl px-4 py-3 bg-surface hover:bg-surface-2 transition-colors cursor-pointer group">
        {/* W/L indicator */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
          duel.status === 'completed'
            ? won
              ? 'bg-green-500/15 text-green-400 border border-green-500/20'
              : 'bg-red-500/15 text-red-400 border border-red-500/20'
            : 'bg-surface-2 border border-stroke text-fg-subtle'
        }`}>
          {duel.status === 'completed' ? (won ? 'W' : 'L') : duel.status === 'active' ? '●' : '·'}
        </div>
        <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-fg truncate">
              {opponent?.display_name || opponent?.username}
            </p>
            <span className={`text-xs ${opponentTier.color} shrink-0`}>{opponentTier.emoji}</span>
          </div>
          {duel.scenario?.content && (
            <p className="text-xs text-fg-subtle line-clamp-1 mt-0.5">{duel.scenario.content}</p>
          )}
        </div>
        <div className="shrink-0 text-xs font-semibold">
          {duel.status === 'completed' && won && <span className="text-green-400">Kazandı</span>}
          {duel.status === 'completed' && lost && <span className="text-red-400">Kaybetti</span>}
          {duel.status === 'active' && <span className="text-blue-400">Devam</span>}
          {duel.status === 'pending' && <span className="text-amber-400">Bekliyor</span>}
        </div>
      </div>
    </Link>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-3 text-fg-subtle opacity-25">{icon}</div>
      <p className="text-sm text-fg-muted">{text}</p>
    </div>
  )
}
