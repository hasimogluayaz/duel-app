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

  // Try full query first (needs migration 028 + 029).
  // If new columns don't exist yet, fall back to base columns so the page doesn't 404.
  let duel: any = null
  const { data: fullDuel, error: fullError } = await supabase
    .from('duels')
    .select('id, code, scenario_id, creator_id, created_at, judge_mode, ai_verdict, winner_id')
    .eq('code', params.kod.toUpperCase())
    .single()

  if (!fullError) {
    duel = fullDuel
  } else {
    // Fallback: columns may not be migrated yet — just show the page without AI fields
    const { data: baseDuel } = await supabase
      .from('duels')
      .select('id, code, scenario_id, creator_id, created_at')
      .eq('code', params.kod.toUpperCase())
      .single()
    duel = baseDuel
      ? { ...baseDuel, judge_mode: 'community', ai_verdict: null, winner_id: null }
      : null
  }

  if (!duel) notFound()

  // Try to fetch participants (needs migration 027) — fall back to empty
  let participants: any[] = []
  try {
    const { data: dp } = await (supabase as any)
      .from('duel_participants')
      .select('id, user_id, answer_id, joined_at, profile:profiles(id, username, display_name, avatar_url), answer:answers(id, content, vote_count)')
      .eq('duel_id', duel.id)
      .order('joined_at', { ascending: true })
    participants = dp ?? []
  } catch {}

  const [
    { data: scenario },
    { data: creator },
  ] = await Promise.all([
    supabase.from('scenarios').select('id, content, active_date').eq('id', duel.scenario_id).single(),
    supabase.from('profiles').select('id, username, display_name, avatar_url').eq('id', duel.creator_id).single(),
  ])

  return (
    <DuelInviteClient
      duel={duel}
      scenario={scenario ?? null}
      creator={creator ?? null}
      participants={participants}
      currentUserId={user?.id ?? null}
    />
  )
}
