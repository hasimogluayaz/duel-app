import { ApiError } from './errors'

interface RateLimitConfig {
  table: string
  column: string       // e.g. 'challenger_id', 'voter_id', 'user_id'
  userId: string
  limit: number
  windowHours?: number // default 24
  errorMessage?: string
}

/**
 * Checks rate limit using DB query.
 * Throws ApiError(429) if limit exceeded.
 *
 * Usage:
 *   await checkRateLimit(supabase, {
 *     table: 'duels',
 *     column: 'challenger_id',
 *     userId: user.id,
 *     limit: 5,
 *     errorMessage: 'Günlük 5 düello limitine ulaştınız.',
 *   })
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkRateLimit(supabase: any, config: RateLimitConfig): Promise<void> {
  const {
    table, column, userId, limit,
    windowHours = 24,
    errorMessage = `İstek limitine ulaştınız (${limit}/${windowHours}s).`,
  } = config

  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()

  const { count } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, userId)
    .gte('created_at', since)

  if ((count ?? 0) >= limit) {
    throw new ApiError(errorMessage, 429, 'RATE_LIMIT')
  }
}

/**
 * Daily rate limit (resets at midnight UTC).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkDailyLimit(supabase: any, config: Omit<RateLimitConfig, 'windowHours'>): Promise<void> {
  const todayUtc = new Date()
  todayUtc.setUTCHours(0, 0, 0, 0)

  const { count } = await supabase
    .from(config.table)
    .select('*', { count: 'exact', head: true })
    .eq(config.column, config.userId)
    .gte('created_at', todayUtc.toISOString())

  if ((count ?? 0) >= config.limit) {
    throw new ApiError(
      config.errorMessage ?? `Günlük limit aşıldı (${config.limit}/gün).`,
      429,
      'RATE_LIMIT',
    )
  }
}
