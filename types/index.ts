export interface Profile {
  id: string
  email: string
  created_at: string
  is_paid: boolean
  trial_started_at: string | null
  stripe_customer_id: string | null
}

export interface RestaurantProfile {
  id: string
  user_id: string
  restaurant_name: string
  cuisine_type: string
  vibe: string
  voice_style: string
  description: string
  owner_name: string
  created_at: string
  google_maps_url: string | null
  last_scraped_at: string | null
  yelp_url: string | null
  yelp_last_scraped_at: string | null
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
  restaurant_profile_id: string
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
}

export interface KeywordAlert {
  id: string
  user_id: string
  keyword: string
  alert_type: 'any' | 'negative_only' | 'positive_only'
  created_at: string
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
