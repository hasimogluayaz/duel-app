'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TagEntry {
  tag: string
  count: number
}

const TAG_LABELS: Record<string, string> = {
  genel: 'genel', ask: 'aşk', is: 'iş', aile: 'aile',
  sosyal: 'sosyal', teknoloji: 'teknoloji', dunya: 'dünya', mizah: 'mizah',
  etik: 'etik', duygusal: 'duygusal', sosyalmedya: 'sosyalmedya', felsefe: 'felsefe',
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return `${n}`
}

export default function TrendingTags() {
  const [tags, setTags] = useState<TagEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/scenarios/trending')
      .then(r => r.json())
      .then(d => {
        // Aggregate by category
        const counts: Record<string, number> = {}
        for (const s of (d.scenarios ?? [])) {
          const cat = s.category ?? 'genel'
          counts[cat] = (counts[cat] ?? 0) + (s.answer_count ?? 1)
        }
        const sorted = Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .map(([tag, count]) => ({ tag, count }))
        setTags(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-wrap gap-1.5 animate-pulse">
      {[80, 60, 72, 55, 65].map((w, i) => (
        <div key={i} style={{ width: w, height: 28, borderRadius: 99, background: 'var(--stroke)' }} />
      ))}
    </div>
  )

  if (tags.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {tags.slice(0, 6).map((t, i) => (
        <Link
          key={t.tag}
          href={`/kesfet?q=${encodeURIComponent(t.tag)}`}
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 10, transition: 'background .12s' }}
          className="hover:bg-surface-2"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ font: '700 12px Geist Mono, monospace', color: 'var(--k-blue-500)', letterSpacing: '-0.01em' }}>
              {i + 1}
            </span>
            <div>
              <div style={{ font: '600 13px Geist, sans-serif', color: 'var(--fg)', letterSpacing: '-0.005em' }}>
                #{TAG_LABELS[t.tag] ?? t.tag}
              </div>
              {i === 0 && (
                <div style={{ font: '400 11px Geist, sans-serif', color: 'var(--fg-subtle)', marginTop: 1 }}>
                  Trend etiket
                </div>
              )}
            </div>
          </div>
          {i < 3 && (
            <span className="tab-nums" style={{ font: '600 12px Geist Mono, monospace', color: 'var(--fg-subtle)' }}>
              {formatCount(t.count)}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
