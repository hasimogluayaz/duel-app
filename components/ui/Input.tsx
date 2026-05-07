import { cn } from '@/lib/utils/cn'
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-fg-muted">{label}</label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-fg placeholder-zinc-600',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
            'transition-all duration-150',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  charCount?: number
  maxChars?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, charCount, maxChars, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-fg-muted">{label}</label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-fg placeholder-zinc-600 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
            'transition-all duration-150',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center">
          {error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : (
            <span />
          )}
          {maxChars !== undefined && (
            <span className={cn('text-xs', charCount && charCount > maxChars * 0.9 ? 'text-amber-400' : 'text-fg-subtle')}>
              {charCount ?? 0}/{maxChars}
            </span>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
