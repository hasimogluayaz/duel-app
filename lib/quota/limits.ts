/**
 * Platform usage quotas — controls cost-generating actions.
 *
 * Costs we protect against:
 *  - User-created scenarios   → DB storage, feeds into AI answers
 *  - Duel creation            → triggers AI verdict (OpenAI call, ~$0.01/duel)
 *  - AI personality analysis  → heavy prompt (~$0.05/call)
 *
 * Tiers (by total_points):
 *   Aday     0–99   pts  → Free
 *   Çaylak   100–499     → Free
 *   Düellocu 500–1999    → Engaged
 *   Usta     2000–4999   → Engaged
 *   Şampiyon 5000–9999   → Power
 *   Efsane   10000+      → Power
 *   Premium  (is_premium flag, any points)
 */

export type QuotaKey =
  | 'scenarios_per_day'   // user-created scenarios
  | 'duels_per_day'        // duel creation (triggers AI verdict)
  | 'ai_analysis_total'    // lifetime personality analysis calls
  | 'answers_per_day'      // answers submitted (light DB write)

export interface QuotaLimits {
  scenarios_per_day: number
  duels_per_day: number
  ai_analysis_total: number   // -1 = unlimited
  answers_per_day: number
}

// Premium overrides everything
const PREMIUM_LIMITS: QuotaLimits = {
  scenarios_per_day: 30,
  duels_per_day: 999,       // effectively unlimited
  ai_analysis_total: -1,
  answers_per_day: 999,
}

// Tier brackets (non-premium)
const TIER_LIMITS: Array<{ minPoints: number; limits: QuotaLimits }> = [
  {
    // Aday + Çaylak (0–499 pts) — free, restricted
    minPoints: 0,
    limits: {
      scenarios_per_day: 2,
      duels_per_day: 3,
      ai_analysis_total: 1,
      answers_per_day: 10,
    },
  },
  {
    // Düellocu + Usta (500–4999) — engaged
    minPoints: 500,
    limits: {
      scenarios_per_day: 5,
      duels_per_day: 10,
      ai_analysis_total: 3,
      answers_per_day: 30,
    },
  },
  {
    // Şampiyon + Efsane (5000+) — power users
    minPoints: 5000,
    limits: {
      scenarios_per_day: 15,
      duels_per_day: 999,
      ai_analysis_total: -1,
      answers_per_day: 999,
    },
  },
]

export interface UserQuotaProfile {
  total_points: number
  is_premium: boolean
  premium_until: string | null
}

export function getQuotaLimits(user: UserQuotaProfile): QuotaLimits {
  const isPremiumActive =
    user.is_premium &&
    (!user.premium_until || new Date(user.premium_until) > new Date())

  if (isPremiumActive) return PREMIUM_LIMITS

  for (let i = TIER_LIMITS.length - 1; i >= 0; i--) {
    if (user.total_points >= TIER_LIMITS[i].minPoints) {
      return TIER_LIMITS[i].limits
    }
  }
  return TIER_LIMITS[0].limits
}

export function formatLimit(val: number): string {
  return val === -1 || val >= 999 ? 'Sınırsız' : String(val)
}

// Human-readable label for each quota key
export const QUOTA_LABELS: Record<QuotaKey, string> = {
  scenarios_per_day: 'Günlük senaryo',
  duels_per_day: 'Günlük düello',
  ai_analysis_total: 'Kişilik analizi',
  answers_per_day: 'Günlük cevap',
}
