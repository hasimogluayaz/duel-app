import { formatDistanceToNow, format } from 'date-fns'
import { tr } from 'date-fns/locale'

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr })
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy', { locale: tr })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy HH:mm', { locale: tr })
}

export function timeUntil(date: string | Date): string {
  const diff = new Date(date).getTime() - Date.now()
  if (diff <= 0) return 'Sona erdi'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) return `${hours}s ${minutes}d kaldı`
  if (minutes > 0) return `${minutes}d ${seconds}sn kaldı`
  return `${seconds}sn kaldı`
}

export function formatPoints(points: number): string {
  if (points >= 1000) return `${(points / 1000).toFixed(1)}K`
  return points.toString()
}

/**
 * Generates a cryptographically secure URL-safe random token.
 * Uses Web Crypto API (available in Node.js 18+ and all browsers).
 */
export function generateShareToken(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}
