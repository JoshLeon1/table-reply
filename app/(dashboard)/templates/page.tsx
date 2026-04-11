export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CopyButton from '@/components/CopyButton'

export default async function TemplatesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: restaurantProfile } = await supabase
    .from('restaurant_profiles')
    .select('restaurant_name')
    .eq('user_id', user.id)
    .single()

  if (!restaurantProfile) redirect('/onboarding')

  const name = restaurantProfile.restaurant_name

  const templates = [
    {
      category: 'SMS',
      title: 'Post-visit #1',
      content: `Hi! Thanks so much for dining at ${name}. We'd love to know how everything was. If you have a moment, would you mind leaving us a quick Google review? It means the world to us. [YOUR GOOGLE REVIEW LINK]`,
    },
    {
      category: 'SMS',
      title: 'Post-visit #2',
      content: `Hey, it's the team at ${name} — hope you enjoyed your visit! If you had a great time, we'd be so grateful if you'd share your experience on Google. Takes less than a minute: [YOUR GOOGLE REVIEW LINK]`,
    },
    {
      category: 'SMS',
      title: 'Follow-up (1 week later)',
      content: `Hi again! Just checking in from ${name}. We'd still love to hear your thoughts on your recent visit. Your review helps other food lovers find us — thanks in advance! [YOUR GOOGLE REVIEW LINK]`,
    },
    {
      category: 'Email',
      title: 'Post-visit email',
      subject: `How was your experience at ${name}?`,
      content: `Hi [First Name],\n\nThank you for dining with us at ${name} recently. We hope you had a wonderful experience.\n\nWe're always working to make ${name} even better, and hearing from guests like you makes all the difference.\n\nIf you enjoyed your visit, would you be willing to share a quick review on Google? It only takes a minute and helps others discover us:\n\n[YOUR GOOGLE REVIEW LINK]\n\nWe'd love to see you again soon.\n\nWarmly,\nThe ${name} Team`,
    },
    {
      category: 'Email',
      title: 'Receipt follow-up',
      subject: `Your receipt from ${name} + a small request`,
      content: `Hi [First Name],\n\nHere's your receipt from your recent visit to ${name}.\n\nWe hope everything was to your liking. If you have a spare moment, a Google review would mean a lot to our small team:\n\n[YOUR GOOGLE REVIEW LINK]\n\nSee you next time!\n\nThe ${name} Family`,
    },
    {
      category: 'In-Person',
      title: 'Table card / receipt script',
      content: `Loved your meal at ${name}?\n\nWe'd be so grateful for a quick Google review — it helps other food lovers find us and supports our team.\n\nScan the QR code or visit:\n[YOUR GOOGLE REVIEW LINK]\n\nThank you from the ${name} family.`,
    },
  ]

  const categoryMeta: Record<string, { bg: string; text: string; dot: string }> = {
    SMS:        { bg: 'bg-blue-50',   text: 'text-blue-600',   dot: 'bg-blue-400' },
    Email:      { bg: 'bg-violet-50', text: 'text-violet-600', dot: 'bg-violet-400' },
    'In-Person':{ bg: 'bg-[#FEF0E8]',  text: 'text-[#C94E21]',  dot: 'bg-[#E05A28]' },
  }

  const grouped = templates.reduce<Record<string, typeof templates>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#111]">Review Request Templates</h1>
        <p className="text-[13px] text-[#888] mt-0.5">
          Ready-to-send messages to get more Google reviews from happy guests. Replace{' '}
          <code className="font-mono text-[12px] bg-[#EDE9E4] text-[#57534E] px-1.5 py-0.5 rounded">
            [YOUR GOOGLE REVIEW LINK]
          </code>{' '}
          with your actual link.
        </p>
      </div>

      {/* Grouped sections */}
      {Object.entries(grouped).map(([category, items]) => {
        const meta = categoryMeta[category]
        return (
          <div key={category}>
            {/* Section label */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A8A29E]">
                {category}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((template, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-[#E4DED8] overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#EDE9E4]">
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
                        {category}
                      </span>
                      <span className="text-[13px] font-semibold text-[#111]">{template.title}</span>
                      {'subject' in template && template.subject && (
                        <span className="text-[12px] text-[#AAA]">· {template.subject}</span>
                      )}
                    </div>
                    <CopyButton text={template.content} />
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4">
                    <p className="text-[13px] text-[#555] whitespace-pre-wrap leading-relaxed">
                      {template.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
