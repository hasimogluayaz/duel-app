'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatLimit, QUOTA_LABELS, type QuotaKey, type QuotaLimits } from '@/lib/quota/limits'

interface QuotaData {
  limits: QuotaLimits
  usage: Record<QuotaKey, number>
  is_premium: boolean
}

const VISIBLE_KEYS: QuotaKey[] = ['scenarios_per_day', 'duels_per_day', 'answers_per_day']

function pct(used: number, limit: number) {
  if (limit >= 999 || limit === -1) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

function barColor(p: number) {
  if (p >= 100) return 'bg-red-500'
  if (p >= 75) return 'bg-orange-400'
  if (p >= 50) return 'bg-yellow-400'
  return 'bg-emerald-500'
}

export default function QuotaBar({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<QuotaData | null>(null)

  useEffect(() => {
    fetch('/api/quota')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setData(d))
  }, [])

  if (!data) return null

  // If premium and all limits are high, don't show the bar
  const hasLowLimit = VISIBLE_KEYS.some((k) => (data.limits[k] ?? 0) < 999)
  if (!hasLowLimit) return null

  if (compact) {
    // Just show colored dots for use in navbar/sidebar
    return (
      <div className="flex items-center gap-1.5">
        {VISIBLE_KEYS.map((k) => {
          const limit = data.limits[k] ?? 0
          if (limit >= 999) return null
          const p = pct(data.usage[k] ?? 0, limit)
          return (
            <div
              key={k}
              className={`w-1.5 h-1.5 rounded-full ${barColor(p)}`}
              title={`${QUOTA_LABELS[k]}: ${data.usage[k]}/${formatLimit(limit)}`}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Günlük Kullanım</span>
        {!data.is_premium && (
          <Link
            href="/premium"
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Premium → Sınırsız
          </Link>
        )}
      </div>

      <div className="space-y-2.5">
        {VISIBLE_KEYS.map((k) => {
          const limit = data.limits[k] ?? 0
          const used = data.usage[k] ?? 0
          const unlimited = limit >= 999 || limit === -1
          const p = unlimited ? 0 : pct(used, limit)

          return (
            <div key={k}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/60">{QUOTA_LABELS[k]}</span>
                <span className={`text-xs font-medium ${p >= 100 ? 'text-red-400' : 'text-white/60'}`}>
                  {unlimited ? '∞' : `${used} / ${limit}`}
                </span>
              </div>
              {!unlimited && (
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor(p)}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!data.is_premium && (
        <p className="text-xs text-white/30 mt-3 leading-relaxed">
          Limitler, hesabındaki toplam puana göre her gün sıfırlanır.
          Premium'da tüm limitler kaldırılır.
        </p>
      )}
    </div>
  )
}
