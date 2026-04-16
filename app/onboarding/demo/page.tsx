export const metadata = { title: 'Demo — ReplyFi' }

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DemoClient from './DemoClient'
import { getSamples } from '@/lib/demo/industry-samples'

export default async function OnboardingDemoPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('business_profiles')
    .select('business_type, business_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!business) redirect('/onboarding')

  const samples = getSamples(business.business_type)
  const businessName = business.business_name ?? 'your business'

  return <DemoClient samples={samples} businessName={businessName} userId={user.id} />
}
