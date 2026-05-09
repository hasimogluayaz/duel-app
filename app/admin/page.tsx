'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Spinner } from '@/components/ui/Spinner'
import { formatPoints } from '@/lib/utils/formatting'
import { Users, Swords, FileText, Zap, ShieldOff, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import DauChart from '@/components/admin/DauChart'

interface Stats {
  users: number
  duels: number
  answers: number
  activeDuels: number
  bannedUsers: number
}

interface ProfileMini {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
  created_at?: string
}

const STAT_CARDS = (s: Stats) => [
  { label: 'Toplam Kullanıcı', value: s.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  { label: 'Toplam Düello', value: s.duels, icon: Swords, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { label: 'Toplam Cevap', value: s.answers, icon: FileText, color: 'text-green-400', bg: 'bg-green-500/15' },
  { label: 'Aktif Düello', value: s.activeDuels, icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { label: 'Banlı Kullanıcı', value: s.bannedUsers, icon: ShieldOff, color: 'text-red-400', bg: 'bg-red-500/15' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentUsers, setRecentUsers] = useState<ProfileMini[]>([])
  const [topUsers, setTopUsers] = useState<ProfileMini[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => {
        setStats(d.stats)
        setRecentUsers(d.recentUsers)
        setTopUsers(d.topUsers)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>
  if (!stats) return null

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-black text-fg mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {STAT_CARDS(stats).map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="text-center py-5">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-black text-fg">{value.toLocaleString('tr')}</p>
            <p className="text-xs text-fg-subtle mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* DAU Chart */}
      <div className="mb-6">
        <DauChart />
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent signups */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-blue-400" />
            <h2 className="font-bold text-fg text-sm">Son Kayıtlar</h2>
          </div>
          <div className="flex flex-col gap-2">
            {recentUsers.map(u => (
              <Link key={u.id} href={`/profil/${u.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar src={u.avatar_url} username={u.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{u.display_name || u.username}</p>
                  <p className="text-xs text-fg-subtle">@{u.username}</p>
                </div>
                <p className="text-xs text-fg-subtle shrink-0">
                  {new Date(u.created_at!).toLocaleDateString('tr')}
                </p>
              </Link>
            ))}
          </div>
          <Link href="/admin/kullanicilar" className="block text-xs text-primary hover:underline mt-4 text-center">
            Tüm kullanıcılar →
          </Link>
        </Card>

        {/* Top players */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-amber-400" />
            <h2 className="font-bold text-fg text-sm">Top Oyuncular</h2>
          </div>
          <div className="flex flex-col gap-2">
            {topUsers.map((u, i) => (
              <Link key={u.id} href={`/profil/${u.username}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <span className="text-sm font-bold text-fg-subtle w-4 shrink-0">{i + 1}</span>
                <Avatar src={u.avatar_url} username={u.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg truncate">{u.display_name || u.username}</p>
                </div>
                <p className="text-sm font-bold text-amber-400">{formatPoints(u.total_points)}</p>
              </Link>
            ))}
          </div>
          <Link href="/liderlik" className="block text-xs text-primary hover:underline mt-4 text-center">
            Tam liderlik →
          </Link>
        </Card>

      </div>
    </div>
  )
}
