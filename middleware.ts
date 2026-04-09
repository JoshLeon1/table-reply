import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const protectedRoutes = ['/dashboard', '/templates', '/settings']

export async function middleware(request: NextRequest) {
  // If Supabase env vars are missing (e.g. misconfigured deployment), fail open
  // rather than returning a 500 for every request
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const pathname = request.nextUrl.pathname
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  try {
    const { supabaseResponse, user } = await updateSession(request)

    const pathname = request.nextUrl.pathname
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route))
    const isAuthRoute = ['/login', '/signup'].includes(pathname)

    if (isProtected && !user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
