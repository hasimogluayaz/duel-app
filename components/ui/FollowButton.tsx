'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { UserPlus, UserCheck, Users } from 'lucide-react'

interface Props {
  targetUserId: string
  initialIsFollowing: boolean
  initialFollowerCount: number
  initialFollowingCount: number
  size?: 'sm' | 'md'
}

export function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  initialFollowingCount,
  size = 'md',
}: Props) {
  const toast = useToast()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [followerCount, setFollowerCount] = useState(initialFollowerCount)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function toggle() {
    setLoading(true)
    const method = isFollowing ? 'DELETE' : 'POST'
    const res = await fetch('/api/follow', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ following_id: targetUserId }),
    })

    if (res.ok) {
      const newFollowing = !isFollowing
      setIsFollowing(newFollowing)
      setFollowerCount(c => newFollowing ? c + 1 : Math.max(0, c - 1))
      toast(newFollowing ? 'Takip ediyorsun! 👤' : 'Takipten çıkıldı.', newFollowing ? 'success' : 'info')
    } else {
      const json = await res.json()
      toast(json.error || 'Bir hata oluştu.', 'error')
    }
    setLoading(false)
  }

  const sm = size === 'sm'

  return (
    <div className="flex items-center gap-3">
      {/* Follower / Following counts */}
      <div className={`flex items-center gap-3 text-center ${sm ? 'gap-2' : 'gap-4'}`}>
        <div>
          <p className={`font-black text-fg ${sm ? 'text-sm' : 'text-base'}`}>{followerCount}</p>
          <p className="text-xs text-fg-subtle leading-none">takipçi</p>
        </div>
        <div className="w-px h-6 bg-stroke" />
        <div>
          <p className={`font-black text-fg ${sm ? 'text-sm' : 'text-base'}`}>{initialFollowingCount}</p>
          <p className="text-xs text-fg-subtle leading-none">takip</p>
        </div>
      </div>

      {/* Follow / Unfollow button */}
      <button
        onClick={toggle}
        disabled={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`
          inline-flex items-center gap-1.5 font-bold rounded-xl border transition-all
          ${sm ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isFollowing
            ? hovered
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-green-500/30 bg-green-500/10 text-green-400'
            : 'border-primary/50 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
          }
        `}
      >
        {loading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isFollowing ? (
          <>
            {hovered ? (
              <><Users size={sm ? 11 : 13} /> Takibi Bırak</>
            ) : (
              <><UserCheck size={sm ? 11 : 13} /> Takip Ediliyor</>
            )}
          </>
        ) : (
          <><UserPlus size={sm ? 11 : 13} /> Takip Et</>
        )}
      </button>
    </div>
  )
}
