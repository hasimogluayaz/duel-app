'use client'

import { useState } from 'react'
import { Pencil, Save, X, AlertCircle } from 'lucide-react'

interface Props {
  answerId: string
  initialContent: string
  editCount?: number
  createdAt: string
  onSaved?: (newContent: string) => void
}

const MAX_EDITS = 3
const EDIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

export default function EditAnswerButton({ answerId, initialContent, editCount = 0, createdAt, onSaved }: Props) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Check if within edit window
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const withinWindow = ageMs < EDIT_WINDOW_MS
  const editsLeft = MAX_EDITS - editCount

  if (!withinWindow || editsLeft <= 0) return null

  const save = async () => {
    if (!content.trim() || content.trim() === initialContent) {
      setEditing(false)
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/answer/edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer_id: answerId, content: content.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error ?? 'Düzenlenemedi.')
      } else {
        onSaved?.(content.trim())
        setEditing(false)
      }
    } catch {
      setError('Bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  if (!editing) return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-fg-subtle hover:text-primary/70 transition-colors"
      title={`Düzenle (${editsLeft} hak kaldı)`}
    >
      <Pencil size={11} />
      <span>Düzenle</span>
    </button>
  )

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={3}
        maxLength={500}
        className="w-full bg-surface-2 border border-primary/40 rounded-xl px-3 py-2 text-sm text-fg placeholder-fg-subtle focus:outline-none focus:border-primary/70 resize-none"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary disabled:opacity-40 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Save size={11} />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
          <button
            onClick={() => { setEditing(false); setContent(initialContent); setError('') }}
            className="flex items-center gap-1 text-xs text-fg-subtle hover:text-fg-muted px-2 py-1.5 rounded-lg transition-colors"
          >
            <X size={11} /> İptal
          </button>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-fg-subtle">
          <span>{content.length}/500</span>
          <span>·</span>
          <span>{editsLeft} düzenleme hakkı</span>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  )
}
