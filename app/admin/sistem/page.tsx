'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  Server, Database, Clock, PlayCircle, CheckCircle2, XCircle,
  AlertTriangle, HardDrive, Cpu, Activity,
} from 'lucide-react'

interface SystemData {
  env: { name: string; purpose: string; critical: boolean; set: boolean }[]
  crons: { path: string; schedule: string; label: string }[]
  tables: { table: string; count: number; ok: boolean; error?: string }[]
  storage: { avatars: { count: number; bytes: number } | null }
  pulse: {
    lastScenarioGeneratedAt: string | null
    lastScenarioDate: string | null
    lastUserAt: string | null
    lastUserName: string | null
    lastAnswerAt: string | null
  }
  runtime: { nodeVersion: string; platform: string; now: string }
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'hiç'
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s önce`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa önce`
  return `${Math.floor(h / 24)}g önce`
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1_073_741_824) return `${(n / 1_048_576).toFixed(1)} MB`
  return `${(n / 1_073_741_824).toFixed(2)} GB`
}

export default function AdminSystemPage() {
  const toast = useToast()
  const [data, setData] = useState<SystemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/system')
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function triggerCron(path: string) {
    if (!confirm(`${path} cron'unu şimdi çalıştırmak istediğinden emin misin?`)) return
    setTriggering(path)
    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })
      const json = await res.json()
      if (res.ok && json.ok) {
        toast(`✓ ${path} başarılı (${json.status})`, 'success')
      } else {
        toast(`✕ ${path} başarısız: ${json.error || json.status}`, 'error')
      }
    } catch {
      toast('Bağlantı hatası', 'error')
    } finally {
      setTriggering(null)
    }
  }

  if (loading || !data) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const missingCritical = data.env.filter(e => e.critical && !e.set).length
  const totalRows = data.tables.reduce((s, t) => s + t.count, 0)

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
          <Server size={20} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-fg">Sistem</h1>
          <p className="text-xs text-fg-subtle mt-0.5">Cron durumu, env, DB sağlık, manuel tetikleme</p>
        </div>
      </div>

      {/* Health summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card className="py-3 px-3">
          <div className="flex items-center gap-2">
            <Activity size={14} className={missingCritical === 0 ? 'text-green-400' : 'text-red-400'} />
            <p className="text-[11px] text-fg-subtle">Kritik Env</p>
          </div>
          <p className={`text-xl font-black mt-1 ${missingCritical === 0 ? 'text-green-400' : 'text-red-400'}`}>
            {missingCritical === 0 ? 'OK' : `${missingCritical} eksik`}
          </p>
        </Card>
        <Card className="py-3 px-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-blue-400" />
            <p className="text-[11px] text-fg-subtle">Son Senaryo</p>
          </div>
          <p className="text-xl font-black text-fg mt-1">{timeAgo(data.pulse.lastScenarioGeneratedAt)}</p>
        </Card>
        <Card className="py-3 px-3">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-amber-400" />
            <p className="text-[11px] text-fg-subtle">Toplam Satır</p>
          </div>
          <p className="text-xl font-black text-fg mt-1 tabular-nums">{totalRows.toLocaleString('tr')}</p>
        </Card>
        <Card className="py-3 px-3">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-fg-muted" />
            <p className="text-[11px] text-fg-subtle">Node</p>
          </div>
          <p className="text-xs font-mono text-fg mt-1">{data.runtime.nodeVersion} · {data.runtime.platform}</p>
        </Card>
      </div>

      {/* Pulse */}
      <Card className="mb-6">
        <h2 className="font-bold text-fg text-sm mb-3 flex items-center gap-2">
          <Activity size={15} className="text-green-400" />
          Canlı Nabız
        </h2>
        <div className="grid sm:grid-cols-3 gap-3 text-xs">
          <PulseRow label="Son senaryo üretildi" value={timeAgo(data.pulse.lastScenarioGeneratedAt)} sub={data.pulse.lastScenarioDate ?? ''} />
          <PulseRow label="Son kullanıcı kaydı" value={timeAgo(data.pulse.lastUserAt)} sub={data.pulse.lastUserName ? `@${data.pulse.lastUserName}` : ''} />
          <PulseRow label="Son cevap" value={timeAgo(data.pulse.lastAnswerAt)} sub="" />
        </div>
      </Card>

      {/* Cron jobs */}
      <Card className="mb-6">
        <h2 className="font-bold text-fg text-sm mb-3 flex items-center gap-2">
          <Clock size={15} className="text-primary" />
          Cron Görevleri
        </h2>
        <div className="flex flex-col divide-y divide-stroke">
          {data.crons.map(c => (
            <div key={c.path} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-fg truncate">{c.label}</p>
                <p className="text-[11px] text-fg-subtle font-mono truncate">{c.path}</p>
              </div>
              <code className="text-[10px] font-mono px-2 py-1 rounded bg-surface-2 text-fg-muted shrink-0">{c.schedule}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => triggerCron(c.path)}
                disabled={triggering === c.path}
                className="text-xs gap-1 shrink-0"
              >
                {triggering === c.path ? <Spinner size="sm" /> : <PlayCircle size={13} />}
                Tetikle
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Env vars */}
      <Card className="mb-6">
        <h2 className="font-bold text-fg text-sm mb-3 flex items-center gap-2">
          <Server size={15} className="text-blue-400" />
          Environment Variables
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {data.env.map(e => (
            <div
              key={e.name}
              className={`flex items-center gap-2 p-2.5 rounded-lg border ${
                e.set
                  ? 'bg-green-500/5 border-green-500/20'
                  : e.critical
                  ? 'bg-red-500/5 border-red-500/30'
                  : 'bg-surface-2 border-stroke'
              }`}
            >
              {e.set ? (
                <CheckCircle2 size={14} className="text-green-400 shrink-0" />
              ) : e.critical ? (
                <XCircle size={14} className="text-red-400 shrink-0" />
              ) : (
                <AlertTriangle size={14} className="text-fg-subtle shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono font-bold text-fg truncate">{e.name}</p>
                <p className="text-[10px] text-fg-subtle truncate">{e.purpose}</p>
              </div>
              {e.critical && !e.set && (
                <span className="text-[9px] font-bold text-red-400 shrink-0">KRİTİK</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* DB tables */}
      <Card className="mb-6">
        <h2 className="font-bold text-fg text-sm mb-3 flex items-center gap-2">
          <Database size={15} className="text-amber-400" />
          Veritabanı Tabloları
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {data.tables.map(t => (
            <div
              key={t.table}
              className={`p-2.5 rounded-lg border ${t.ok ? 'bg-surface-2 border-stroke' : 'bg-red-500/5 border-red-500/30'}`}
            >
              <p className="text-[10px] font-mono text-fg-subtle truncate">{t.table}</p>
              <p className={`text-lg font-black tabular-nums ${t.ok ? 'text-fg' : 'text-red-400'}`}>
                {t.ok ? t.count.toLocaleString('tr') : '⚠'}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Storage */}
      {data.storage.avatars && (
        <Card>
          <h2 className="font-bold text-fg text-sm mb-3 flex items-center gap-2">
            <HardDrive size={15} className="text-fg-muted" />
            Storage
          </h2>
          <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
            <div>
              <p className="text-sm font-semibold text-fg">avatars bucket</p>
              <p className="text-xs text-fg-subtle">{data.storage.avatars.count} dosya</p>
            </div>
            <p className="text-lg font-black text-fg">{formatBytes(data.storage.avatars.bytes)}</p>
          </div>
        </Card>
      )}
    </div>
  )
}

function PulseRow({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-3 rounded-xl bg-surface-2">
      <p className="text-[10px] text-fg-subtle">{label}</p>
      <p className="text-base font-black text-fg mt-1">{value}</p>
      {sub && <p className="text-[10px] text-fg-muted mt-0.5 truncate">{sub}</p>}
    </div>
  )
}
