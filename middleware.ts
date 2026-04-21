import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const protectedRoutes = ['/dashboard', '/templates', '/settings']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // If Supabase env vars are missing, fail open rather than 500ing every request
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    const isAuthRoute = authRoutes.includes(pathname)
    const isOnboarding = pathname.startsWith('/onboarding')

    // Not logged in → redirect to login
    if ((isProtected || isOnboarding) && !user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Logged-in user hitting auth routes → redirect to dashboard
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Logged-in user on a protected dashboard route → check if they completed onboarding
    if (isProtected && user) {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    // Logged-in user already has a profile and tries to go to onboarding → send to dashboard
    // EXCEPT for /onboarding/demo — that's a post-profile step. Bouncing it back
    // to /dashboard causes an infinite redirect loop with the dashboard page,
    // which itself redirects to /onboarding/demo when has_seen_demo is false.
    if (isOnboarding && user && pathname !== '/onboarding/demo') {
      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    return supabaseResponse
  } catch {
    // On Supabase error, protect routes rather than failing open
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
