import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/redis/ratelimit'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const duelId = searchParams.get('duel_id')
  if (!duelId) return NextResponse.json({ error: 'duel_id gerekli.' }, { status: 400 })

  const supabase = createApiClient()
  const { data, error } = await (supabase.from('comments' as any) as any)
    .select(`
      id, content, created_at,
      profiles:user_id(id, username, display_name, avatar_url)
    `)
    .eq('duel_id', duelId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Yorumlar yüklenemedi.' }, { status: 500 })
  return NextResponse.json({ comments: data ?? [] })
}

export async function POST(req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { duel_id, content } = await req.json() as { duel_id: string; content: string }
    if (!duel_id || !content?.trim()) return NextResponse.json({ error: 'Eksik alan.' }, { status: 400 })
    if (content.trim().length > 300) return NextResponse.json({ error: 'Yorum en fazla 300 karakter olabilir.' }, { status: 400 })

    // Rate limit: 20 comments/hour (Redis sliding window)
    const rl = await checkRateLimit('comment', user.id)
    if (!rl.success) {
      return NextResponse.json({ error: 'Saatlik yorum limitine ulaştınız.' }, { status: 429 })
    }

    const { data: comment, error } = await (supabase.from('comments' as any) as any)
      .insert({ duel_id, user_id: user.id, content: content.trim() })
      .select(`id, content, created_at, profiles:user_id(id, username, display_name, avatar_url)`)
      .single()

    if (error) return NextResponse.json({ error: 'Yorum kaydedilemedi.' }, { status: 500 })
    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'id gerekli.' }, { status: 400 })

    const { error } = await (supabase.from('comments' as any) as any)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'Silinemedi.' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Sunucu hatası.' }, { status: 500 })
  }
}
