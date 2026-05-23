'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { formatPoints } from '@/lib/utils/formatting'
import {
  Users, Swords, FileText, ShieldOff, TrendingUp, Activity,
  Calendar, AlertTriangle, MessageSquare, ThumbsUp, Bot,
  UsersRound, Sparkles, ArrowUpRight, Flame,
} from 'lucide-react'
import Link from 'next/link'
import DauChart from '@/components/admin/DauChart'

interface Stats {
  users: { total: number; today: number; week: number; month: number; banned: number; admin: number; premium: number }
  engagement: {
    dau: number; wau: number; mau: number
    answersToday: number; answersWeek: number; answersTotal: number; answersAnonymous: number
    votesToday: number; commentsToday: number
  }
  scenarios: {
    total: number; approved: number; pending: number
    today: { id: string; content: string; answerCount: number } | null
    missingDates: string[]
  }
  duels: { total: number; today: number; aiMode: number; communityMode: number }
  health: { reportsPending: number; missingScenarios: number }
  userTrend: { date: string; count: number }[]
  recentUsers: any[]
  topUsers: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
  }, [])

  if (loading || !stats) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>

  const maxTrend = Math.max(...stats.userTrend.map(t => t.count), 1)
  const aiPct = stats.duels.total > 0 ? Math.round((stats.duels.aiMode / stats.duels.total) * 100) : 0

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-fg">Dashboard</h1>
          <p className="text-xs text-fg-subtle mt-0.5">{new Date().toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        {stats.health.reportsPending > 0 || stats.health.missingScenarios > 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold">
            <AlertTriangle size={14} />
            <span>{stats.health.missingScenarios} eksik senaryo · {stats.health.reportsPending} bekleyen rapor</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-semibold">
            <Activity size={14} />
            <span>Her şey yolunda</span>
          </div>
        )}
      </div>

      {/* ── KPI Row 1: Big numbers ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <BigKpi
          label="Toplam Kullanıcı"
          value={stats.users.total}
          delta={`+${stats.users.today} bugün`}
          icon={Users}
          color="text-blue-400"
          bg="bg-blue-500/15"
        />
        <BigKpi
          label="DAU · Bugün"
          value={stats.engagement.dau}
          delta={`${stats.engagement.wau} bu hafta`}
          icon={Activity}
          color="text-green-400"
          bg="bg-green-500/15"
        />
        <BigKpi
          label="Bugünkü Cevap"
          value={stats.engagement.answersToday}
          delta={`${stats.engagement.answersWeek} bu hafta`}
          icon={FileText}
          color="text-primary"
          bg="bg-primary/15"
        />
        <BigKpi
          label="Bugünkü Düello"
          value={stats.duels.today}
          delta={`${stats.duels.total} toplam`}
          icon={Swords}
          color="text-amber-400"
          bg="bg-amber-500/15"
        />
      </div>

      {/* ── KPI Row 2: Secondary stats ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <SmallKpi label="Bu hafta yeni" value={stats.users.week} icon={TrendingUp} color="text-green-400" />
        <SmallKpi label="Bu ay yeni" value={stats.users.month} icon={Calendar} color="text-blue-400" />
        <SmallKpi label="Banlı" value={stats.users.banned} icon={ShieldOff} color="text-red-400" />
        <SmallKpi label="Premium" value={stats.users.premium} icon={Sparkles} color="text-amber-400" />
      </div>

      {/* ── Today's pulse ───────────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame size={16} className="text-amber-400" />
          <h2 className="font-bold text-fg text-sm">Bugünün Nabzı</h2>
          <span className="text-xs text-fg-subtle ml-auto">canlı</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PulseStat label="Yeni Kullanıcı" value={stats.users.today} icon={Users} />
          <PulseStat label="Cevap" value={stats.engagement.answersToday} icon={FileText} />
          <PulseStat label="Oy" value={stats.engagement.votesToday} icon={ThumbsUp} />
          <PulseStat label="Yorum" value={stats.engagement.commentsToday} icon={MessageSquare} />
        </div>
      </Card>

      {/* ── Today's scenario + Missing scenarios ────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-primary" />
              <h2 className="font-bold text-fg text-sm">Bugünkü Senaryo</h2>
            </div>
            {stats.scenarios.today && (
              <span className="text-xs font-bold text-primary">{stats.scenarios.today.answerCount} cevap</span>
            )}
          </div>
          {stats.scenarios.today ? (
            <p className="text-sm text-fg leading-relaxed">{stats.scenarios.today.content}</p>
          ) : (
            <div className="text-sm text-red-400 font-semibold flex items-center gap-2">
              <AlertTriangle size={14} />
              Bugün için senaryo yok!
            </div>
          )}
          <Link href="/admin/senaryolar" className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1">
            Yönet <ArrowUpRight size={11} />
          </Link>
        </Card>

        <Card className={stats.scenarios.missingDates.length > 0 ? 'border-amber-500/30 bg-amber-500/5' : ''}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className={stats.scenarios.missingDates.length > 0 ? 'text-amber-500' : 'text-green-400'} />
              <h2 className="font-bold text-fg text-sm">Eksik Senaryolar</h2>
            </div>
            <span className={`text-xs font-bold ${stats.scenarios.missingDates.length > 0 ? 'text-amber-500' : 'text-green-400'}`}>
              {stats.scenarios.missingDates.length} / 14 gün
            </span>
          </div>
          {stats.scenarios.missingDates.length === 0 ? (
            <p className="text-sm text-fg-muted">Önümüzdeki 14 günün tamamı dolu ✓</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {stats.scenarios.missingDates.slice(0, 14).map(d => (
                <span key={d} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  {d.slice(5)}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── 7-day user growth trend ─────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" />
            <h2 className="font-bold text-fg text-sm">7 Günlük Yeni Kullanıcı</h2>
          </div>
          <span className="text-xs text-fg-subtle">son hafta</span>
        </div>
        <div className="flex items-end gap-2 h-24">
          {stats.userTrend.map(t => (
            <div key={t.date} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="text-[10px] text-fg-muted tabular-nums">{t.count}</div>
              <div
                className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary"
                style={{ height: `${(t.count / maxTrend) * 100}%`, minHeight: 4 }}
              />
              <div className="text-[10px] text-fg-subtle tabular-nums">{t.date.slice(5)}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── DAU Chart (legacy component) ────────────────────────────────── */}
      <div className="mb-6">
        <DauChart />
      </div>

      {/* ── Duel mode breakdown ─────────────────────────────────────────── */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Swords size={16} className="text-amber-400" />
          <h2 className="font-bold text-fg text-sm">Düello Modu Dağılımı</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 mb-1">
              <Bot size={12} /> AI Modu
            </div>
            <p className="text-2xl font-black text-fg">{stats.duels.aiMode}</p>
            <p className="text-xs text-fg-subtle">%{aiPct}</p>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary mb-1">
              <UsersRound size={12} /> Topluluk
            </div>
            <p className="text-2xl font-black text-fg">{stats.duels.communityMode}</p>
            <p className="text-xs text-fg-subtle">%{100 - aiPct}</p>
          </div>
        </div>
        <Link href="/admin/duellolar" className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1">
          Tüm düelloları yönet <ArrowUpRight size={11} />
        </Link>
      </Card>

      {/* ── Recent + Top users ──────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-400" />
            <h2 className="font-bold text-fg text-sm">Son Kayıtlar</h2>
          </div>
          <div className="flex flex-col gap-2">
            {stats.recentUsers.map(u => (
              <Link key={u.id} href={`/admin/kullanicilar/${u.id}`} className="flex items-center gap-3 hover:bg-surface-2 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <Avatar src={u.avatar_url} username={u.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{u.display_name || u.username}</p>
                  <p className="text-xs text-fg-subtle">@{u.username}</p>
                </div>
                <p className="text-xs text-fg-subtle shrink-0">{new Date(u.created_at!).toLocaleDateString('tr')}</p>
              </Link>
            ))}
          </div>
          <Link href="/admin/kullanicilar" className="block text-xs text-primary hover:underline mt-3 text-center">
            Tüm kullanıcılar →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-amber-400" />
            <h2 className="font-bold text-fg text-sm">Top Oyuncular</h2>
          </div>
          <div className="flex flex-col gap-2">
            {stats.topUsers.map((u, i) => (
              <Link key={u.id} href={`/admin/kullanicilar/${u.id}`} className="flex items-center gap-3 hover:bg-surface-2 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <span className="text-sm font-bold text-fg-subtle w-4 shrink-0">{i + 1}</span>
                <Avatar src={u.avatar_url} username={u.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{u.display_name || u.username}</p>
                  <p className="text-xs text-fg-subtle">🔥 {u.streak_count ?? 0} streak</p>
                </div>
                <p className="text-sm font-bold text-amber-400">{formatPoints(u.total_points)}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

// ── Components ─────────────────────────────────────────────────────────────

function BigKpi({ label, value, delta, icon: Icon, color, bg }: {
  label: string; value: number; delta: string; icon: any; color: string; bg: string
}) {
  return (
    <Card className="py-4 px-4">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center`}>
          <Icon size={16} className={color} />
        </div>
      </div>
      <p className="text-2xl font-black text-fg tabular-nums">{value.toLocaleString('tr')}</p>
      <p className="text-[11px] text-fg-subtle mt-1">{label}</p>
      <p className={`text-[10px] font-semibold ${color} mt-1`}>{delta}</p>
    </Card>
  )
}

function SmallKpi({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <Card className="py-3 px-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className={color} />
        <p className="text-[11px] text-fg-subtle">{label}</p>
      </div>
      <p className="text-xl font-black text-fg mt-1 tabular-nums">{value.toLocaleString('tr')}</p>
    </Card>
  )
}

function PulseStat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="text-center p-3 rounded-xl bg-surface-2">
      <Icon size={16} className="text-primary mx-auto mb-1" />
      <p className="text-xl font-black text-fg tabular-nums">{value.toLocaleString('tr')}</p>
      <p className="text-[10px] text-fg-subtle">{label}</p>
    </div>
  )
}
