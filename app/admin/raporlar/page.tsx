'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils/cn'
import { Flag, CheckCircle, XCircle, Trash2, ExternalLink, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam / Reklam',
  hate_speech: 'Nefret söylemi',
  inappropriate: 'Uygunsuz içerik',
  harassment: 'Taciz / Zorbalık',
  other: 'Diğer',
}

const STATUS_TABS = [
  { id: 'pending',  label: 'Bekleyen', color: 'text-amber-400' },
  { id: 'resolved', label: 'Çözüldü',  color: 'text-green-400' },
  { id: 'dismissed',label: 'Reddedildi', color: 'text-fg-subtle' },
]

export default function AdminRaporlarPage() {
  const toast = useToast()
  const [status, setStatus] = useState('pending')
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(async (s: string) => {
    setLoading(true)
    const res = await fetch(`/api/admin/reports?status=${s}`)
    const json = await res.json()
    setReports(json.reports ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load(status) }, [status, load])

  async function action(id: string, act: 'resolve' | 'dismiss' | 'delete_content') {
    setActioning(id + act)
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: act }),
    })
    const json = await res.json()
    setActioning(null)
    if (!res.ok) { toast(json.error || 'İşlem başarısız.', 'error'); return }
    toast(act === 'delete_content' ? 'İçerik silindi.' : act === 'resolve' ? 'Çözüldü olarak işaretlendi.' : 'Reddedildi.', 'success')
    setReports(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-fg">Raporlar</h1>
          <p className="text-sm text-fg-subtle mt-0.5">Kullanıcı şikayetleri ve moderasyon kuyruğu</p>
        </div>
        <button
          onClick={() => load(status)}
          className="flex items-center gap-1.5 text-xs text-fg-subtle hover:text-fg border border-stroke px-3 py-2 rounded-xl transition-colors"
        >
          <RefreshCw size={13} />
          Yenile
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex border-b border-stroke mb-6">
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setStatus(t.id)}
            className={cn(
              'px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px',
              status === t.id ? 'border-fg text-fg' : 'border-transparent text-fg-subtle hover:text-fg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20">
          <Flag size={28} className="text-fg-subtle opacity-25 mx-auto mb-3" />
          <p className="text-fg-muted font-semibold">
            {status === 'pending' ? 'Bekleyen şikayet yok' : 'Kayıt bulunamadı'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r: any) => {
            const reporter = r.reporter
            const isLoading = (id: string) => actioning === r.id + id

            return (
              <div key={r.id} className="bg-surface border border-stroke rounded-xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-stroke/50 bg-surface-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 bg-red-500/15 rounded-lg flex items-center justify-center">
                      <Flag size={13} className="text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-fg capitalize">{r.target_type}</span>
                        <Badge variant="warning" className="text-[10px] py-0">{REASON_LABELS[r.reason] ?? r.reason}</Badge>
                        {r.auto_hidden && (
                          <Badge variant="danger" className="text-[10px] py-0 flex items-center gap-1">
                            <AlertTriangle size={9} /> Otomatik Gizlendi
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-fg-subtle mt-0.5">
                        {timeAgo(r.created_at)} · Şikayet eden: @{reporter?.username ?? '?'}
                      </p>
                    </div>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    r.status === 'pending' ? 'bg-amber-500/15 text-amber-400' :
                    r.status === 'resolved' ? 'bg-green-500/15 text-green-400' :
                    'bg-surface text-fg-subtle border border-stroke'
                  )}>
                    {STATUS_TABS.find(t => t.id === r.status)?.label ?? r.status}
                  </span>
                </div>

                {/* Target content */}
                <div className="px-4 py-3">
                  {r.target_content ? (
                    <div className="text-sm text-fg-muted bg-bg rounded-xl p-3 border border-stroke/50">
                      {r.target_type === 'answer' && (
                        <>
                          <p className="text-xs text-fg-subtle mb-1">@{r.target_content.user?.username}</p>
                          <p className="leading-relaxed">{r.target_content.content}</p>
                        </>
                      )}
                      {r.target_type === 'comment' && (
                        <>
                          <p className="text-xs text-fg-subtle mb-1">@{r.target_content.user?.username}</p>
                          <p className="leading-relaxed">{r.target_content.content}</p>
                        </>
                      )}
                      {r.target_type === 'duel' && (
                        <div className="flex items-center gap-2">
                          <span>@{r.target_content.challenger?.username}</span>
                          <span className="text-fg-subtle text-xs font-bold">VS</span>
                          <span>@{r.target_content.challenged?.username}</span>
                          <Link href={`/duel/${r.target_content.share_token}`} target="_blank">
                            <ExternalLink size={12} className="text-fg-subtle hover:text-fg transition-colors ml-2" />
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-fg-subtle italic">İçerik silinmiş veya bulunamıyor</p>
                  )}

                  {r.description && (
                    <p className="text-xs text-fg-muted mt-2 italic">"{r.description}"</p>
                  )}
                </div>

                {/* Actions — only for pending */}
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 px-4 py-3 border-t border-stroke/50">
                    <button
                      onClick={() => action(r.id, 'resolve')}
                      disabled={!!actioning}
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 px-3 py-1.5 rounded-lg border border-green-500/20 hover:bg-green-500/10 transition-all disabled:opacity-50"
                    >
                      {isLoading('resolve') ? <Spinner size="sm" /> : <CheckCircle size={12} />}
                      Çöz
                    </button>
                    <button
                      onClick={() => action(r.id, 'dismiss')}
                      disabled={!!actioning}
                      className="flex items-center gap-1.5 text-xs font-semibold text-fg-subtle hover:text-fg px-3 py-1.5 rounded-lg border border-stroke hover:bg-surface-2 transition-all disabled:opacity-50"
                    >
                      {isLoading('dismiss') ? <Spinner size="sm" /> : <XCircle size={12} />}
                      Reddet
                    </button>
                    {r.target_content && r.target_type !== 'duel' && (
                      <button
                        onClick={() => action(r.id, 'delete_content')}
                        disabled={!!actioning}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 transition-all disabled:opacity-50 ml-auto"
                      >
                        {isLoading('delete_content') ? <Spinner size="sm" /> : <Trash2 size={12} />}
                        İçeriği Sil
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
