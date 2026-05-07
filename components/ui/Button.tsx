'use client'

import { cn } from '@/lib/utils/cn'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-fg focus:ring-violet-500 active:scale-[0.98] shadow-md shadow-violet-500/20': variant === 'primary',
            'bg-surface-2 hover:bg-stroke text-fg focus:ring-violet-500': variant === 'secondary',
            'hover:bg-surface-2 text-fg-muted hover:text-fg focus:ring-zinc-500': variant === 'ghost',
            'bg-red-500 hover:bg-red-400 text-fg focus:ring-red-500': variant === 'danger',
            'border border-stroke hover:border-primary/50 hover:text-primary text-fg-muted focus:ring-violet-500 hover:bg-primary/5': variant === 'outline',
            'px-3 py-1.5 text-sm gap-1.5': size === 'sm',
            'px-5 py-2.5 text-sm gap-2': size === 'md',
            'px-6 py-3 text-base gap-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Yükleniyor...
          </>
        ) : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
