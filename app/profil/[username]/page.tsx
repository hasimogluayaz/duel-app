export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProfilClient from './ProfilClient'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('display_name, username, bio, avatar_url')
    .eq('username', params.username.toLowerCase())
    .single()
  if (!data) return { title: 'Profil · Kapisio' }
  return {
    title: `${data.display_name || data.username} (@${data.username}) · Kapisio`,
    description: data.bio ?? `${data.username} adlı kullanıcının Kapisio profili.`,
    openGraph: {
      title: `${data.display_name || data.username} · Kapisio`,
      description: data.bio ?? `@${data.username} ile düello yap!`,
      images: data.avatar_url ? [{ url: data.avatar_url }] : [],
    },
    twitter: { card: 'summary', title: `${data.display_name || data.username} · Kapisio` },
  }
}

export default async function ProfilPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username.toLowerCase())
    .single()

  if (!profile || (profile.is_admin && user?.id !== profile.id)) notFound()

  const isFollowing = user ? await (async () => {
    const { data } = await (supabase.from('followers' as any) as any)
      .select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
    return !!data
  })() : false

  const [
    { count: duelCount },
    { count: winCount },
    { data: achievements },
    { data: recentDuels },
    { data: recentAnswers },
    { count: followerCount },
    { count: followingCount },
    { data: userScenarios },
  ] = await Promise.all([
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .eq('status', 'completed'),
    supabase.from('duels').select('*', { count: 'exact', head: true })
      .eq('winner_id', profile.id),
    supabase.from('achievements').select('*').eq('user_id', profile.id),
    supabase.from('duels').select(`
      id, share_token, status, created_at, winner_id,
      challenger_id, challenged_id,
      challenger:profiles!duels_challenger_id_fkey(username, display_name, avatar_url, total_points),
      challenged:profiles!duels_challenged_id_fkey(username, display_name, avatar_url, total_points),
      scenario:scenarios(content)
    `)
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('answers').select(`
      id, content, vote_count, created_at,
      scenario:scenarios(id, content, active_date)
    `)
      .eq('user_id', profile.id)
      .order('vote_count', { ascending: false })
      .limit(10),
    (supabase.from('followers' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    (supabase.from('followers' as any) as any)
      .select('id', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    supabase.from('scenarios')
      .select('id, content, category, answer_count, created_at')
      .eq('user_id', profile.id)
      .eq('is_user_created', true)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  // Fetch pinned answers (vitrin)
  const pinnedIds: string[] = profile.pinned_answer_ids ?? []
  const pinnedAnswers = pinnedIds.length > 0
    ? await supabase.from('answers')
        .select('id, content, vote_count, verdict_count, created_at, scenario:scenarios(id, content)')
        .in('id', pinnedIds)
        .then((r: { data: any[] | null }) => r.data ?? [])
    : []

  return (
    <ProfilClient
      profile={{
        ...profile,
        follower_count: followerCount ?? profile.follower_count ?? 0,
        following_count: followingCount ?? profile.following_count ?? 0,
      }}
      currentUserId={user?.id}
      isFollowing={isFollowing}
      duelCount={duelCount ?? 0}
      winCount={winCount ?? 0}
      achievements={achievements ?? []}
      recentDuels={recentDuels ?? []}
      recentAnswers={recentAnswers ?? []}
      userScenarios={userScenarios ?? []}
      pinnedAnswers={pinnedAnswers}
    />
  )
}
