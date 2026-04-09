import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-[#111111] mb-1.5">
            {label}
          </label>
        )}
        {hint && <p className="text-[12px] text-[#888] mb-1.5">{hint}</p>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 rounded-xl border text-[#111111] text-sm placeholder:text-[#BBBAB6] bg-white',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400',
            'disabled:bg-[#F7F6F3] disabled:cursor-not-allowed disabled:text-[#999]',
            error ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : 'border-[#E8E4DC]',
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
