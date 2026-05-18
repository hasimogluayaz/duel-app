export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { HomeAnswerBox } from '@/components/home/HomeAnswerBox'
import { AdminGenerateButton } from '@/components/home/AdminGenerateButton'

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

  let isAdmin = false
  let scenario: { id: string; content: string; category?: string | null; active_date?: string } | null = null
  let responseCount = 0
  let streakCount = 0
  let existingAnswerId: string | null = null

  try {
    const { data } = await supabase
      .from('scenarios')
      .select('id, content, category, active_date')
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
        .select('streak_count, is_admin')
        .eq('id', user.id)
        .single()
      streakCount = data?.streak_count ?? 0
      isAdmin = data?.is_admin === true
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
                animation: 'pulse 2s infinite',
              }}
            />
            <span>Gün #{dayNumber}</span>
            <span style={{ color: 'var(--stroke)' }}>·</span>
            <span>
              {scenario?.active_date
                ? new Date(scenario.active_date + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                : new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
            </span>
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
                boxShadow: '0 2px 0 rgba(15,19,32,.04), 0 12px 32px -12px rgba(15,19,32,.12)',
              }}
            >
              {/* Blue gradient top bar — thicker + brighter */}
              <div
                className="h-1 w-full"
                style={{ background: 'linear-gradient(90deg, #1442a8, #2a6cf0 55%, #60a5fa)' }}
              />
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold uppercase" style={{ letterSpacing: '0.14em', color: 'var(--primary)' }}>
                    BUGÜNÜN SENARYOSU
                  </p>
                  {/* Category tag inline */}
                  {scenario.category && scenario.category !== 'genel' && (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: 'var(--k-blue-50, #eff6ff)', color: 'var(--primary)' }}
                    >
                      {categoryLabel(scenario.category)}
                    </span>
                  )}
                </div>

                <p
                  className="text-[21px] sm:text-[25px] font-semibold text-fg"
                  style={{ lineHeight: 1.38, letterSpacing: '-0.012em' }}
                >
                  {scenario.content}
                </p>

                {/* Response count */}
                {responseCount >= 100 && (
                  <div className="mt-4 pt-3.5 border-t text-sm flex items-center gap-1.5"
                    style={{ borderColor: 'var(--stroke)', borderStyle: 'dashed', color: 'var(--fg-subtle)' }}>
                    <span className="font-bold tabular-nums" style={{ color: 'var(--fg)' }}>
                      {responseCount.toLocaleString('tr-TR')}
                    </span> kişi cevap verdi
                  </div>
                )}
                {responseCount >= 10 && responseCount < 100 && (
                  <p className="mt-3 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                    ✦ İlk cevaplayanlardan biri ol!
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
            className="rounded-3xl border text-center py-16 flex flex-col items-center gap-4"
            style={{ background: 'var(--surface)', borderColor: 'var(--stroke)' }}
          >
            <div>
              <p className="text-fg font-semibold">Bugünkü senaryo hazırlanıyor</p>
              <p className="text-sm mt-1" style={{ color: 'var(--fg-subtle)' }}>Birazdan yayınlanacak.</p>
            </div>
            {isAdmin && <AdminGenerateButton />}
          </div>
        )}

      </div>
    </>
  )
}
