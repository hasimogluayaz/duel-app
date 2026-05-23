import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { ApiError } from '@/lib/api/errors'
import { parseBody, requireUuid, validateAnswerContent } from '@/lib/api/validate'

export async function POST(req: Request) {
  try {
    const supabase = createApiClient()
    const body = await parseBody<{ scenario_id?: unknown; content?: unknown }>(req)

    const scenarioId = requireUuid(body.scenario_id, 'Senaryo ID')
    const content = validateAnswerContent(String(body.content ?? ''))

    const { data: scenario } = await supabase
      .from('scenarios')
      .select('id')
      .eq('id', scenarioId)
      .eq('is_approved', true)
      .single()

    if (!scenario) {
      throw new ApiError('Senaryo bulunamadı.', 404, 'NOT_FOUND')
    }

    // Capture network fingerprint for admin moderation (best-effort)
    const ipHeader = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
    const ipAddress = ipHeader.split(',')[0]?.trim() || null
    const userAgent = req.headers.get('user-agent')?.slice(0, 500) || null

    const { data: answer, error: insertError } = await supabase
      .from('answers')
      .insert({
        user_id: null,
        scenario_id: scenarioId,
        content,
        mode: 'scenario',
        ip_address: ipAddress,
        user_agent: userAgent,
      } as any)
      .select()
      .single()

    if (insertError || !answer) {
      console.error('[answer/anonymous] Insert failed:', insertError)
      throw new ApiError('Cevap kaydedilemedi.', 500, 'DB_ERROR')
    }

    return NextResponse.json({ answer })
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.status })
    }
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 })
  }
}
