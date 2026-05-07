'use client'

import { useEffect, useState, useCallback } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { formatPoints } from '@/lib/utils/formatting'
import { Search, ShieldCheck, ShieldOff, Trash2, Crown, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'

interface UserRow {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
  streak_count: number
  is_admin: boolean
  is_banned: boolean
  created_at: string
  last_played_at: string | null
}

type Filter = 'all' | 'banned' | 'admin'

export default function AdminKullanicilarPage() {
  const toast = useToast()
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const LIMIT = 25

  useEffect(() => {
    const id = setTimeout(() => { setDebouncedQ(query); setPage(1) }, 350)
    return () => clearTimeout(id)
  }, [query])

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(debouncedQ)}&filter=${filter}&page=${page}`)
    const json = await res.json()
    setUsers(json.users ?? [])
    setTotal(json.total ?? 0)
    setLoading(false)
  }, [debouncedQ, filter, page])

  useEffect(() => { load() }, [load])

  async function patchUser(id: string, updates: Partial<UserRow>) {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!res.ok) { toast('İşlem başarısız.', 'error'); return }
    toast('Güncellendi!', 'success')
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }

  async function deleteUser(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Silinemedi.', 'error'); return }
    toast('Kullanıcı silindi.', 'success')
    setUsers(prev => prev.filter(u => u.id !== id))
    setConfirmDelete(null)
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black text-fg mb-6">Kullanıcı Yönetimi</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-subtle pointer-events-none" />
          <input
            type="text"
            placeholder="Kullanıcı ara..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-surface border border-stroke rounded-xl pl-10 pr-4 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-purple-500"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'banned', 'admin'] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1) }}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-surface border border-stroke text-fg-muted hover:text-fg'
              }`}
            >
              {f === 'all' ? 'Tümü' : f === 'banned' ? 'Banlılar' : 'Adminler'}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-fg-subtle mb-3">{total.toLocaleString('tr')} kullanıcı</div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {users.map(u => (
              <Card key={u.id} className={u.is_banned ? 'border-red-500/20 bg-red-500/5' : ''}>
                <div className="flex items-center gap-3">
                  <Link href={`/profil/${u.username}`}>
                    <Avatar src={u.avatar_url} username={u.username} size="md" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/profil/${u.username}`} className="text-sm font-bold text-fg hover:text-purple-300 transition-colors">
                        {u.display_name || u.username}
                      </Link>
                      {u.is_admin && <Badge variant="warning" className="text-xs">Admin</Badge>}
                      {u.is_banned && <Badge variant="danger" className="text-xs">Banlı</Badge>}
                    </div>
                    <p className="text-xs text-fg-subtle">
                      @{u.username} · {formatPoints(u.total_points)} puan · {new Date(u.created_at).toLocaleDateString('tr')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => patchUser(u.id, { is_banned: !u.is_banned })}
                      title={u.is_banned ? 'Banı kaldır' : 'Banla'}
                      className={`p-2 rounded-lg transition-colors ${
                        u.is_banned ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'
                      }`}
                    >
                      {u.is_banned ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                    </button>
                    <button
                      onClick={() => patchUser(u.id, { is_admin: !u.is_admin })}
                      title={u.is_admin ? 'Admin yetkisini al' : 'Admin yap'}
                      className={`p-2 rounded-lg transition-colors ${
                        u.is_admin ? 'text-amber-400 hover:bg-amber-500/10' : 'text-fg-subtle hover:bg-surface-2'
                      }`}
                    >
                      {u.is_admin ? <X size={16} /> : <Crown size={16} />}
                    </button>
                    {confirmDelete === u.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => deleteUser(u.id)} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600">Evet</button>
                        <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs bg-surface border border-stroke rounded-lg text-fg-muted hover:text-fg">İptal</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(u.id)}
                        className="p-2 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-fg-muted">{page} / {totalPages}</span>
              <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
