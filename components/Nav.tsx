'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
    { href: '/settings',                   label: 'Settings',        icon: (a) => <IconSettings active={a} /> },
  ]

  return (
    <>
      <nav className="bg-[#0A0A0A] sticky top-0 z-40 border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-7 h-7 rounded-lg bg-[#E05A28] flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105">
                <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 2v4a2 2 0 002 2v6M8 2v10M11 2s2 1 2 3-2 3-2 3v4"/>
                </svg>
              </div>
              <span className="text-[14px] font-semibold text-white tracking-tight">TableReply</span>
            </Link>

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-white/[0.09] text-white'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={active ? 'text-[#E05A28]' : ''}>{link.icon(active)}</span>
                    {link.label}
                    {link.badge != null && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#E05A28] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {link.dot && !link.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0" />
                    )}
                  </Link>
                )
              })}

              <div className="w-px h-4 bg-white/[0.08] mx-1" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150"
              >
                <IconLogout />
                Logout
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
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
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px] animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer */}
          <div className="lg:hidden fixed top-14 left-0 right-0 z-40 bg-[#0A0A0A] border-b border-white/[0.06] animate-slide-down shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
            <div className="px-3 py-3 grid grid-cols-2 gap-1">
              {links.map((link) => {
                const active = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      active
                        ? 'bg-white/[0.09] text-white'
                        : 'text-white/45 hover:text-white/85 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={active ? 'text-[#E05A28]' : 'opacity-70'}>{link.icon(active)}</span>
                    <span className="flex-1">{link.label}</span>
                    {link.badge != null && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#E05A28] text-white text-[10px] font-bold flex items-center justify-center">
                        {link.badge > 99 ? '99+' : link.badge}
                      </span>
                    )}
                    {link.dot && !link.badge && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28]" />
                    )}
                  </Link>
                )
              })}
            </div>
            <div className="px-3 pb-3 pt-1 border-t border-white/[0.05]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3.5 py-3 rounded-xl text-[13px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
              >
                <IconLogout />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
