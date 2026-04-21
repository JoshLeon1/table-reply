// app/(dashboard)/dashboard/ManageLocationButton.tsx
'use client'

import { useRouter } from 'next/navigation'

export default function ManageLocationButton({ locationId }: { locationId: string }) {
  const router = useRouter()

  const handleManage = async () => {
    await fetch('/api/locations/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    })
    router.push('/dashboard/reviews')
    router.refresh()
  }

  return (
    <button
      onClick={handleManage}
      className="self-start inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F3F0EC] hover:bg-[#EDE9E4] text-[12px] font-medium text-[#57534E] hover:text-[#111] transition-colors"
    >
      Manage
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
      </svg>
    </button>
  )
}
