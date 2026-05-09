import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

const VALID_TYPES = ['answer', 'duel', 'comment', 'profile', 'scenario'] as const
const VALID_REASONS = ['spam', 'hate_speech', 'inappropriate', 'harassment', 'other'] as const

export async function POST(req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { target_type, target_id, reason, description } = await req.json()

    if (!VALID_TYPES.includes(target_type)) return NextResponse.json({ error: 'Geçersiz içerik tipi.' }, { status: 400 })
    if (!VALID_REASONS.includes(reason)) return NextResponse.json({ error: 'Geçersiz sebep.' }, { status: 400 })
    if (!target_id) return NextResponse.json({ error: 'Hedef belirtilmedi.' }, { status: 400 })

    const { error } = await (supabase.from('reports' as any) as any).insert({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      description: description?.slice(0, 500) || null,
    })

    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Bu içeriği zaten şikayet ettin.' }, { status: 409 })
    }
    if (error) return NextResponse.json({ error: 'Şikayet kaydedilemedi.' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
