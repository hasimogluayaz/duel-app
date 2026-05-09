import { getQuotaLimits, type QuotaKey } from './limits'
import { ApiError } from '@/lib/api/errors'

/**
 * Fetches user quota profile and checks if a given action is within limits.
 * Throws ApiError(429) if quota exceeded.
 *
 * Usage in route handlers:
 *   await checkQuota(supabase, userId, 'duels_per_day')
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkQuota(
  supabase: any,
  userId: string,
  key: QuotaKey,
): Promise<void> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('total_points, is_premium, premium_until')
    .eq('id', userId)
    .single()

  if (!profile) throw new ApiError('Profil bulunamadı.', 404, 'NOT_FOUND')

  const limits = getQuotaLimits(profile)
  const limit = limits[key]

  if (limit === -1 || limit >= 999) return // unlimited

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Count today's usage for per-day quotas
  if (key === 'scenarios_per_day') {
    const { count } = await supabase
      .from('scenarios')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_user_created', true)
      .gte('created_at', todayStart.toISOString())

    if ((count ?? 0) >= limit) {
      throw new ApiError(
        `Günlük senaryo limitine ulaştın (${limit}/gün). Premium'a geç veya yarın tekrar dene.`,
        429,
        'QUOTA_EXCEEDED',
      )
    }
  }

  if (key === 'duels_per_day') {
    const { count } = await supabase
      .from('duels')
      .select('id', { count: 'exact', head: true })
      .eq('challenger_id', userId)
      .gte('created_at', todayStart.toISOString())

    if ((count ?? 0) >= limit) {
      throw new ApiError(
        `Günlük düello limitine ulaştın (${limit}/gün). Premium'a geç veya yarın tekrar dene.`,
        429,
        'QUOTA_EXCEEDED',
      )
    }
  }

  if (key === 'answers_per_day') {
    const { count } = await supabase
      .from('answers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', todayStart.toISOString())

    if ((count ?? 0) >= limit) {
      throw new ApiError(
        `Günlük cevap limitine ulaştın (${limit}/gün).`,
        429,
        'QUOTA_EXCEEDED',
      )
    }
  }

  if (key === 'ai_analysis_total') {
    // Track via profile column personality_analysis_count
    const { data: p } = await supabase
      .from('profiles')
      .select('personality_analysis_count')
      .eq('id', userId)
      .single()

    const used = (p as any)?.personality_analysis_count ?? 0
    if (used >= limit) {
      throw new ApiError(
        `Kişilik analizi limitine ulaştın (${limit} toplam). Premium üyelikle sınırsız analiz yapabilirsin.`,
        429,
        'QUOTA_EXCEEDED',
      )
    }
  }
}

/**
 * Returns current usage counts for a user (for display in UI).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getUserQuotaUsage(supabase: any, userId: string) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { data: profile },
    { count: scenariosToday },
    { count: duelsToday },
    { count: answersToday },
    { count: analysisTotal },
  ] = await Promise.all([
    supabase.from('profiles').select('total_points, is_premium, premium_until').eq('id', userId).single(),
    supabase.from('scenarios').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_user_created', true).gte('created_at', todayStart.toISOString()),
    supabase.from('duels').select('id', { count: 'exact', head: true }).eq('challenger_id', userId).gte('created_at', todayStart.toISOString()),
    supabase.from('answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayStart.toISOString()),
    supabase.from('profiles').select('personality_analysis_count').eq('id', userId).single(),
  ])

  const limits = profile ? getQuotaLimits(profile) : getQuotaLimits({ total_points: 0, is_premium: false, premium_until: null })

  return {
    limits,
    usage: {
      scenarios_per_day: scenariosToday ?? 0,
      duels_per_day: duelsToday ?? 0,
      answers_per_day: answersToday ?? 0,
      ai_analysis_total: (analysisTotal as any)?.personality_analysis_count ?? 0,
    },
    is_premium: profile?.is_premium ?? false,
  }
}
