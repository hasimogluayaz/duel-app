import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import KararVerCard from '@/components/karar-ver/KararVerCard'
import { Swords, TrendingUp, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Karar Ver | Duel',
  description: 'İki cevabı karşılaştır, hangisi daha iyiyse seç. Toplu yargılama modu.',
  openGraph: {
    title: 'Karar Ver — Duel',
    description: 'İki cevabı karşılaştır, hangisi daha iyiyse seç.',
  },
}

export default async function KararVerPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Stats: total verdicts ever
  const { count: totalVerdicts } = await supabase
    .from('answer_verdicts')
    .select('*', { count: 'exact', head: true })

  // Stats: unique judges today
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: todayJudges } = await supabase
    .from('answer_verdicts')
    .select('voter_id', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4">
            <Swords size={14} className="text-violet-400" />
            <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Karar Ver Modu</span>
          </div>
          <h1 className="text-2xl font-bold text-fg mb-2">Hangisi Daha İyi?</h1>
          <p className="text-fg-subtle text-sm max-w-sm mx-auto">
            Aynı soruya verilen iki cevabı karşılaştır. Seçimin topluluk sıralamasını şekillendirir.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-surface border border-stroke p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp size={12} className="text-violet-400" />
              <span className="text-xs text-fg-subtle">Toplam Karar</span>
            </div>
            <p className="text-xl font-bold text-fg">{(totalVerdicts ?? 0).toLocaleString('tr-TR')}</p>
          </div>
          <div className="rounded-xl bg-surface border border-stroke p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users size={12} className="text-green-400" />
              <span className="text-xs text-fg-subtle">Bugün Yargılayan</span>
            </div>
            <p className="text-xl font-bold text-fg">{(todayJudges ?? 0).toLocaleString('tr-TR')}</p>
          </div>
        </div>

        {/* Main card */}
        <Suspense fallback={
          <div className="rounded-2xl bg-surface border border-stroke p-6 animate-pulse">
            <div className="h-4 bg-surface-2 rounded w-48 mb-4" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-40 bg-surface-2 rounded-xl" />
              <div className="h-40 bg-surface-2 rounded-xl" />
            </div>
          </div>
        }>
          <KararVerCard userId={user?.id ?? null} />
        </Suspense>

        {/* How it works */}
        <div className="mt-8 rounded-2xl bg-surface border border-stroke p-5">
          <h2 className="text-xs font-semibold text-fg-subtle uppercase tracking-wider mb-3">Nasıl Çalışır?</h2>
          <ul className="space-y-2 text-sm text-fg-muted">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">①</span>
              Aynı senaryoya verilen iki cevap gösterilir.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">②</span>
              Hangisi daha iyi, daha yaratıcı veya daha samimiyse onu seç.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">③</span>
              Seçimlerin cevapların topluluk sıralamasını belirler.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5 shrink-0">④</span>
              En çok kazanan cevap haftalık şampiyon olabilir.
            </li>
          </ul>
        </div>

      </div>
    </div>
  )
}
