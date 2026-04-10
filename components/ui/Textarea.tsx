import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-[13px] font-medium text-[#111111] mb-1.5">
            {label}
          </label>
        )}
        {hint && <p className="text-[12px] text-[#888] mb-1.5">{hint}</p>}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-3 rounded-xl border text-[#111111] text-sm placeholder:text-[#BBBAB6] bg-white resize-y',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28]',
            'disabled:bg-[#F3F0EC] disabled:cursor-not-allowed',
            error ? 'border-red-400 focus:ring-red-400/30 focus:border-red-400' : 'border-[#E4DED8] hover:border-[#CEC8C1]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
export default Textarea
