import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'

export async function POST() {
  const supabase = createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  const customerId = (profile as any)?.stripe_customer_id
  if (!customerId) return NextResponse.json({ error: 'Stripe müşterisi yok.' }, { status: 404 })

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/profil/ayarlar`,
  })

  return NextResponse.json({ url: session.url })
}
