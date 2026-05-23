'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import {
  FileText, Plus, Trash2, Zap, CheckCircle2, XCircle,
  Clock, Star, Pencil, Check, X, RefreshCw, CalendarDays,
} from 'lucide-react'

interface ScenarioRow {
  id: string
  content: string
  active_date: string
  generated_at: string
  is_approved: boolean | null
}

interface PendingScenario {
  id: string
  content: string
  category: string
  created_at: string
  answer_count: number
  author: { username: string; display_name: string | null } | null
}

const today = new Date().toISOString().split('T')[0]

function dateLabel(d: string) {
  if (d === today) return 'Bugün'
  const diff = Math.round((new Date(d).getTime() - new Date(today).getTime()) / 86400000)
  if (diff === 1) return 'Yarın'
  if (diff === -1) return 'Dün'
  if (diff > 0) return `+${diff} gün`
  return `${d}`
}

// Next 14 days for the "missing scenarios" panel
function next14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

export default function AdminSenaryolarPage() {
  const toast = useToast()

  const [scenarios, setScenarios] = useState<ScenarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState<PendingScenario[]>([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [tab, setTab] = useState<'scheduled' | 'pending'>('scheduled')

  // Add form
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ content: '', active_date: today })
  const [saving, setSaving] = useState(false)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  // Per-row AI generate
  const [generatingDate, setGeneratingDate] = useState<string | null>(null)

  useEffect(() => {
    loadScenarios()
    loadPending()
  }, [])

  function loadScenarios() {
    setLoading(true)
    fetch('/api/admin/scenarios')
      .then(r => r.json())
      .then(d => { setScenarios(d.scenarios ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  function loadPending() {
    setPendingLoading(true)
    fetch('/api/admin/scenarios/pending')
      .then(r => r.json())
      .then(d => { setPending(d.scenarios ?? []); setPendingLoading(false) })
      .catch(() => setPendingLoading(false))
  }

  // ── Generate AI scenario for a specific date ─────────────────
  async function generateForDate(date: string, force = false) {
    setGeneratingDate(date)
    const params = new URLSearchParams({ date })
    if (force) params.set('force', 'true')
    const res = await fetch(`/api/scenario/generate?${params}`, { method: 'POST' })
    const json = await res.json()
    setGeneratingDate(null)
    if (!res.ok) { toast(json.error || 'Üretilemedi.', 'error'); return }
    toast(json.cached ? 'Bu tarih zaten var.' : 'Senaryo üretildi!', json.cached ? 'info' : 'success')
    loadScenarios()
  }

  // ── Manual add ───────────────────────────────────────────────
  async function saveScenario(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim() || !form.active_date) { toast('İçerik ve tarih zorunlu.', 'error'); return }
    setSaving(true)
    const res = await fetch('/api/admin/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: form.content, active_date: form.active_date }),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Kaydedilemedi.', 'error'); setSaving(false); return }
    toast('Senaryo kaydedildi!', 'success')
    setScenarios(prev => [json.scenario, ...prev.filter(s => s.active_date !== form.active_date)])
    setForm({ content: '', active_date: today })
    setShowForm(false)
    setSaving(false)
  }

  // ── Inline edit ──────────────────────────────────────────────
  function startEdit(s: ScenarioRow) {
    setEditingId(s.id)
    setEditContent(s.content)
  }
  function cancelEdit() { setEditingId(null); setEditContent('') }

  async function saveEdit(id: string) {
    if (!editContent.trim()) return
    setEditSaving(true)
    const res = await fetch('/api/admin/scenarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editContent }),
    })
    const json = await res.json()
    setEditSaving(false)
    if (!res.ok) { toast(json.error || 'Güncellenemedi.', 'error'); return }
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, content: json.scenario.content } : s))
    setEditingId(null)
    toast('Güncellendi!', 'success')
  }

  // ── Approve toggle ───────────────────────────────────────────
  async function toggleApprove(s: ScenarioRow) {
    const newVal = !s.is_approved
    // Optimistic
    setScenarios(prev => prev.map(x => x.id === s.id ? { ...x, is_approved: newVal } : x))
    const res = await fetch('/api/admin/scenarios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_approved: newVal }),
    })
    if (!res.ok) {
      setScenarios(prev => prev.map(x => x.id === s.id ? { ...x, is_approved: s.is_approved } : x))
      toast('Güncellenemedi.', 'error')
    } else {
      toast(newVal ? 'Onaylandı ✓' : 'Onay kaldırıldı', 'success')
    }
  }

  // ── Delete ───────────────────────────────────────────────────
  async function deleteScenario(id: string) {
    if (!confirm('Bu senaryoyu silmek istediğinden emin misin?')) return
    const res = await fetch(`/api/admin/scenarios?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Silinemedi.', 'error'); return }
    toast('Silindi.', 'success')
    setScenarios(prev => prev.filter(s => s.id !== id))
  }

  // ── Pending actions ──────────────────────────────────────────
  async function pendingAction(id: string, action: 'approve' | 'reject' | 'editor_pick') {
    const res = await fetch('/api/admin/scenarios/pending', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    if (!res.ok) { toast('Hata oluştu.', 'error'); return }
    const msgs = { approve: 'Onaylandı!', reject: 'Reddedildi.', editor_pick: 'Editör seçimi!' }
    toast(msgs[action], 'success')
    setPending(prev => prev.filter(s => s.id !== id))
  }

  const hasToday = scenarios.some(s => s.active_date === today)
  const upcomingDates = next14Days()
  const missingDates = upcomingDates.filter(d => !scenarios.some(s => s.active_date === d))

  return (
    <div className="max-w-3xl">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-fg">Senaryo Yönetimi</h1>
            {pending.length > 0 && (
              <span className="text-xs text-orange-400 font-semibold">{pending.length} kullanıcı senaryosu onay bekliyor</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!hasToday && (
            <Button size="sm" onClick={() => generateForDate(today)} loading={generatingDate === today} className="btn-gradient">
              <Zap size={14} /> Bugünkü Üret (AI)
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setShowForm(v => !v)}>
            <Plus size={14} /> Manuel Ekle
          </Button>
        </div>
      </div>

      {/* ── Missing upcoming dates warning ────────────────── */}
      {missingDates.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 mb-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-amber-400" />
            <p className="text-sm font-bold text-amber-400">
              Önümüzdeki {missingDates.length} günde senaryo yok
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {missingDates.map(d => (
              <button
                key={d}
                onClick={() => generateForDate(d)}
                disabled={generatingDate === d}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
              >
                {generatingDate === d
                  ? <RefreshCw size={11} className="animate-spin" />
                  : <Zap size={11} />}
                {dateLabel(d)} — {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab switcher ──────────────────────────────────── */}
      <div className="flex gap-1 bg-surface border border-stroke rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('scheduled')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'scheduled' ? 'bg-primary text-white' : 'text-fg-subtle hover:text-fg'}`}
        >
          Zamanlanmış ({scenarios.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${tab === 'pending' ? 'bg-orange-600 text-white' : 'text-fg-subtle hover:text-fg'}`}
        >
          Onay Bekleyen
          {pending.length > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{pending.length}</span>
          )}
        </button>
      </div>

      {/* ── Manual add form ───────────────────────────────── */}
      {tab === 'scheduled' && showForm && (
        <Card className="mb-5 border-primary/30">
          <h2 className="font-bold text-fg text-sm mb-4">Yeni Senaryo Ekle</h2>
          <form onSubmit={saveScenario} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-fg-muted block mb-1">Tarih</label>
              <input
                type="date"
                value={form.active_date}
                onChange={e => setForm(f => ({ ...f, active_date: e.target.value }))}
                className="w-full bg-surface-2 border border-stroke rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-fg-muted block mb-1">Senaryo İçeriği</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
                maxLength={400}
                placeholder="Günün senaryosunu yaz..."
                className="w-full bg-surface-2 border border-stroke rounded-xl px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-primary resize-none"
                required
              />
              <p className="text-xs text-fg-subtle text-right mt-1">{form.content.length}/400</p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saving} size="sm" className="btn-gradient">Kaydet</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── Scheduled scenarios list ──────────────────────── */}
      {tab === 'scheduled' && (
        loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : scenarios.length === 0 ? (
          <Card className="text-center py-14 border-dashed">
            <p className="text-fg-muted text-sm">Henüz senaryo yok.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {scenarios.map(s => {
              const isEditing = editingId === s.id
              const isToday = s.active_date === today
              const isGenerating = generatingDate === s.active_date
              const approved = s.is_approved !== false // null treated as approved for legacy

              return (
                <Card key={s.id} className={`transition-all ${isToday ? 'border-green-500/30 bg-green-500/5' : ''}`}>
                  {/* Card top row */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {/* Date badge */}
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isToday ? 'bg-green-500/20 text-green-400' : 'bg-surface-2 text-fg-subtle'
                    }`}>
                      {dateLabel(s.active_date)} — {s.active_date}
                    </span>

                    {/* Approve toggle */}
                    <button
                      onClick={() => toggleApprove(s)}
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                        approved
                          ? 'bg-green-500/15 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400'
                          : 'bg-red-500/10 border-red-500/25 text-red-400 hover:bg-green-500/15 hover:border-green-500/30 hover:text-green-400'
                      }`}
                      title={approved ? 'Onaylı — tıkla kaldır' : 'Onaylı değil — tıkla onayla'}
                    >
                      {approved ? <><CheckCircle2 size={10} /> Onaylı</> : <><XCircle size={10} /> Onaylanmadı</>}
                    </button>

                    {/* Actions right side */}
                    <div className="ml-auto flex items-center gap-1">
                      {/* AI Regenerate */}
                      <button
                        onClick={() => generateForDate(s.active_date, true)}
                        disabled={isGenerating}
                        title="AI ile yeniden üret"
                        className="p-1.5 rounded-lg text-fg-subtle hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
                      >
                        <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                      </button>

                      {/* Edit / Cancel edit */}
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(s.id)}
                            disabled={editSaving}
                            className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors disabled:opacity-40"
                            title="Kaydet"
                          >
                            {editSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="İptal"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(s)}
                          className="p-1.5 rounded-lg text-fg-subtle hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Düzenle"
                        >
                          <Pencil size={14} />
                        </button>
                      )}

                      {/* Delete */}
                      <button
                        onClick={() => deleteScenario(s.id)}
                        className="p-1.5 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Content — editable or read-only */}
                  {isEditing ? (
                    <textarea
                      autoFocus
                      value={editContent}
                      onChange={e => setEditContent(e.target.value.slice(0, 400))}
                      rows={4}
                      className="w-full bg-surface-2 border border-primary/40 rounded-xl px-3 py-2 text-sm text-fg focus:outline-none resize-none"
                    />
                  ) : (
                    <p
                      className="text-sm text-fg leading-relaxed cursor-text hover:bg-surface-2/50 rounded-lg px-1 -mx-1 transition-colors"
                      onClick={() => startEdit(s)}
                      title="Düzenlemek için tıkla"
                    >
                      {s.content}
                    </p>
                  )}
                </Card>
              )
            })}
          </div>
        )
      )}

      {/* ── Pending user scenarios ────────────────────────── */}
      {tab === 'pending' && (
        pendingLoading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : pending.length === 0 ? (
          <Card className="text-center py-14 border-dashed">
            <CheckCircle2 size={32} className="text-green-400 opacity-50 mx-auto mb-2" />
            <p className="text-fg font-semibold">Onay bekleyen senaryo yok</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pending.map(s => (
              <Card key={s.id} className="border-orange-500/20">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 flex items-center gap-1">
                        <Clock size={10} /> Bekliyor
                      </span>
                      {s.category && <span className="text-xs text-fg-subtle">{s.category}</span>}
                      {s.author && <span className="text-xs text-fg-subtle">@{s.author.username}</span>}
                    </div>
                    <p className="text-sm text-fg leading-relaxed mb-3">{s.content}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => pendingAction(s.id, 'approve')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 bg-green-500/10 hover:bg-green-500/15 border border-green-500/25 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <CheckCircle2 size={12} /> Onayla
                      </button>
                      <button
                        onClick={() => pendingAction(s.id, 'reject')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 border border-red-500/25 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <XCircle size={12} /> Reddet
                      </button>
                      <button
                        onClick={() => pendingAction(s.id, 'editor_pick')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Star size={12} /> Editör Seçimi
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  )
}
