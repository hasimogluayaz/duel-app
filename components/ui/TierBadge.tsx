import { getTier, getTierProgress } from '@/lib/utils/tier'
import { cn } from '@/lib/utils/cn'

interface Props {
  points: number
  showLabel?: boolean
  showProgress?: boolean
  size?: 'xs' | 'sm' | 'md'
}

export function TierBadge({ points, showLabel = true, showProgress = false, size = 'sm' }: Props) {
  const tier = getTier(points)
  const progress = showProgress ? getTierProgress(points) : null

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 gap-1 text-[10px]',
    sm: 'px-2 py-0.5 gap-1 text-[11px]',
    md: 'px-2.5 py-1 gap-1.5 text-xs',
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={cn(
        'inline-flex items-center rounded-full border font-bold',
        sizeClasses[size],
        tier.bg,
        tier.color,
      )}>
        <span>{tier.emoji}</span>
        {showLabel && <span>{tier.label}</span>}
      </span>

      {showProgress && progress && progress.next && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--stroke)' }}>
            <div
              className={cn('h-full rounded-full bg-gradient-to-r transition-all', tier.gradient)}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-fg-subtle whitespace-nowrap">
            {progress.pointsNeeded}p → {progress.next.emoji}
          </span>
        </div>
      )}

      {showProgress && progress && !progress.next && (
        <span className="text-[10px] font-bold text-yellow-400">MAX SEVİYE 👑</span>
      )}
    </div>
  )
}
