// lib/supabase/database.types.ts
//
// TODO(hand-authored): regenerate with
//   npx supabase gen types typescript --linked --schema public > lib/supabase/database.types.ts
// once the Supabase CLI is linked to this project. This file is the
// fallback from Phase 2.5 Task 3 ("LAST RESORT") and only covers the
// tables the Stripe webhook and subscription code read/write. When
// the generated file lands it will cover every table and replace this.
//
// Scope of coverage today:
//   - profiles          (subscription lifecycle columns + has_seen_demo)
//   - stripe_webhook_events (idempotency table from Task 1)
//
// Other tables (business_profiles, scraped_reviews, business_analytics,
// competitor_profiles, google_waitlist, keyword_alerts, replies,
// reply_feedback, review_request_clicks) are declared with loose
// row shapes so existing untyped call sites keep compiling while
// still getting compile-time safety where the typed factories are
// actually used.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Tables covered loosely here keep compile-time behaviour identical to
// the pre-Database-generic era: any row shape, any insert/update payload.
// The `any` is intentional — it matches the behaviour of an untyped client
// exactly. Replace with precise shapes as tables are audited.
/* eslint-disable @typescript-eslint/no-explicit-any */
interface LooseTable {
  Row: any
  Insert: any
  Update: any
  Relationships: []
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          is_paid: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_plan: string | null
          trial_started_at: string | null
          subscription_period_end: string | null
          subscription_canceled_at: string | null
          subscription_past_due: boolean | null
          has_seen_demo: boolean | null
          welcome_email_sent_at: string | null
          trial_reminder_3d_sent_at: string | null
          trial_reminder_1d_sent_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string
          payload: Json
        }
        Insert: {
          event_id: string
          event_type: string
          payload: Json
          processed_at?: string
        }
        Update: Partial<Database['public']['Tables']['stripe_webhook_events']['Row']>
        Relationships: []
      }
      business_profiles: LooseTable
      scraped_reviews: LooseTable
      business_analytics: LooseTable
      competitor_profiles: LooseTable
      google_waitlist: LooseTable
      keyword_alerts: LooseTable
      replies: LooseTable
      reply_feedback: LooseTable
      review_request_clicks: LooseTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
