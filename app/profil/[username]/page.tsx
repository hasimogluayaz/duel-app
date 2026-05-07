export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ACHIEVEMENT_LABELS } from '@/types'
import { formatDate, formatPoints } from '@/lib/utils/formatting'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Settings, Trophy, Swords, Flame, Star, Calendar } from 'lucide-react'

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

  if (!profile || profile.is_admin) notFound()

  const [
    { count: duelCount },
    { count: winCount },
    { data: achievements },
    { data: recentDuels },
  ] = await Promise.all([
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .eq('status', 'completed'),
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .eq('winner_id', profile.id),
    supabase.from('achievements').select('*').eq('user_id', profile.id),
    supabase.from('duels').select(`
      id, share_token, status, created_at, winner_id,
      challenger:profiles!duels_challenger_id_fkey(username, display_name, avatar_url),
      challenged:profiles!duels_challenged_id_fkey(username, display_name, avatar_url),
      scenario:scenarios(content)
    `)
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const winRate = duelCount && duelCount > 0 ? Math.round(((winCount ?? 0) / duelCount) * 100) : 0
  const isOwnProfile = user?.id === profile.id

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* ── Hero Banner ────────────────────────────────── */}
      <div className="mb-6">
        <div className="h-36 sm:h-44 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-pink-500 relative overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full" />
          <div className="absolute -bottom-10 left-16 w-28 h-28 bg-white/5 rounded-full" />
          <div className="absolute top-4 left-5 text-4xl opacity-20 rotate-12">⚔️</div>
          <div className="absolute bottom-3 right-16 text-2xl opacity-10">🏆</div>

          {isOwnProfile && (
            <Link href="/profil/ayarlar" className="absolute top-3 right-3">
              <div className="flex items-center gap-1.5 text-xs text-white/90 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg px-3 py-1.5 hover:bg-white/30 transition-all font-medium">
                <Settings size={13} />
                Düzenle
              </div>
            </Link>
          )}
        </div>

        {/* Profile card overlapping banner */}
        <Card className="-mt-10 relative pt-0">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {/* Avatar overlapping banner */}
            <div className="-mt-14 sm:-mt-16 ml-2 shrink-0">
              <div className="p-1.5 bg-surface rounded-full shadow-xl">
                <Avatar src={profile.avatar_url} username={profile.username} size="xl" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pt-1 sm:pt-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-2xl font-black text-fg">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-fg-subtle text-sm">@{profile.username}</p>
                </div>
              </div>

              {profile.personality_type && (
                <div className="mt-2">
                  <Badge variant="info">🧠 {profile.personality_type}</Badge>
                </div>
              )}

              {profile.bio && (
                <p className="text-fg-muted text-sm mt-3 leading-relaxed">{profile.bio}</p>
              )}

              <p className="text-xs text-fg-subtle mt-3 flex items-center gap-1.5">
                <Calendar size={11} />
                {formatDate(profile.created_at)} tarihinde katıldı
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="text-center py-4 hover:border-amber-500/30 transition-colors">
          <Star size={18} className="text-amber-400 fill-amber-400/30 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">{formatPoints(profile.total_points)}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Toplam Puan</div>
        </Card>
        <Card className="text-center py-4 hover:border-green-500/30 transition-colors">
          <Trophy size={18} className="text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">%{winRate}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Kazanma Oranı</div>
        </Card>
        <Card className="text-center py-4 hover:border-purple-500/30 transition-colors">
          <Swords size={18} className="text-purple-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">{duelCount ?? 0}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Düello</div>
        </Card>
        <Card className="text-center py-4 hover:border-amber-500/30 transition-colors">
          <Flame size={18} className="text-amber-400 mx-auto mb-1.5" />
          <div className="text-2xl font-black text-fg">{profile.streak_count}</div>
          <div className="text-xs text-fg-subtle mt-0.5">Günlük Seri</div>
        </Card>
      </div>

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
                  className="flex items-center gap-3 bg-surface border border-stroke rounded-xl px-4 py-3 hover:border-purple-500/30 transition-colors">
                  <span className="text-2xl flex-shrink-0">{info.emoji}</span>
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
          Son Düellolar
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
                <div className="text-sm text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                  Oynamaya başla →
                </div>
              </Link>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentDuels.map((duel: any) => {
              const isChallenger = duel.challenger_id === profile.id
              const opponent = isChallenger ? duel.challenged : duel.challenger
              const won = duel.winner_id === profile.id
              const lost = duel.winner_id && duel.winner_id !== profile.id

              return (
                <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                  <Card className="hover:border-purple-500/30 hover:bg-purple-500/5 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={opponent?.avatar_url} username={opponent?.username || '?'} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-fg group-hover:text-purple-300 transition-colors">
                            vs {opponent?.display_name || opponent?.username}
                          </p>
                          {duel.scenario?.content && (
                            <p className="text-xs text-fg-subtle line-clamp-1 mt-0.5">{duel.scenario.content}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {duel.status === 'completed' && won && <Badge variant="success">🏆 Kazandı</Badge>}
                        {duel.status === 'completed' && lost && <Badge variant="danger">Kaybetti</Badge>}
                        {duel.status === 'active' && <Badge variant="info">Oylanıyor</Badge>}
                        {duel.status === 'pending' && <Badge variant="warning">Bekliyor</Badge>}
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
