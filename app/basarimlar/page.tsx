'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Medal, Lock, CheckCircle2, Star, Swords, Flame, Users, Trophy, Zap, MessageSquare } from 'lucide-react'

interface Achievement {
  type: string
  earned: boolean
  earned_at: string | null
}

const ACHIEVEMENT_MAP: Record<string, {
  emoji: string
  label: string
  description: string
  how: string
  icon: React.ElementType
  color: string
  points: number
  progress?: (profile: any) => { current: number; target: number }
}> = {
  ilk_kan: {
    emoji: '🩸', label: 'İlk Kan', description: 'İlk düellonu tamamla',
    how: 'Herhangi bir düelloyu kazan veya kaybet', icon: Swords, color: 'text-red-400',
    points: 50, progress: p => ({ current: Math.min(p.duel_count ?? 0, 1), target: 1 }),
  },
  galipler_galibi: {
    emoji: '👑', label: 'Galipler Galibi', description: '10 düello kazan',
    how: 'Düellolarda galip gel', icon: Trophy, color: 'text-amber-400',
    points: 200, progress: p => ({ current: Math.min(p.win_count ?? 0, 10), target: 10 }),
  },
  cevap_makinesi: {
    emoji: '💬', label: 'Cevap Makinesi', description: '50 senaryo cevapla',
    how: 'Farklı senaryolara cevap ver', icon: MessageSquare, color: 'text-blue-400',
    points: 150, progress: p => ({ current: Math.min(p.answer_count ?? 0, 50), target: 50 }),
  },
  haftalik_sampiyon: {
    emoji: '🏅', label: 'Haftalık Şampiyon', description: 'Haftalık liderliği kazan',
    how: 'Hafta sonu en çok puana sahip ol', icon: Star, color: 'text-yellow-400',
    points: 500,
  },
  seri_avcisi: {
    emoji: '🎯', label: 'Seri Avcısı', description: '3 düelloyu arka arkaya kazan',
    how: 'Peş peşe galip gel', icon: Zap, color: 'text-primary/70',
    points: 100,
  },
  efsane_serisi: {
    emoji: '🔥', label: 'Efsane Serisi', description: '7 günlük giriş serisi yap',
    how: 'Her gün giriş yap', icon: Flame, color: 'text-orange-400',
    points: 100, progress: p => ({ current: Math.min(p.streak_count ?? 0, 7), target: 7 }),
  },
  sosyal_kelebek: {
    emoji: '🦋', label: 'Sosyal Kelebek', description: '10 kişiyi takip et',
    how: 'Profil sayfalarından takip et', icon: Users, color: 'text-secondary/70',
    points: 75, progress: p => ({ current: Math.min(p.following_count ?? 0, 10), target: 10 }),
  },
  populer: {
    emoji: '⭐', label: 'Popüler', description: '100 takipçi kazan',
    how: 'Başkaları seni takip etsin', icon: Users, color: 'text-cyan-400',
    points: 300, progress: p => ({ current: Math.min(p.follower_count ?? 0, 100), target: 100 }),
  },
  viral: {
    emoji: '🚀', label: 'Viral', description: 'Bir cevabın 50 oy alsın',
    how: 'Çok beğenilen cevaplar yaz', icon: Star, color: 'text-green-400',
    points: 250,
  },
  filozof: {
    emoji: '🤔', label: 'Filozof', description: 'Felsefe kategorisinde 5 cevap ver',
    how: 'Felsefe senaryolarına cevap ver', icon: MessageSquare, color: 'text-indigo-400',
    points: 75,
  },
  karisik_kafali: {
    emoji: '🎲', label: 'Karışık Kafalı', description: '5 farklı kategoride cevap ver',
    how: 'Çeşitli senaryolara cevap ver', icon: Zap, color: 'text-primary/70',
    points: 100,
  },
  davetkar: {
    emoji: '🤝', label: 'Davetkar', description: '3 arkadaşını davet et',
    how: 'Referans kodunu paylaş', icon: Users, color: 'text-emerald-400',
    points: 150, progress: p => ({ current: Math.min(p.referral_count ?? 0, 3), target: 3 }),
  },
}

