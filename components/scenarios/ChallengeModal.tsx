'use client'

import { useState, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import { Search, X, Swords, UserPlus } from 'lucide-react'

interface Profile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
}

interface Props {
  scenarioId: string
  scenarioContent: string
  userAnswerId: string | null   // null = user hasn't answered yet
  userId: string
  onClose: () => void
}

export function ChallengeModal({ scenarioId, scenarioContent, userAnswerId, userId, onClose }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [inviting, setInviting] = useState<string | null>(null)

  const search = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}&limit=6`)
      if (res.ok) {
        const json = await res.json()
        setResults((json.users ?? []).filter((p: Profile) => p.id !== userId).slice(0, 5))
      }
    } catch {}
    setSearching(false)
  }, [userId])

  async function challenge(target: Profile) {
    if (!userAnswerId || inviting) return
    setInviting(target.id)
    try {
      const res = await fetch('/api/duel/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenged_id: target.id,
          scenario_id: scenarioId,
          challenger_answer_id: userAnswerId,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'Düello oluşturulamadı.', 'error')
        setInviting(null)
        return
      }
      toast(`@${target.username} düelloya davet edildi! ⚔️`, 'success')
      onClose()
      router.push(`/duel/${json.duel.share_token}`)
    } catch {
      toast('Bağlantı hatası.', 'error')
      setInviting(null)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(10,15,30,0.55)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-50 bg-surface"
        style={{
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '80dvh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          animation: 'slideUp .2s ease-out',
          maxWidth: 600,
          margin: '0 auto',
        }}
      >
        {/* Handle */}
        <div className="mx-auto w-10 h-1 rounded-full mt-3 mb-1 shrink-0" style={{ background: 'var(--stroke-strong)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <div>
            <h2 className="text-[17px] font-black tracking-tight flex items-center gap-2">
              <Swords size={18} className="text-primary" />
              Meydan Oku
            </h2>
            <p className="text-xs text-fg-subtle mt-0.5 line-clamp-1 max-w-[260px]">
              &ldquo;{scenarioContent}&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-fg-subtle hover:bg-surface-2 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* If not answered */}
        {!userAnswerId ? (
          <div className="flex flex-col items-center gap-3 px-5 py-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--k-blue-50)' }}
            >
              <UserPlus size={22} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-fg text-center">
              Önce senaryoya cevap ver
            </p>
            <p className="text-xs text-fg-subtle text-center max-w-[240px]">
              Meydan okumak için önce bu senaryodaki görüşünü paylaşman gerekiyor.
            </p>
            <Button
              className="btn-gradient mt-1"
              size="sm"
              onClick={() => { onClose(); router.push(`/arsiv/${scenarioId}`) }}
            >
              Cevapla
            </Button>
          </div>
        ) : (
          <>
            {/* Search */}
            <div className="px-5 pb-3 shrink-0">
              <div
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border"
                style={{ background: 'var(--surface-2)', borderColor: 'var(--stroke)' }}
              >
                <Search size={15} className="text-fg-subtle shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={e => search(e.target.value)}
                  placeholder="@kullanıcı ara…"
                  className="flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle outline-none"
                  autoFocus
                />
                {searching && (
                  <div className="w-3.5 h-3.5 border-2 border-fg-subtle border-t-transparent rounded-full animate-spin shrink-0" />
                )}
              </div>
            </div>

            {/* Results */}
            <div className="overflow-y-auto flex-1 px-5 pb-2">
              {results.length === 0 && query.length >= 2 && !searching && (
                <p className="text-sm text-fg-subtle text-center py-6">Kullanıcı bulunamadı</p>
              )}
              {query.length < 2 && (
                <p className="text-xs text-fg-subtle text-center py-4">En az 2 karakter yaz</p>
              )}
              <div className="space-y-1">
                {results.map(p => (
                  <button
                    key={p.id}
                    onClick={() => challenge(p)}
                    disabled={inviting !== null}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-2 transition-colors text-left"
                  >
                    <Avatar src={p.avatar_url} username={p.username} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">
                        {p.display_name || p.username}
                      </p>
                      <p className="text-xs text-fg-subtle">@{p.username} · {p.total_points} puan</p>
                    </div>
                    {inviting === p.id ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    ) : (
                      <span
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                        style={{ background: 'var(--k-blue-50)', color: 'var(--k-blue-600)' }}
                      >
                        Düello ⚔️
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
