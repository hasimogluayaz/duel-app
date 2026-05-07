export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DuelClient } from './DuelClient'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: duel } = await supabase
    .from('duels')
    .select(`
      challenger:profiles!duels_challenger_id_fkey(username, display_name),
      challenged:profiles!duels_challenged_id_fkey(username, display_name),
      scenario:scenarios(content)
    `)
    .eq('share_token', params.id)
    .single()

  const challenger = (duel?.challenger as { username: string; display_name: string | null } | null)
  const challenged = (duel?.challenged as { username: string; display_name: string | null } | null)
  const scenario = (duel?.scenario as { content: string } | null)

  const a = challenger?.display_name || challenger?.username || '?'
  const b = challenged?.display_name || challenged?.username || '?'

  return {
    title: `${a} vs ${b} · Kapisio Düello`,
    description: scenario?.content
      ? `"${scenario.content.slice(0, 120)}" — Kim haklı? Oy ver ve kazananı belirle!`
      : `${a} ile ${b} arasındaki düelloda oy kullan ve kazananı belirle!`,
    openGraph: {
      title: `${a} vs ${b} · Kapisio`,
      description: scenario?.content ? `"${scenario.content.slice(0, 120)}"` : 'Düelloda oy ver!',
    },
  }
}

export default async function DuelPage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Find duel by share_token
  const { data: duel } = await supabase
    .from('duels')
    .select(`
      *,
      scenario:scenarios(*),
      challenger:profiles!duels_challenger_id_fkey(*),
      challenged:profiles!duels_challenged_id_fkey(*),
      challenger_answer:answers!duels_challenger_answer_id_fkey(*),
      challenged_answer:answers!duels_challenged_answer_id_fkey(*)
    `)
    .eq('share_token', params.id)
    .single()

  if (!duel) notFound()

  // Get vote counts
  const [{ count: votesA }, { count: votesB }] = await Promise.all([
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id)
      .eq('voted_for_id', duel.challenger_id),
    supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('duel_id', duel.id)
      .eq('voted_for_id', duel.challenged_id),
  ])

  // Get user's vote
  let userVote = null
  if (user) {
    const { data: vote } = await supabase
      .from('votes')
      .select('voted_for_id')
      .eq('duel_id', duel.id)
      .eq('voter_id', user.id)
      .single()
    userVote = vote?.voted_for_id ?? null
  }

  return (
    <DuelClient
      duel={duel}
      votesA={votesA ?? 0}
      votesB={votesB ?? 0}
      userId={user?.id ?? null}
      userVote={userVote}
    />
  )
}
