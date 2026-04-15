'use client'

import { useState } from 'react'
import GetMoreReviewsClient from '../get-more-reviews/GetMoreReviewsClient'
import SocialClient from '../social/SocialClient'
import CompetitorsClient from '../competitors/CompetitorsClient'
import type { RestaurantProfile, CompetitorProfile } from '@/types'
import type { ScrapedReview } from '@/types'

type Tab = 'get-reviews' | 'social' | 'competitors'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'get-reviews',
    label: 'Get Reviews',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
  {
    key: 'social',
    label: 'Social',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
  {
    key: 'competitors',
    label: 'Competitors',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

interface GrowClientProps {
  restaurantProfile: RestaurantProfile
  reviews: ScrapedReview[]
  competitors: CompetitorProfile[]
  userAvgRating: number
}

export default function GrowClient({ restaurantProfile, reviews, competitors, userAvgRating }: GrowClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('get-reviews')

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-[#E4DED8] shadow-[0_1px_3px_rgba(0,0,0,0.04)] w-fit">
        {TABS.map((tab) => {
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-[#E05A28] text-white shadow-[0_1px_3px_rgba(224,90,40,0.3)]'
                  : 'text-[#A8A29E] hover:text-[#57534E] hover:bg-[#F3F0EC]'
              }`}
            >
              <span className={active ? 'opacity-90' : 'opacity-70'}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'get-reviews' && (
          <GetMoreReviewsClient restaurantProfile={restaurantProfile} />
        )}
        {activeTab === 'social' && (
          <SocialClient reviews={reviews} restaurantProfile={restaurantProfile} />
        )}
        {activeTab === 'competitors' && (
          <CompetitorsClient
            restaurantProfile={restaurantProfile}
            competitors={competitors}
            userAvgRating={userAvgRating}
          />
        )}
      </div>
    </div>
  )
}
