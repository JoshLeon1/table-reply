import { createBrowserClient } from '@supabase/ssr'

// NOTE: Database generic intentionally not wired here — the hand-authored
// lib/supabase/database.types.ts (Phase 2.5 Task 3) only covers profiles
// and stripe_webhook_events. Plumbing the generic through with LooseTable
// fallbacks breaks existing code (insert/select narrows to `never`).
// TODO(P2.5): switch to `createBrowserClient<Database>(...)` once types
// are regenerated via `supabase gen types typescript --linked`.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
