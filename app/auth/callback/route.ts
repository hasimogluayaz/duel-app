import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { POINTS } from '@/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const refCode = searchParams.get('ref')

  if (code) {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, profile_complete')
        .eq('id', data.user.id)
        .single()

      const isNewUser = !profile
      const provider = data.user.app_metadata?.provider ?? 'email'
      const isGoogle = provider === 'google'

      if (isNewUser) {
        if (isGoogle) {
          // Google new user: create profile with temp username, must complete profile
          const base = (data.user.email?.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user')
          const tempUsername = (base + Math.floor(Math.random() * 9999)).slice(0, 20).toLowerCase()
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: tempUsername,
            display_name: data.user.user_metadata?.full_name || tempUsername,
            avatar_url: data.user.user_metadata?.avatar_url || null,
            profile_complete: false,
          })
          // Store in JWT metadata so middleware can check without a DB call
          await supabase.auth.updateUser({ data: { profile_complete: false } })
        } else {
          // Email confirmation: create profile from metadata set during signUp
          const meta = data.user.user_metadata ?? {}
          const username = (meta.username as string | undefined) || data.user.email?.split('@')[0] || 'user'
          const displayName = (meta.display_name as string | undefined) || username
          await supabase.from('profiles').insert({
            id: data.user.id,
            username: username.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20),
            display_name: displayName,
            profile_complete: true,
          })
        }
      }

      // Apply referral for new users (fire-and-forget)
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

      // New or incomplete Google profile → must choose username
      const needsCompletion = isGoogle && (isNewUser || profile?.profile_complete === false)
      if (needsCompletion) {
        return NextResponse.redirect(`${origin}/auth/tamamla`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/giris?error=auth_callback`)
}
