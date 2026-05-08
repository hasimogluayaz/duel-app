export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { OyunClient } from './OyunClient'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Oyna' }

export default async function OyunPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toISOString().split('T')[0]

  // Get today's scenario
  let { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('active_date', today)
    .single()

  // If no scenario, generate via API
  if (!scenario) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scenario/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` },
      })
      if (res.ok) {
        const json = await res.json()
        scenario = json.scenario
      }
    } catch { /* ignore */ }
  }

  // Public: top community answers for today (visible to everyone)
  const { data: communityAnswers } = scenario ? await supabase
    .from('answers')
    .select('id, content, vote_count, user_id, profiles:profiles(username, display_name, avatar_url)')
    .eq('scenario_id', scenario.id)
    .order('vote_count', { ascending: false })
    .limit(5) : { data: [] }

  // Public: recent completed duels
  const { data: recentDuels } = await supabase
    .from('duels')
    .select(`
      id, share_token, ai_verdict, created_at,
      challenger:profiles!duels_challenger_id_fkey(username, display_name, avatar_url),
      challenged:profiles!duels_challenged_id_fkey(username, display_name, avatar_url)
    `)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(4)

  // Logged-in user data
  let profile = null
  let userAnswer = null
  let activeDuels: any[] = []

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
        .single()
      userAnswer = a
    }

    const { data: duels } = await supabase
      .from('duels')
      .select(`
        *,
        challenger:profiles!duels_challenger_id_fkey(username, display_name, avatar_url),
        challenged:profiles!duels_challenged_id_fkey(username, display_name, avatar_url)
      `)
      .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })
      .limit(10)
    activeDuels = duels ?? []
  }

  // Detect new user: onboarding_done = false (or not set)
  const isNewUser = !!user && !!(profile) && !(profile as any).onboarding_done

  return (
    <>
      <OyunClient
        scenario={scenario}
        profile={profile}
        userAnswer={userAnswer}
        activeDuels={activeDuels}
        userId={user?.id ?? null}
        communityAnswers={(communityAnswers ?? []) as any[]}
        recentDuels={(recentDuels ?? []) as any[]}
      />
      {user && isNewUser && (
        <OnboardingModal userId={user.id} isNewUser={isNewUser} />
      )}
    </>
  )
}
