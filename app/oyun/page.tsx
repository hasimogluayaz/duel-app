export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OyunClient } from './OyunClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Oyna' }

export default async function OyunPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?redirect=/oyun')

  const today = new Date().toISOString().split('T')[0]

  // Get today's scenario
  let { data: scenario } = await supabase
    .from('scenarios')
    .select('*')
    .eq('active_date', today)
    .single()

  // If no scenario today, generate one via API
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
    } catch {
      // fallback scenario
    }
  }

  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's answer for today
  let userAnswer = null
  if (scenario) {
    const { data } = await supabase
      .from('answers')
      .select('*')
      .eq('user_id', user.id)
      .eq('scenario_id', scenario.id)
      .single()
    userAnswer = data
  }

  // Get user's active duels (pending or being voted on — not completed)
  const { data: activeDuels } = await supabase
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

  return (
    <OyunClient
      scenario={scenario}
      profile={profile}
      userAnswer={userAnswer}
      activeDuels={activeDuels ?? []}
      userId={user.id}
    />
  )
}
