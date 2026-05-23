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

  // Current viewer's admin status — admins shouldn't see message/follow/duel buttons
  let viewerIsAdmin = false
  if (user) {
    const { data: viewerProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    viewerIsAdmin = (viewerProfile as { is_admin?: boolean } | null)?.is_admin === true
  }

  const isFollowing = user ? await (async () => {
    const { data } = await (supabase.from('followers' as any) as any)
      .select('id').eq('follower_id', user.id).eq('following_id', profile.id).maybeSingle()
    return !!data
  })() : false

  // ── Fetch answers + vote total ──
  const [
    { data: recentAnswers },
    { count: answerCount },
    { data: voteAgg },
  ] = await Promise.all([
    supabase.from('answers').select(`
      id, content, vote_count, created_at,
      scenario:scenarios(id, content, active_date)
    `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('answers').select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase.from('answers').select('vote_count')
      .eq('user_id', profile.id),
  ])

  const totalVotes = (voteAgg ?? []).reduce((sum: number, r: any) => sum + (r.vote_count ?? 0), 0)

  // ── Fetch invite duels (new system via duel_participants) ──
  const { data: participantRows } = await (supabase as any)
    .from('duel_participants')
    .select('duel_id')
    .eq('user_id', profile.id)

  const duelIds: string[] = (participantRows ?? []).map((r: any) => r.duel_id)

  const { data: rawInviteDuels } = duelIds.length > 0
    ? await (supabase as any)
      .from('duels')
      .select(`
        id, code, creator_id, created_at, judge_mode, ai_verdict, winner_id,
        scenario:scenarios(id, content, active_date),
        participants:duel_participants(
          user_id, joined_at,
          profile:profiles(id, username, display_name, avatar_url),
          answer:answers(id, vote_count)
        )
      `)
      .in('id', duelIds)
      .order('created_at', { ascending: false })
      .limit(30)
    : { data: [] }

  const inviteDuels = (rawInviteDuels ?? []) as any[]

  // ── Answered today? ──
  const today = new Date().toISOString().split('T')[0]
  let answeredToday = false
  try {
    const { data: todayScenario } = await supabase
      .from('scenarios').select('id').eq('active_date', today).eq('is_approved', true).single()
    if (todayScenario) {
      const { count } = await supabase.from('answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id).eq('scenario_id', todayScenario.id)
      answeredToday = (count ?? 0) > 0
    }
  } catch {}

  return (
    <ProfilClient
      profile={profile}
      currentUserId={user?.id}
      viewerIsAdmin={viewerIsAdmin}
      isFollowing={isFollowing}
      inviteDuels={inviteDuels}
      recentAnswers={recentAnswers ?? []}
      totalVotes={totalVotes}
      answerCount={answerCount ?? 0}
      answeredToday={answeredToday}
    />
  )
}
