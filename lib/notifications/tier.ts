/**
 * Check if a user crossed a tier boundary and send a notification.
 * Call this whenever total_points is updated for a user.
 */

import { getTier } from '@/lib/utils/tier'

const TIER_EMOJIS: Record<string, string> = {
  'Çaylak':   '⚡',
  'Düellocu': '⚔️',
  'Usta':     '🎯',
  'Şampiyon': '🏆',
  'Efsane':   '👑',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function checkTierUp(supabase: any, userId: string, oldPoints: number, newPoints: number): Promise<void> {
  try {
    const oldTier = getTier(oldPoints)
    const newTier = getTier(newPoints)

    if (newTier.rank <= oldTier.rank) return // no tier change

    const emoji = TIER_EMOJIS[newTier.label] ?? newTier.emoji

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'achievement',
      title: `${emoji} Rütbe Yükseldi: ${newTier.label}!`,
      message: `Tebrikler! Artık bir ${newTier.label} düellocu. Yeni unvanını profilinde göster!`,
      data: { tier: newTier.label, old_tier: oldTier.label },
    })

    // Also create an achievement record
    await supabase.from('achievements').upsert({
      user_id: userId,
      type: `tier_${newTier.label.toLowerCase().replace('ş', 's').replace('ç', 'c').replace('ü', 'u').replace('ı', 'i')}`,
      earned_at: new Date().toISOString(),
    }).catch(() => {})
  } catch {
    // fire-and-forget — never throw
  }
}
