'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  text: string
  className?: string
  label?: string
}

export default function CopyButton({ text, className, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 select-none',
        copied
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 scale-[0.97]'
          : 'bg-[#F3F0EC] hover:bg-[#EDE9E4] active:bg-[#E4DED8] text-[#555] border border-[#E4DED8] hover:border-[#CEC8C1] active:scale-[0.97]',
        className
      )}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {label ?? 'Copy'}
        </>
      )}
    </button>
  )
}
