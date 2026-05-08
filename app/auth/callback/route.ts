import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/oyun'
  const refCode = searchParams.get('ref')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Check if profile exists, create if not
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      const isNewUser = !profile

      if (isNewUser) {
        const username = data.user.email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') + Math.floor(Math.random() * 999)
        await supabase.from('profiles').insert({
          id: data.user.id,
          username: username.slice(0, 20).toLowerCase(),
          display_name: data.user.user_metadata?.full_name || username,
          avatar_url: data.user.user_metadata?.avatar_url || null,
        })
      }

      // Apply referral code for new users (fire-and-forget)
      if (isNewUser && refCode) {
        ;(async () => {
          try {
            const { data: referrerProfile } = await (supabase as any)
              .from('profiles').select('id, total_points, weekly_points').eq('referral_code', refCode.toUpperCase()).single()

            if (!referrerProfile || referrerProfile.id === data.user.id) return

            const { data: referred } = await supabase
              .from('profiles').select('total_points, weekly_points').eq('id', data.user.id).single()

            await (supabase as any).from('referrals').insert({
              referrer_id: referrerProfile.id,
              referred_id: data.user.id,
              rewarded: true,
            })

            await Promise.all([
              supabase.from('profiles').update({
                total_points: (referrerProfile.total_points || 0) + POINTS.REFERRAL,
                weekly_points: (referrerProfile.weekly_points || 0) + POINTS.REFERRAL,
              } as any).eq('id', referrerProfile.id),
              referred && supabase.from('profiles').update({
                total_points: (referred.total_points || 0) + POINTS.REFERRAL,
                weekly_points: (referred.weekly_points || 0) + POINTS.REFERRAL,
              } as any).eq('id', data.user.id),
            ])

            await supabase.from('notifications').insert({
              user_id: referrerProfile.id,
              type: 'referral',
              title: '🎉 Referans Ödülü!',
              message: `Davet ettiğin kullanıcı katıldı! ${POINTS.REFERRAL} puan kazandın.`,
              data: {},
            } as any)
          } catch {}
        })()
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/giris?error=auth_callback`)
}
