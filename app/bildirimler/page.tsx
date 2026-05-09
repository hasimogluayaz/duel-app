'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { timeAgo } from '@/lib/utils/formatting'
import type { Notification } from '@/types'
import { Bell, CheckCheck, Swords, Settings2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

// ─── Universal URL resolver (mirrors NotificationBell logic) ──────────────────
function getNotificationUrl(n: Notification): string | null {
  const data = (n as any).data ?? {}
  switch (n.type) {
    case 'duel_invite':
    case 'duel_result':
    case 'duel_accepted':
      if (data.share_token) return `/duel/${data.share_token}`
      if (data.duel_id)     return `/duel/${data.duel_id}`
      return null
    case 'vote_milestone':
      if (data.duel_id) return `/duel/${data.duel_id}`
      return null
    case 'new_follower':
      if (data.follower_username) return `/profil/${data.follower_username}`
      return null
    case 'new_comment':
    case 'comment_reply':
    case 'answer_comment':
      if (data.scenario_id) return `/arsiv/${data.scenario_id}`
      return null
    case 'reaction_milestone':
      if (data.scenario_id) return `/arsiv/${data.scenario_id}`
      return null
    case 'streak_milestone':
    case 'streak_reminder':
    case 'weekly_mission_complete':
      return '/oyun'
    case 'achievement':
    case 'tier_up':
      return '/basarimlar'
    case 'vote_received':
      if (data.scenario_id) return `/arsiv/${data.scenario_id}`
      return null
    default:
      return null
  }
}

// ─── Type display helpers ─────────────────────────────────────────────────────
const TYPE_GROUP: Record<string, string> = {
  duel_invite:            'Düello',
  duel_result:            'Düello',
  duel_accepted:          'Düello',
  vote_received:          'Oylar',
  vote_milestone:         'Oylar',
  reaction_milestone:     'Oylar',
  new_follower:           'Sosyal',
  streak_reminder:        'Seriler',
  streak_milestone:       'Seriler',
  weekly_mission_complete:'Görevler',
  title_earned:           'Başarımlar',
  achievement:            'Başarımlar',
  tier_up:                'Başarımlar',
  new_comment:            'Yorumlar',
  comment_reply:          'Yorumlar',
  answer_comment:         'Yorumlar',
}

const TYPE_ICONS: Record<string, string> = {
  duel_invite:            '⚔️',
  duel_result:            '🏆',
  duel_accepted:          '🤝',
  vote_milestone:         '⭐',
  reaction_milestone:     '🔥',
  streak_reminder:        '🔥',
  streak_milestone:       '🎯',
  new_follower:           '👥',
  vote_received:          '👍',
  new_comment:            '💬',
  comment_reply:          '↩️',
  answer_comment:         '💬',
  achievement:            '🏅',
  tier_up:                '📈',
  weekly_mission_complete:'✅',
}

const TYPE_COLORS: Record<string, string> = {
  duel_invite:            'bg-purple-500/20 text-purple-300',
  duel_result:            'bg-amber-500/20 text-amber-300',
  duel_accepted:          'bg-green-500/20 text-green-300',
  vote_milestone:         'bg-yellow-500/20 text-yellow-300',
  reaction_milestone:     'bg-orange-500/20 text-orange-300',
  streak_reminder:        'bg-orange-500/20 text-orange-300',
  streak_milestone:       'bg-red-500/20 text-red-300',
  new_follower:           'bg-blue-500/20 text-blue-300',
  vote_received:          'bg-green-500/20 text-green-300',
  new_comment:            'bg-cyan-500/20 text-cyan-300',
  comment_reply:          'bg-cyan-500/20 text-cyan-300',
  answer_comment:         'bg-cyan-500/20 text-cyan-300',
  achievement:            'bg-amber-500/20 text-amber-300',
  tier_up:                'bg-violet-500/20 text-violet-300',
  weekly_mission_complete:'bg-emerald-500/20 text-emerald-300',
}

export default function BildirimlerPage() {
  const supabase = createClient()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(data ?? [])
      setLoading(false)

      // Mark all as read on open
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(() => {})
    }
    load()
  }, [])

  async function markAllRead() {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  async function handleClick(n: Notification) {
    // Optimistic mark read
    if (!n.is_read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id).then(() => {})
    }
    const url = getNotificationUrl(n)
    if (url) router.push(url)
  }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center relative">
            <Bell size={20} className="text-purple-400" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black text-fg">Bildirimler</h1>
            <p className="text-sm text-fg-subtle">
              {unread > 0 ? `${unread} yeni bildirim` : 'Hepsi okundu'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              <CheckCheck size={14} />
              <span className="hidden sm:inline">Tümünü okundu işaretle</span>
            </Button>
          )}
          <Link href="/profil/ayarlar" title="Bildirim tercihleri">
            <button className="w-9 h-9 rounded-xl border border-stroke bg-surface hover:bg-surface-2 flex items-center justify-center text-fg-subtle hover:text-fg transition-colors">
              <Settings2 size={15} />
            </button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-16 border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-4">
            <Bell size={24} className="text-fg-subtle opacity-50" />
          </div>
          <p className="text-fg font-semibold mb-1">Henüz bildirim yok</p>
          <p className="text-fg-subtle text-sm mb-4">Düelloya gir, oylanmaya başla!</p>
          <Link href="/oyun">
            <Button size="sm" variant="secondary">
              <Swords size={14} />
              Oynamaya git
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Unread divider */}
          {unread > 0 && (
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px flex-1 bg-stroke" />
              <span className="text-xs text-purple-400 font-semibold px-2">{unread} yeni</span>
              <div className="h-px flex-1 bg-stroke" />
            </div>
          )}

          {notifications.map((n, idx) => {
            const thisGroup = TYPE_GROUP[n.type] ?? 'Diğer'
            const prevGroup = idx > 0 ? (TYPE_GROUP[notifications[idx - 1].type] ?? 'Diğer') : null
            const showGroupLabel = idx === 0 || thisGroup !== prevGroup

            const url = getNotificationUrl(n)
            const icon = TYPE_ICONS[n.type] ?? '🔔'
            const iconColor = TYPE_COLORS[n.type] ?? 'bg-surface-2 text-fg-muted'

            const inner = (
              <div
                onClick={() => handleClick(n)}
                className={cn(
                  'flex items-start gap-3.5 p-4 rounded-xl border transition-all',
                  !n.is_read
                    ? 'bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40'
                    : 'bg-surface border-stroke hover:border-purple-500/20',
                  url && 'cursor-pointer',
                )}
              >
                {/* Icon bubble */}
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5', iconColor)}>
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-fg">{n.title}</p>
                  <p className="text-sm text-fg-muted mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-xs text-fg-subtle mt-2">{timeAgo(n.created_at)}</p>
                </div>

                {!n.is_read && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2 animate-pulse" />
                )}
              </div>
            )

            return (
              <div key={n.id}>
                {showGroupLabel && idx > 0 && (
                  <p className="text-[10px] text-white/25 font-bold uppercase tracking-widest mt-3 mb-1 px-1">
                    {thisGroup}
                  </p>
                )}
                {inner}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
