'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/utils/formatting'
import { ShieldAlert, Trash2, FileText, Swords, ExternalLink, Flag, CheckCircle2, XCircle, MessageSquare } from 'lucide-react'
import Link from 'next/link'

const REASON_LABELS: Record<string, string> = {
  spam: '🗑️ Spam',
  hate_speech: '😠 Nefret söylemi',
  inappropriate: '🔞 Uygunsuz',
  harassment: '👊 Taciz',
  other: '❓ Diğer',
}

interface ReportRow {
  id: string
  target_type: string
  target_id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  reporter: { username: string; display_name: string | null } | null
  target_content: any
}

interface AnswerRow {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: { username: string; display_name: string | null; avatar_url: string | null } | null
}

interface DuelRow {
  id: string
  status: string
  created_at: string
  share_token: string
  ai_verdict: string | null
  ai_roast: string | null
  challenger: { username: string } | null
  challenged: { username: string } | null
}

export default function AdminIcerikPage() {
  const toast = useToast()
  const [answers, setAnswers] = useState<AnswerRow[]>([])
  const [duels, setDuels] = useState<DuelRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [reportsLoading, setReportsLoading] = useState(true)
  const [tab, setTab] = useState<'reports' | 'answers' | 'duels'>('reports')

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then(d => { setAnswers(d.answers ?? []); setDuels(d.duels ?? []); setLoading(false) })
    fetch('/api/admin/reports')
      .then(r => r.json())
      .then(d => { setReports(d.reports ?? []); setReportsLoading(false) })
      .catch(() => setReportsLoading(false))
  }, [])

  async function handleReport(id: string, action: 'resolve' | 'dismiss' | 'delete_content') {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    if (res.ok) {
      toast(action === 'delete_content' ? 'İçerik silindi!' : 'Rapor güncellendi!', 'success')
      setReports(prev => prev.filter(r => r.id !== id))
    } else { toast('Hata oluştu.', 'error') }
  }

  async function deleteItem(type: 'answer' | 'duel', id: string) {
    const res = await fetch(`/api/admin/content?type=${type}&id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Silinemedi.', 'error'); return }
    toast('Silindi!', 'success')
    if (type === 'answer') setAnswers(prev => prev.filter(a => a.id !== id))
    else setDuels(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-red-500/15 rounded-xl flex items-center justify-center">
          <ShieldAlert size={18} className="text-red-400" />
        </div>
        <h1 className="text-2xl font-black text-fg">İçerik Moderasyonu</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {([
          { key: 'reports', label: 'Raporlar', icon: Flag, badge: reports.length },
          { key: 'answers', label: 'Cevaplar', icon: FileText },
          { key: 'duels', label: 'Düellolar', icon: Swords },
        ] as const).map(({ key, label, icon: Icon, badge }: any) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key ? 'bg-primary text-white' : 'bg-surface border border-stroke text-fg-muted hover:text-fg'
            }`}
          >
            <Icon size={14} />
            {label}
            {badge > 0 && <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        reportsLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <Card className="text-center py-14 border-dashed">
            <CheckCircle2 size={32} className="text-green-400 opacity-50 mx-auto mb-2" />
            <p className="text-fg font-semibold">Bekleyen rapor yok</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map(r => (
              <Card key={r.id} className="border-red-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
                    <Flag size={14} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-red-400">{REASON_LABELS[r.reason] ?? r.reason}</span>
                      <span className="text-xs text-fg-subtle capitalize">{r.target_type}</span>
                      {r.reporter && <span className="text-xs text-fg-subtle">· @{r.reporter.username}</span>}
                      <span className="text-xs text-fg-subtle">{timeAgo(r.created_at)}</span>
                    </div>
                    {r.description && <p className="text-xs text-fg-muted italic mb-2">"{r.description}"</p>}

                    {/* Target content preview */}
                    {r.target_content?.content && (
                      <div className="bg-surface-2 border border-stroke rounded-lg p-2 mb-2">
                        <p className="text-xs text-fg-muted line-clamp-3">{r.target_content.content}</p>
                        {r.target_content?.user?.username && (
                          <Link href={`/profil/${r.target_content.user.username}`} className="text-[10px] text-primary/70 mt-1 block">
                            @{r.target_content.user.username}
                          </Link>
                        )}
                      </div>
                    )}
                    {r.target_type === 'duel' && r.target_content?.share_token && (
                      <div className="bg-surface-2 border border-stroke rounded-lg p-2 mb-2">
                        <p className="text-xs text-fg-muted">
                          {r.target_content.challenger?.username} vs {r.target_content.challenged?.username}
                        </p>
                        <Link href={`/duel/${r.target_content.share_token}`} target="_blank" className="text-[10px] text-blue-400">Düelloyu gör →</Link>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <button onClick={() => handleReport(r.id, 'delete_content')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-lg transition-colors">
                        <Trash2 size={11} /> İçeriği Sil
                      </button>
                      <button onClick={() => handleReport(r.id, 'resolve')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/15 border border-green-500/25 px-3 py-1.5 rounded-lg transition-colors">
                        <CheckCircle2 size={11} /> Çözüldü
                      </button>
                      <button onClick={() => handleReport(r.id, 'dismiss')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-fg-subtle hover:text-fg bg-surface-2 hover:bg-surface border border-stroke px-3 py-1.5 rounded-lg transition-colors">
                        <XCircle size={11} /> Reddet
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {loading && tab !== 'reports' ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : tab === 'answers' ? (
        <div className="flex flex-col gap-2">
          {answers.length === 0 && (
            <Card className="text-center py-12 border-dashed">
              <p className="text-fg-subtle text-sm">Cevap yok</p>
            </Card>
          )}
          {answers.map(a => (
            <Card key={a.id}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    {a.profiles && (
                      <Link href={`/profil/${a.profiles.username}`} className="text-xs font-semibold text-primary/70 hover:underline">
                        @{a.profiles.username}
                      </Link>
                    )}
                    <span className="text-xs text-fg-subtle">{timeAgo(a.created_at)}</span>
                  </div>
                  <p className="text-sm text-fg leading-relaxed">{a.content}</p>
                </div>
                <button
                  onClick={() => deleteItem('answer', a.id)}
                  className="p-2 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {duels.length === 0 && (
            <Card className="text-center py-12 border-dashed">
              <p className="text-fg-subtle text-sm">Düello yok</p>
            </Card>
          )}
          {duels.map(d => (
            <Card key={d.id}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-fg">
                      {d.challenger?.username} vs {d.challenged?.username}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      d.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      d.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{d.status}</span>
                    <span className="text-xs text-fg-subtle">{timeAgo(d.created_at)}</span>
                  </div>
                  {d.ai_verdict && (
                    <p className="text-xs text-fg-muted mb-1">🏆 {d.ai_verdict}</p>
                  )}
                  {d.ai_roast && (
                    <p className="text-xs text-amber-400/80 italic">&quot;{d.ai_roast}&quot;</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link href={`/duel/${d.share_token}`} target="_blank">
                    <button className="p-2 rounded-lg text-fg-subtle hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                      <ExternalLink size={15} />
                    </button>
                  </Link>
                  <button
                    onClick={() => deleteItem('duel', d.id)}
                    className="p-2 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
