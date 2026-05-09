'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  answerId: string
  onDeleted?: () => void
}

export default function DeleteAnswerButton({ answerId, onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    setLoading(true)
    const res = await fetch(`/api/answer?id=${answerId}`, { method: 'DELETE' })
    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      alert(json.error || 'Cevap silinemedi.')
      setConfirming(false)
      return
    }

    if (onDeleted) {
      onDeleted()
    } else {
      router.refresh()
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="text-xs text-red-400">Emin misin?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-red-400 hover:text-red-300 font-semibold disabled:opacity-50"
        >
          {loading ? 'Siliniyor...' : 'Evet, sil'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-white/30 hover:text-white/60"
        >
          Vazgeç
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 text-xs text-white/30 hover:text-red-400 transition-colors"
      title="Cevabı sil"
    >
      <Trash2 size={12} />
      Sil
    </button>
  )
}
