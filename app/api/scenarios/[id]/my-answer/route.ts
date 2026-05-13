import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'

export const GET = withAuth(async (_req, { userId, params }) => {
  const supabase = createApiClient()
  const id = params?.id
  if (!id) throw new ApiError('Senaryo ID gerekli.', 400, 'VALIDATION')

  const { data } = await supabase
    .from('answers')
    .select('id')
    .eq('user_id', userId)
    .eq('scenario_id', id)
    .maybeSingle()

  return NextResponse.json({ answerId: data?.id ?? null })
})
