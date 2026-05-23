import { createApiClient } from '@/lib/supabase/typed'
import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getStripe, getPremiumPriceId, isStripeConfigured } from '@/lib/stripe/client'

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Premium şu an yapılandırılmamış. (STRIPE env eksik)' },
      { status: 503 },
    )
  }

  const supabase = createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('username, stripe_customer_id').eq('id', user.id).single()

  if (!profile) return NextResponse.json({ error: 'Profil bulunamadı.' }, { status: 404 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kapisio.com'

  // Reuse existing Stripe customer or create new one
  let customerId = (profile as any).stripe_customer_id as string | null
  const stripe = getStripe()

  if (!customerId) {
    // Need user email — auth.admin requires service role key
    const admin = createServiceClient()
    const { data: authData } = await admin.auth.admin.getUserById(user.id)
    const email = authData?.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Hesap email\'i bulunamadı.' }, { status: 400 })
    }

    const customer = await stripe.customers.create({
      email,
      metadata: { supabase_user_id: user.id, username: profile.username },
    })
    customerId = customer.id
    await supabase.from('profiles').update({ stripe_customer_id: customerId } as any).eq('id', user.id)
  }

  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: getPremiumPriceId(), quantity: 1 }],
      success_url: `${appUrl}/premium/basarili?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/premium`,
      allow_promotion_codes: true,
      metadata: { user_id: user.id },
    })

    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('[stripe/checkout]', e)
    return NextResponse.json({ error: e.message ?? 'Ödeme oturumu oluşturulamadı.' }, { status: 500 })
  }
}
