'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto bg-surface border border-stroke rounded-2xl p-5 shadow-2xl">
        <p className="text-sm text-fg-muted mb-4">
          🍪 Bu site, daha iyi deneyim sunmak için çerezler kullanır. Zorunlu çerezler (oturum) her zaman aktiftir.{' '}
          <Link href="/cerez-politikasi" className="text-primary/70 hover:underline">Çerez politikamızı</Link> okuyabilirsiniz.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={accept} size="sm">Kabul Et</Button>
          <Button onClick={decline} variant="outline" size="sm">Reddet</Button>
        </div>
      </div>
    </div>
  )
}
