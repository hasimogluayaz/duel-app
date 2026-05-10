'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Lock, Sparkles, LogIn } from 'lucide-react'

export function HomeAnswerGate() {
  const [joinModal, setJoinModal] = useState(false)

  return (
    <>
      {/* Locked answer textarea */}
      <div
        className="relative rounded-xl border border-stroke bg-surface p-4 cursor-pointer hover:border-primary/40 transition-colors group"
        onClick={() => setJoinModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setJoinModal(true)}
      >
        {/* Fake textarea */}
        <div className="w-full h-20 rounded-lg bg-bg border border-stroke flex items-center justify-center mb-3">
          <div className="flex items-center gap-2 text-fg-subtle text-sm">
            <Lock size={13} className="text-primary/70" />
            <span>Cevabını buraya yaz...</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-subtle">0 / 280</span>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary/70 group-hover:text-primary/40 transition-colors">
            <Sparkles size={12} />
            Cevaplamak için katıl
          </div>
        </div>
      </div>

      {/* Join modal */}
      <Modal open={joinModal} onClose={() => setJoinModal(false)} title="Kapışmaya katıl! 🔥">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted text-center">
            Cevabını yaz, topluluktan oy topla, düello kazan.
            <br />
            <span className="text-fg-subtle">Ücretsiz — 30 saniyede kayıt.</span>
          </p>

          <Link href="/kayit" className="w-full" onClick={() => setJoinModal(false)}>
            <Button className="w-full btn-gradient text-sm" size="lg">
              <Sparkles size={15} />
              Ücretsiz Kayıt Ol
            </Button>
          </Link>

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-stroke" />
            <span className="text-xs text-fg-subtle">veya</span>
            <div className="flex-1 h-px bg-stroke" />
          </div>

          <Link href="/giris" className="w-full" onClick={() => setJoinModal(false)}>
            <Button variant="secondary" className="w-full text-sm" size="lg">
              <LogIn size={15} />
              Zaten hesabım var — Giriş Yap
            </Button>
          </Link>
        </div>
      </Modal>
    </>
  )
}
