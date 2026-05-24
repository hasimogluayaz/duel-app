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
    .select('total_points')
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
        `Günlük senaryo limitine ulaştın (${limit}/gün). Yarın tekrar dene.`,
        429,
        'QUOTA_EXCEEDED',
      )
    }
  }

  if (key === 'duels_per_day') {
    // Count duels created by user TODAY — covers both classic challenges
    // (challenger_id) and new invite duels (creator_id).
    const todayIso = todayStart.toISOString()
    const [{ count: classic }, { count: invite }] = await Promise.all([
      supabase
        .from('duels')
        .select('id', { count: 'exact', head: true })
        .eq('challenger_id', userId)
        .gte('created_at', todayIso),
      supabase
        .from('duels')
        .select('id', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .gte('created_at', todayIso),
    ])
    const total = (classic ?? 0) + (invite ?? 0)

    if (total >= limit) {
      throw new ApiError(
        `Günlük düello limitine ulaştın (${limit}/gün). Yarın tekrar dene.`,
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
        `Kişilik analizi limitine ulaştın (${limit} toplam). Daha çok puan kazanırsan limit artar.`,
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

  const todayIso = todayStart.toISOString()
  const [
    { data: profile },
    { count: scenariosToday },
    { count: classicDuelsToday },
    { count: inviteDuelsToday },
    { count: answersToday },
    { data: analysisProfile },
  ] = await Promise.all([
    supabase.from('profiles').select('total_points').eq('id', userId).single(),
    supabase.from('scenarios').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_user_created', true).gte('created_at', todayIso),
    supabase.from('duels').select('id', { count: 'exact', head: true }).eq('challenger_id', userId).gte('created_at', todayIso),
    supabase.from('duels').select('id', { count: 'exact', head: true }).eq('creator_id', userId).gte('created_at', todayIso),
    supabase.from('answers').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', todayIso),
    supabase.from('profiles').select('personality_analysis_count').eq('id', userId).single(),
  ])
  const duelsToday = (classicDuelsToday ?? 0) + (inviteDuelsToday ?? 0)

  const limits = profile ? getQuotaLimits(profile) : getQuotaLimits({ total_points: 0 })

  return {
    limits,
    usage: {
      scenarios_per_day: scenariosToday ?? 0,
      duels_per_day: duelsToday,
      answers_per_day: answersToday ?? 0,
      ai_analysis_total: (analysisProfile as any)?.personality_analysis_count ?? 0,
    },
  }
}
