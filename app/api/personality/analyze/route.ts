import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { analyzePersonality } from '@/lib/anthropic/personality'
import { checkQuota } from '@/lib/quota/check'

export async function POST(_req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    // Quota check — AI analysis limit
    try {
      await checkQuota(supabase, user.id, 'ai_analysis_total')
    } catch (e: any) {
      return NextResponse.json({ error: e.message, code: 'QUOTA_EXCEEDED' }, { status: 429 })
    }

    // Get last 10 answers
    const { data: answers } = await supabase
      .from('answers')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!answers || answers.length < 5) {
      return NextResponse.json({ error: 'Yeterli cevap yok (en az 5 gerekli).' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await analyzePersonality(answers.map((a: any) => a.content))

    // Increment usage counter (for quota tracking) + save result
    const { data: pProfile } = await supabase
      .from('profiles')
      .select('personality_analysis_count')
      .eq('id', user.id)
      .single()

    await supabase.from('profiles').update({
      personality_type: result.personality_type,
      personality_updated_at: new Date().toISOString(),
      personality_analysis_count: ((pProfile as any)?.personality_analysis_count ?? 0) + 1,
    }).eq('id', user.id)

    return NextResponse.json(result)
  } catch (_err) {
    return NextResponse.json({ error: 'Kişilik analizi yapılamadı.' }, { status: 500 })
  }
}
