'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

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

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const links: { href: string; label: string; badge?: number | null; dot?: boolean }[] = [
    { href: '/dashboard', label: 'Home' },
    { href: '/dashboard/generate', label: 'Generate Reply' },
    { href: '/dashboard/reviews', label: 'Auto Reviews', badge: pendingCount > 0 ? pendingCount : null },
    { href: '/dashboard/analytics', label: 'Analytics', dot: analyticsStale },
    { href: '/dashboard/social', label: 'Social' },
    { href: '/dashboard/competitors', label: 'Competitors' },
    { href: '/dashboard/get-more-reviews', label: 'Get Reviews' },
    { href: '/settings', label: 'Settings' },
  ]

  return (
    <nav className="bg-[#0D0D0D] border-b border-white/[0.05] sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-5">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-6 h-6 rounded-md bg-amber-400 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-[#111]" viewBox="0 0 14 14" fill="currentColor">
                <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 2a4 4 0 110 8A4 4 0 017 3z"/>
              </svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">TableReply</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center">
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 mx-0.5 rounded-md text-[13px] font-medium transition-all duration-150 ${
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/40 hover:text-white/75 hover:bg-white/[0.05]'
                  }`}
                >
                  {link.label}
                  {link.badge != null && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#111] text-[10px] font-bold flex items-center justify-center leading-none">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                  {link.dot && !link.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Analysis may be out of date" />
                  )}
                </Link>
              )
            })}

            <div className="w-px h-4 bg-white/10 mx-2" />

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-md text-[13px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all duration-150"
            >
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-8 h-8 text-white/60 hover:text-white transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.06] pb-3">
          {links.map((link) => {
            const active = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-5 py-3 text-[14px] font-medium transition-colors ${
                  active ? 'text-white bg-white/10 border-l-2 border-amber-400' : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.label}
                  {link.dot && !link.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  )}
                </span>
                {link.badge != null && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-[#111] text-[11px] font-bold flex items-center justify-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            )
          })}
          <div className="px-5 pt-2 mt-1 border-t border-white/[0.06]">
            <button
              onClick={handleLogout}
              className="text-[14px] font-medium text-white/40 hover:text-white/70 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
