/**
 * Lightweight skeleton placeholders.
 *
 * Usage:
 *   <Skeleton className="h-4 w-32" />
 *   <SkeletonCircle size={40} />
 *   <SkeletonCard />   ← composed card placeholder
 */

import { cn } from '@/lib/utils/cn'

export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-surface-2', className)}
      {...rest}
    />
  )
}

export function SkeletonCircle({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-full bg-surface-2 shrink-0', className)}
      style={{ width: size, height: size }}
    />
  )
}

/**
 * Standard "answer card" placeholder — used in feeds, profile, duel grids.
 */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-stroke bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SkeletonCircle size={28} />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  )
}

/**
 * 2-column duel grid skeleton.
 */
export function SkeletonDuelGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * List of N rows (compact).
 */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-stroke">
          <SkeletonCircle size={36} />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2.5 w-48" />
          </div>
        </div>
      ))}
    </div>
  )
}
