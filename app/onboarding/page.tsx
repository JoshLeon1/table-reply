import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RestaurantProfileForm from '@/components/RestaurantProfileForm'

export default async function OnboardingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('restaurant_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profile) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#FFFDF9] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="text-4xl">🍽️</span>
          <h1 className="text-2xl font-bold text-stone-900 mt-2">Set up your restaurant</h1>
          <p className="text-stone-500 mt-1">
            This is how we personalize every reply to sound like you.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <RestaurantProfileForm userId={user.id} />
        </div>
      </div>
    </div>
  )
}
