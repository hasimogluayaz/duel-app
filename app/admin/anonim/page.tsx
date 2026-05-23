'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Trash2, Monitor, Globe2, AlertTriangle, UserX } from 'lucide-react'

interface AnonAnswer {
  id: string
  content: string
  ip_address: string | null
  user_agent: string | null
  created_at: string
  scenario: { id: string; content: string; active_date: string } | { id: string; content: string; active_date: string }[] | null
}

interface IpRow { ip: string; count: number }

export default function AdminAnonymousAnswersPage() {
  const [answers, setAnswers] = useState<AnonAnswer[]>([])
  const [ipSummary, setIpSummary] = useState<IpRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterIp, setFilterIp] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/anonymous-answers?limit=200')
    const data = await res.json() as { answers: AnonAnswer[]; ipSummary: IpRow[] }
    setAnswers(data.answers ?? [])
    setIpSummary(data.ipSummary ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Bu anonim cevabı silmek istediğinden emin misin?')) return
    setDeletingId(id)
    try {
      const res = await fetch('/api/admin/anonymous-answers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) setAnswers(prev => prev.filter(a => a.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = filterIp ? answers.filter(a => a.ip_address === filterIp) : answers

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
          <UserX size={20} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Anonim Cevaplar</h1>
          <p className="text-xs text-fg-subtle mt-0.5">
            Giriş yapmadan yazılan cevaplar — IP + tarayıcı parmak izi
          </p>
        </div>
      </div>

      {/* Privacy notice */}
      <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
        <div className="flex gap-3">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-fg-muted leading-relaxed">
            <strong className="text-amber-500">Gizlilik notu:</strong> Anonim
            kullanıcıların Google email'i veya gerçek kimliği <strong>tarayıcı
            tarafından bizimle paylaşılmaz</strong> — bu temel web güvenliği.
            Yalnızca IP adresi + User-Agent kaydedilir. Aynı IP'den çok cevap
            geliyorsa muhtemelen aynı cihazdır.
          </div>
        </div>
      </Card>

      {/* IP frequency leaderboard */}
      {ipSummary.length > 0 && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Globe2 size={16} className="text-primary" />
            <h2 className="font-bold text-fg text-sm">En Sık Görülen IP&apos;ler</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {ipSummary.map(row => (
              <button
                key={row.ip}
                onClick={() => setFilterIp(filterIp === row.ip ? null : row.ip)}
                className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-colors ${
                  filterIp === row.ip
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-2 text-fg-muted border-stroke hover:border-primary/40'
                }`}
              >
                {row.ip}
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[10px]">
                  {row.count}
                </span>
              </button>
            ))}
          </div>
          {filterIp && (
            <button
              onClick={() => setFilterIp(null)}
              className="text-xs text-fg-subtle hover:text-fg mt-3"
            >
              ✕ Filtreyi temizle
            </button>
          )}
        </Card>
      )}

      {/* Answer list */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-fg-subtle">
          {filtered.length} cevap {filterIp && `· IP: ${filterIp}`}
        </p>
        {filtered.length === 0 ? (
          <Card><p className="text-sm text-fg-muted text-center py-6">Anonim cevap yok.</p></Card>
        ) : filtered.map(a => {
          const sc = Array.isArray(a.scenario) ? a.scenario[0] : a.scenario
          return (
            <Card key={a.id} className="flex flex-col gap-2">
              {sc?.content && (
                <p className="text-xs text-fg-subtle line-clamp-1">
                  📅 {sc.active_date} — {sc.content}
                </p>
              )}
              <p className="text-sm text-fg leading-relaxed">{a.content}</p>
              <div className="flex flex-wrap gap-2 items-center text-[11px] text-fg-subtle mt-1">
                {a.ip_address && (
                  <span className="font-mono px-2 py-0.5 rounded bg-surface-2 border border-stroke">
                    🌐 {a.ip_address}
                  </span>
                )}
                {a.user_agent && (
                  <span className="font-mono px-2 py-0.5 rounded bg-surface-2 border border-stroke max-w-[300px] truncate inline-flex items-center gap-1">
                    <Monitor size={10} />
                    {a.user_agent}
                  </span>
                )}
                <span>{new Date(a.created_at).toLocaleString('tr-TR')}</span>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deletingId === a.id}
                  className="ml-auto text-red-400 hover:text-red-300 disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  Sil
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
