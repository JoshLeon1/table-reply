import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg'
}

export function Card({ className, padding = 'md', children, ...props }: CardProps) {
  const paddings = { sm: 'p-4', md: 'p-6', lg: 'p-8' }

  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-[#E8E4DC]',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
