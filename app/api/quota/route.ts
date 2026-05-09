import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { getUserQuotaUsage } from '@/lib/quota/check'

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const quotaData = await getUserQuotaUsage(supabase, userId)
  return NextResponse.json(quotaData)
})
