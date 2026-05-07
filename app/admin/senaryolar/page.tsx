'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { FileText, Plus, Trash2, Zap } from 'lucide-react'

interface ScenarioRow {
  id: string
  content: string
  active_date: string
  generated_at: string
}

export default function AdminSenaryolarPage() {
  const toast = useToast()
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ content: '', active_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/admin/scenarios')
      .then(r => r.json())
      .then(d => { setScenarios(d.scenarios ?? []); setLoading(false) })
  }, [])

  async function generateToday() {
    setGenerating(true)
    const res = await fetch('/api/scenario/generate', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Üretilemedi.', 'error'); setGenerating(false); return }
    toast('Senaryo üretildi!', 'success')
    // Reload list
    const listRes = await fetch('/api/admin/scenarios')
    const listJson = await listRes.json()
    setScenarios(listJson.scenarios ?? [])
    setGenerating(false)
  }

  async function saveScenario(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim() || !form.active_date) {
      toast('İçerik ve tarih zorunlu.', 'error'); return
    }
    setSaving(true)
    const res = await fetch('/api/admin/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) { toast(json.error || 'Kaydedilemedi.', 'error'); setSaving(false); return }
    toast('Senaryo kaydedildi!', 'success')
    setScenarios(prev => [json.scenario, ...prev.filter(s => s.active_date !== form.active_date)])
    setForm({ content: '', active_date: '' })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteScenario(id: string) {
    const res = await fetch(`/api/admin/scenarios?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast('Silinemedi.', 'error'); return }
    toast('Silindi.', 'success')
    setScenarios(prev => prev.filter(s => s.id !== id))
  }

  const today = new Date().toISOString().split('T')[0]
  const hasToday = scenarios.some(s => s.active_date === today)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center">
            <FileText size={18} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-fg">Senaryo Yönetimi</h1>
        </div>
        <div className="flex gap-2">
          {!hasToday && (
            <Button size="sm" onClick={generateToday} loading={generating} className="btn-gradient">
              <Zap size={14} />
              Bugünkü Üret (AI)
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setShowForm(v => !v)}>
            <Plus size={14} />
            Manuel Ekle
          </Button>
        </div>
      </div>

      {/* Manual form */}
      {showForm && (
        <Card className="mb-5 border-purple-500/30">
          <h2 className="font-bold text-fg text-sm mb-4">Yeni Senaryo Ekle</h2>
          <form onSubmit={saveScenario} className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-fg-muted block mb-1">Tarih</label>
              <input
                type="date"
                value={form.active_date}
                onChange={e => setForm(f => ({ ...f, active_date: e.target.value }))}
                className="w-full bg-surface-2 border border-stroke rounded-xl px-3 py-2 text-sm text-fg focus:outline-none focus:border-purple-500"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-fg-muted block mb-1">Senaryo İçeriği</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={3}
                maxLength={300}
                placeholder="Günün senaryosunu yaz..."
                className="w-full bg-surface-2 border border-stroke rounded-xl px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-purple-500 resize-none"
                required
              />
              <p className="text-xs text-fg-subtle text-right mt-1">{form.content.length}/300</p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" loading={saving} size="sm" className="btn-gradient">Kaydet</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>İptal</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="flex flex-col gap-2">
          {scenarios.map(s => {
            const isToday = s.active_date === today
            return (
              <Card key={s.id} className={isToday ? 'border-green-500/30 bg-green-500/5' : ''}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isToday ? 'bg-green-500/20 text-green-400' : 'bg-surface-2 text-fg-subtle'
                      }`}>
                        {isToday ? 'Bugün' : s.active_date}
                      </span>
                    </div>
                    <p className="text-sm text-fg leading-relaxed">{s.content}</p>
                  </div>
                  <button
                    onClick={() => deleteScenario(s.id)}
                    className="p-2 rounded-lg text-fg-subtle hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
