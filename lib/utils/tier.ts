export interface Tier {
  label: string
  emoji: string
  rank: number
  minPoints: number
  maxPoints: number
  color: string           // text color class
  bg: string             // bg + border class
  gradient: string       // from/to gradient
  ringColor: string      // ring-* class for avatar
}

const TIERS: Tier[] = [
  {
    label: 'Aday',
    emoji: '🥚',
    rank: 1,
    minPoints: 0,
    maxPoints: 99,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/15 border-zinc-500/30',
    gradient: 'from-zinc-500 to-zinc-600',
    ringColor: 'ring-zinc-500/40',
  },
  {
    label: 'Çaylak',
    emoji: '⚡',
    rank: 2,
    minPoints: 100,
    maxPoints: 499,
    color: 'text-green-400',
    bg: 'bg-green-500/15 border-green-500/30',
    gradient: 'from-green-500 to-emerald-500',
    ringColor: 'ring-green-500/40',
  },
  {
    label: 'Düellocu',
    emoji: '⚔️',
    rank: 3,
    minPoints: 500,
    maxPoints: 1999,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15 border-blue-500/30',
    gradient: 'from-blue-500 to-cyan-500',
    ringColor: 'ring-blue-500/40',
  },
  {
    label: 'Usta',
    emoji: '🎯',
    rank: 4,
    minPoints: 2000,
    maxPoints: 4999,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15 border-purple-500/30',
    gradient: 'from-purple-500 to-violet-500',
    ringColor: 'ring-purple-500/40',
  },
  {
    label: 'Şampiyon',
    emoji: '🏆',
    rank: 5,
    minPoints: 5000,
    maxPoints: 9999,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
    gradient: 'from-amber-500 to-yellow-500',
    ringColor: 'ring-amber-500/40',
  },
  {
    label: 'Efsane',
    emoji: '👑',
    rank: 6,
    minPoints: 10000,
    maxPoints: Infinity,
    color: 'text-yellow-300',
    bg: 'bg-yellow-500/20 border-yellow-400/40',
    gradient: 'from-yellow-400 to-orange-400',
    ringColor: 'ring-yellow-400/50',
  },
]

export function getTier(points: number): Tier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].minPoints) return TIERS[i]
  }
  return TIERS[0]
}

export interface TierProgress {
  current: Tier
  next: Tier | null
  progress: number       // 0–100
  pointsInTier: number   // points earned within this tier
  pointsNeeded: number   // total points needed for next tier
}

export function getTierProgress(points: number): TierProgress {
  const current = getTier(points)
  const nextTier = TIERS.find(t => t.rank === current.rank + 1) ?? null

  if (!nextTier) {
    return { current, next: null, progress: 100, pointsInTier: points - current.minPoints, pointsNeeded: 0 }
  }

  const pointsInTier = points - current.minPoints
  const tierRange = nextTier.minPoints - current.minPoints
  const progress = Math.min(100, Math.round((pointsInTier / tierRange) * 100))

  return {
    current,
    next: nextTier,
    progress,
    pointsInTier,
    pointsNeeded: nextTier.minPoints - points,
  }
}

export function getAllTiers(): Tier[] {
  return TIERS
}
