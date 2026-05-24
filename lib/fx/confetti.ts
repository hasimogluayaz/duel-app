/**
 * Centralized celebration effects. Lazy-imports canvas-confetti so it never
 * adds weight to the initial bundle.
 *
 * Usage:
 *   import { celebrate } from '@/lib/fx/confetti'
 *   celebrate('answer-sent')
 */

type Preset = 'answer-sent' | 'first-vote' | 'streak' | 'verdict' | 'win' | 'mild'

async function fire(opts: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const mod = await import('canvas-confetti')
  mod.default(opts)
}

export async function celebrate(preset: Preset) {
  switch (preset) {
    case 'answer-sent':
      // Small zip from the bottom — non-intrusive
      await fire({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.85 },
        scalar: 0.85,
        colors: ['#2a6cf0', '#3b82f6', '#22c55e'],
      })
      return
    case 'first-vote':
      await fire({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        scalar: 0.7,
      })
      return
    case 'streak':
      // Two bursts from the sides — milestone feeling
      await fire({ particleCount: 90, spread: 75, origin: { x: 0.15, y: 0.6 }, colors: ['#f59e0b', '#f97316', '#ef4444'] })
      await fire({ particleCount: 90, spread: 75, origin: { x: 0.85, y: 0.6 }, colors: ['#f59e0b', '#f97316', '#ef4444'] })
      return
    case 'verdict':
      // Gold rain from the top
      await fire({
        particleCount: 120,
        spread: 120,
        origin: { y: 0 },
        startVelocity: 35,
        gravity: 0.8,
        scalar: 1.1,
        colors: ['#fbbf24', '#f59e0b', '#fde68a'],
      })
      return
    case 'win':
      // Big celebration
      await fire({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        startVelocity: 45,
        colors: ['#fbbf24', '#f59e0b', '#22c55e', '#2a6cf0'],
      })
      return
    case 'mild':
      await fire({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        scalar: 0.6,
      })
      return
  }
}

/**
 * Disable confetti for users who set prefers-reduced-motion.
 */
export function celebrateSafe(preset: Preset) {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  void celebrate(preset)
}
