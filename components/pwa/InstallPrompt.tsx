'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (localStorage.getItem('pwa_dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e)
      // Show after 30 seconds of use
      setTimeout(() => setShow(true), 30_000)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!prompt) return
    prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }

  function dismiss() {
    setShow(false)
    setDismissed(true)
    localStorage.setItem('pwa_dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto">
      <div className="bg-[#1a1a2e] border border-violet-500/30 rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
          <Download size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Uygulamayı Yükle</p>
          <p className="text-xs text-white/50">Ana ekrana ekle, daha hızlı aç</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={install}
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
          >
            Yükle
          </button>
          <button onClick={dismiss} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
