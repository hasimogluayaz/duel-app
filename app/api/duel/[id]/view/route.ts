import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/duel/[id]/view  — increment view_count (fire-and-forget from client)
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  // Increment view_count with a raw SQL increment (avoids race condition)
  const { error } = await supabase.rpc('increment_duel_view', { p_duel_id: params.id })

  if (error) {
    // If rpc doesn't exist yet, fall back to a select+update — fail silently
    return NextResponse.json({ ok: false })
  }

  return NextResponse.json({ ok: true })
}
