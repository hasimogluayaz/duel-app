export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DuelInviteClient from './DuelInviteClient'

interface Props { params: { kod: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: duel } = await supabase
    .from('duels')
    .select('creator:profiles!duels_creator_id_fkey(display_name, username), scenario:scenarios(content)')
    .eq('code', params.kod.toUpperCase())
    .single()

  const creator = duel?.creator as { display_name: string | null; username: string } | null
  const scenario = duel?.scenario as { content: string } | null
  const name = creator?.display_name || creator?.username || 'Biri'

  return {
    title: `${name} seni düelloya çağırdı · Kapisio`,
    description: scenario?.content
      ? `"${scenario.content.slice(0, 140)}" — ${name} cevapladı. Sen ne yapardın?`
      : `${name} seni Kapisio düellosuna çağırdı!`,
    openGraph: {
      title: `${name} seni düelloya çağırdı · Kapisio`,
      description: `Kapisio'da bugünkü senaryoyu ${name} ile birlikte cevaplayın.`,
    },
    twitter: { card: 'summary', title: `${name} seni düelloya çağırdı · Kapisio` },
  }
}

export default async function DuelInvitePage({ params }: Props) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: duel } = await supabase
    .from('duels')
    .select('id, code, scenario_id, creator_id, created_at')
    .eq('code', params.kod.toUpperCase())
    .single()

  if (!duel) notFound()

  const [
    { data: scenario },
    { data: creator },
    { data: creatorAnswer },
  ] = await Promise.all([
    supabase.from('scenarios').select('id, content, active_date').eq('id', duel.scenario_id).single(),
    supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', duel.creator_id).single(),
    supabase.from('answers').select('id, content, vote_count, created_at')
      .eq('user_id', duel.creator_id).eq('scenario_id', duel.scenario_id).maybeSingle(),
  ])

  // Visitor's answer for this scenario (if logged in)
  let visitorAnswer: { id: string; content: string; vote_count: number } | null = null
  if (user && user.id !== duel.creator_id) {
    const { data } = await supabase.from('answers').select('id, content, vote_count')
      .eq('user_id', user.id).eq('scenario_id', duel.scenario_id).maybeSingle()
    visitorAnswer = data ?? null
  }

  return (
    <DuelInviteClient
      duel={duel}
      scenario={scenario}
      creator={creator}
      creatorAnswer={creatorAnswer}
      visitorAnswer={visitorAnswer}
      currentUserId={user?.id ?? null}
    />
  )
}
