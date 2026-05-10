'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Mail, MailOpen, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export default function AdminMesajlarPage() {
  const toast = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<ContactMessage | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const LIMIT = 20

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/contact?page=${page}`)
    const json = await res.json()
    setMessages(json.messages ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [page])

  useEffect(() => { load() }, [load])

  async function markRead(id: string) {
    await fetch(`/api/admin/contact/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_read: true }) })
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
    if (selected?.id === id) setSelected(s => s ? { ...s, is_read: true } : null)
  }

  async function deleteMessage(id: string) {
    const res = await fetch(`/api/admin/contact/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Silinemedi.', 'error'); return }
    toast('Mesaj silindi.', 'success')
    setMessages(prev => prev.filter(m => m.id !== id))
    setConfirmDelete(null)
    if (selected?.id === id) setSelected(null)
  }

  const unreadCount = messages.filter(m => !m.is_read).length
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-fg">İletişim Mesajları</h1>
        {unreadCount > 0 && (
          <Badge variant="info">{unreadCount} okunmamış</Badge>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : messages.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <Mail size={32} className="text-fg-subtle opacity-30 mx-auto mb-3" />
          <p className="text-fg font-semibold">Henüz mesaj yok</p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Message list */}
          <div className="flex flex-col gap-2">
            {messages.map(msg => (
              <Card
                key={msg.id}
                className={`cursor-pointer transition-all ${
                  selected?.id === msg.id ? 'border-primary/60 bg-primary/5' : ''
                } ${!msg.is_read ? 'border-blue-500/30' : ''}`}
                onClick={() => { setSelected(msg); if (!msg.is_read) markRead(msg.id) }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {msg.is_read
                        ? <MailOpen size={15} className="text-fg-subtle" />
                        : <Mail size={15} className="text-blue-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${!msg.is_read ? 'text-fg' : 'text-fg-muted'}`}>
                        {msg.name}
                      </p>
                      <p className="text-xs text-fg-subtle truncate">{msg.subject}</p>
                      <p className="text-xs text-fg-subtle mt-0.5">
                        {new Date(msg.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {confirmDelete === msg.id ? (
                    <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteMessage(msg.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Sil</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-surface border border-stroke rounded-lg text-fg-muted">İptal</button>
                    </div>
                  ) : (
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDelete(msg.id) }}
                      className="p-1.5 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </Card>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={16} />
                </Button>
                <span className="text-sm text-fg-muted">{page} / {totalPages}</span>
                <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </div>

          {/* Message detail */}
          <div className="sticky top-6">
            {selected ? (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-fg">{selected.subject}</h2>
                    <p className="text-sm text-fg-muted mt-0.5">{selected.name}</p>
                    <a href={`mailto:${selected.email}`} className="text-xs text-primary/70 hover:underline">
                      {selected.email}
                    </a>
                    <p className="text-xs text-fg-subtle mt-1">
                      {new Date(selected.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                    className="shrink-0 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary transition-colors"
                  >
                    Yanıtla
                  </a>
                </div>
                <div className="bg-surface-2 rounded-xl p-4 text-sm text-fg leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </div>
              </Card>
            ) : (
              <Card className="text-center py-16 border-dashed">
                <MailOpen size={28} className="text-fg-subtle opacity-30 mx-auto mb-2" />
                <p className="text-sm text-fg-subtle">Okumak için bir mesaj seç</p>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
