import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Falls back gracefully if env vars missing (dev / non-configured environments)
function makeRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

const redis = makeRedis()

function makeLimit(requests: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!redis) return null
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(requests, window) })
}

// Different limits per endpoint type
export const limits = {
  answer:   makeLimit(5,  '1 h'),  // 5 answers/hour (1/day enforced by DB, but extra safety)
  duel:     makeLimit(10, '1 h'),  // 10 duel creates/hour
  comment:  makeLimit(20, '1 h'),  // 20 comments/hour
  report:   makeLimit(10, '1 h'),  // 10 reports/hour
  vote:     makeLimit(50, '1 h'),  // 50 votes/hour
  message:  makeLimit(30, '1 m'),  // 30 messages/minute
  api:      makeLimit(100,'1 m'),  // generic 100 req/min
}

export type LimitKey = keyof typeof limits

export async function checkRateLimit(
  key: LimitKey,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const limiter = limits[key]
  if (!limiter) return { success: true, remaining: 999, reset: 0 }

  const result = await limiter.limit(identifier)
  return {
    success: result.success,
    remaining: result.remaining,
    reset: result.reset,
  }
}
