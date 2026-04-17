import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, type, inputMode, autoCapitalize, autoCorrect, ...props }, ref) => {
    const t = type ?? 'text'
    const derived = (() => {
      if (t === 'email') return { inputMode: 'email' as const, autoCapitalize: 'none', autoCorrect: 'off' }
      if (t === 'url')   return { inputMode: 'url'   as const, autoCapitalize: 'none', autoCorrect: 'off' }
      if (t === 'tel')   return { inputMode: 'tel'   as const }
      if (t === 'number')return { inputMode: 'numeric' as const }
      return {}
    })()

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-text-1 mb-1.5">
            {label}
          </label>
        )}
        {hint && <p className="text-[12px] text-text-2 mb-1.5">{hint}</p>}
        <input
          ref={ref}
          id={id}
          type={t}
          inputMode={inputMode ?? derived.inputMode}
          autoCapitalize={autoCapitalize ?? derived.autoCapitalize}
          autoCorrect={autoCorrect ?? derived.autoCorrect}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border text-text-1 text-base sm:text-sm placeholder:text-text-placeholder bg-white',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-accent/25 focus:border-accent',
            'disabled:bg-surface disabled:cursor-not-allowed disabled:text-text-3',
            error
              ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400'
              : 'border-border hover:border-[#CEC8C1]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
