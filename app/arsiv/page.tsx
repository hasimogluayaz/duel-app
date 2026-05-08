export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import ArsivClient from './ArsivClient'

export const metadata: Metadata = { title: 'Senaryo Arşivi · Kapisio' }

const CATEGORIES = [
  { value: 'all', label: 'Tümü' },
  { value: 'genel', label: '🌍 Genel' },
  { value: 'ask', label: '❤️ Aşk' },
  { value: 'is', label: '💼 İş' },
  { value: 'aile', label: '👨‍👩‍👧 Aile' },
  { value: 'sosyal', label: '👥 Sosyal' },
  { value: 'teknoloji', label: '💻 Teknoloji' },
  { value: 'dunya', label: '🌏 Dünya' },
  { value: 'mizah', label: '😂 Mizah' },
]

export default async function ArsivPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const category = searchParams.category && searchParams.category !== 'all' ? searchParams.category : null
  const sort = searchParams.sort ?? 'recent'

  let query = supabase
    .from('scenarios')
    .select(`
      id, content, category, active_date, answer_count, created_at, is_user_created,
      author:profiles!scenarios_user_id_fkey(username, display_name, avatar_url)
    `)
    .eq('is_approved', true)

  if (category) query = query.eq('category', category)

  if (sort === 'popular') {
    query = query.order('answer_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: scenarios } = await query.limit(24)

  // Fetch which ones the user has answered
  let answeredIds: string[] = []
  if (user && scenarios?.length) {
    const { data: answers } = await supabase
      .from('answers')
      .select('scenario_id')
      .eq('user_id', user.id)
      .in('scenario_id', scenarios.map((s: any) => s.id))
    answeredIds = (answers ?? []).map((a: any) => a.scenario_id)
  }

  const enriched = (scenarios ?? []).map((s: any) => ({
    ...s,
    answered: answeredIds.includes(s.id),
  }))

  return (
    <ArsivClient
      initialScenarios={enriched}
      categories={CATEGORIES}
      activeCategory={searchParams.category ?? 'all'}
      activeSort={sort}
      userId={user?.id ?? null}
    />
  )
}
