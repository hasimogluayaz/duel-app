'use client'

import { useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'

interface Props {
  type: 'answer' | 'scenario'
  id: string
  initialBookmarked?: boolean
  size?: number
  className?: string
  showLabel?: boolean
}

export default function BookmarkButton({ type, id, initialBookmarked = false, size = 16, className = '', showLabel = false }: Props) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    const prev = bookmarked
    setBookmarked(!prev) // optimistic
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      })
      const d = await res.json()
      if (!res.ok) setBookmarked(prev)
      else setBookmarked(d.bookmarked)
    } catch {
      setBookmarked(prev)
    } finally {
      setLoading(false)
    }
  }

  const Icon = bookmarked ? BookmarkCheck : Bookmark

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={bookmarked ? 'Kaydedildi' : 'Kaydet'}
      className={`flex items-center gap-1 transition-all disabled:opacity-50 ${
        bookmarked ? 'text-violet-400' : 'text-fg-subtle hover:text-fg-muted'
      } ${className}`}
    >
      <Icon size={size} className={loading ? 'animate-pulse' : ''} />
      {showLabel && (
        <span className="text-xs">{bookmarked ? 'Kaydedildi' : 'Kaydet'}</span>
      )}
    </button>
  )
}
