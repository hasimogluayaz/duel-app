'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { Flag } from 'lucide-react'

const REASONS = [
  { value: 'spam', label: 'Spam / Reklam' },
  { value: 'hate_speech', label: 'Nefret söylemi' },
  { value: 'inappropriate', label: 'Uygunsuz içerik' },
  { value: 'harassment', label: 'Taciz / Zorbalık' },
  { value: 'other', label: 'Diğer' },
] as const

interface Props {
  targetType: 'answer' | 'duel' | 'comment' | 'profile'
  targetId: string
  userId: string | null
  className?: string
}

export function ReportButton({ targetType, targetId, userId, className }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const toast = useToast()

  async function submit() {
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
    setTimeout(() => { setOpen(false); setDone(false); setReason(''); setDescription('') }, 1500)
  }

  if (!userId) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-1 text-xs text-fg-subtle hover:text-red-400 transition-colors ${className ?? ''}`}
        title="Şikayet et"
      >
        <Flag size={12} />
        Şikayet
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Şikayet Et 🚩">
        {done ? (
          <div className="text-center py-6">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-fg font-semibold">Şikayetin alındı!</p>
            <p className="text-fg-subtle text-sm mt-1">Ekibimiz inceleyecek.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-fg-muted mb-4">
              Bu içeriği neden uygunsuz buluyorsun?
            </p>
            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map(r => (
                <label key={r.value} className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-primary"
                  />
                  <span className={`text-sm ${reason === r.value ? 'text-fg font-semibold' : 'text-fg-muted'} group-hover:text-fg transition-colors`}>
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
              className="w-full bg-bg border border-stroke rounded-xl px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
            />
            <div className="flex gap-2">
              <Button className="flex-1 btn-gradient" loading={loading} disabled={!reason} onClick={submit}>
                Gönder
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Vazgeç
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
