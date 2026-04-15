'use client'
import Nav from '@/components/Nav'
import { useState } from 'react'

const MOCK_REVIEWS = [
  { id: '1', reviewer_name: 'Deepshikha Dash', star_rating: 1, review_text: 'Extreme racism alert. I called this restaurant to place a pickup order just now. This is not my first time. Just now, when I called, he picked up and when I asked if I could place an order, he said he couldn\'t help me.', generated_reply: 'Thank you for taking the time to share your experience. We take all feedback seriously and want to assure you that we do not tolerate any form of discrimination at our restaurant. Please contact us directly so we can address this.', source: 'google', alert_triggered: true },
  { id: '2', reviewer_name: 'Marcus Chen', star_rating: 5, review_text: 'Absolutely incredible dining experience! The pasta was perfectly al dente and the sauce had depth I haven\'t tasted anywhere else in the city. Service was attentive without being overbearing.', generated_reply: 'Marcus, thank you so much for this wonderful review! We\'re thrilled the pasta hit the mark — our chef will be delighted to hear this. We look forward to welcoming you back soon!', source: 'google', alert_triggered: false },
  { id: '3', reviewer_name: 'Sarah Mitchell', star_rating: 4, review_text: 'Great food and atmosphere. The tiramisu was divine. Only minor complaint is the wait time was a bit long on a Saturday evening.', generated_reply: 'Sarah, so glad you enjoyed the tiramisu! You\'re right that Saturdays get busy — we\'re working on improving wait times. Hope to see you again soon!', source: 'yelp', alert_triggered: false },
]

const PRAISED = ['Incredible pasta dishes', 'Warm, attentive staff', 'Romantic atmosphere', 'Great wine selection']
const COMPLAINTS = ['Long wait times on weekends', 'Limited parking nearby', 'Loud noise level']
const OPPORTUNITIES = ['Add online reservations', 'Expand vegetarian menu', 'Loyalty program for regulars']

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= n ? 'text-amber-400' : 'text-[#E4DED8]'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
        </svg>
      ))}
    </div>
  )
}

function Badge({ source }: { source?: string | null }) {
  if (source === 'yelp') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-100">YELP</span>
  if (source === 'tripadvisor') return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">TA</span>
  return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-500 border border-blue-100">G</span>
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase()
}

function avatarColors(rating: number) {
  if (rating <= 2) return { bg: 'from-red-50 to-rose-50', text: 'text-red-400' }
  if (rating === 3) return { bg: 'from-amber-50 to-yellow-50', text: 'text-amber-500' }
  return { bg: 'from-emerald-50 to-teal-50', text: 'text-emerald-600' }
}

