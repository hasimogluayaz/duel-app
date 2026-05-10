'use client'

import { cn } from '@/lib/utils/cn'

interface ProgressBarProps {
  value: number // 0-100
  className?: string
  colorA?: string
  colorB?: string
  showLabels?: boolean
  labelA?: string
  labelB?: string
  countA?: number
  countB?: number
}

export function ProgressBar({
  value,
  className,
  colorA = 'bg-primary',
  colorB = 'bg-primary',
  showLabels,
  labelA = 'A',
  labelB = 'B',
  countA,
  countB,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div className={cn('w-full', className)}>
      {showLabels && (
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-primary/70 font-medium">
            {labelA} {countA !== undefined && <span className="text-fg-muted">({countA})</span>}
          </span>
          <span className="text-primary/70 font-medium">
            {labelB} {countB !== undefined && <span className="text-fg-muted">({countB})</span>}
          </span>
        </div>
      )}
      <div className="relative h-3 bg-surface-2 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorA)}
          style={{ width: `${clampedValue}%` }}
        />
        <div
          className={cn('absolute top-0 right-0 h-full rounded-full transition-all duration-500', colorB)}
          style={{ width: `${100 - clampedValue}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs mt-1 text-fg-subtle">
          <span>{Math.round(clampedValue)}%</span>
          <span>{Math.round(100 - clampedValue)}%</span>
        </div>
      )}
    </div>
  )
}
