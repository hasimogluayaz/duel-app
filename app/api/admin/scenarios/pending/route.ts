import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

function requireAdmin(isAdmin: boolean) {
  if (!isAdmin) throw new ApiError('Yetkisiz erişim.', 403, 'FORBIDDEN')
}

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = createApiClient()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
  requireAdmin((profile as any)?.is_admin)

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select(`
      id, content, category, created_at, answer_count,
      author:profiles!scenarios_user_id_fkey(username, display_name)
    `)
    .eq('is_user_created', true)
    .eq('is_approved', false)
    .order('created_at', { ascending: true })
    .limit(50)

  return NextResponse.json({ scenarios: scenarios ?? [] })
})

export const PATCH = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
  requireAdmin((profile as any)?.is_admin)

  const body = await parseBody<{ id?: unknown; action?: unknown }>(req)
  const id = String(body.id ?? '')
  const action = String(body.action ?? '')

  if (!id) throw new ApiError('id gerekli.', 400, 'VALIDATION')
  if (!['approve', 'reject', 'editor_pick'].includes(action)) throw new ApiError('Geçersiz action.', 400, 'VALIDATION')

  if (action === 'approve') {
    await supabase.from('scenarios').update({ is_approved: true } as any).eq('id', id)
    return NextResponse.json({ success: true, action: 'approved' })
  }

  if (action === 'editor_pick') {
    await supabase.from('scenarios').update({ is_approved: true, is_editor_pick: true } as any).eq('id', id)
    return NextResponse.json({ success: true, action: 'editor_pick' })
  }

  // reject — delete the scenario
  await supabase.from('scenarios').delete().eq('id', id).eq('is_user_created', true)
  return NextResponse.json({ success: true, action: 'rejected' })
})
