import { createApiClient } from '@/lib/supabase/typed'
import { NextResponse } from 'next/server'

/**
 * POST /api/cron/streak-reset
 * Runs daily at 01:00 UTC via Vercel Cron.
 * Resets streak_count to 0 for users who haven't played in 2+ days
 * AND have no streak_freeze_count remaining.
 * Users with freeze tokens get their freeze decremented instead.
 */
export async function POST(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createApiClient()

  // Find users who last played more than 1 day ago (missed yesterday)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 1)
  cutoff.setHours(0, 0, 0, 0)

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, streak_count, streak_freeze_count, last_played_at')
    .gt('streak_count', 0)
    .lt('last_played_at', cutoff.toISOString())

  if (error) {
    console.error('[streak-reset] Query error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!users?.length) {
    return NextResponse.json({ reset: 0, frozen: 0 })
  }

  let reset = 0
  let frozen = 0

  for (const user of users) {
    const freezeCount = (user as any).streak_freeze_count ?? 0

    if (freezeCount > 0) {
      // Use freeze — preserve streak, decrement freeze
      await supabase.from('profiles').update({
        streak_freeze_count: freezeCount - 1,
      } as any).eq('id', user.id)

      // Notify user that freeze was used
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'streak_reminder',
        title: '🧊 Streak Freeze Kullanıldı!',
        message: `Dün oynamadın ama dondurucu serini korudu! Kalan: ${freezeCount - 1}`,
        data: { freeze_used: true, remaining: freezeCount - 1 },
      } as any).catch(() => {})

      frozen++
    } else {
      // No freeze — reset streak
      await supabase.from('profiles').update({
        streak_count: 0,
      } as any).eq('id', user.id)

      // Notify user streak was lost (only if they had a meaningful streak)
      if ((user.streak_count ?? 0) >= 3) {
        await supabase.from('notifications').insert({
          user_id: user.id,
          type: 'streak_reminder',
          title: '💔 Seriniz Koptu!',
          message: `${user.streak_count} günlük seriniz koptu. Yeniden başlamak için bugün oyna!`,
          data: { lost_streak: user.streak_count },
        } as any).catch(() => {})
      }

      reset++
    }
  }

  console.log(`[streak-reset] reset=${reset} frozen=${frozen} at ${new Date().toISOString()}`)
  return NextResponse.json({ reset, frozen })
}
