'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LogoMark } from '@/components/Logo'
import { useModal } from '@/lib/hooks/useModal'

// Re-export from shared module for backward compatibility.
export { LogoMark }

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconHome({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function IconBolt({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

function IconReviews({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  )
}

function IconChart({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function IconGrow({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2.25 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
}

function IconSettings({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

// ─── Nav component ────────────────────────────────────────────────────────────

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [pendingCount, setPendingCount] = useState(0)
  const [analyticsStale, setAnalyticsStale] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [displayName, setDisplayName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { count } = await supabase
        .from('scraped_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('reply_status', 'pending')
      if (!cancelled) setPendingCount(count ?? 0)

      const { data: analytics } = await supabase
        .from('business_analytics')
        .select('last_analyzed_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cancelled) {
        if (analytics?.last_analyzed_at) {
          const ageMs = Date.now() - new Date(analytics.last_analyzed_at).getTime()
          setAnalyticsStale(ageMs > 7 * 24 * 60 * 60 * 1000)
        } else if ((count ?? 0) > 0) {
          setAnalyticsStale(true)
        }
      }

      const { data: profile } = await supabase
        .from('business_profiles')
        .select('owner_name, business_name')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!cancelled && profile) {
        const name = (profile.owner_name || profile.business_name || '').trim()
        if (name) setDisplayName(name.slice(0, 20) + (name.length > 20 ? '…' : ''))
      }
    }

    fetchData()
    const onFocus = () => fetchData()
    const onReviewsUpdated = () => fetchData()
    window.addEventListener('focus', onFocus)
    window.addEventListener('reviewsUpdated', onReviewsUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('reviewsUpdated', onReviewsUpdated)
    }
  }, [supabase])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Focus trap + Escape + scroll lock via shared hook
  const { containerRef: mobileDrawerRef } = useModal({
    open: mobileOpen,
    onClose: () => setMobileOpen(false),
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links: { href: string; label: string; icon: (a: boolean) => React.ReactNode; badge?: number | null; dot?: boolean }[] = [
    { href: '/dashboard',               label: 'Home',      icon: (a) => <IconHome active={a} /> },
    { href: '/dashboard/reviews',       label: 'Reviews',   icon: (a) => <IconReviews active={a} />, badge: pendingCount > 0 ? pendingCount : null },
    { href: '/dashboard/analytics',     label: 'Analytics', icon: (a) => <IconChart active={a} />, dot: analyticsStale },
    { href: '/dashboard/grow',          label: 'Grow',      icon: (a) => <IconGrow active={a} /> },
  ]

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#E4DED8]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
              <LogoMark size={26} />
              <span className="text-[14px] font-bold text-[#111111] tracking-[-0.025em]">ReplyFi</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-1">
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] transition-colors duration-150 ${
                      active
                        ? 'text-[#111111] font-semibold'
                        : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
                    }`}
                  >
                    <span className={active ? 'text-[#111111]' : 'text-[#A8A29E]'}>{link.icon(active)}</span>
                    {link.label}
                    {link.badge != null && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E05A28] text-white text-[10px] font-semibold flex items-center justify-center leading-none tnum">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {link.dot && !link.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0" />
                    )}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-3 right-3 -bottom-[14px] h-[2px] bg-[#E05A28] rounded-full"
                      />
                    )}
                  </Link>
                )
              })}

              <div className="w-px h-4 bg-[#E4DED8] mx-2" />

              {displayName && (
                <Link href="/settings" className="bg-[#F3F0EC] border border-[#E4DED8] rounded-full px-3 py-1 text-[12px] text-[#57534E] font-medium max-w-[140px] truncate mr-1 hover:bg-[#EDE9E4] transition-colors">
                  {displayName}
                </Link>
              )}

              <Link
                href="/settings"
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] transition-colors duration-150 ${
                  pathname === '/settings'
                    ? 'text-[#111111] font-semibold'
                    : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
                }`}
              >
                <IconSettings active={pathname === '/settings'} />
                <span>Settings</span>
                {pathname === '/settings' && (
                  <span aria-hidden="true" className="absolute left-3 right-3 -bottom-[14px] h-[2px] bg-[#E05A28] rounded-full" />
                )}
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[14px] font-medium text-[#111111]/60 hover:text-[#111111]/65 hover:bg-[#F3F0EC] transition-all duration-150 active:scale-[0.97]"
              >
                <IconLogout />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex items-center justify-center w-11 h-11 rounded-lg text-[#111111]/50 hover:text-[#111111] hover:bg-[#F3F0EC] transition-all active:scale-95"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span className={`absolute block w-5 h-px bg-current transition-all duration-200 ${mobileOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
                <span className={`absolute block w-5 h-px bg-current transition-all duration-200 ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`} />
                <span className={`absolute block w-5 h-px bg-current transition-all duration-200 ${mobileOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile overlay + drawer — only mounted when open so it never sits off-screen */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />

          <div
            ref={mobileDrawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="lg:hidden fixed left-0 right-0 z-50 bg-white border-b border-[#E4DED8] shadow-[0_20px_50px_rgba(0,0,0,0.10)] overflow-y-auto animate-slide-down"
            style={{
              top: 'calc(64px + env(safe-area-inset-top))',
              maxHeight: 'calc(100dvh - 64px - env(safe-area-inset-top))',
            }}
          >
            <div className="px-3 py-2 space-y-0.5">
              {displayName && (
                <div className="px-4 pt-2 pb-1">
                  <span className="bg-[#F3F0EC] border border-[#E4DED8] rounded-full px-3 py-1 text-[12px] text-[#57534E] font-medium inline-block max-w-full truncate">
                    {displayName}
                  </span>
                </div>
              )}
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 rounded-xl text-[14px] transition-colors duration-150 min-h-[48px] ${
                      active
                        ? 'bg-[#FAF8F5] text-[#111111] font-semibold'
                        : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
                    }`}
                  >
                    <span className={`w-0.5 h-5 rounded-full flex-shrink-0 transition-all ${active ? 'bg-[#E05A28]' : 'bg-transparent'}`} />
                    <span className={active ? 'text-[#E05A28]' : 'opacity-60'}>{link.icon(active)}</span>
                    <span className="flex-1">{link.label}</span>
                    {link.badge != null && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#E05A28] text-white text-[10px] font-semibold flex items-center justify-center tnum">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {link.dot && !link.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0" />
                    )}
                  </Link>
                )
              })}
            </div>
            <div className="px-3 pb-4 pt-1 border-t border-[#EDE9E4] space-y-0.5">
              <Link
                href="/settings"
                className={`flex items-center gap-3 w-full px-4 rounded-xl text-[14px] transition-colors duration-150 min-h-[48px] ${
                  pathname === '/settings'
                    ? 'bg-[#FAF8F5] text-[#111111] font-semibold'
                    : 'text-[#57534E] font-medium hover:text-[#111111] hover:bg-[#F0EDE8]'
                }`}
              >
                <span className={`w-0.5 h-5 rounded-full flex-shrink-0 ${pathname === '/settings' ? 'bg-[#E05A28]' : 'bg-transparent'}`} />
                <span className={pathname === '/settings' ? 'text-[#E05A28]' : 'opacity-60'}><IconSettings active={pathname === '/settings'} /></span>
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 min-h-[48px] rounded-xl text-[14px] font-medium text-[#57534E] hover:text-[#111111] hover:bg-[#F0EDE8] transition-colors duration-150"
              >
                <span className="w-0.5 h-5 rounded-full flex-shrink-0 bg-transparent" />
                <IconLogout />
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
