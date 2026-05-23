import { NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe/client'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

async function updatePremiumStatus(
  customerId: string,
  isActive: boolean,
  periodEnd?: number
) {
  // Webhook bypasses RLS (service role) — needs to write across users
  const admin = createServiceClient()

  const { data: profile } = await admin
    .from('profiles').select('id').eq('stripe_customer_id', customerId).single()

  if (!profile) {
    console.warn('[stripe/webhook] No profile for stripe_customer_id:', customerId)
    return
  }

  await admin.from('profiles').update({
    is_premium: isActive,
    premium_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  } as any).eq('id', (profile as any).id)

  // Upsert subscription row
  await admin.from('subscriptions').upsert({
    user_id: (profile as any).id,
    stripe_customer_id: customerId,
    status: isActive ? 'active' : 'canceled',
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe yapılandırılmamış.' }, { status: 503 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET eksik.' }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'İmza yok.' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (e: any) {
    console.error('[stripe/webhook] signature verification failed:', e?.message)
    return NextResponse.json({ error: 'Webhook imzası geçersiz.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await updatePremiumStatus(
          sub.customer as string,
          sub.status === 'active' || sub.status === 'trialing',
          sub.current_period_end
        )
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await updatePremiumStatus(sub.customer as string, false)
        break
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice
        const admin = createServiceClient()
        await admin.from('subscriptions').update({
          status: 'past_due', updated_at: new Date().toISOString()
        }).eq('stripe_customer_id', inv.customer as string)
        break
      }
    }
  } catch (e: any) {
    console.error('[stripe/webhook] handler error:', e)
    // Return 200 anyway — don't have Stripe retry on our handler bugs
  }

  return NextResponse.json({ received: true })
}
