export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import FollowListClient from '../FollowListClient'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} · Takipçiler · Kapisio` }
}

export default async function TakipcilerPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('id, username, display_name, avatar_url, follower_count')
    .eq('username', params.username.toLowerCase()).single()

  if (!profile) notFound()

  const { data: followers } = await (supabase.from('followers' as any) as any)
    .select('follower_id, created_at, follower:profiles!followers_follower_id_fkey(id, username, display_name, avatar_url, total_points, follower_count)')
    .eq('following_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Which of these does the current user follow?
  let currentUserFollowing: string[] = []
  if (user && followers?.length) {
    const ids = followers.map((f: any) => f.follower_id)
    const { data: myFollows } = await (supabase.from('followers' as any) as any)
      .select('following_id').eq('follower_id', user.id).in('following_id', ids)
    currentUserFollowing = (myFollows ?? []).map((f: any) => f.following_id)
  }

  const enriched = (followers ?? []).map((f: any) => ({
    ...f.follower,
    isFollowing: currentUserFollowing.includes(f.follower_id),
    followedAt: f.created_at,
  }))

  return (
    <FollowListClient
      profile={profile}
      users={enriched}
      mode="followers"
      currentUserId={user?.id ?? null}
    />
  )
}
