import { createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

// Daily cron: expire lapsed premium + top up freezes (3/month).
async function handler(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const [{ data: expired }, { data: granted }] = await Promise.all([
    supabase.rpc('expire_lapsed_premium'),
    supabase.rpc('grant_premium_freezes'),
  ])

  return NextResponse.json({
    expired: expired ?? 0,
    freezes_granted: granted ?? 0,
  })
}

export const GET = handler
export const POST = handler
