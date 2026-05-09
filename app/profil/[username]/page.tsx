export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import ProfilClient from './ProfilClient'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `@${params.username} · Kapisio` }
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
      scenario:scenarios(content, active_date)
    `)
      .eq('user_id', profile.id)
      .order('vote_count', { ascending: false })
      .limit(10),
  ])

  return (
    <ProfilClient
      profile={profile}
      currentUserId={user?.id}
      isFollowing={isFollowing}
      duelCount={duelCount ?? 0}
      winCount={winCount ?? 0}
      achievements={achievements ?? []}
      recentDuels={recentDuels ?? []}
      recentAnswers={recentAnswers ?? []}
    />
  )
}
