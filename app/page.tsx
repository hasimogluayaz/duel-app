export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/server'
import { Users, Trophy, ChevronRight, Star } from 'lucide-react'

export default async function LandingPage() {
  const supabase = createClient()

  const { data: recentDuels } = await supabase
    .from('duels')
    .select(`
      id, share_token, ai_verdict, created_at,
      challenger:profiles!duels_challenger_id_fkey(username),
      challenged:profiles!duels_challenged_id_fkey(username),
      scenario:scenarios(content)
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-40 left-10 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-10 w-56 h-56 bg-orange-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm text-purple-600 dark:text-purple-300 mb-6">
            <Image src="/logo.png" alt="Kapisio" width={16} height={16} className="w-4 h-4 object-contain" />
            <span>AI destekli günlük kapışma platformu</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-fg mb-6 leading-tight">
            Yaz.{' '}
            <span className="text-gradient">Kapış.</span>
            {' '}Kazan. 🔥
          </h1>

          <p className="text-lg md:text-xl text-fg-muted max-w-2xl mx-auto mb-10">
            Her gün yeni bir senaryo. Cevabını yaz, arkadaşını kapışmaya çağır,
            topluluktan oy topla. AI kazananı ilan eder — kaybedeni roast&apos;lar. 😂
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/kayit">
              <Button size="lg" className="text-base px-8 btn-gradient border-0 shadow-lg shadow-purple-500/25">
                <Image src="/logo.png" alt="" width={20} height={20} className="w-5 h-5 object-contain brightness-0 invert" />
                Hemen Kapış!
              </Button>
            </Link>
            <Link href="/nasil-oynanir">
              <Button size="lg" variant="outline" className="text-base px-8">
                Nasıl Oynanır?
                <ChevronRight size={18} />
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-sm text-fg-subtle">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-purple-400" />
              <span>Binlerce aktif oyuncu</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-yellow-400" />
              <span>Her gün yeni senaryo</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy size={16} className="text-orange-400" />
              <span>Liderlik tablosu</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-fg mb-4">Nasıl Çalışır?</h2>
          <p className="text-fg-subtle flex items-center justify-center gap-1.5">
            3 adımda kapışma başlıyor
            <Image src="/logo.png" alt="" width={16} height={16} className="w-4 h-4 object-contain" />
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              emoji: '✍️',
              title: 'Senaryoya Cevap Ver',
              desc: 'Her gün AI tarafından üretilen eğlenceli bir senaryoya maksimum 280 karakterle cevabını yaz.',
              color: 'from-purple-500/10 to-pink-500/5 border-purple-500/20',
            },
            {
              step: '02',
              emoji: '⚡',
              title: 'Kapışmaya Çağır',
              desc: 'Cevabını yazdıktan sonra bir arkadaşını kapışmaya davet et. Aynı senaryoya o da cevap verir.',
              color: 'from-pink-500/10 to-orange-500/5 border-pink-500/20',
            },
            {
              step: '03',
              emoji: '🏆',
              title: 'AI Kazananı İlan Eder',
              desc: 'Topluluk 24 saat oy kullanır. Sonunda AI kazananı ilan eder, kaybedeni komik şekilde roast\'lar.',
              color: 'from-orange-500/10 to-yellow-500/5 border-orange-500/20',
            },
          ].map((item) => (
            <div key={item.step} className={`group p-6 rounded-2xl bg-gradient-to-br border transition-all hover:scale-[1.02] ${item.color}`}>
              <div className="text-xs font-mono text-fg-subtle mb-4 group-hover:text-purple-400 transition-colors">{item.step}</div>
              <div className="text-5xl mb-4 animate-float">{item.emoji}</div>
              <h3 className="text-xl font-bold text-fg mb-3">{item.title}</h3>
              <p className="text-fg-muted leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Duels */}
      {recentDuels && recentDuels.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-fg">Son Düellolar</h2>
            <Link href="/liderlik" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
              Tümünü gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {recentDuels.map((duel: any) => (
              <Link key={duel.id} href={`/duel/${duel.share_token}`}>
                <Card className="hover:border-purple-500/40 transition-all duration-200 cursor-pointer h-full">
                  <p className="text-xs text-fg-subtle mb-3 line-clamp-2">{duel.scenario?.content}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-fg-muted">{duel.challenger?.username}</span>
                    <span className="text-xs text-fg-subtle">vs</span>
                    <span className="text-xs font-medium text-fg-muted">{duel.challenged?.username}</span>
                  </div>
                  {duel.ai_verdict && (
                    <p className="text-xs text-amber-400 italic line-clamp-2">&ldquo;{duel.ai_verdict}&rdquo;</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="relative border-t border-stroke overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/5 to-orange-600/5 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Kapisio" width={72} height={72} className="w-18 h-18 object-contain animate-float drop-shadow-lg" />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-fg mb-4">
            Kapışmaya hazır mısın?
          </h2>
          <p className="text-fg-muted mb-8">Ücretsiz hesap oluştur, ilk kapışmanı kazan! 🏆</p>
          <Link href="/kayit">
            <Button size="lg" className="text-base px-10 btn-gradient border-0 shadow-lg shadow-purple-500/25">
              Şimdi Başla — Ücretsiz
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
