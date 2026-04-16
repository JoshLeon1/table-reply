import { cn } from '@/lib/utils'
import Eyebrow from './Eyebrow'

interface SectionDividerProps {
  /** Optional centered eyebrow label inside the rule. */
  label?: string
  className?: string
}

/**
 * Hairline rule with optional centered eyebrow label. Use to separate
 * page-level sections without stacking cards.
 */
export default function SectionDivider({ label, className }: SectionDividerProps) {
  if (!label) {
    return <hr className={cn('border-0 border-t border-[#EDE9E4]', className)} />
  }
  return (
    <div className={cn('flex items-center gap-4', className)} role="separator">
      <span className="flex-1 h-px bg-[#EDE9E4]" aria-hidden="true" />
      <Eyebrow>{label}</Eyebrow>
      <span className="flex-1 h-px bg-[#EDE9E4]" aria-hidden="true" />
    </div>
  )
}
