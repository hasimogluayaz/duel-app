import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { stripe, PREMIUM_PRICE_ID } from '@/lib/stripe/client'

export async function POST() {
  const supabase = createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('username, stripe_customer_id').eq('id', user.id).single()

  if (!profile) return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Reuse existing Stripe customer or create new one
  let customerId = (profile as any).stripe_customer_id as string | null

  if (!customerId) {
    const { data: authUser } = await (supabase.auth as any).admin.getUserById(user.id)
    const customer = await stripe.customers.create({
      email: authUser?.user?.email,
      metadata: { supabase_user_id: user.id, username: profile.username },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId } as any).eq('id', user.id)
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/premium/basarili?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/premium`,
    allow_promotion_codes: true,
    metadata: { user_id: user.id },
  })

  return NextResponse.json({ url: session.url })
}
