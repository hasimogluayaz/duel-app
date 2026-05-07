import { createApiClient } from '@/lib/supabase/typed'
import { createServiceClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

export async function DELETE() {
  try {
    const supabase = createApiClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    // Delete profile and all related data (cascades via RLS/FK)
    await supabase.from('notifications').delete().eq('user_id', user.id)
    await supabase.from('achievements').delete().eq('user_id', user.id)
    await supabase.from('votes').delete().eq('voter_id', user.id)
    await supabase.from('answers').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)

    // Delete auth user via service role
    const serviceSupabase = createServiceClient()
    await serviceSupabase.auth.admin.deleteUser(user.id)

    return NextResponse.json({ success: true })
  } catch (_err) {
    return NextResponse.json({ error: 'Hesap silinemedi.' }, { status: 500 })
  }
}
