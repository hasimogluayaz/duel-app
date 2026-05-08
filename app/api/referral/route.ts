import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'

// GET /api/referral — returns current user's referral stats
export async function GET() {
  const supabase = createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('referral_code').eq('id', user.id).single()

  const { count } = await (supabase as any)
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)

  return NextResponse.json({
    referral_code: (profile as any)?.referral_code ?? null,
    referral_count: count ?? 0,
  })
}

// POST /api/referral — apply a referral code at registration
export async function POST(req: Request) {
  const supabase = createApiClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Kod eksik.' }, { status: 400 })

  // Prevent self-referral and double referral
  const { data: referrerProfile } = await (supabase as any)
    .from('profiles').select('id').eq('referral_code', code.toUpperCase()).single()

  if (!referrerProfile) return NextResponse.json({ error: 'Geçersiz referans kodu.' }, { status: 404 })
  if (referrerProfile.id === user.id) return NextResponse.json({ error: 'Kendinizi referans edemezsiniz.' }, { status: 400 })

  // Check if user already used a referral code
  const { data: existing } = await (supabase as any)
    .from('referrals').select('id').eq('referred_id', user.id).single()

  if (existing) return NextResponse.json({ error: 'Zaten referans kodu kullandınız.' }, { status: 409 })

  // Insert referral record
  const { error } = await (supabase as any).from('referrals').insert({
    referrer_id: referrerProfile.id,
    referred_id: user.id,
    rewarded: false,
  })
  if (error) return NextResponse.json({ error: 'Referans kaydedilemedi.' }, { status: 500 })

  // Reward both parties
  const rewardBoth = async () => {
    const [{ data: referrer }, { data: referred }] = await Promise.all([
      supabase.from('profiles').select('total_points, weekly_points').eq('id', referrerProfile.id).single(),
      supabase.from('profiles').select('total_points, weekly_points').eq('id', user.id).single(),
    ])

    await Promise.all([
      referrer && supabase.from('profiles').update({
        total_points: (referrer.total_points || 0) + POINTS.REFERRAL,
        weekly_points: (referrer.weekly_points || 0) + POINTS.REFERRAL,
      } as any).eq('id', referrerProfile.id),
      referred && supabase.from('profiles').update({
        total_points: (referred.total_points || 0) + POINTS.REFERRAL,
        weekly_points: (referred.weekly_points || 0) + POINTS.REFERRAL,
      } as any).eq('id', user.id),
    ])

    // Mark rewarded
    await (supabase as any).from('referrals').update({ rewarded: true })
      .eq('referrer_id', referrerProfile.id).eq('referred_id', user.id)

    // Notify referrer
    await supabase.from('notifications').insert({
      user_id: referrerProfile.id,
      type: 'referral',
      title: '🎉 Referans Ödülü!',
      message: `Davet ettiğin kullanıcı katıldı! ${POINTS.REFERRAL} puan kazandın.`,
      data: {},
    } as any)
  }

  rewardBoth().catch(() => {})

  return NextResponse.json({ ok: true, reward: POINTS.REFERRAL })
}
