export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { HomeAnswerBox } from '@/components/home/HomeAnswerBox'

const START_DATE = new Date('2024-09-01T00:00:00Z')

const CATEGORY_MAP: Record<string, string> = {
  'is-hayati': '💼 İş hayatı',
  'iliskiler': '❤️ İlişkiler',
  'aile': '👨‍👩‍👧 Aile',
  'para': '💰 Para',
  'ahlak': '⚖️ Ahlak',
  'dostluk': '🤝 Dostluk',
  'kariyer': '🎯 Kariyer',
  'saglik': '🏥 Sağlık',
  'sosyal-medya': '📱 Sosyal medya',
  'okul': '📚 Okul',
  'ask': '💕 Aşk',
  'toplum': '🏙️ Toplum',
}
function categoryLabel(cat: string): string {
  return CATEGORY_MAP[cat] ?? `🏷️ ${cat.charAt(0).toUpperCase() + cat.slice(1)}`
}

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

  let scenario: { id: string; content: string; category?: string | null } | null = null
  let responseCount = 0
  let streakCount = 0
  let existingAnswerId: string | null = null

  try {
    const { data } = await supabase
      .from('scenarios')
      .select('id, content, category')
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

      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 flex flex-col gap-5">

        {/* Day eyebrow badge */}
        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold border"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--stroke)',
              color: 'var(--fg-subtle)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                background: 'var(--primary)',
                boxShadow: '0 0 0 3px rgba(42,108,240,0.18)',
              }}
            />
            <span>Gün #{dayNumber}</span>
            <span style={{ color: 'var(--stroke)' }}>·</span>
            <span>{dateLabel}</span>
          </div>
        </div>

        {scenario ? (
          <>
            {/* Scenario card */}
            <div
              className="relative rounded-3xl border overflow-hidden"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--stroke)',
                boxShadow: '0 1px 0 rgba(15,19,32,.02), 0 8px 28px -16px rgba(15,19,32,.08)',
              }}
            >
              {/* Blue gradient top bar */}
              <div
                className="h-[3px] w-full"
                style={{
                  background: 'linear-gradient(90deg, #1442a8, #2a6cf0 60%, #5188fa)',
                }}
              />
              <div className="p-6 sm:p-8">
                <p
                  className="text-[10px] font-bold uppercase mb-3"
                  style={{ letterSpacing: '0.14em', color: 'var(--primary)' }}
                >
                  BUGÜNÜN SENARYOSU
                </p>

                {/* Category tag */}
                {scenario.category && scenario.category !== 'genel' && (
                  <span
                    className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-3"
                    style={{ background: 'var(--k-blue-50, #eff6ff)', color: 'var(--primary)' }}
                  >
                    {categoryLabel(scenario.category)}
                  </span>
                )}

                <p
                  className="text-[22px] sm:text-[26px] font-semibold text-fg"
                  style={{ lineHeight: 1.35, letterSpacing: '-0.012em' }}
                >
                  {scenario.content}
                </p>
                {responseCount >= 100 && (
                  <div
                    className="mt-4 pt-3.5 border-t text-sm"
                    style={{ borderColor: 'var(--stroke)', borderStyle: 'dashed', color: 'var(--fg-subtle)' }}
                  >
                    <span className="font-bold tabular-nums" style={{ color: 'var(--fg)' }}>
                      {responseCount.toLocaleString('tr-TR')}
                    </span>{' '}kişi cevap verdi
                  </div>
                )}
                {responseCount >= 10 && responseCount < 100 && (
                  <p className="mt-3 text-xs font-medium" style={{ color: 'var(--primary)' }}>
                    İlk cevaplayanlardan biri ol!
                  </p>
                )}
              </div>
            </div>

            {/* Hint above answer box */}
            {!existingAnswerId && (
              <p className="text-center text-sm" style={{ color: 'var(--fg-subtle)' }}>
                Sen ne yapardın?
              </p>
            )}

            {/* Interactive answer box */}
            <HomeAnswerBox
              scenarioId={scenario.id}
              userId={user?.id ?? null}
              streakCount={streakCount}
              existingAnswerId={existingAnswerId}
            />
          </>
        ) : (
          <div
            className="rounded-3xl border text-center py-16"
            style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
          >
            <p className="text-fg font-semibold">Bugünkü senaryo hazırlanıyor</p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-subtle)' }}>Birazdan yayınlanacak.</p>
          </div>
        )}

      </div>
    </>
  )
}
