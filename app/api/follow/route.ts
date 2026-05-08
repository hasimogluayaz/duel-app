import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { pushToUser } from '@/lib/push/notify'

export async function POST(req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { following_id, action } = await req.json() as { following_id: string; action: 'follow' | 'unfollow' }

    if (!following_id || !action) return NextResponse.json({ error: 'Eksik alan.' }, { status: 400 })
    if (following_id === user.id) return NextResponse.json({ error: 'Kendinizi takip edemezsiniz.' }, { status: 400 })

    if (action === 'follow') {
      const { error } = await supabase.from('followers' as any).insert({
        follower_id: user.id,
        following_id,
      })
      if (error?.code === '23505') {
        return NextResponse.json({ following: true }) // already following
      }
      if (error) return NextResponse.json({ error: 'Takip edilemedi.' }, { status: 500 })

      // Notify followed user
      const { data: followerProfile } = await supabase
        .from('profiles').select('username, display_name').eq('id', user.id).single()

      await supabase.from('notifications').insert({
        user_id: following_id,
        type: 'new_follower',
        title: '👥 Yeni Takipçi!',
        message: `${followerProfile?.display_name || followerProfile?.username} seni takip etmeye başladı.`,
        data: { follower_id: user.id },
      } as any)

      pushToUser(following_id, {
        title: '👥 Yeni Takipçi!',
        body: `${followerProfile?.display_name || followerProfile?.username} seni takip etmeye başladı.`,
        url: `/profil/${followerProfile?.username}`,
      }).catch(() => {})

      return NextResponse.json({ following: true })
    }

    if (action === 'unfollow') {
      await (supabase.from('followers' as any) as any)
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', following_id)
      return NextResponse.json({ following: false })
    }

    return NextResponse.json({ error: 'Geçersiz işlem.' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
