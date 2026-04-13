'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Logo mark ────────────────────────────────────────────────────────────────
// Two overlapping speech bubbles: customer review (top-left) + restaurant reply (bottom-right)

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="rounded-[8px] bg-[#E05A28] flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        style={{ width: size * 0.62, height: size * 0.62 }}
        aria-hidden="true"
      >
        {/* Back bubble — customer review */}
        <path
          d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z"
          fill="white"
          fillOpacity="0.5"
        />
        {/* Front bubble — restaurant reply */}
        <path
          d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z"
          fill="white"
        />
      </svg>
    </div>
  )
}

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

function IconRefresh({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

function IconShare({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )
}

function IconUsers({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function IconStar({ active }: { active: boolean }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
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
        .from('restaurant_analytics')
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
    }

    fetchData()
    const onFocus = () => fetchData()
    window.addEventListener('focus', onFocus)
    return () => { cancelled = true; window.removeEventListener('focus', onFocus) }
  }, [supabase])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const links: { href: string; label: string; icon: (a: boolean) => React.ReactNode; badge?: number | null; dot?: boolean }[] = [
    { href: '/dashboard',                  label: 'Home',            icon: (a) => <IconHome active={a} /> },
    { href: '/dashboard/generate',         label: 'Generate',        icon: (a) => <IconBolt active={a} /> },
    { href: '/dashboard/reviews',          label: 'Auto Reviews',    icon: (a) => <IconRefresh active={a} />, badge: pendingCount > 0 ? pendingCount : null },
    { href: '/dashboard/analytics',        label: 'Analytics',       icon: (a) => <IconChart active={a} />, dot: analyticsStale },
    { href: '/dashboard/social',           label: 'Social',          icon: (a) => <IconShare active={a} /> },
    { href: '/dashboard/competitors',      label: 'Competitors',     icon: (a) => <IconUsers active={a} /> },
    { href: '/dashboard/get-more-reviews', label: 'Get Reviews',     icon: (a) => <IconStar active={a} /> },
  ]

  return (
    <>
      <nav className="sticky top-0 z-40 bg-[#0C0C0C]/95 backdrop-blur-xl border-b border-white/[0.06]" style={{ boxShadow: '0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.25)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="relative">
                <LogoMark size={30} />
                <div className="absolute inset-0 rounded-[8px] bg-[#E05A28]/20 blur-md group-hover:bg-[#E05A28]/30 transition-all duration-300 -z-10" />
              </div>
              <span className="text-[14px] font-bold text-white tracking-[-0.02em]">TableReply</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.97] ${
                      active
                        ? 'text-white bg-white/[0.10] border border-white/[0.10]'
                        : 'text-white/40 hover:text-white/70 hover:bg-white/[0.06]'
                    }`}
                    style={active ? { boxShadow: '0 1px 0 rgba(255,255,255,0.08) inset, 0 0 0 1px rgba(255,255,255,0.05)' } : undefined}
                  >
                    <span className={active ? 'text-[#E05A28]' : 'opacity-60'}>{link.icon(active)}</span>
                    {link.label}
                    {/* active underline dot */}
                    {active && (
                      <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-[#E05A28] shadow-[0_0_6px_rgba(224,90,40,0.7)]" />
                    )}
                    {link.badge != null && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E05A28] text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-[0_0_8px_rgba(224,90,40,0.5)]">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {link.dot && !link.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0 shadow-[0_0_6px_rgba(224,90,40,0.6)] animate-pulse" />
                    )}
                  </Link>
                )
              })}

              <div className="w-px h-4 bg-white/[0.07] mx-2" />

              <Link
                href="/settings"
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-[0.97] ${
                  pathname === '/settings'
                    ? 'text-[#E05A28] bg-white/[0.10] border border-white/[0.08]'
                    : 'text-white/35 hover:text-white/70 hover:bg-white/[0.06]'
                }`}
                title="Settings"
              >
                <IconSettings active={pathname === '/settings'} />
              </Link>

              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-white/30 hover:text-white/65 hover:bg-white/[0.06] transition-all duration-150 active:scale-[0.97]"
                title="Log Out"
              >
                <IconLogout />
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all active:scale-95"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
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

      {/* Mobile overlay + drawer */}
      <>
          <div
            className={`lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setMobileOpen(false)}
          />

          <div className={`lg:hidden fixed top-14 left-0 right-0 z-50 bg-[#0D0D0D] border-b border-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out overflow-y-auto max-h-[calc(100dvh-56px)] ${mobileOpen ? 'translate-y-0' : '-translate-y-[110%]'}`}>
            {/* Branding strip */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.05]">
              <LogoMark size={22} />
              <span className="text-[12px] font-semibold text-white/60 tracking-tight">TableReply</span>
            </div>

            <div className="px-3 py-2 space-y-0.5">
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 rounded-xl text-[14px] font-medium transition-all duration-150 min-h-[48px] ${
                      active
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/55 hover:text-white/90 hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Active left-border accent */}
                    <span className={`w-0.5 h-5 rounded-full flex-shrink-0 transition-all ${active ? 'bg-[#E05A28]' : 'bg-transparent'}`} />
                    <span className={active ? 'text-[#E05A28]' : 'opacity-60'}>{link.icon(active)}</span>
                    <span className="flex-1">{link.label}</span>
                    {link.badge != null && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#E05A28] text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(224,90,40,0.4)]">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {link.dot && !link.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] shadow-[0_0_6px_rgba(224,90,40,0.6)]" />
                    )}
                  </Link>
                )
              })}
            </div>
            <div className="px-3 pb-4 pt-1 border-t border-white/[0.05] space-y-0.5">
              <Link
                href="/settings"
                className={`flex items-center gap-3 w-full px-4 rounded-xl text-[14px] font-medium transition-all duration-150 min-h-[48px] ${
                  pathname === '/settings'
                    ? 'bg-white/[0.08] text-white'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/[0.05]'
                }`}
              >
                <span className={`w-0.5 h-5 rounded-full flex-shrink-0 ${pathname === '/settings' ? 'bg-[#E05A28]' : 'bg-transparent'}`} />
                <span className={pathname === '/settings' ? 'text-[#E05A28]' : 'opacity-60'}><IconSettings active={pathname === '/settings'} /></span>
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 min-h-[48px] rounded-xl text-[14px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
              >
                <span className="w-0.5 h-5 rounded-full flex-shrink-0 bg-transparent" />
                <IconLogout />
                Log Out
              </button>
            </div>
          </div>
      </>
    </>
  )
}
