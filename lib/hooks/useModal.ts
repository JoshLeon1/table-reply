// lib/hooks/useModal.ts
//
// One hook for every modal: focus trap + Escape close + body scroll lock +
// return-focus on close. Call from any component that opens a modal:
//
//   const { containerRef } = useModal({ open, onClose })
//   return open ? <div ref={containerRef} role="dialog" aria-modal="true">…</div> : null

import { useEffect, useRef } from 'react'

interface UseModalOptions {
  open: boolean
  onClose: () => void
  /** disable focus trap (useful for full-page sheets that own the whole viewport) */
  disableFocusTrap?: boolean
}

export function useModal({ open, onClose, disableFocusTrap }: UseModalOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  // Body scroll lock
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  // Escape close + focus trap + return focus
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const focusable = () => {
      const root = containerRef.current
      if (!root) return [] as HTMLElement[]
      return Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
    }

    // Focus the first focusable element on open
    const first = focusable()[0]
    first?.focus()

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (disableFocusTrap || e.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey && active === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      // Return focus to whatever was focused before the modal opened
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose, disableFocusTrap])

  return { containerRef }
}
