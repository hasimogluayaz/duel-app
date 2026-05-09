'use client'

import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { TrendingUp, Users, UserPlus, Swords } from 'lucide-react'

interface DayData {
  date: string
  dau: number
  signups: number
  duels: number
}

interface Summary {
  totalDau: number
  totalSignups: number
  totalDuels: number
  peakDau: number
  avgDau: number
}

type Series = 'dau' | 'signups' | 'duels'

const SERIES_CONFIG: Record<Series, { label: string; color: string; strokeColor: string; fillColor: string; icon: React.ElementType }> = {
  dau:     { label: 'Aktif Kullanıcı', color: 'text-purple-400', strokeColor: '#a855f7', fillColor: 'rgba(168,85,247,0.15)', icon: Users },
  signups: { label: 'Yeni Kayıt',      color: 'text-blue-400',   strokeColor: '#60a5fa', fillColor: 'rgba(96,165,250,0.15)',  icon: UserPlus },
  duels:   { label: 'Düello',          color: 'text-pink-400',   strokeColor: '#f472b6', fillColor: 'rgba(244,114,182,0.15)', icon: Swords },
}

// ── Inline sparkline SVG chart ────────────────────────────────────────────────
function SparkChart({
  data,
  series,
  height = 96,
}: {
  data: DayData[]
  series: Series
  height?: number
}) {
  if (data.length === 0) return null

  const values = data.map(d => d[series])
  const max = Math.max(...values, 1)
  const w = 600
  const h = height
  const padX = 0
  const padY = 6

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1 || 1)) * (w - 2 * padX)
    const y = padY + (1 - v / max) * (h - 2 * padY)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polyline = points.join(' ')
  const fillPath = `M${points[0]} L${points.join(' L')} L${(w - padX).toFixed(1)},${h} L${padX},${h} Z`

  const { strokeColor, fillColor } = SERIES_CONFIG[series]

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height }}
      preserveAspectRatio="none"
    >
      <path d={fillPath} fill={fillColor} />
      <polyline
        points={polyline}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ── Bar chart (simple vertical bars) ─────────────────────────────────────────
function BarChart({
  data,
  series,
  height = 96,
}: {
  data: DayData[]
  series: Series
  height?: number
}) {
  if (data.length === 0) return null

  const values = data.map(d => d[series])
  const max = Math.max(...values, 1)
  const { strokeColor } = SERIES_CONFIG[series]
  const barCount = data.length
  const w = 600
  const barW = (w / barCount) * 0.7
  const gap = (w / barCount) * 0.3

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      {values.map((v, i) => {
        const barH = Math.max((v / max) * (height - 4), v > 0 ? 2 : 0)
        const x = i * (w / barCount) + gap / 2
        const y = height - barH
        return (
          <rect
            key={i}
            x={x.toFixed(1)}
            y={y.toFixed(1)}
            width={barW.toFixed(1)}
            height={barH.toFixed(1)}
            fill={strokeColor}
            fillOpacity="0.6"
            rx="2"
          />
        )
      })}
    </svg>
  )
}

// ── Axis labels ───────────────────────────────────────────────────────────────
function AxisLabels({ data, days }: { data: DayData[]; days: number }) {
  if (data.length === 0) return null

  // Show first, middle, last
  const indices = [0, Math.floor(data.length / 2), data.length - 1]
  const labelPositions = indices.map(i => ({
    pct: i / (data.length - 1 || 1) * 100,
    label: new Date(data[i].date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="relative h-4 mt-1">
      {labelPositions.map(({ pct, label }, i) => (
        <span
          key={i}
          className="absolute text-[10px] text-fg-subtle transform -translate-x-1/2"
          style={{ left: `${pct}%` }}
        >
          {label}
        </span>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DauChart() {
  const [data, setData] = useState<DayData[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<7 | 30>(30)
  const [activeSeries, setActiveSeries] = useState<Series>('dau')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/dau?days=${days}`)
      .then(r => r.json())
      .then(d => {
        setData(d.chartData ?? [])
        setSummary(d.summary ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [days])

  const cfg = SERIES_CONFIG[activeSeries]
  const Icon = cfg.icon

  return (
    <div className="bg-surface border border-stroke rounded-2xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-purple-400" />
          <h2 className="font-bold text-fg text-sm">Platform Aktivitesi</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {([7, 30] as const).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                days === d
                  ? 'bg-purple-600 text-white'
                  : 'text-fg-subtle hover:text-fg hover:bg-surface-2'
              }`}
            >
              {d}G
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(Object.entries(SERIES_CONFIG) as [Series, typeof cfg][]).map(([key, c]) => {
            const CIcon = c.icon
            const value = key === 'dau' ? summary.avgDau
              : key === 'signups' ? summary.totalSignups
              : summary.totalDuels
            const sub = key === 'dau' ? `maks ${summary.peakDau}` : `toplam`
            return (
              <button
                key={key}
                onClick={() => setActiveSeries(key)}
                className={`text-left p-3 rounded-xl border transition-all ${
                  activeSeries === key
                    ? 'border-purple-500/40 bg-purple-500/8'
                    : 'border-stroke hover:border-purple-500/20 hover:bg-purple-500/4'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <CIcon size={12} className={c.color} />
                  <span className={`text-xs font-medium ${c.color}`}>{c.label}</span>
                </div>
                <p className="text-lg font-black text-fg">{value.toLocaleString('tr')}</p>
                <p className="text-[10px] text-fg-subtle">{sub}</p>
              </button>
            )
          })}
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="sm" /></div>
      ) : data.length === 0 ? (
        <p className="text-center text-fg-subtle text-sm py-10">Veri yok</p>
      ) : (
        <div>
          <div className="rounded-xl overflow-hidden bg-surface-2 border border-stroke/50">
            {activeSeries === 'dau' ? (
              <SparkChart data={data} series={activeSeries} height={100} />
            ) : (
              <BarChart data={data} series={activeSeries} height={100} />
            )}
          </div>
          <AxisLabels data={data} days={days} />
        </div>
      )}
    </div>
  )
}
