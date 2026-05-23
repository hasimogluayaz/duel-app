import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function assertAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin ? user : null
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await assertAdmin()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = params.id
  const service = createServiceClient()

  const [
    { data: profile },
    { data: authUser },
    { data: recentAnswers },
    { count: answerCount },
    { count: duelCount },
    { count: voteCount },
    { count: commentCount },
    { data: recentDuels },
    { count: followerCount },
    { count: followingCount },
  ] = await Promise.all([
    service.from('profiles').select('*').eq('id', userId).single(),
    service.auth.admin.getUserById(userId).catch(() => ({ data: null })),
    service.from('answers')
      .select('id, content, vote_count, created_at, scenario:scenarios(id, content, active_date)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20),
    service.from('answers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    service.from('duel_participants').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    service.from('answer_likes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    service.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    service.from('duel_participants')
      .select('joined_at, duel:duels(id, code, judge_mode, created_at, ai_verdict, winner_id, scenario:scenarios(content))')
      .eq('user_id', userId)
      .order('joined_at', { ascending: false })
      .limit(10),
    service.from('followers').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    service.from('followers').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ])

  if (!profile) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const email = (authUser as any)?.data?.user?.email ?? null
  const lastSignIn = (authUser as any)?.data?.user?.last_sign_in_at ?? null
  const provider = (authUser as any)?.data?.user?.app_metadata?.provider ?? null

  return NextResponse.json({
    profile,
    auth: { email, lastSignIn, provider },
    counts: {
      answers: answerCount ?? 0,
      duels: duelCount ?? 0,
      votes: voteCount ?? 0,
      comments: commentCount ?? 0,
      followers: followerCount ?? 0,
      following: followingCount ?? 0,
    },
    recentAnswers: recentAnswers ?? [],
    recentDuels: recentDuels ?? [],
  })
}
