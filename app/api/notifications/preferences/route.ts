import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { parseBody } from '@/lib/api/validate'

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const { data } = await (supabase as any)
    .from('notification_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // Return defaults if not set
  return NextResponse.json({
    prefs: data ?? {
      duel_updates: true, answer_votes: true, social: true,
      system: true, weekly_summary: true,
    }
  })
})

export const PATCH = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const body = await parseBody<Record<string, unknown>>(req)

  const allowed = ['duel_updates', 'answer_votes', 'social', 'system', 'weekly_summary']
  const update: Record<string, boolean> = {}
  for (const key of allowed) {
    if (key in body) update[key] = Boolean(body[key])
  }

  await (supabase as any).from('notification_preferences').upsert({
    user_id: userId, ...update
  }, { onConflict: 'user_id' })

  return NextResponse.json({ success: true, prefs: update })
})
