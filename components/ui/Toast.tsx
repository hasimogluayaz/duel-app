'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-up',
              t.type === 'success' && 'bg-green-900/90 border-green-700 text-green-100',
              t.type === 'error' && 'bg-red-900/90 border-red-700 text-red-100',
              t.type === 'info' && 'bg-zinc-800 border-zinc-700 text-zinc-100'
            )}
          >
            {t.type === 'success' && <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />}
            {t.type === 'error' && <XCircle size={18} className="flex-shrink-0 mt-0.5" />}
            {t.type === 'info' && <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />}
            <p className="text-sm flex-1">{t.message}</p>
            <button onClick={() => remove(t.id)} className="flex-shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}
