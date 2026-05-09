export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TartismaClient } from './TartismaClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ateşli Tartışma · Kapisio',
  description: 'Tarafını seç, görüşünü savun — topluluk hakem.',
  openGraph: { title: 'Ateşli Tartışma · Kapisio' },
}

export default async function TartismaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  const { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('active_date', today)
    .single()

  const { data: communityAnswers } = scenario ? await supabase
    .from('answers')
    .select('id, content, vote_count, user_id, mode_metadata, profiles:profiles(username, display_name, avatar_url)')
    .eq('scenario_id', scenario.id)
    .eq('mode', 'debate')
    .order('vote_count', { ascending: false })
    .limit(20) : { data: [] }

  // Count sides for live distribution
  const { data: sideStats } = scenario ? await supabase
    .from('answers')
    .select('mode_metadata')
    .eq('scenario_id', scenario.id)
    .eq('mode', 'debate') : { data: [] }

  const forCount = (sideStats ?? []).filter((a: any) => a.mode_metadata?.side === 'for').length
  const againstCount = (sideStats ?? []).filter((a: any) => a.mode_metadata?.side === 'against').length

  let userAnswer = null
  let profile = null

  if (user) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    profile = p

    if (scenario) {
      const { data: a } = await supabase
        .from('answers')
        .select('*')
        .eq('user_id', user.id)
        .eq('scenario_id', scenario.id)
        .eq('mode', 'debate')
        .maybeSingle()
      userAnswer = a
    }
  }

  return (
    <TartismaClient
      scenario={scenario}
      profile={profile}
      userAnswer={userAnswer}
      userId={user?.id ?? null}
      communityAnswers={(communityAnswers ?? []) as any[]}
      forCount={forCount}
      againstCount={againstCount}
    />
  )
}
