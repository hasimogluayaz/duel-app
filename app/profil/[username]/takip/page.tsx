export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import FollowListClient from '../FollowListClient'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} · Takip Edilenler · Kapisio` }
}

export default async function TakipPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('id, username, display_name, avatar_url, following_count')
    .eq('username', params.username.toLowerCase()).single()

  if (!profile) notFound()

  const { data: following } = await (supabase.from('followers' as any) as any)
    .select('following_id, created_at, following:profiles!followers_following_id_fkey(id, username, display_name, avatar_url, total_points, follower_count)')
    .eq('follower_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(100)

  let currentUserFollowing: string[] = []
  if (user && following?.length) {
    const ids = following.map((f: any) => f.following_id)
    const { data: myFollows } = await (supabase.from('followers' as any) as any)
      .select('following_id').eq('follower_id', user.id).in('following_id', ids)
    currentUserFollowing = (myFollows ?? []).map((f: any) => f.following_id)
  }

  const enriched = (following ?? []).map((f: any) => ({
    ...f.following,
    isFollowing: currentUserFollowing.includes(f.following_id),
    followedAt: f.created_at,
  }))

  return (
    <FollowListClient
      profile={profile}
      users={enriched}
      mode="following"
      currentUserId={user?.id ?? null}
    />
  )
}
