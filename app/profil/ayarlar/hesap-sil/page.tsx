'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, AlertTriangle } from 'lucide-react'

export default function HesapSilPage() {
  const router = useRouter()
  const supabase = createClient()
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const CONFIRM_TEXT = 'HESABIMI SİL'

  async function handleDelete() {
    if (confirm !== CONFIRM_TEXT) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? 'Bir hata oluştu.')
        setLoading(false)
        return
      }
      await supabase.auth.signOut()
      router.push('/')
    } catch {
      setError('Bağlantı hatası.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10 flex flex-col gap-6">
      {/* Warning card */}
      <div
        className="rounded-2xl p-5 flex gap-4"
        style={{ background: 'color-mix(in oklab, #dc2626 8%, var(--surface))', border: '1px solid color-mix(in oklab, #dc2626 30%, transparent)' }}
      >
        <AlertTriangle size={22} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="font-bold text-fg mb-1">Bu işlem geri alınamaz</p>
          <p className="text-sm" style={{ color: 'var(--fg-subtle)' }}>
            Tüm cevapların, düellolarin, rozetlerin ve profil bilgilerin kalıcı olarak silinecek.
            Hesabını silmeden önce verilerini indirmek istiyorsan Ayarlar sayfasına geri dön.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-black text-fg mb-1">Hesabı Sil</h1>
        <p className="text-sm" style={{ color: 'var(--fg-subtle)' }}>
          Onaylamak için aşağıya <strong style={{ color: 'var(--fg)' }}>{CONFIRM_TEXT}</strong> yaz.
        </p>
      </div>

      <input
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        placeholder={CONFIRM_TEXT}
        style={{
          padding: '11px 14px', borderRadius: 10,
          border: '1px solid var(--stroke)',
          background: 'var(--surface-2)', color: 'var(--fg)',
          font: '400 14px -apple-system, sans-serif', outline: 'none', width: '100%',
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <button
          onClick={() => router.back()}
          style={{
            flex: 1, padding: '11px', borderRadius: 10,
            border: '1px solid var(--stroke)', background: 'var(--surface)',
            color: 'var(--fg)', font: '600 14px -apple-system, sans-serif', cursor: 'pointer',
          }}
        >
          Vazgeç
        </button>
        <button
          onClick={handleDelete}
          disabled={confirm !== CONFIRM_TEXT || loading}
          style={{
            flex: 1, padding: '11px', borderRadius: 10, border: 'none',
            background: confirm === CONFIRM_TEXT ? '#dc2626' : 'var(--stroke)',
            color: confirm === CONFIRM_TEXT ? '#fff' : 'var(--fg-subtle)',
            font: '600 14px -apple-system, sans-serif',
            cursor: confirm === CONFIRM_TEXT ? 'pointer' : 'not-allowed',
            transition: 'background .15s, color .15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          <Trash2 size={14} />
          {loading ? 'Siliniyor…' : 'Hesabı Sil'}
        </button>
      </div>
    </div>
  )
}