export default function PreviewTest() {
  const [section, setSection] = useState<'home'|'reviews'|'analytics'>('home')
  const [reviewTab, setReviewTab] = useState<'pending'|'approved'|'dismissed'>('pending')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#F8F6F3', overflowX: 'clip' }}>
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-96 opacity-40" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(224,90,40,0.06), transparent)' }} />
      <Nav />
      <div className="flex-shrink-0" style={{ height: 'calc(64px + env(safe-area-inset-top))' }} />

      <div className="max-w-6xl mx-auto w-full px-4 pt-3 flex gap-2">
        {(['home','reviews','analytics'] as const).map(s => (
          <button key={s} onClick={() => setSection(s)} className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${section===s ? 'bg-[#E05A28] text-white' : 'bg-white border border-[#E4DED8] text-[#57534E]'}`}>{s}</button>
        ))}
      </div>

      <main className="relative flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-5 sm:py-8 min-w-0 space-y-6">

        {/* ── HOME ── */}
        {section === 'home' && <>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Good morning, Josh 👋</h1>
              <p className="text-[13px] text-[#A8A29E] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                josh place · Synced Apr 9, 2026
              </p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4DED8] bg-white text-[13px] font-medium text-[#57534E] shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sync
            </button>
          </div>

          {/* Alert */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#FEF0E8] border border-[#F5C9AD]">
            <span className="relative flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-[#E05A28] animate-ping opacity-30" />
              <span className="relative w-7 h-7 rounded-full bg-[#E05A28] text-white text-[12px] font-bold flex items-center justify-center">13</span>
            </span>
            <p className="text-[13px] text-[#7A3010] flex-1"><span className="font-semibold text-[#C94E21]">13 reviews</span> waiting — copy the AI reply and paste it on the review platform.</p>
            <button className="text-[12px] font-semibold text-[#E05A28] whitespace-nowrap">View →</button>
          </div>

          {/* Stat cards — no more ALL CAPS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Reviews this month', value: '14', sub: <span className="text-[11px] font-semibold text-emerald-600">↑ 40%</span>, iconBg: 'bg-amber-50', icon: <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> },
              { label: 'Avg rating', value: '3.8', sub: <span className="text-[11px] font-semibold text-red-400">↓ 0.2</span>, iconBg: 'bg-blue-50', icon: <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg> },
              { label: 'Replies approved', value: '1', sub: <span className="text-[11px] font-semibold text-emerald-600">↑ 1</span>, iconBg: 'bg-emerald-50', icon: <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> },
              { label: 'Response rate', value: '7%', sub: <span className="text-[11px] text-[#A8A29E]">all time</span>, iconBg: 'bg-[#FEF0E8]', icon: <svg className="w-3.5 h-3.5 text-[#E05A28]" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E4DED8] p-3.5 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <div className={`w-6 h-6 rounded-lg ${s.iconBg} flex items-center justify-center`}>{s.icon}</div>
                  <p className="text-[11px] font-medium text-[#A8A29E] leading-tight">{s.label}</p>
                </div>
                <p className="text-[22px] sm:text-[28px] font-bold text-[#111111] leading-none tracking-tight mb-2">{s.value}</p>
                {s.sub}
              </div>
            ))}
          </div>

          {/* Pending reviews + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[13px] font-semibold text-[#57534E]">Pending replies</span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#E4DED8] to-transparent" />
              </div>
              {MOCK_REVIEWS.slice(0,2).map(r => {
                const { bg, text } = avatarColors(r.star_rating)
                return (
                  <div key={r.id} className={`bg-white rounded-2xl border overflow-hidden hover:border-[#D0C9C1] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all duration-200 ${r.alert_triggered ? 'border-red-200' : 'border-[#E4DED8]'}`}>
                    <div className="px-4 pt-4 pb-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${bg} border border-[#E4DED8] flex items-center justify-center text-[11px] font-bold ${text} flex-shrink-0`}>{initials(r.reviewer_name)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="text-[13px] font-semibold text-[#111111]">{r.reviewer_name}</span>
                            <Badge source={r.source} />
                            {r.alert_triggered && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200">⚠ Alert</span>}
                          </div>
                          <Stars n={r.star_rating} />
                        </div>
                      </div>
                      <p className="text-[13px] text-[#57534E] leading-relaxed mt-3 pl-12 line-clamp-3">{r.review_text}</p>
                    </div>
                    {/* AI reply — no more ALL CAPS, cleaner orange tint */}
                    <div className="px-4 pb-3 border-t border-[#EDE9E4]">
                      <div className="mt-3 bg-[#E05A28]/[0.07] rounded-xl px-4 py-3.5 border border-[#E05A28]/15">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-4 h-4 rounded-md bg-[#E05A28]/10 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                          </div>
                          <span className="text-[11px] font-semibold text-[#E05A28]">AI reply</span>
                        </div>
                        <p className="text-[12px] text-[#57534E] leading-relaxed">{r.generated_reply}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 pb-4 pt-1">
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E05A28] text-white text-[12px] font-semibold shadow-[0_2px_8px_rgba(224,90,40,0.2)] hover:shadow-[0_4px_14px_rgba(224,90,40,0.35)] hover:bg-[#C94E21] transition-all">
                        <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                        Copy & Approve
                      </button>
                      <button className="px-3 py-2 rounded-xl text-[12px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] transition-all">Dismiss</button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-[13px] font-semibold text-[#57534E]">Recent activity</span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#E4DED8] to-transparent" />
              </div>
              {[{ name: 'Tom Bradley', rating: 5, text: 'Best Italian in the neighborhood, hands down.', source: 'google' }, { name: 'Lisa Park', rating: 4, text: 'Lovely spot for a date night. The wine list is excellent.', source: 'yelp' }].map(r => (
                <div key={r.name} className="bg-white rounded-2xl border border-[#E4DED8] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 border border-[#E4DED8] flex items-center justify-center text-[10px] font-bold text-emerald-600`}>{initials(r.name)}</div>
                    <div className="flex-1"><p className="text-[12px] font-semibold text-[#111111]">{r.name}</p><Stars n={r.rating} /></div>
                    <Badge source={r.source} />
                  </div>
                  <p className="text-[12px] text-[#A8A29E] leading-relaxed">{r.text}</p>
                </div>
              ))}
              <div className="bg-white rounded-2xl border border-[#E4DED8] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="text-[12px] font-semibold text-[#57534E] mb-3">At a glance</p>
                <div className="flex flex-wrap gap-1.5">
                  {PRAISED.slice(0,3).map(t => <span key={t} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">{t}</span>)}
                </div>
              </div>
            </div>
          </div>
        </>}

        {/* ── REVIEWS ── */}
        {section === 'reviews' && <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Reviews</h1>
              <p className="text-[13px] text-[#A8A29E] mt-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"/>josh place · Synced Apr 9, 2026</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E4DED8] bg-white text-[13px] font-medium text-[#57534E] shadow-sm">Sync Now</button>
          </div>

          {/* Response rate — no more ALL CAPS */}
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-white border border-[#E4DED8] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[12px] font-medium text-[#A8A29E]">Response rate</p>
                <span className="text-[13px] font-bold text-[#E05A28]">1 / 14 · 7%</span>
              </div>
              <div className="h-2 rounded-full bg-[#EDE9E4] overflow-hidden">
                <div className="h-full rounded-full bg-[#E05A28] transition-all duration-700" style={{ width: '7%' }} />
              </div>
            </div>
          </div>

          {/* Pending alert */}
          <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#E05A28]/10 border border-[#E05A28]/25">
            <span className="relative flex-shrink-0">
              <span className="absolute inset-0 rounded-full bg-[#E05A28] animate-ping opacity-30" />
              <span className="relative w-6 h-6 rounded-full bg-[#E05A28] text-white text-[11px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(224,90,40,0.4)]">13</span>
            </span>
            <p className="text-[13px] text-[#E05A28]/80"><span className="font-semibold text-[#E05A28]">13 reviews</span> waiting — copy the AI reply and paste it on the review platform.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-2xl border border-[#E4DED8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] w-fit">
            {(['pending','approved','dismissed'] as const).map(t => (
              <button key={t} onClick={() => setReviewTab(t)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium transition-all capitalize ${reviewTab===t ? 'bg-[#E05A28] text-white shadow-sm' : 'text-[#A8A29E] hover:text-[#57534E]'}`}>
                {t}{t==='pending' && <span className={`text-[10px] font-bold px-1.5 rounded-full ${reviewTab==='pending' ? 'bg-white/20 text-white' : 'bg-[#F3F0EC] text-[#57534E]'}`}>13</span>}
              </button>
            ))}
          </div>

          {/* Review cards */}
          {MOCK_REVIEWS.map(r => {
            const { bg, text } = avatarColors(r.star_rating)
            return (
              <div key={r.id} className={`bg-white rounded-2xl border overflow-hidden hover:border-[#D0C9C1] hover:shadow-[0_4px_20px_rgba(0,0,0,0.07)] transition-all ${r.alert_triggered ? 'border-red-200' : 'border-[#E4DED8]'}`}>
                <div className="px-4 sm:px-5 pt-4 pb-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${bg} border border-[#E4DED8] flex items-center justify-center text-[11px] font-bold ${text} flex-shrink-0`}>{initials(r.reviewer_name)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-semibold text-[#111111]">{r.reviewer_name}</span>
                          <Badge source={r.source} />
                          {r.alert_triggered && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 border border-red-200">⚠ Alert</span>}
                        </div>
                      </div>
                      <Stars n={r.star_rating} />
                    </div>
                  </div>
                  <div className="mt-3 pl-12">
                    <p className="text-[11px] font-medium text-[#A8A29E] mb-1.5">Their review</p>
                    <p className="text-[13px] text-[#57534E] leading-relaxed">"{r.review_text}"</p>
                  </div>
                </div>
                <div className="px-4 sm:px-5 py-3.5 border-t border-[#EDE9E4]">
                  <div className="rounded-xl bg-[#E05A28]/[0.07] border border-[#E05A28]/15 px-4 py-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-4 h-4 rounded-md bg-[#E05A28]/10 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-[#E05A28]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/></svg>
                      </div>
                      <span className="text-[11px] font-semibold text-[#E05A28]">AI reply</span>
                    </div>
                    <p className="text-[13px] text-[#57534E] leading-relaxed">{r.generated_reply}</p>
                  </div>
                </div>
                {/* Clean action row — no more heavy beige footer */}
                <div className="flex items-center gap-2 px-4 sm:px-5 py-3.5 border-t border-[#EDE9E4]">
                  <button className="flex items-center justify-center gap-1.5 px-4 min-h-[40px] rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[13px] font-semibold transition-all shadow-[0_1px_3px_rgba(224,90,40,0.3)]">
                    <svg className="w-3.5 h-3.5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    Copy & Approve
                  </button>
                  <button className="px-3.5 min-h-[40px] rounded-xl text-[13px] font-medium text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC] transition-all">Dismiss</button>
                </div>
              </div>
            )
          })}
        </>}

        {/* ── ANALYTICS ── */}
        {section === 'analytics' && <>
          <div>
            <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">Analytics</h1>
            <p className="text-[13px] text-[#A8A29E] mt-1">Insights from your reviews and customer feedback.</p>
          </div>

          {/* Stat cards — no ALL CAPS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total reviews', value: '47', sub: 'all time', color: 'text-[#111111]' },
              { label: 'Avg rating', value: '4.1', sub: '★★★★☆', color: 'text-[#111111]' },
              { label: 'Response rate', value: '68%', sub: '32 of 47 replied', color: 'text-emerald-600' },
              { label: 'Critical unanswered', value: '✓ None', sub: 'All addressed', color: 'text-emerald-600' },
            ].map((s, i) => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#E4DED8] p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="text-[11px] font-medium text-[#A8A29E] mb-2 leading-tight">{s.label}</p>
                <p className={`text-[20px] sm:text-[26px] font-bold leading-none mb-1 tracking-tight ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-[#A8A29E] leading-tight">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* What customers are saying — TAG CHIPS not bullets */}
          <div>
            <p className="text-[13px] font-semibold text-[#57534E] mb-5">What customers are saying</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { title: 'They love', items: PRAISED, chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-100', iconClass: 'text-emerald-500', topBorder: 'border-t-[3px] border-t-emerald-300', icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg> },
                { title: 'They mention', items: COMPLAINTS, chipClass: 'bg-[#F3F0EC] text-[#57534E] border-[#E4DED8]', iconClass: 'text-[#A8A29E]', topBorder: 'border-t-[3px] border-t-[#D0C9C1]', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg> },
                { title: 'Opportunities', items: OPPORTUNITIES, chipClass: 'bg-[#FEF0E8] text-[#C94E21] border-[#F5C9AD]', iconClass: 'text-[#E05A28]', topBorder: 'border-t-[3px] border-t-[#E05A28]', icon: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg> },
              ].map(({ title, items, chipClass, iconClass, topBorder, icon }) => (
                <div key={title} className={`bg-white rounded-2xl border border-[#E4DED8] p-5 ${topBorder} shadow-[0_1px_3px_rgba(0,0,0,0.04)]`}>
                  <div className={`flex items-center gap-1.5 mb-4 ${iconClass}`}>
                    {icon}
                    <span className="text-[13px] font-semibold text-[#111111]">{title}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map(item => (
                      <span key={item} className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border ${chipClass} leading-none`}>{item}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>}

      </main>
    </div>
  )
}
