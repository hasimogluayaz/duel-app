'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Search, Bot, Users, ExternalLink, Trash2, ChevronLeft, ChevronRight, Swords, Trophy, Clock } from 'lucide-react'

interface DuelRow {
  id: string
  code: string
  judge_mode: string
  ai_verdict: string | null
  winner_id: string | null
  voting_started_at: string | null
  created_at: string
  participant_count: number
  scenario: { content: string; active_date: string } | null
  creator: { username: string; display_name: string | null; avatar_url: string | null } | null
}

type Range = 'all' | 'today' | 'week'
type Mode = '' | 'ai' | 'community'

export default function AdminDuelsPage() {
  const toast = useToast()
  const [duels, setDuels] = useState<DuelRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [range, setRange] = useState<Range>('all')
  const [mode, setMode] = useState<Mode>('')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const LIMIT = 25

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedQ(query); setPage(1) }, 300)
    return () => clearTimeout(id)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ q: debouncedQ, mode, range, page: String(page) })
    const res = await fetch(`/api/admin/duels?${params}`)
    const json = await res.json()
    setDuels(json.duels ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [debouncedQ, mode, range, page])

  useEffect(() => { load() }, [load])

  async function handleDelete(id: string) {
    const res = await fetch('/api/admin/duels', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) { toast('Silinemedi.', 'error'); return }
    toast('Düello silindi.', 'success')
    setDuels(prev => prev.filter(d => d.id !== id))
    setConfirmDelete(null)
  }

  const totalPages = Math.ceil(total / LIMIT)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <Swords size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Düellolar</h1>
          <p className="text-xs text-fg-subtle mt-0.5">Tüm invite düellolarını ara, filtrele, sil</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Kod ara (örn: W02KGR)..."
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle font-mono uppercase focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {([
            ['all', 'Tümü'],
            ['today', 'Bugün'],
            ['week', '7 Gün'],
          ] as [Range, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setRange(v); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                range === v ? 'bg-primary text-white' : 'bg-surface border border-stroke text-fg-muted hover:text-fg'
              }`}
            >{label}</button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {([
            ['', 'Tüm Mod'],
            ['ai', '🤖 AI'],
            ['community', '👥 Topluluk'],
          ] as [Mode, string][]).map(([v, label]) => (
            <button
              key={v}
              onClick={() => { setMode(v); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                mode === v ? 'bg-primary text-white' : 'bg-surface border border-stroke text-fg-muted hover:text-fg'
              }`}
            >{label}</button>
          ))}
        </div>
      </div>

      <p className="text-xs text-fg-subtle mb-3">{total.toLocaleString('tr')} düello</p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {duels.length === 0 ? (
              <Card><p className="text-sm text-fg-muted text-center py-6">Düello bulunamadı.</p></Card>
            ) : duels.map(d => {
              const isAi = d.judge_mode === 'ai'
              const isActive = d.scenario?.active_date === today
              const hasVerdict = !!d.ai_verdict || !!d.winner_id
              const creatorName = d.creator?.display_name || d.creator?.username || '?'
              return (
                <Card key={d.id} className="flex flex-col gap-2.5">
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    <Avatar src={d.creator?.avatar_url} username={creatorName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-bold text-fg">{creatorName}</span>
                        <code className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-fg-muted">{d.code}</code>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          isAi ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-primary/10 border-primary/30 text-primary'
                        }`}>
                          {isAi ? <><Bot size={9} className="inline mr-0.5" /> AI</> : <><Users size={9} className="inline mr-0.5" /> Topluluk</>}
                        </span>
                        {isActive ? (
                          <span className="text-[10px] font-bold text-green-500 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] text-fg-subtle inline-flex items-center gap-1">
                            <Clock size={9} /> Geçmiş
                          </span>
                        )}
                        {hasVerdict && (
                          <span className="text-[10px] font-bold text-amber-400 inline-flex items-center gap-1">
                            <Trophy size={9} /> Karar verildi
                          </span>
                        )}
                      </div>
                      {d.scenario && (
                        <p className="text-xs text-fg-muted line-clamp-1">📅 {d.scenario.active_date} — {d.scenario.content}</p>
                      )}
                    </div>
                  </div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between gap-3 text-xs text-fg-subtle pt-2 border-t border-stroke">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Users size={11} /> {d.participant_count}/4</span>
                      {d.voting_started_at && <span>🗳️ oylama açık</span>}
                      <span>{new Date(d.created_at).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={`/d/${d.code}`} target="_blank">
                        <button className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors" title="Görüntüle">
                          <ExternalLink size={14} />
                        </button>
                      </Link>
                      {confirmDelete === d.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(d.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Sil</button>
                          <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-surface border border-stroke rounded-lg text-fg-muted">İptal</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(d.id)} className="p-1.5 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Sil">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {d.ai_verdict && (
                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2">
                      <p className="text-[11px] font-bold text-amber-500 mb-0.5">🤖 AI KARARI</p>
                      <p className="text-xs text-fg leading-relaxed line-clamp-2">{d.ai_verdict}</p>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-fg-muted">{page} / {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
