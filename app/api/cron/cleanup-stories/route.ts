import { createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

// Vercel cron: daily at 04:00 UTC (07:00 Turkey)
async function handler(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc('cleanup_expired_stories')

  if (error) {
    console.error('[cleanup-stories]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export const GET = handler
export const POST = handler
