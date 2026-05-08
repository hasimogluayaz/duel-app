import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export const runtime = 'nodejs'

async function updatePremiumStatus(
  supabase: ReturnType<typeof createClient>,
  customerId: string,
  isActive: boolean,
  periodEnd?: number
) {
  const { data: profile } = await (supabase as any)
    .from('profiles').select('id').eq('stripe_customer_id', customerId).single()

  if (!profile) return

  await supabase.from('profiles').update({
    is_premium: isActive,
    premium_until: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  } as any).eq('id', profile.id)

  // Upsert subscription row
  await (supabase as any).from('subscriptions').upsert({
    user_id: profile.id,
    stripe_customer_id: customerId,
    status: isActive ? 'active' : 'canceled',
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Webhook imzası geçersiz.' }, { status: 400 })
  }

  const supabase = createClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await updatePremiumStatus(
        supabase,
        sub.customer as string,
        sub.status === 'active',
        sub.current_period_end
      )
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await updatePremiumStatus(supabase, sub.customer as string, false)
      break
    }
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice
      await (supabase as any).from('subscriptions').update({
        status: 'past_due', updated_at: new Date().toISOString()
      }).eq('stripe_customer_id', inv.customer as string)
      break
    }
  }

  return NextResponse.json({ received: true })
}
