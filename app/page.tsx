export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/server'
import { ChevronRight, Swords, Star, Lock, Sparkles, Trophy, Flame, ArrowRight } from 'lucide-react'
import { HomeAnswerGate } from '@/components/home/HomeAnswerGate'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { redirect } = await import('next/navigation')
    redirect('/oyun')
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('active_date', today)
    .single()

  const { data: topAnswers } = scenario ? await supabase
    .from('answers')
    .select('id, content, vote_count, profiles:profiles(username, display_name, avatar_url)')
    .eq('scenario_id', scenario.id)
    .order('vote_count', { ascending: false })
    .limit(4) : { data: [] }

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

  const [{ count: userCount }, { count: duelCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('duels').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ])

  const MODES = [
    {
      no: '01',
      title: 'Senaryo Kapışması',
      desc: 'Günlük senaryoya bakış açını yaz, topluluğun oylarını topla.',
      badge: 'Aktif',
      active: true,
    },
    {
      no: '02',
      title: 'Emoji Kapışması',
      desc: 'Duyguları sadece emoji ile ifade et — kelime yasak.',
      badge: 'Yakında',
      active: false,
    },
    {
      no: '03',
      title: 'Karakter Kapışması',
      desc: 'Bir karaktere bürün ve o karakterin ağzıyla cevap ver.',
      badge: 'Yakında',
      active: false,
    },
    {
      no: '04',
      title: 'Ateşli Tartışma',
      desc: 'Tarafını seç, görüşünü savun — topluluk hakem.',
      badge: 'Yakında',
      active: false,
    },
    {
      no: '05',
      title: 'Fotoğraf Kapışması',
      desc: 'Senaryoya en iyi karşılık veren fotoğrafı çek.',
      badge: 'Yakında',
      active: false,
    },
    {
      no: '06',
      title: 'Sesli Kapışma',
      desc: 'Sesini kaydet, tonun ve tarzınla fark yarat.',
      badge: 'Yakında',
      active: false,
    },
  ]

  const TESTIMONIALS = [
    {
      quote: 'Senaryo bazen o kadar gerçekçi oluyor ki tartışma hiç bitmiyor. Her gün girip bakıyorum.',
      name: 'Ayşegül K.',
      sub: 'İstanbul · 127 puan',
    },
    {
      quote: 'AI\'ın düello değerlendirmesi her seferinde herkesi güldürüyor. Arkadaşımla kapışmadan edemiyoruz.',
      name: 'Mert C.',
      sub: 'Ankara · 3 düello kazandı',
    },
    {
      quote: 'Grubumuzda turnuva bile yaptık. Kapisio o kadar doğal bir format ki anlatmaya gerek kalmıyor.',
      name: 'Zeynep T.',
      sub: 'İzmir · 5 günlük seri',
    },
  ]

  return (
    <>
      {/* ── JSON-LD ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Kapisio',
            url: 'https://kapisio.com',
            description: "Türkiye'nin günlük tartışma ve düello platformu.",
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://kapisio.com/kesfet?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <div className="flex flex-col">

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-purple-600/8 rounded-full blur-[120px]" />

          <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
            <div className="inline-flex items-center gap-2 bg-surface border border-stroke rounded-full px-4 py-1.5 text-sm text-fg-muted mb-6">
              <Sparkles size={12} className="text-purple-400" />
              <span>Yapay zeka destekli günlük tartışma platformu</span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-fg mb-5 leading-tight tracking-tight">
              Yaz.{' '}
              <span className="text-gradient">Kapış.</span>
              {' '}Kazan.
            </h1>

            <p className="text-base sm:text-lg text-fg-muted max-w-lg mx-auto mb-8 leading-relaxed">
              Türkiye'nin en tartışmalı günlük senaryoları burada. Cevabını yaz, arkadaşını kapışmaya çağır, topluluk karar versin.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
              <Link href="/kayit">
                <Button size="lg" className="text-base px-8 btn-gradient shadow-lg shadow-purple-500/20">
                  Ücretsiz Başla
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/nasil-oynanir">
                <Button size="lg" variant="ghost" className="text-base text-fg-muted">
                  Nasıl Oynanır?
                </Button>
              </Link>
            </div>

            {/* Social proof stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-fg-subtle">
              <span>
                <span className="text-fg font-bold">{(userCount ?? 0).toLocaleString('tr')}</span>
                <span className="ml-1.5">oyuncu</span>
              </span>
              <span className="w-px h-3 bg-stroke" />
              <span>
                <span className="text-fg font-bold">{(duelCount ?? 0).toLocaleString('tr')}</span>
                <span className="ml-1.5">düello tamamlandı</span>
              </span>
              <span className="w-px h-3 bg-stroke" />
              <span className="flex items-center gap-1.5">
                <Flame size={12} className="text-orange-400" />
                Her gün yeni senaryo
              </span>
            </div>
          </div>
        </section>

        {/* ── Today's Scenario ── */}
        <section className="max-w-2xl mx-auto px-4 pb-16 w-full">
          <div className="text-center mb-5">
            <h2 className="text-xl font-black text-fg">Bugünün Senaryosu</h2>
            <p className="text-sm text-fg-subtle mt-1">Sen ne yapardın?</p>
          </div>

          {scenario ? (
            <>
              <div className="border border-stroke rounded-2xl bg-surface p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-fg-subtle uppercase tracking-wider">Günün Senaryosu</span>
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
              </div>

              <HomeAnswerGate />

              {topAnswers && topAnswers.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Topluluktan Cevaplar</p>
                  <div className="flex flex-col gap-2">
                    {(topAnswers as any[]).map((a: any, i: number) => {
                      const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles
                      const blurred = i >= 2

                      return (
                        <div key={a.id} className="relative rounded-xl border border-stroke bg-surface p-4">
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
            <div className="border border-stroke rounded-2xl bg-surface text-center py-12">
              <p className="text-fg font-semibold">Bugünkü senaryo hazırlanıyor</p>
              <p className="text-fg-subtle text-sm mt-1">Birazdan yayınlanacak.</p>
            </div>
          )}
        </section>

        {/* ── Testimonials ── */}
        <section className="border-t border-stroke bg-surface/40">
          <div className="max-w-5xl mx-auto px-4 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Kullanıcılar Ne Diyor</p>
              <h2 className="text-2xl sm:text-3xl font-black text-fg">Kapışmayı bırakamayanlar</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="border border-stroke rounded-2xl p-5 bg-surface">
                  <p className="text-sm text-fg-muted leading-relaxed mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-fg">{t.name}</p>
                    <p className="text-xs text-fg-subtle">{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Kapışma Modları ── */}
        <section className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Kapışma Modları</p>
            <h2 className="text-2xl sm:text-3xl font-black text-fg mb-2">Sadece metin değil — her şeyle kapış</h2>
            <p className="text-fg-muted text-sm">Farklı yetenekler, farklı arenalar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODES.map((mode) => (
              <div
                key={mode.title}
                className={`relative rounded-2xl border p-5 transition-all ${
                  mode.active
                    ? 'border-stroke bg-surface hover:bg-surface-2 hover:border-purple-500/30 cursor-pointer'
                    : 'border-stroke bg-surface opacity-50'
                }`}
              >
                {mode.active && (
                  <Link href="/kayit" className="absolute inset-0 rounded-2xl" aria-label={mode.title} />
                )}
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-black text-fg-subtle font-mono">{mode.no}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                    mode.active
                      ? 'border-green-500/30 bg-green-500/10 text-green-400'
                      : 'border-stroke text-fg-subtle'
                  }`}>
                    {mode.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-fg mb-1">{mode.title}</h3>
                <p className="text-xs text-fg-muted leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Son Düellolar ── */}
        {recentDuels && recentDuels.length > 0 && (
          <section className="border-t border-stroke bg-surface/40">
            <div className="max-w-5xl mx-auto px-4 py-16">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-1">Canlı Arena</p>
                  <h2 className="text-xl font-black text-fg">Son Düellolar</h2>
                </div>
                <Link href="/liderlik" className="text-sm text-fg-muted hover:text-fg flex items-center gap-1 transition-colors">
                  Liderlik <ChevronRight size={14} />
                </Link>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {(recentDuels as any[]).map((duel: any) => (
                  <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                    <div className="border border-stroke rounded-2xl bg-surface hover:bg-surface-2 transition-all cursor-pointer group p-4 h-full flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar src={duel.challenger?.avatar_url} username={duel.challenger?.username || '?'} size="sm" />
                        <span className="text-xs font-bold text-fg-subtle">vs</span>
                        <Avatar src={duel.challenged?.avatar_url} username={duel.challenged?.username || '?'} size="sm" />
                        <span className="text-xs text-fg-subtle ml-1 truncate">{duel.challenger?.username} vs {duel.challenged?.username}</span>
                      </div>
                      {duel.ai_verdict && (
                        <p className="text-xs text-fg-muted italic line-clamp-2 flex-1">&ldquo;{duel.ai_verdict}&rdquo;</p>
                      )}
                      <p className="text-xs text-fg-subtle mt-3 group-hover:text-fg transition-colors">
                        Düelloyu gör →
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <section className="border-t border-stroke">
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <p className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-4">Ücretsiz · Kayıt gerekmez başlamak için</p>
            <h2 className="text-2xl sm:text-3xl font-black text-fg mb-3 leading-tight">
              Bugünün senaryosunu<br />henüz cevaplamadın.
            </h2>
            <p className="text-fg-muted mb-8 text-sm">Hesap oluştur, cevabını yaz, arkadaşını meydan okumaya çağır.</p>
            <Link href="/kayit">
              <Button size="lg" className="text-base px-10 btn-gradient shadow-lg shadow-purple-500/20">
                Şimdi Başla
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
