export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { HomeAnswerBox } from '@/components/home/HomeAnswerBox'
import { Flame } from 'lucide-react'

const START_DATE = new Date('2024-09-01T00:00:00Z')

function getDayNumber(): number {
  const diffMs = Date.now() - START_DATE.getTime()
  return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1)
}

export default async function HomePage() {
  const supabase = createClient()

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {}

  const today = new Date().toISOString().split('T')[0]
  const dayNumber = getDayNumber()
  const dateLabel = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })

  let scenario: { id: string; content: string } | null = null
  let responseCount = 0
  let streakCount = 0
  let existingAnswerId: string | null = null

  try {
    const { data } = await supabase
      .from('scenarios')
      .select('id, content')
      .eq('active_date', today)
      .eq('is_approved', true)
      .single()
    scenario = data
  } catch {}

  if (scenario) {
    try {
      const { count } = await supabase
        .from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('scenario_id', scenario.id)
      responseCount = count ?? 0
    } catch {}

    if (user) {
      try {
        const { data } = await supabase
          .from('answers')
          .select('id')
          .eq('user_id', user.id)
          .eq('scenario_id', scenario.id)
          .eq('mode', 'scenario')
          .maybeSingle()
        existingAnswerId = data?.id ?? null
      } catch {}
    }
  }

  if (user) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('streak_count')
        .eq('id', user.id)
        .single()
      streakCount = data?.streak_count ?? 0
    } catch {}
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Kapisio',
            url: 'https://kapisio.com',
            description: "Türkiye'nin günlük tartışma platformu.",
          }),
        }}
      />

      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        {/* Day badge */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2 bg-surface border border-stroke rounded-full px-4 py-1.5 text-sm text-fg-muted">
            <Flame size={13} className="text-orange-400" />
            <span>Gün #{dayNumber} · {dateLabel}</span>
          </div>
        </div>

        {scenario ? (
          <>
            {/* Scenario card */}
            <div className="rounded-2xl border border-stroke bg-white dark:bg-surface shadow-sm mb-5 overflow-hidden">
              {/* Blue top accent bar */}
              <div className="h-1 bg-primary w-full" />
              <div className="p-5 sm:p-6">
                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                  Bugünün Senaryosu
                </p>
                <p className="text-lg sm:text-xl font-bold text-fg leading-relaxed">
                  {scenario.content}
                </p>
                {responseCount > 0 && (
                  <p className="text-sm text-fg-subtle mt-3">
                    {responseCount.toLocaleString('tr-TR')} kişi cevap verdi
                  </p>
                )}
              </div>
            </div>

            {/* Interactive answer box */}
            <HomeAnswerBox
              scenarioId={scenario.id}
              userId={user?.id ?? null}
              streakCount={streakCount}
              existingAnswerId={existingAnswerId}
            />
          </>
        ) : (
          <div className="border border-stroke rounded-2xl bg-surface text-center py-16">
            <p className="text-fg font-semibold">Bugünkü senaryo hazırlanıyor</p>
            <p className="text-fg-subtle text-sm mt-1">Birazdan yayınlanacak.</p>
          </div>
        )}
      </div>
    </>
  )
}
