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
    { data: participants },
  ] = await Promise.all([
    supabase.from('scenarios').select('id, content, active_date').eq('id', duel.scenario_id).single(),
    supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', duel.creator_id).single(),
    supabase
      .from('duel_participants')
      .select('id, user_id, answer_id, joined_at, profile:profiles(id, username, display_name, avatar_url), answer:answers(id, content, vote_count)')
      .eq('duel_id', duel.id)
      .order('joined_at', { ascending: true }),
  ])

  return (
    <DuelInviteClient
      duel={duel}
      scenario={scenario ?? null}
      creator={creator ?? null}
      participants={(participants ?? []) as any[]}
      currentUserId={user?.id ?? null}
    />
  )
}
