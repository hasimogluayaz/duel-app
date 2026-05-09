export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { EmojiClient } from './EmojiClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Emoji Kapışması · Kapisio',
  description: 'Günlük senaryoya sadece emoji ile cevap ver — kelime yasak.',
  openGraph: { title: 'Emoji Kapışması · Kapisio' },
}

export default async function EmojiPage() {
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
    .eq('mode', 'emoji')
    .order('vote_count', { ascending: false })
    .limit(20) : { data: [] }

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
        .eq('mode', 'emoji')
        .maybeSingle()
      userAnswer = a
    }
  }

  return (
    <EmojiClient
      scenario={scenario}
      profile={profile}
      userAnswer={userAnswer}
      userId={user?.id ?? null}
      communityAnswers={(communityAnswers ?? []) as any[]}
    />
  )
}
