import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

/**
 * POST /api/cron/season-end
 * Runs daily at 02:00 UTC via Vercel Cron.
 * Checks if the active season has ended. If so:
 *  1. Determines top 3 winners by season_points
 *  2. Awards achievement + notification to winners
 *  3. Resets season_points for all users
 *  4. Creates a new season (next month)
 *  5. Marks old season as inactive
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createApiClient()

  // Get active season
  const { data: season } = await (supabase as any)
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()

  if (!season) {
    return NextResponse.json({ message: 'No active season.' })
  }

  const now = new Date()
  const endsAt = new Date(season.ends_at)

  if (endsAt > now) {
    return NextResponse.json({ message: 'Season still active.', days_left: Math.ceil((endsAt.getTime() - now.getTime()) / 86400000) })
  }

  // Season has ended — get top 3 players
  const { data: top3 } = await supabase
    .from('profiles')
    .select('id, username, display_name, season_points')
    .eq('is_banned', false)
    .gt('season_points', 0)
    .order('season_points', { ascending: false })
    .limit(3)

  const winners = top3 ?? []
  const RANK_EMOJIS = ['🥇', '🥈', '🥉']
  const RANK_NAMES = ['Birinci', 'İkinci', 'Üçüncü']
  const RANK_BONUS = [2000, 1000, 500]

  // Award achievements + notifications + bonus points to top 3
  for (let i = 0; i < winners.length; i++) {
    const w = winners[i] as any
    const emoji = RANK_EMOJIS[i]
    const rankName = RANK_NAMES[i]
    const bonus = RANK_BONUS[i]

    // Achievement
    await (supabase as any).from('achievements').upsert({
      user_id: w.id,
      type: `season_${rankName.toLowerCase()}`,
      earned_at: new Date().toISOString(),
    }).catch(() => {})

    // Bonus points
    const { data: p } = await supabase.from('profiles').select('total_points, weekly_points').eq('id', w.id).single()
    if (p) {
      await supabase.from('profiles').update({
        total_points: ((p as any).total_points ?? 0) + bonus,
        weekly_points: ((p as any).weekly_points ?? 0) + bonus,
      } as any).eq('id', w.id)
    }

    // Notification
    await supabase.from('notifications').insert({
      user_id: w.id,
      type: 'achievement',
      title: `${emoji} Sezon Sona Erdi — Sen ${rankName} Oldun!`,
      message: `${season.name} sezonunu ${w.season_points} puanla ${rankName.toLowerCase()} tamamladın! +${bonus} puan kazandın.`,
      data: { season_id: season.id, rank: i + 1, season_points: w.season_points, bonus },
    } as any).catch(() => {})
  }

  // Mark current season as inactive + set winner
  await (supabase as any).from('seasons').update({
    is_active: false,
    winner_id: winners[0]?.id ?? null,
    ended_at: now.toISOString(),
  }).eq('id', season.id)

  // Reset season_points for all users
  await supabase.from('profiles').update({ season_points: 0 } as any).gt('season_points', 0)

  // Create new season (starts now, ends in ~30 days)
  const newEndsAt = new Date(now)
  newEndsAt.setDate(newEndsAt.getDate() + 30)

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
  const newSeasonName = `${monthNames[now.getMonth()]} ${now.getFullYear()} Sezonu`

  await (supabase as any).from('seasons').insert({
    name: newSeasonName,
    starts_at: now.toISOString(),
    ends_at: newEndsAt.toISOString(),
    is_active: true,
  })

  console.log(`[season-end] Season "${season.name}" ended. Winners: ${winners.map((w: any) => w.username).join(', ')}. New season: ${newSeasonName}`)

  return NextResponse.json({
    success: true,
    ended_season: season.name,
    new_season: newSeasonName,
    winners: winners.map((w: any, i: number) => ({ rank: i + 1, username: w.username, points: w.season_points })),
  })
}
