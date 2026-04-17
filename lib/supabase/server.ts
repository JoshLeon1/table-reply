import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// NOTE: Database generic intentionally not wired here — see lib/supabase/client.ts
// TODO(P2.5): switch to `createServerClient<Database>(...)` once types are
// regenerated via `supabase gen types typescript --linked`.
export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie mutations handled by middleware
          }
        },
      },
    }
  )
}
