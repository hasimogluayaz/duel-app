import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { withAuth } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/errors'
import { parseBody } from '@/lib/api/validate'

function requireAdmin(isAdmin: boolean) {
  if (!isAdmin) throw new ApiError('Yetkisiz erişim.', 403, 'FORBIDDEN')
}

export const GET = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
  requireAdmin((profile as any)?.is_admin)

  const url = new URL(req.url)
  const status = url.searchParams.get('status') ?? 'pending'

  const { data: reports } = await (supabase as any)
    .from('reports')
    .select(`
      id, target_type, target_id, reason, description, status, created_at,
      reporter:profiles!reports_reporter_id_fkey(username, display_name)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  // Enrich with target content
  const enriched = await Promise.all((reports ?? []).map(async (r: any) => {
    let content = null
    if (r.target_type === 'answer') {
      const { data } = await supabase.from('answers')
        .select('content, user:profiles!answers_user_id_fkey(username)')
        .eq('id', r.target_id).maybeSingle()
      content = data
    } else if (r.target_type === 'duel') {
      const { data } = await supabase.from('duels')
        .select('share_token, challenger:profiles!duels_challenger_id_fkey(username), challenged:profiles!duels_challenged_id_fkey(username)')
        .eq('id', r.target_id).maybeSingle()
      content = data
    } else if (r.target_type === 'comment') {
      const { data } = await (supabase as any).from('answer_comments')
        .select('content, user:profiles!answer_comments_user_id_fkey(username)')
        .eq('id', r.target_id).maybeSingle()
      content = data
    }
    return { ...r, target_content: content }
  }))

  return NextResponse.json({ reports: enriched })
})

export const PATCH = withAuth(async (req, { userId }) => {
  const supabase = createApiClient()
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
  requireAdmin((profile as any)?.is_admin)

  const body = await parseBody<{ id?: unknown; action?: unknown }>(req)
  const id = String(body.id ?? '')
  const action = String(body.action ?? '') // 'resolve' | 'dismiss' | 'delete_content'

  if (!id) throw new ApiError('id gerekli.', 400, 'VALIDATION')

  if (action === 'resolve') {
    await (supabase as any).from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolver_id: userId }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (action === 'dismiss') {
    await (supabase as any).from('reports').update({ status: 'dismissed', resolved_at: new Date().toISOString(), resolver_id: userId }).eq('id', id)
    return NextResponse.json({ success: true })
  }

  if (action === 'delete_content') {
    // Get report to find target
    const { data: report } = await (supabase as any).from('reports').select('target_type, target_id').eq('id', id).single()
    if (report) {
      if (report.target_type === 'answer') await supabase.from('answers').delete().eq('id', report.target_id)
      else if (report.target_type === 'duel') await supabase.from('duels').delete().eq('id', report.target_id)
      else if (report.target_type === 'comment') await (supabase as any).from('answer_comments').delete().eq('id', report.target_id)
    }
    await (supabase as any).from('reports').update({ status: 'resolved', resolved_at: new Date().toISOString(), resolver_id: userId }).eq('id', id)
    return NextResponse.json({ success: true, deleted: true })
  }

  throw new ApiError('Geçersiz action.', 400, 'VALIDATION')
})
