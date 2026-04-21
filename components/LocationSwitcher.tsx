// components/LocationSwitcher.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Location {
  id: string
  business_name: string
  location_label: string | null
  is_primary: boolean | null
}

export default function LocationSwitcher() {
  const [locations, setLocations] = useState<Location[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('business_profiles')
        .select('id, business_name, location_label, is_primary')
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false })

      if (data) setLocations(data)
    }

    // Read current active location from cookie
    const match = document.cookie.match(/(?:^|;\s*)active_location_id=([^;]+)/)
    if (match) setActiveId(match[1])

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Only show when user has 2+ locations
  if (locations.length < 2) return null

  const active = locations.find(l => l.id === activeId) ?? locations[0]
  const displayLabel = active.location_label ?? active.business_name

  const handleSwitch = async (locationId: string) => {
    if (locationId === activeId || switching) return
    setSwitching(true)
    setOpen(false)
    await fetch('/api/locations/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationId }),
    })
    setActiveId(locationId)
    setSwitching(false)
    router.refresh()
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={switching}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F3F0EC] border border-[#EDE6DC] text-[12px] font-medium text-[#57534E] hover:bg-[#EDE9E4] transition-colors disabled:opacity-60 max-w-[160px]"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#E05A28] flex-shrink-0" />
        <span className="truncate">{displayLabel}</span>
        <svg className={`w-3 h-3 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-[#EDE6DC] rounded-xl shadow-lg py-1.5 min-w-[180px] z-50">
          {locations.map(loc => {
            const label = loc.location_label ?? loc.business_name
            const isActive = loc.id === (activeId || locations[0]?.id)
            return (
              <button
                key={loc.id}
                onClick={() => handleSwitch(loc.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-left transition-colors hover:bg-[#F3F0EC] ${
                  isActive ? 'font-medium text-[#111]' : 'text-[#57534E]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-[#E05A28]' : 'bg-[#E4DED8]'}`} />
                <span className="truncate">{label}</span>
                {isActive && (
                  <svg className="w-3 h-3 text-[#E05A28] ml-auto flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
