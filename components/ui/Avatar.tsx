import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  username: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-24 h-24 text-3xl',
}

const pixelSizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
}

function getInitial(username: string) {
  return username.charAt(0).toUpperCase()
}

function getColor(username: string) {
  const colors = [
    'from-indigo-500 to-primary',
    'from-blue-500 to-cyan-600',
    'from-green-500 to-emerald-600',
    'from-amber-500 to-orange-600',
    'from-primary to-secondary',
    'from-primary to-primary',
  ]
  const idx = username.charCodeAt(0) % colors.length
  return colors[idx]
}

export function Avatar({ src, username, size = 'md', className }: AvatarProps) {
  const px = pixelSizeMap[size]

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden flex-shrink-0', sizeMap[size], className)}>
        <Image src={src} alt={username} width={px} height={px} className="object-cover" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex-shrink-0 rounded-full flex items-center justify-center font-bold text-fg bg-gradient-to-br',
        sizeMap[size],
        getColor(username),
        className
      )}
    >
      {getInitial(username)}
    </div>
  )
}
