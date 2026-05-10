'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { FollowButton } from '@/components/profile/FollowButton'
import { formatPoints } from '@/lib/utils/formatting'
import { getTier } from '@/lib/utils/tier'
import { Users, ArrowLeft } from 'lucide-react'

interface UserRow {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  total_points: number
  follower_count: number
  isFollowing: boolean
}

interface Props {
  profile: { username: string; display_name: string; follower_count?: number; following_count?: number }
  users: UserRow[]
  mode: 'followers' | 'following'
  currentUserId: string | null
}

export default function FollowListClient({ profile, users, mode, currentUserId }: Props) {
  const [list, setList] = useState(users)

  return (
    <div className="max-w-xl mx-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bg/80 backdrop-blur-md border-b border-stroke">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href={`/profil/${profile.username}`} className="text-fg-subtle hover:text-fg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-fg text-sm">{profile.display_name || profile.username}</h1>
            <p className="text-xs text-fg-subtle">@{profile.username}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4">
          <Link
            href={`/profil/${profile.username}/takip`}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              mode === 'following'
                ? 'border-primary text-fg'
                : 'border-transparent text-fg-subtle hover:text-fg'
            }`}
          >
            {profile.following_count ?? 0} Takip
          </Link>
          <Link
            href={`/profil/${profile.username}/takipciler`}
            className={`flex-1 py-3 text-sm font-semibold text-center border-b-2 transition-colors ${
              mode === 'followers'
                ? 'border-primary text-fg'
                : 'border-transparent text-fg-subtle hover:text-fg'
            }`}
          >
            {profile.follower_count ?? 0} Takipçi
          </Link>
        </div>
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-fg-subtle">
          <Users size={40} className="opacity-20 mb-3" />
          <p className="font-semibold">
            {mode === 'followers' ? 'Henüz takipçi yok' : 'Henüz kimseyi takip etmiyor'}
          </p>
        </div>
      ) : (
        <div>
          {list.map((u) => {
            const tier = getTier(u.total_points)
            return (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 border-b border-stroke/50 hover:bg-surface/50 transition-colors">
                <Link href={`/profil/${u.username}`}>
                  <Avatar src={u.avatar_url} username={u.username} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profil/${u.username}`} className="group">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-fg text-sm group-hover:text-primary/70 transition-colors truncate">
                        {u.display_name || u.username}
                      </span>
                      <span className="text-xs">{tier.emoji}</span>
                    </div>
                    <p className="text-xs text-fg-subtle">@{u.username}</p>
                  </Link>
                  <p className="text-xs text-fg-subtle mt-0.5">
                    {u.follower_count} takipçi · {formatPoints(u.total_points)} puan
                  </p>
                </div>
                {currentUserId && currentUserId !== u.id && (
                  <FollowButton
                    targetId={u.id}
                    initialFollowing={u.isFollowing}
                    size="sm"
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
