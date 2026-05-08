'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { UserPlus, UserCheck } from 'lucide-react'

interface Props {
  targetId: string
  initialFollowing: boolean
}

export function FollowButton({ targetId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  async function toggle() {
    setLoading(true)
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
      toast(json.following ? 'Takip edildi! 👥' : 'Takip bırakıldı.', 'success')
    }
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant={following ? 'secondary' : 'outline'}
      loading={loading}
      onClick={toggle}
      className={following ? '' : 'border-purple-500/40 text-purple-400 hover:bg-purple-500/10'}
    >
      {following ? <UserCheck size={13} /> : <UserPlus size={13} />}
      {following ? 'Takip Ediliyor' : 'Takip Et'}
    </Button>
  )
}
