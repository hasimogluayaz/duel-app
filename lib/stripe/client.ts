import Stripe from 'stripe'

/**
 * Lazy Stripe client — never throws at module load.
 * Premium routes call `getStripe()` and surface friendly errors when env is missing.
 */

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (_stripe) return _stripe
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set. Premium features are disabled.')
  }
  _stripe = new Stripe(key, { apiVersion: '2025-02-24.acacia' })
  return _stripe
}

export function getPremiumPriceId(): string {
  const id = process.env.STRIPE_PREMIUM_PRICE_ID
  if (!id) throw new Error('STRIPE_PREMIUM_PRICE_ID is not set.')
  return id
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PREMIUM_PRICE_ID
}

// Back-compat proxy for routes that import `stripe` directly
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop]
  },
})
