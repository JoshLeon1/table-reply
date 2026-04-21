// app/api/locations/add/route.ts
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { locationLabel, googleMapsUrl, yelpUrl, placeId, latitude, longitude } = await request.json().catch(() => ({}))

  const supabaseAdmin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Get primary profile to inherit voice/tone settings
  const { data: primary } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_primary', true)
    .maybeSingle()

  if (!primary) return NextResponse.json({ error: 'No primary location found' }, { status: 400 })

  // Create new location row inheriting brand settings
  const { data: newLocation, error: insertErr } = await supabaseAdmin
    .from('business_profiles')
    .insert({
      user_id: user.id,
      business_name: primary.business_name,
      business_type: primary.business_type,
      vibe: primary.vibe,
      voice_style: primary.voice_style,
      description: primary.description,
      owner_name: primary.owner_name,
      reply_language: primary.reply_language,
      reply_preferences: primary.reply_preferences,
      review_request_messages: primary.review_request_messages,
      location_label: locationLabel ?? null,
      is_primary: false,
      google_maps_url: googleMapsUrl ?? null,
      yelp_url: yelpUrl ?? null,
      google_place_id: placeId ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    })
    .select('id')
    .single()

  if (insertErr || !newLocation) {
    console.error('[locations/add] Insert failed:', insertErr)
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }

  // Stripe quantity increment (skip if no subscription — e.g. trial users)
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.stripe_subscription_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      const item = sub.items.data[0]
      if (item) {
        await stripe.subscriptions.update(profile.stripe_subscription_id, {
          items: [{ id: item.id, quantity: (item.quantity ?? 1) + 1 }],
          proration_behavior: 'create_prorations',
        })
      }
    } catch (stripeErr) {
      // Non-fatal: location created, billing update failed — log for ops
      console.error('[locations/add] Stripe update failed:', stripeErr)
    }
  }

  return NextResponse.json({ locationId: newLocation.id })
}
