export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ACHIEVEMENT_LABELS } from '@/types'
import { formatDate, formatPoints } from '@/lib/utils/formatting'
import { getTier, getTierProgress, getAllTiers } from '@/lib/utils/tier'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Settings, Trophy, Swords, Flame, Star, Calendar, Target, TrendingUp, Zap, Users, Crown } from 'lucide-react'
import { FollowButton } from '@/components/profile/FollowButton'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} · Kapisio` }
}

export default async function ProfilPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username.toLowerCase())
    .single()

  if (!profile || (profile.is_admin && user?.id !== profile.id)) notFound()

  // Check if current user follows this profile
  const isFollowing = user ? await (async () => {
    const { data } = await (supabase.from('followers' as any) as any)
      .select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
    return !!data
  })() : false

  const [
    { count: duelCount },
    { count: winCount },
    { data: achievements },
    { data: recentDuels },
    { data: recentAnswers },
  ] = await Promise.all([
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .eq('status', 'completed'),
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .eq('winner_id', profile.id),
    supabase.from('achievements').select('*').eq('user_id', profile.id),
    supabase.from('duels').select(`
      id, share_token, status, created_at, winner_id,
      challenger_id, challenged_id,
      challenger:profiles!duels_challenger_id_fkey(username, display_name, avatar_url, total_points),
      challenged:profiles!duels_challenged_id_fkey(username, display_name, avatar_url, total_points),
      scenario:scenarios(content)
    `)
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('answers').select(`
      id, content, vote_count, created_at,
      scenario:scenarios(content, active_date)
    `)
      .eq('user_id', profile.id)
      .order('vote_count', { ascending: false })
      .limit(3),
  ])

  const winRate = duelCount && duelCount > 0 ? Math.round(((winCount ?? 0) / duelCount) * 100) : 0
  const loseCount = (duelCount ?? 0) - (winCount ?? 0)
  const isOwnProfile = user?.id === profile.id

  const tier = getTier(profile.total_points)
  const tierProgress = getTierProgress(profile.total_points)
  const allTiers = getAllTiers()

  // Form: last 5 completed duels result
  const form: string[] = (recentDuels ?? [])
    .filter((d: any) => d.status === 'completed')
    .slice(0, 5)
    .map((d: any): string => d.winner_id === profile.id ? 'W' : 'L')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Hero Banner ────────────────────────────────── */}
      <div className="mb-6">
        <div className={`h-36 sm:h-44 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 relative overflow-hidden`}>
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 left-16 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute top-4 left-5 text-4xl opacity-20 rotate-12">⚔️</div>
          <div className="absolute bottom-3 right-16 text-2xl opacity-10">🏆</div>
          {/* Tier glow */}
          <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-10`} />

          {isOwnProfile && (
            <Link href="/profil/ayarlar" className="absolute top-3 right-3">
              <div className="flex items-center gap-1.5 text-xs text-white/90 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/30 transition-all font-medium">
                <Settings size={13} />
                Düzenle
              </div>
            </Link>
          )}
        </div>

        {/* Profile card */}
        <Card className="-mt-10 relative pt-0">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="-mt-14 sm:-mt-16 ml-2 shrink-0">
              <div className={`p-1.5 bg-surface rounded-full shadow-xl ring-2 ${tier.ringColor}`}>
                <Avatar src={profile.avatar_url} username={profile.username} size="xl" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1 sm:pt-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-fg">
                      {profile.display_name || profile.username}
                    </h1>
                    {/* Tier badge */}
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>
                      {tier.emoji} {tier.label}
                    </span>
                    {/* Premium badge */}
                    {(profile as any).is_premium && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300">
                        <Crown size={10} className="fill-amber-400" /> Premium
                      </span>
                    )}
                  </div>
                  <p className="text-fg-subtle text-sm">@{profile.username}</p>
                </div>
                {/* Follow + Challenge CTAs */}
                {!isOwnProfile && user && (
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <FollowButton
                      targetId={profile.id}
                      initialFollowing={isFollowing}
                    />
                    <Link href="/oyun">
                      <Button size="sm" className="btn-gradient">
                        <Swords size={13} />
                        Düelloya Çağır
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {profile.personality_type && (
                <div className="mt-2">
                  <Badge variant="info">🧠 {profile.personality_type}</Badge>
                </div>
              )}

              {profile.bio && (
                <p className="text-fg-muted text-sm mt-3 leading-relaxed">{profile.bio}</p>
              )}

              {/* Form (last 5 results) */}
              {form.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3">
                  <span className="text-xs text-fg-subtle font-medium">Form:</span>
                  {form.map((r, i) => (
                    <span
                      key={i}
                      className={`w-5 h-5 rounded-full text-xs font-black flex items-center justify-center ${
                        r === 'W'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                  <span className="text-xs text-fg-subtle">(son {form.length})</span>
                </div>
              )}

              <p className="text-xs text-fg-subtle mt-2 flex items-center gap-1.5">
                <Calendar size={11} />
                {formatDate(profile.created_at)} tarihinde katıldı
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Tier progress ──────────────────────────────── */}
      <Card className="mb-6">
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
              <div
                className={`h-full rounded-full bg-gradient-to-r ${tier.gradient} transition-all duration-700`}
                style={{ width: `${tierProgress.progress}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-xs text-yellow-300 font-bold mb-3">👑 Maksimum tier ulaşıldı — Efsane!</p>
        )}
        {/* Tier roadmap */}
        <div className="flex items-center justify-between gap-1 mt-1">
          {allTiers.map((t) => (
            <div key={t.label} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                profile.total_points >= t.minPoints
                  ? `${t.bg} ${t.color}`
                  : 'bg-surface border-stroke text-fg-subtle opacity-40'
              }`}>
                {t.emoji}
              </div>
              <span className={`text-[9px] font-semibold hidden sm:block ${
                profile.total_points >= t.minPoints ? t.color : 'text-fg-subtle opacity-40'
              }`}>
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Follower/Following counts ──────────────────── */}
      {((profile as any).follower_count > 0 || (profile as any).following_count > 0) && (
        <div className="flex items-center gap-4 mb-4 px-1 text-sm">
          <span className="text-fg-subtle">
            <span className="font-black text-fg">{(profile as any).follower_count ?? 0}</span> takipçi
          </span>
          <span className="text-fg-subtle">
            <span className="font-black text-fg">{(profile as any).following_count ?? 0}</span> takip
          </span>
        </div>
      )}

      {/* ── Stats grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="text-center py-4 hover:border-amber-500/30 transition-colors">
          <Star size={18} className="text-amber-400 fill-amber-400/30 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">{formatPoints(profile.total_points)}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Toplam Puan</div>
        </Card>
        <Card className="text-center py-4 hover:border-green-500/30 transition-colors">
          <Trophy size={18} className="text-green-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">%{winRate}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Kazanma</div>
        </Card>
        <Card className="text-center py-4 hover:border-purple-500/30 transition-colors">
          <Target size={18} className="text-purple-400 mx-auto mb-1.5" />
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-black text-green-400">{winCount ?? 0}G</span>
            <span className="text-lg font-black text-fg-subtle">/</span>
            <span className="text-lg font-black text-red-400">{loseCount}K</span>
          </div>
          <div className="text-xs text-fg-subtle mt-0.5">{duelCount ?? 0} düello</div>
        </Card>
        <Card className="text-center py-4 hover:border-amber-500/30 transition-colors">
          <Flame size={18} className="text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">{profile.streak_count}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Günlük Seri</div>
        </Card>
      </div>

      {/* ── Top answers ────────────────────────────────── */}
      {recentAnswers && recentAnswers.length > 0 && (recentAnswers as any[]).some((a: any) => (a.vote_count ?? 0) > 0) && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-fg mb-3 flex items-center gap-2">
            <Star size={16} className="text-amber-400 fill-amber-400/30" />
            En Beğenilen Cevaplar
          </h2>
          <div className="flex flex-col gap-2.5">
            {(recentAnswers as any[]).filter((a: any) => (a.vote_count ?? 0) > 0).map((a: any, i: number) => {
              const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
              return (
                <Card key={a.id} className="hover:border-amber-500/20 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {sc?.content && (
                        <p className="text-xs text-fg-subtle mb-1.5 line-clamp-1 italic">&ldquo;{sc.content}&rdquo;</p>
                      )}
                      <p className="text-sm text-fg leading-relaxed line-clamp-2">{a.content}</p>
                    </div>
                    {a.vote_count > 0 && (
                      <div className="shrink-0 flex flex-col items-center">
                        <span className="text-xs">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5 mt-0.5">
                          <Star size={9} className="fill-amber-400" />
                          {a.vote_count}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Achievements ───────────────────────────────── */}
      {achievements && achievements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-bold text-fg mb-3 flex items-center gap-2">
            <span className="text-amber-400">🏅</span>
            Başarımlar
            <span className="text-xs font-normal text-fg-subtle bg-surface-2 px-2 py-0.5 rounded-full">
              {achievements.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {achievements.map((a: any) => {
              const info = ACHIEVEMENT_LABELS[a.type as keyof typeof ACHIEVEMENT_LABELS]
              if (!info) return null
              return (
                <div key={a.id}
                  className="flex items-center gap-3 bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 rounded-xl px-4 py-3 hover:border-amber-500/40 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-xl shrink-0">
                    {info.emoji}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-fg">{info.label}</p>
                    <p className="text-xs text-fg-subtle">{info.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent duels ───────────────────────────────── */}
      <div>
        <h2 className="text-base font-bold text-fg mb-3 flex items-center gap-2">
          <Swords size={16} className="text-purple-400" />
          Düello Geçmişi
        </h2>
        {!recentDuels || recentDuels.length === 0 ? (
          <Card className="text-center py-10 border-dashed">
            <Swords size={28} className="text-fg-subtle mx-auto mb-3 opacity-50" />
            <p className="text-fg font-semibold mb-1">Henüz düello yok</p>
            <p className="text-fg-subtle text-sm">
              {isOwnProfile ? 'Günlük senaryoya cevap ver ve birini düelloya çağır!' : 'Bu kullanıcı henüz düelloya girmemiş.'}
            </p>
            {isOwnProfile && (
              <Link href="/oyun" className="inline-block mt-4">
                <Button size="sm" className="btn-gradient">
                  <Zap size={13} />
                  Oynamaya başla
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {recentDuels.map((duel: any) => {
              const isChallenger = duel.challenger_id === profile.id
              const opponent = isChallenger ? duel.challenged : duel.challenger
              const opponentTier = getTier(opponent?.total_points ?? 0)
              const won = duel.winner_id === profile.id
              const lost = duel.winner_id && duel.winner_id !== profile.id

              return (
                <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                  <Card className="hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between gap-3">
                      {/* Result indicator */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                        duel.status === 'completed'
                          ? won
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-surface border border-stroke text-fg-subtle'
                      }`}>
                        {duel.status === 'completed' ? (won ? 'W' : 'L') : '?'}
                      </div>

                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
                        <div className="min-w-0">
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
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        {duel.status === 'completed' && won && <Badge variant="success" className="text-xs">🏆</Badge>}
                        {duel.status === 'completed' && lost && <Badge variant="danger" className="text-xs">😅</Badge>}
                        {duel.status === 'active' && <Badge variant="info" className="text-xs">⚡</Badge>}
                        {duel.status === 'pending' && <Badge variant="warning" className="text-xs">⏳</Badge>}
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
