'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { UserPlus, UserCheck } from 'lucide-react'

interface Props {
  targetId: string
  initialFollowing: boolean
  size?: 'sm' | 'md'
  onFollow?: () => void
  onUnfollow?: () => void
}

export function FollowButton({ targetId, initialFollowing, size = 'sm', onFollow, onUnfollow }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch('/api/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          following_id: targetId,
          action: following ? 'unfollow' : 'follow',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast(json.error || 'İşlem başarısız.', 'error')
      } else {
        setFollowing(json.following)
        if (json.following) {
          toast('Takip edildi! 👥', 'success')
          onFollow?.()
        } else {
          toast('Takip bırakıldı.', 'success')
          onUnfollow?.()
        }
      }
    } catch {
      toast('Bağlantı hatası. Tekrar dene.', 'error')
    }
    setLoading(false)
  }

  return (
    <Button
      size={size}
      variant={following ? 'secondary' : 'outline'}
      loading={loading}
      onClick={toggle}
      className={following ? '' : 'border-primary/40 text-primary/70 hover:bg-primary/10'}
    >
      {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
      {following ? 'Takip Ediliyor' : 'Takip Et'}
    </Button>
  )
}
