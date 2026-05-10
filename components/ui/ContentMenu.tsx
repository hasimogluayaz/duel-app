'use client'

import { useState, useRef, useEffect } from 'react'
import { MoreHorizontal, Flag, Trash2, Edit2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

const REASONS = [
  { value: 'spam',         label: 'Spam / Reklam' },
  { value: 'hate_speech',  label: 'Nefret söylemi' },
  { value: 'inappropriate',label: 'Uygunsuz içerik' },
  { value: 'harassment',   label: 'Taciz / Zorbalık' },
  { value: 'other',        label: 'Diğer' },
] as const

interface Props {
  targetType: 'answer' | 'duel' | 'comment' | 'profile' | 'scenario'
  targetId: string
  userId: string | null
  isOwn?: boolean
  onDelete?: () => void
  onEdit?: () => void
  size?: number
}

export function ContentMenu({ targetType, targetId, userId, isOwn, onDelete, onEdit, size = 15 }: Props) {
  const [open, setOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function submitReport() {
    if (!reason) return
    setLoading(true)
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_type: targetType, target_id: targetId, reason, description }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { toast(json.error || 'Şikayet gönderilemedi.', 'error'); return }
    setDone(true)
    toast('Şikayetin alındı, incelenecek.', 'success')
    setTimeout(() => { setReportOpen(false); setDone(false); setReason(''); setDescription('') }, 1500)
  }

  if (!userId) return null

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={e => { e.preventDefault(); e.stopPropagation(); setOpen(o => !o) }}
          className="p-1 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-2 transition-colors"
          aria-label="Daha fazla"
        >
          <MoreHorizontal size={size} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-surface border border-stroke rounded-xl shadow-lg overflow-hidden min-w-[160px]">
            {isOwn && onEdit && (
              <button
                onClick={() => { setOpen(false); onEdit() }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-fg hover:bg-surface-2 transition-colors text-left"
              >
                <Edit2 size={13} className="text-fg-subtle" />
                Düzenle
              </button>
            )}
            {isOwn && onDelete && (
              <button
                onClick={() => { setOpen(false); onDelete() }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 size={13} />
                Sil
              </button>
            )}
            {!isOwn && (
              <button
                onClick={() => { setOpen(false); setReportOpen(true) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-fg-muted hover:bg-surface-2 transition-colors text-left"
              >
                <Flag size={13} className="text-fg-subtle" />
                Şikayet Et
              </button>
            )}
          </div>
        )}
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Şikayet Et 🚩">
        {done ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-fg font-semibold">Şikayetin alındı!</p>
            <p className="text-fg-subtle text-sm mt-1">Ekibimiz inceleyecek.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-fg-muted mb-4">Bu içeriği neden uygunsuz buluyorsun?</p>
            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-primary"
                  />
                  <span className={`text-sm transition-colors ${reason === r.value ? 'text-fg font-semibold' : 'text-fg-muted group-hover:text-fg'}`}>
                    {r.label}
                  </span>
                </label>
              ))}
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ek açıklama (isteğe bağlı)..."
              rows={2}
              maxLength={500}
              className="w-full bg-bg border border-stroke rounded-xl px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary/50 resize-none mb-4"
            />
            <div className="flex gap-2">
              <Button className="flex-1 btn-gradient" loading={loading} disabled={!reason} onClick={submitReport}>
                Gönder
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setReportOpen(false)}>
                Vazgeç
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
