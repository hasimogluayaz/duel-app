/**
 * Single source of truth for premium status.
 *
 * A user is "premium active" when:
 *   - is_premium = true, AND
 *   - premium_until IS NULL OR premium_until > now()
 *
 * The webhook may temporarily leave is_premium = true after expiry until the
 * subscription.deleted event fires; the premium_until guard prevents lapsed
 * subscriptions from getting premium perks.
 */

export interface PremiumProfile {
  is_premium?: boolean | null
  premium_until?: string | null
}

export function isPremiumActive(profile: PremiumProfile | null | undefined): boolean {
  if (!profile?.is_premium) return false
  if (!profile.premium_until) return true
  return new Date(profile.premium_until).getTime() > Date.now()
}

/**
 * Server-side helper: fetch + check in one call.
 * Pass a Supabase client (service or user-scoped).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function userIsPremium(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('is_premium, premium_until')
    .eq('id', userId)
    .single()
  return isPremiumActive(data as PremiumProfile | null)
}
