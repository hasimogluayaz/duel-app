import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { analyzePersonality } from '@/lib/anthropic/personality'

export async function POST(_req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

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

    await supabase.from('profiles').update({
      personality_type: result.personality_type,
      personality_updated_at: new Date().toISOString(),
    }).eq('id', user.id)

    return NextResponse.json(result)
  } catch (_err) {
    return NextResponse.json({ error: 'Kişilik analizi yapılamadı.' }, { status: 500 })
  }
}
