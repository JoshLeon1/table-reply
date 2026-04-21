export interface Profile {
  id: string
  email: string
  created_at: string
  is_paid: boolean
  trial_started_at: string | null
  stripe_customer_id: string | null
}

// ─── Autopilot ────────────────────────────────────────────────────────────────

export interface AutopilotRules {
  enabled: boolean
  mode: 'draft' | 'auto_approve' // draft = generate but keep status=pending; auto_approve = status=approved
  minStarRating: number           // only auto-handle reviews >= this (default 4)
  keywordBlocklist: string[]      // escalate to user if review contains any
  skipNoText: boolean             // skip reviews with empty review_text (default true)
  dailyDigest: boolean            // include in daily autopilot digest email
}

export interface ReplyPreferences {
  endWithOwnerName?: boolean
  includeBusinessName?: boolean
  inviteBack?: boolean
  autopilot?: AutopilotRules
}

// ─── Business profile ─────────────────────────────────────────────────────────

export interface BusinessProfile {
  id: string
  user_id: string
  business_name: string
  business_type: string
  vibe: string
  voice_style: string
  description: string
  owner_name: string
  created_at: string
  google_maps_url: string | null
  google_place_id: string | null
  latitude: number | null
  longitude: number | null
  last_scraped_at: string | null
  yelp_url: string | null
  yelp_last_scraped_at: string | null
  review_request_messages?: { sms: string; email: string; receipt: string; tablecard: string } | null
  reply_language?: string | null
  reply_preferences?: ReplyPreferences | null
  location_label?: string | null
  is_primary?: boolean | null
}

export interface Reply {
  id: string
  user_id: string
  review_text: string
  platform: string
  star_rating: number
  generated_reply: string
  created_at: string
}

export interface ScrapedReview {
  id: string
  user_id: string
  business_profile_id: string
  review_id: string
  reviewer_name: string
  star_rating: number
  review_text: string
  review_datetime_utc: string
  generated_reply: string | null
  reply_status: 'pending' | 'approved' | 'dismissed' | 'skipped'
  created_at: string
  alert_triggered?: boolean
  staff_mentions?: string[] | null
  language?: string | null
  source?: 'google' | 'yelp' | null
  // Autopilot fields
  autopilot_handled?: boolean
  autopilot_action?: string | null
  autopilot_processed_at?: string | null
  autopilot_posted_at?: string | null
  // GBP direct posting
  google_review_name?: string | null
  gbp_posted_at?: string | null
}

export interface KeywordAlert {
  id: string
  user_id: string
  keyword: string
  alert_type: 'any' | 'negative_only' | 'positive_only'
  created_at: string
}

export interface ThemesShape {
  praised: string[]
  complaints: string[]
  opportunities: string[]
}

export interface CompetitorProfile {
  id: string
  user_id: string
  name: string | null
  google_maps_url: string
  last_scraped_at: string | null
  avg_rating: number | null
  review_count: number | null
  response_rate: number | null
  created_at: string
}