const ORDER = ['ilk_kan', 'galipler_galibi', 'cevap_makinesi', 'haftalik_sampiyon', 'seri_avcisi',
               'efsane_serisi', 'sosyal_kelebek', 'populer', 'viral', 'filozof', 'karisik_kafali', 'davetkar']

export default function BasarimlarPage() {
  const router = useRouter()
  const supabase = createClient()
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      const [{ data: prof }, achRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        fetch('/api/titles'),
      ])
      const achJson = await achRes.json()
      setProfile(prof)
      setAchievements(achJson.earned ?? [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="space-y-3">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-surface-2 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  )

  const earnedSet = new Set(achievements.map(a => a.type))
  const earnedCount = ORDER.filter(k => earnedSet.has(k)).length
  const totalPoints = ORDER.filter(k => earnedSet.has(k)).reduce((s, k) => s + (ACHIEVEMENT_MAP[k]?.points ?? 0), 0)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center">
          <Medal size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-black text-fg">Başarımlar</h1>
          <p className="text-xs text-fg-subtle">{earnedCount}/{ORDER.length} kazanıldı · {totalPoints} puan</p>
        </div>
      </div>

      {/* Overall progress */}
      <div className="bg-surface border border-stroke rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between text-xs text-fg-subtle mb-2">
          <span>Genel İlerleme</span>
          <span className="font-bold text-amber-400">{Math.round((earnedCount / ORDER.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-stroke rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
            style={{ width: `${(earnedCount / ORDER.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-fg-subtle">
          <span>{earnedCount} kazanıldı</span>
          <span>{ORDER.length - earnedCount} kaldı</span>
        </div>
      </div>

      {/* Achievement grid */}
      <div className="space-y-2">
        {ORDER.map(key => {
          const def = ACHIEVEMENT_MAP[key]
          if (!def) return null
          const earned = earnedSet.has(key)
          const achData = achievements.find(a => a.type === key)
          const progressData = def.progress && profile ? def.progress(profile) : null
          const Icon = def.icon
          const pct = progressData ? Math.round((progressData.current / progressData.target) * 100) : 0

          return (
            <div
              key={key}
              className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                earned
                  ? 'bg-amber-500/6 border-amber-500/25'
                  : 'bg-surface border-stroke'
              }`}
            >
              {/* Emoji / locked */}
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                earned ? 'bg-amber-500/15' : 'bg-surface-2'
              }`}>
                {earned ? def.emoji : <Lock size={18} className="text-fg-subtle opacity-50" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-sm font-bold ${earned ? 'text-fg' : 'text-fg-subtle'}`}>
                    {def.label}
                  </span>
                  {earned && <CheckCircle2 size={13} className="text-green-400 shrink-0" />}
                </div>
                <p className={`text-xs mb-1 ${earned ? 'text-fg-muted' : 'text-fg-subtle'}`}>
                  {def.description}
                </p>

                {/* Progress bar (if not earned + has progress) */}
                {!earned && progressData && (
                  <div>
                    <div className="h-1 bg-stroke rounded-full overflow-hidden mb-0.5">
                      <div
                        className={`h-full rounded-full transition-all ${def.color.replace('text-', 'bg-')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-fg-subtle">{progressData.current}/{progressData.target}</span>
                  </div>
                )}

                {/* How to earn */}
                {!earned && !progressData && (
                  <p className="text-[10px] text-fg-subtle italic">{def.how}</p>
                )}

                {/* Earned date */}
                {earned && achData?.earned_at && (
                  <p className="text-[10px] text-amber-400/60">
                    {new Date(achData.earned_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>

              {/* Points badge */}
              <div className={`shrink-0 flex flex-col items-center gap-0.5 ${earned ? 'text-amber-400' : 'text-fg-subtle'}`}>
                <Star size={12} className={earned ? 'fill-amber-400' : ''} />
                <span className="text-xs font-black">{def.points}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
