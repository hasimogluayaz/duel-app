'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Check } from 'lucide-react'

interface Prefs {
  duel_updates: boolean
  answer_votes: boolean
  social: boolean
  system: boolean
  weekly_summary: boolean
}

const PREF_CONFIG: Array<{ key: keyof Prefs; label: string; desc: string; emoji: string }> = [
  { key: 'duel_updates',   label: 'Düello Bildirimleri',   desc: 'Düello davetleri, sonuçlar ve rövanşlar', emoji: '⚔️' },
  { key: 'answer_votes',   label: 'Cevap Oyları',          desc: 'Cevaplarına oy verildiğinde', emoji: '⭐' },
  { key: 'social',         label: 'Sosyal',                desc: 'Yeni takipçiler ve yorumlar', emoji: '👥' },
  { key: 'weekly_summary', label: 'Haftalık Özet',         desc: 'Haftalık performans özeti', emoji: '📊' },
  { key: 'system',         label: 'Sistem',                desc: 'Önemli güncellemeler ve duyurular', emoji: '🔔' },
]

export default function NotificationPrefs() {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<keyof Prefs | null>(null)
  const [saved, setSaved] = useState<keyof Prefs | null>(null)

  useEffect(() => {
    fetch('/api/notifications/preferences')
      .then(r => r.json())
      .then(d => { setPrefs(d.prefs); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggle = async (key: keyof Prefs) => {
    if (!prefs || saving) return
    const newVal = !prefs[key]
    setSaving(key)
    const newPrefs = { ...prefs, [key]: newVal }
    setPrefs(newPrefs)

    try {
      await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newVal }),
      })
      setSaved(key)
      setTimeout(() => setSaved(null), 1500)
    } catch {
      setPrefs(prefs)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="bg-surface border border-stroke rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 p-4 border-b border-stroke">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Bell size={16} className="text-violet-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-fg">Bildirim Tercihleri</h2>
          <p className="text-xs text-fg-subtle">Hangi bildirimleri almak istediğini seç</p>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface-2 rounded-xl animate-pulse" />)}
        </div>
      ) : prefs ? (
        <div className="divide-y divide-stroke">
          {PREF_CONFIG.map(({ key, label, desc, emoji }) => {
            const isOn = prefs[key]
            const isSaving = saving === key
            const isSaved = saved === key
            return (
              <div key={key} className="flex items-center justify-between px-4 py-3 hover:bg-surface-2 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-fg">{label}</p>
                    <p className="text-xs text-fg-subtle">{desc}</p>
                  </div>
                </div>

                <button
                  onClick={() => toggle(key)}
                  disabled={!!saving}
                  className={`relative w-11 h-6 rounded-full transition-all shrink-0 ${
                    isOn ? 'bg-violet-600' : 'bg-stroke'
                  } ${saving ? 'opacity-60' : ''}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                    isOn ? 'translate-x-5' : 'translate-x-0'
                  } ${isSaving ? 'animate-pulse' : ''} left-0.5`}>
                    {isSaved && <Check size={10} className="absolute inset-0 m-auto text-violet-600" />}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-fg-subtle">
          <BellOff size={24} className="mx-auto mb-2 opacity-40" />
          Tercihler yüklenemedi
        </div>
      )}
    </div>
  )
}
