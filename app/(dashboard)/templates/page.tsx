export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CopyButton from '@/components/CopyButton'

export default async function TemplatesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: restaurantProfile } = await supabase
    .from('business_profiles')
    .select('business_name, google_maps_url')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!restaurantProfile) redirect('/onboarding')

  const name = restaurantProfile.business_name
  const reviewLink = restaurantProfile.google_maps_url ?? '[YOUR GOOGLE REVIEW LINK]'

  const templates = [
    {
      category: 'SMS',
      title: 'Post-visit #1',
      content: `Hi! Thanks so much for your recent visit to ${name}. We'd love to know how everything was. If you have a moment, would you mind leaving us a quick Google review? It means the world to us. ${reviewLink}`,
    },
    {
      category: 'SMS',
      title: 'Post-visit #2',
      content: `Hey, it's the team at ${name} — hope you enjoyed your visit! If you had a great time, we'd be so grateful if you'd share your experience on Google. Takes less than a minute: ${reviewLink}`,
    },
    {
      category: 'SMS',
      title: 'Follow-up (1 week later)',
      content: `Hi again! Just checking in from ${name}. We'd still love to hear your thoughts on your recent visit. Your review helps others discover us — thanks in advance! ${reviewLink}`,
    },
    {
      category: 'Email',
      title: 'Post-visit email',
      subject: `How was your experience at ${name}?`,
      content: `Hi [First Name],\n\nThank you for visiting ${name} recently. We hope you had a wonderful experience.\n\nWe're always working to make ${name} even better, and hearing from customers like you makes all the difference.\n\nIf you enjoyed your visit, would you be willing to share a quick review on Google? It only takes a minute and helps others discover us:\n\n${reviewLink}\n\nWe'd love to see you again soon.\n\nWarmly,\nThe ${name} Team`,
    },
    {
      category: 'Email',
      title: 'Receipt follow-up',
      subject: `Your receipt from ${name} + a small request`,
      content: `Hi [First Name],\n\nHere's your receipt from your recent visit to ${name}.\n\nWe hope everything was to your liking. If you have a spare moment, a Google review would mean a lot to our team:\n\n${reviewLink}\n\nSee you next time!\n\nThe ${name} Team`,
    },
    {
      category: 'In-Person',
      title: 'Card / receipt script',
      content: `Enjoyed your visit to ${name}?\n\nWe'd be so grateful for a quick Google review — it helps others discover us and supports our team.\n\nScan the QR code or visit:\n${reviewLink}\n\nThank you from the team at ${name}.`,
    },
  ]

  const categoryMeta: Record<string, { bg: string; text: string; dot: string }> = {
    SMS:        { bg: 'bg-[#F3F0EC]', text: 'text-[#57534E]', dot: 'bg-[#A8A29E]' },
    Email:      { bg: 'bg-[#F3F0EC]', text: 'text-[#57534E]', dot: 'bg-[#A8A29E]' },
    'In-Person':{ bg: 'bg-[#F3F0EC]', text: 'text-[#57534E]', dot: 'bg-[#57534E]' },
  }

  const grouped = templates.reduce<Record<string, typeof templates>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pt-8 pb-2">
        <h1 className="text-[22px] sm:text-[24px] text-[#111] leading-[1.15]" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>Review Request Templates</h1>
        <p className="text-[13px] text-[#57534E] mt-1.5 max-w-xl" style={{ letterSpacing: '-0.006em' }}>
          Ready-to-send messages to collect more Google reviews.{' '}
          {restaurantProfile.google_maps_url
            ? 'Your Google review link has been filled in automatically.'
            : <>Connect your Google listing in <a href="/dashboard/grow" className="text-[#57534E] underline underline-offset-2 hover:text-[#111]">Grow</a> to auto-fill your review link.</>
          }
        </p>
      </div>

      {/* Grouped sections */}
      {Object.entries(grouped).map(([category, items]) => {
        const meta = categoryMeta[category]
        return (
          <div key={category}>
            {/* Section label */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              {category === 'SMS' && (
                <svg className="w-3.5 h-3.5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              )}
              {category === 'Email' && (
                <svg className="w-3.5 h-3.5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              )}
              {category === 'In-Person' && (
                <svg className="w-3.5 h-3.5 text-[#A8A29E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
              )}
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">
                {category}
              </span>
            </div>

            <div className="divide-y divide-[#EDE6DC]">
              {items.map((template, i) => (
                <div key={i} className="py-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium text-[#111]">{template.title}</span>
                      </div>
                      {'subject' in template && template.subject && (
                        <span className="text-[12px] text-[#A8A29E] truncate">· {template.subject}</span>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <CopyButton text={template.content} />
                    </div>
                  </div>
                  <p className="text-[13px] text-[#57534E] whitespace-pre-wrap leading-relaxed">
                    {template.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
