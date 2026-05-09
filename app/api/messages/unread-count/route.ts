import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()

  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('is_read', false)

  return NextResponse.json({ count: count ?? 0 })
})
