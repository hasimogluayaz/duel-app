export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Swords, Star, Lock, Sparkles, Trophy, Flame } from 'lucide-react'
import { HomeAnswerGate } from '@/components/home/HomeAnswerGate'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If logged in, redirect to oyun
  if (user) {
    const { redirect } = await import('next/navigation')
    redirect('/oyun')
  }

  const today = new Date().toISOString().split('T')[0]

  // Today's scenario
  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('active_date', today)
    .single()

  // Top community answers (public preview)
  const { data: topAnswers } = scenario ? await supabase
    .from('answers')
    .select('id, content, vote_count, profiles:profiles(username, display_name, avatar_url)')
    .eq('scenario_id', scenario.id)
    .order('vote_count', { ascending: false })
    .limit(4) : { data: [] }

  // Recent completed duels
  const { data: recentDuels } = await supabase
    .from('duels')
    .select(`
      id, share_token, ai_verdict, created_at,
      challenger:profiles!duels_challenger_id_fkey(username, display_name, avatar_url),
      challenged:profiles!duels_challenged_id_fkey(username, display_name, avatar_url)
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3)

  // Stats
  const [{ count: userCount }, { count: duelCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('duels').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  const MODES = [
    {
      emoji: '✍️',
      title: 'Senaryo Kapışması',
      desc: 'Günlük senaryoya cevap yaz, topluluğun oylarını topla.',
      badge: 'Aktif',
      badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
      active: true,
    },
    {
      emoji: '😂',
      title: 'Emoji Kapışması',
      desc: 'Duyguları sadece emoji ile ifade et — kelime yasak!',
      badge: 'Yakında',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      active: false,
    },
    {
      emoji: '🎭',
      title: 'Karakter Kapışması',
      desc: 'Bir karaktere bürün ve o karakterin ağzıyla cevap ver.',
      badge: 'Yakında',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      active: false,
    },
    {
      emoji: '🔥',
      title: 'Ateşli Tartışma',
      desc: 'Tarafını seç, görüşünü savun — topluluk hakem.',
      badge: 'Yakında',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      active: false,
    },
    {
      emoji: '📸',
      title: 'Fotoğraf Kapışması',
      desc: 'Senaryoya en iyi karşılık veren fotoğrafı çek.',
      badge: 'Yakında',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      active: false,
    },
    {
      emoji: '🎙️',
      title: 'Sesli Kapışma',
      desc: 'Sesini kaydet, tonun ve tarzınla fark yarat.',
      badge: 'Yakında',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      active: false,
    },
  ]

  return (
    <div className="flex flex-col">

      {/* ── Compact hero ──────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="pointer-events-none absolute top-20 right-0 w-64 h-64 bg-pink-600/8 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 pt-14 pb-10 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-600 dark:text-purple-300 mb-5">
            <Sparkles size={13} />
            <span>AI destekli günlük kapışma platformu</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-fg mb-4 leading-tight">
            Yaz.{' '}
            <span className="text-gradient">Kapış.</span>
            {' '}Kazan. 🔥
          </h1>

          <p className="text-base sm:text-lg text-fg-muted max-w-xl mx-auto mb-6">
            Her gün yeni senaryo. Cevabını yaz, arkadaşını kapışmaya çağır, topluluktan oy topla.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Link href="/kayit">
              <Button size="lg" className="text-base px-8 btn-gradient shadow-lg shadow-purple-500/25">
                <Image src="/logo.png" alt="" width={20} height={20} className="w-5 h-5 object-contain brightness-0 invert" />
                Ücretsiz Başla
              </Button>
            </Link>
            <Link href="/nasil-oynanir">
              <Button size="lg" variant="ghost" className="text-base">
                Nasıl Oynanır?
                <ChevronRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-fg-subtle">
            <span className="flex items-center gap-1.5">
              <span className="text-purple-400 font-bold">{(userCount ?? 0).toLocaleString('tr')}</span> oyuncu
            </span>
            <span className="w-px h-4 bg-stroke" />
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">{(duelCount ?? 0).toLocaleString('tr')}</span> düello tamamlandı
            </span>
            <span className="w-px h-4 bg-stroke" />
            <span className="flex items-center gap-1.5">
              <Flame size={13} className="text-orange-400" />
              Her gün yeni senaryo
            </span>
          </div>
        </div>
      </section>

      {/* ── TODAY'S SCENARIO — live preview ──────────── */}
      <section className="max-w-2xl mx-auto px-4 pb-16 w-full">
        <div className="text-center mb-5">
          <h2 className="text-xl font-black text-fg">Bugünün Kapışması</h2>
          <p className="text-sm text-fg-subtle mt-1">Katıl, cevap yaz, oylanmaya gir</p>
        </div>

        {scenario ? (
          <>
            {/* Scenario card */}
            <Card glow className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="info" className="flex items-center gap-1.5">
                  <Sparkles size={11} />
                  Günün Senaryosu
                </Badge>
                <span className="text-xs text-fg-subtle">
                  {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </span>
              </div>
              <p className="text-lg sm:text-xl font-bold text-fg leading-relaxed">{scenario.content}</p>
              {topAnswers && topAnswers.length > 0 && (
                <p className="text-sm text-fg-subtle mt-3 flex items-center gap-1.5">
                  <Star size={12} className="text-amber-400" />
                  {topAnswers.length}+ kişi cevap verdi
                </p>
              )}
            </Card>

            {/* Answer gate (client component for the interactive bit) */}
            <HomeAnswerGate />

            {/* Community answers preview */}
            {topAnswers && topAnswers.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-bold text-fg mb-3 flex items-center gap-2">
                  <Trophy size={14} className="text-amber-400" />
                  Topluluktan Cevaplar
                </h3>
                <div className="flex flex-col gap-2.5">
                  {(topAnswers as any[]).map((a: any, i: number) => {
                    const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                    const blurred = i >= 2

                    return (
                      <div
                        key={a.id}
                        className="relative rounded-xl border border-stroke bg-surface p-4"
                      >
                        <div className={`flex items-start gap-3 ${blurred ? 'blur-sm select-none pointer-events-none' : ''}`}>
                          <Avatar src={p?.avatar_url} username={p?.username || '?'} size="sm" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-fg">{p?.display_name || p?.username}</span>
                              {a.vote_count > 0 && (
                                <span className="ml-auto flex items-center gap-1 text-xs text-amber-400 font-semibold">
                                  <Star size={10} className="fill-amber-400" />
                                  {a.vote_count}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-fg-muted leading-relaxed line-clamp-2">{a.content}</p>
                          </div>
                        </div>

                        {blurred && (
                          <Link href="/kayit" className="absolute inset-0 flex items-center justify-center rounded-xl bg-surface/70 backdrop-blur-[3px] hover:bg-surface/60 transition-colors">
                            <div className="flex items-center gap-2 bg-surface border border-stroke rounded-xl px-3 py-2 shadow-md">
                              <Lock size={13} className="text-purple-400" />
                              <span className="text-xs font-semibold text-fg">Görmek için katıl</span>
                            </div>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <Card className="text-center py-12">
            <p className="text-3xl mb-3">🌙</p>
            <p className="text-fg font-semibold">Bugünkü senaryo hazırlanıyor</p>
            <p className="text-fg-subtle text-sm mt-1">Birazdan yayınlanacak, bekle!</p>
          </Card>
        )}
      </section>

      {/* ── Kapışma modları ───────────────────────────── */}
      <section className="border-t border-stroke bg-surface/50">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs text-amber-400 font-medium mb-3">
              <Swords size={12} />
              Kapışma Modları
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-fg mb-2">Sadece metin değil — her şeyle kapış</h2>
            <p className="text-fg-muted text-sm">Farklı yetenekler, farklı arenalar. Kendi stilinle kazanmanın yolu.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODES.map((mode) => (
              <div
                key={mode.title}
                className={`relative rounded-2xl border p-5 transition-all ${
                  mode.active
                    ? 'border-purple-500/40 bg-gradient-to-br from-purple-600/10 to-pink-500/5 hover:border-purple-400/60 hover:scale-[1.02] cursor-pointer'
                    : 'border-stroke bg-surface opacity-70'
                }`}
              >
                {mode.active && (
                  <Link href="/kayit" className="absolute inset-0 rounded-2xl" aria-label={mode.title} />
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{mode.emoji}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${mode.badgeColor}`}>
                    {mode.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-fg mb-1">{mode.title}</h3>
                <p className="text-xs text-fg-muted leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Son düellolar ─────────────────────────────── */}
      {recentDuels && recentDuels.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-fg">Son Düellolar</h2>
            <Link href="/liderlik" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors">
              Liderlik <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {(recentDuels as any[]).map((duel: any) => (
              <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                <Card className="hover:border-purple-500/40 transition-all cursor-pointer group h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar src={duel.challenger?.avatar_url} username={duel.challenger?.username || '?'} size="sm" />
                    <span className="text-xs font-bold text-fg-subtle">vs</span>
                    <Avatar src={duel.challenged?.avatar_url} username={duel.challenged?.username || '?'} size="sm" />
                    <span className="text-xs text-fg-subtle ml-1">{duel.challenger?.username} vs {duel.challenged?.username}</span>
                  </div>
                  {duel.ai_verdict && (
                    <p className="text-xs text-amber-400 italic line-clamp-2">&ldquo;{duel.ai_verdict}&rdquo;</p>
                  )}
                  <p className="text-xs text-fg-subtle mt-2 group-hover:text-purple-400 transition-colors">
                    Düelloyu gör →
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="relative border-t border-stroke overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-orange-600/5" />
        <div className="relative max-w-2xl mx-auto px-4 py-20 text-center">
          <Image src="/logo.png" alt="Kapisio" width={64} height={64} className="w-16 h-16 object-contain mx-auto mb-5 animate-float drop-shadow-lg" />
          <h2 className="text-2xl sm:text-3xl font-black text-fg mb-3">Kapışmaya hazır mısın?</h2>
          <p className="text-fg-muted mb-7 text-sm">Ücretsiz hesap oluştur, bugünkü senaryoya cevap ver!</p>
          <Link href="/kayit">
            <Button size="lg" className="text-base px-10 btn-gradient shadow-lg shadow-purple-500/25">
              Şimdi Başla — Ücretsiz
            </Button>
          </Link>
          <p className="text-xs text-fg-subtle mt-4">Kredi kartı gerekmez · 30 saniyede kayıt</p>
        </div>
      </section>
    </div>
  )
}
