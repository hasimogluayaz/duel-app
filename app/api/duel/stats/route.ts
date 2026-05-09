import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/typed'
import { optionalAuth } from '@/lib/api/auth'

/**
 * GET /api/duel/stats?username=xxx
 * Returns detailed duel statistics for a user
 */
export const GET = optionalAuth(async (req, { userId: viewerId }) => {
  const supabase = createApiClient()
  const username = new URL(req.url).searchParams.get('username')
  if (!username) return NextResponse.json({ error: 'username gerekli' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, total_points')
    .eq('username', username.toLowerCase())
    .single()

  if (!profile) return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })

  const uid = (profile as any).id

  // All completed duels
  const { data: duels } = await supabase
    .from('duels')
    .select('id, winner_id, challenger_id, challenged_id, category, created_at, scenario:scenarios(category)')
    .or(`challenger_id.eq.${uid},challenged_id.eq.${uid}`)
    .eq('status', 'completed')

  const total = (duels ?? []).length
  const wins  = (duels ?? []).filter((d: any) => d.winner_id === uid).length
  const losses = total - wins

  // Category breakdown
  const catMap: Record<string, { w: number; l: number }> = {}
  for (const d of duels ?? []) {
    const cat = (d as any).scenario?.category ?? 'genel'
    if (!catMap[cat]) catMap[cat] = { w: 0, l: 0 }
    if ((d as any).winner_id === uid) catMap[cat].w++
    else catMap[cat].l++
  }
  const categories = Object.entries(catMap).map(([cat, { w, l }]) => ({
    category: cat,
    wins: w, losses: l, total: w + l,
    win_rate: w + l > 0 ? Math.round((w / (w + l)) * 100) : 0,
  })).sort((a, b) => b.total - a.total)

  const bestCategory  = [...categories].sort((a, b) => b.win_rate - a.win_rate)[0] ?? null
  const worstCategory = [...categories].sort((a, b) => a.win_rate - b.win_rate)[0] ?? null

  // Head-to-head vs viewer
  let h2h = null
  if (viewerId && viewerId !== uid) {
    const h2hDuels = (duels ?? []).filter((d: any) =>
      (d.challenger_id === viewerId || d.challenged_id === viewerId)
    )
    h2h = {
      total: h2hDuels.length,
      my_wins: h2hDuels.filter((d: any) => d.winner_id === viewerId).length,
      their_wins: h2hDuels.filter((d: any) => d.winner_id === uid).length,
    }
  }

  // Win streak (current)
  const sorted = [...(duels ?? [])].sort((a: any, b: any) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  let currentStreak = 0
  for (const d of sorted) {
    if ((d as any).winner_id === uid) currentStreak++
    else break
  }

  // Monthly trend (last 6 months)
  const now = new Date()
  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthDuels = (duels ?? []).filter((dd: any) => dd.created_at?.startsWith(month))
    const mw = monthDuels.filter((dd: any) => (dd as any).winner_id === uid).length
    return { month, wins: mw, total: monthDuels.length }
  })

  return NextResponse.json({
    total, wins, losses,
    win_rate: total > 0 ? Math.round((wins / total) * 100) : 0,
    current_streak: currentStreak,
    categories,
    best_category: bestCategory,
    worst_category: worstCategory,
    h2h,
    monthly_trend: monthlyTrend,
  })
})
