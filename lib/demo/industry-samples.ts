// lib/demo/industry-samples.ts
//
// Tone-tuned sample reviews used in /onboarding/demo. The flow shows
// three reviews (one positive, one mid, one critical) so the user can
// experience the AI voice on the kinds of feedback they actually receive.
//
// Add a new industry here when adding a new vertical to the signup flow.

export type Industry =
  | 'restaurant'
  | 'dental'
  | 'hvac'
  | 'salon'
  | 'retail'
  | 'professional_services'
  | 'generic'

export interface SampleReview {
  rating: number       // 1-5
  author: string
  text: string
  scenario: 'glowing' | 'mixed' | 'critical'
}

export const INDUSTRY_SAMPLES: Record<Industry, SampleReview[]> = {
  restaurant: [
    { rating: 5, author: 'Sarah M.',  scenario: 'glowing',  text: 'Best brunch in town. The eggs benedict is worth driving across the city for. Service was warm without being intrusive.' },
    { rating: 3, author: 'David K.',  scenario: 'mixed',    text: 'Food was great but we waited 25 minutes for a table even with a reservation. Would come back for the menu, not the host stand.' },
    { rating: 1, author: 'Marcus T.', scenario: 'critical', text: 'Cold pasta, the server forgot our drinks twice, and the bill had a $9 charge for "bread service" that nobody mentioned. Won\'t be back.' },
  ],
  dental: [
    { rating: 5, author: 'Jenny R.',   scenario: 'glowing',  text: 'Dr. Patel walked me through every step of the root canal. First time I have not been terrified at the dentist.' },
    { rating: 3, author: 'Mike H.',    scenario: 'mixed',    text: 'Cleaning was thorough but the front desk gave me three different prices for the same procedure. Bring your insurance card and your wits.' },
    { rating: 1, author: 'Linda O.',   scenario: 'critical', text: 'They billed me for a fluoride treatment my insurance does not cover and never told me. Now I owe $80 I did not agree to.' },
  ],
  hvac: [
    { rating: 5, author: 'Tom W.',     scenario: 'glowing',  text: 'AC died on the hottest day of summer. They had a tech out in three hours and replaced the capacitor for half what the last guy quoted me.' },
    { rating: 3, author: 'Karen B.',   scenario: 'mixed',    text: 'Tech was friendly and fixed the issue but tracked mud through the house. Bring shoe covers if you want a repeat customer.' },
    { rating: 1, author: 'Rob P.',     scenario: 'critical', text: 'Quoted $400, billed $1,100. Said the parts were "more involved than expected." Never again.' },
  ],
  salon: [
    { rating: 5, author: 'Amanda L.',  scenario: 'glowing',  text: 'Maya nailed the balayage on my first try. I have been chasing this color for a year and finally found my person.' },
    { rating: 3, author: 'Erin S.',    scenario: 'mixed',    text: 'Cut was great. Wash was rushed and the conditioner stung. Mixed feelings.' },
    { rating: 1, author: 'Tasha N.',   scenario: 'critical', text: 'Showed up for a 2pm appointment, was not seen until 2:50. Stylist was on her phone the whole time.' },
  ],
  retail: [
    { rating: 5, author: 'Carlos M.',  scenario: 'glowing',  text: 'Helpful staff, clean store, easy returns. Bought a jacket and brought it back two weeks later — no questions asked.' },
    { rating: 3, author: 'Heather V.', scenario: 'mixed',    text: 'Good selection but the dressing-room line was 20 minutes deep on a Saturday. Hire more people on weekends.' },
    { rating: 1, author: 'Aaron J.',   scenario: 'critical', text: 'Cashier was on her phone, ignored me for five minutes, then charged me twice and refused to refund without a manager.' },
  ],
  professional_services: [
    { rating: 5, author: 'Priya N.',   scenario: 'glowing',  text: 'Walked me through the entire LLC formation, answered three follow-ups for free, and the price was exactly what was quoted.' },
    { rating: 3, author: 'Greg F.',    scenario: 'mixed',    text: 'Final deliverable was strong but communication was spotty — I had to follow up three times for status updates.' },
    { rating: 1, author: 'Daniel R.',  scenario: 'critical', text: 'Missed two deadlines, did not respond to emails for a week, then sent the bill anyway.' },
  ],
  generic: [
    { rating: 5, author: 'Alex P.',    scenario: 'glowing',  text: 'Fantastic experience start to finish. Will absolutely be back.' },
    { rating: 3, author: 'Jordan S.',  scenario: 'mixed',    text: 'Good in some ways, frustrating in others. Worth it but bring patience.' },
    { rating: 1, author: 'Sam W.',     scenario: 'critical', text: 'Unprofessional and overpriced. Look elsewhere.' },
  ],
}

// Maps the free-form `business_profiles.business_type` values collected
// during signup (e.g. "Restaurant", "Dental Practice", "Hair Salon") to
// the canonical Industry keys above. Anything we don't recognize falls
// through to the generic set.
function normalizeIndustry(raw: string): Industry {
  const v = raw.toLowerCase()
  if (v.includes('restaur') || v.includes('cafe') || v.includes('coffee') || v.includes('bar') || v.includes('food')) return 'restaurant'
  if (v.includes('dent') || v.includes('orthodont')) return 'dental'
  if (v.includes('hvac') || v.includes('plumb') || v.includes('electric') || v.includes('home service') || v.includes('auto repair') || v.includes('mechanic')) return 'hvac'
  if (v.includes('salon') || v.includes('hair') || v.includes('spa') || v.includes('barber') || v.includes('nail')) return 'salon'
  if (v.includes('retail') || v.includes('shop') || v.includes('store') || v.includes('boutique')) return 'retail'
  if (v.includes('law') || v.includes('legal') || v.includes('account') || v.includes('consult') || v.includes('agenc') || v.includes('professional')) return 'professional_services'
  // Exact-match fallthrough for the canonical keys themselves
  if ((['restaurant','dental','hvac','salon','retail','professional_services','generic'] as const).includes(v as Industry)) {
    return v as Industry
  }
  return 'generic'
}

export function getSamples(industry: string | null | undefined): SampleReview[] {
  if (!industry) return INDUSTRY_SAMPLES.generic
  const key = normalizeIndustry(industry)
  return INDUSTRY_SAMPLES[key] ?? INDUSTRY_SAMPLES.generic
}
