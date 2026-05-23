import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { getStripe, isStripeConfigured } from '@/lib/stripe/client'

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe yapılandırılmamış.' }, { status: 503 })
  }

  const supabase = createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('stripe_customer_id').eq('id', user.id).single()

  const customerId = (profile as any)?.stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: 'Önce Premium aboneliği başlatmalısın.' }, { status: 404 })
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://kapisio.com'}/profil/ayarlar`,
    })
    return NextResponse.json({ url: session.url })
  } catch (e: any) {
    console.error('[stripe/portal]', e)
    return NextResponse.json({ error: e.message ?? 'Portal açılamadı.' }, { status: 500 })
  }
}
