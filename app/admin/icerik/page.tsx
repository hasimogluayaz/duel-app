'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { timeAgo } from '@/lib/utils/formatting'
import { ShieldAlert, Trash2, FileText, Swords, ExternalLink } from 'lucide-react'
import Link from 'next/link'

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
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'answers' | 'duels'>('answers')

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then(d => {
        setAnswers(d.answers ?? [])
        setDuels(d.duels ?? [])
        setLoading(false)
      })
  }, [])

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
      <div className="flex gap-2 mb-5">
        {([
          { key: 'answers', label: 'Cevaplar', icon: FileText },
          { key: 'duels', label: 'Düellolar', icon: Swords },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === key ? 'bg-purple-600 text-white' : 'bg-surface border border-stroke text-fg-muted hover:text-fg'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
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
                      <Link href={`/profil/${a.profiles.username}`} className="text-xs font-semibold text-purple-400 hover:underline">
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
