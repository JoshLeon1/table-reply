import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

export type StripePlan = 'monthly' | 'annual'

// Trim to guard against accidental whitespace/tabs copied from env var tables
const MONTHLY_PRICE_ID = (process.env.STRIPE_PRICE_ID_MONTHLY || 'price_1TLwjc2IRuOunZUQTdms55bJ').trim()
const ANNUAL_PRICE_ID  = (process.env.STRIPE_PRICE_ID_ANNUAL  || 'price_1TMMPT2IRuOunZUQ7qayYYPV').trim()

export const PRICE_IDS: Record<StripePlan, string> = {
  monthly: MONTHLY_PRICE_ID,
  annual:  ANNUAL_PRICE_ID,
}

// Reverse lookup: price ID → plan name
export function planFromPriceId(priceId: string): StripePlan | null {
  if (priceId === ANNUAL_PRICE_ID)  return 'annual'
  if (priceId === MONTHLY_PRICE_ID) return 'monthly'
  return null
}

export async function createCheckoutSession(
  userId: string,
  email: string,
  plan: StripePlan = 'monthly'
) {
  const priceId = PRICE_IDS[plan]
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://replyfi.vercel.app').replace(/\/$/, '')

  const session = await stripe.checkout.sessions.create({
    customer_email: email,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/settings`,
    metadata: { userId, plan },
    allow_promotion_codes: true,
  })

  return session
}
