interface Tab {
  key: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (key: string) => void
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-6 border-b border-[#E4DED8] -mx-5 sm:-mx-6 px-5 sm:px-6">
      {tabs.map(t => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative pb-3 text-[13px] tracking-[-0.01em] transition-colors ${isActive ? 'text-[#111]' : 'text-[#57534E] hover:text-[#111]'}`}
            style={{ fontWeight: isActive ? 500 : 400 }}
          >
            {t.label}
            {typeof t.count === 'number' && (
              <span className="ml-1.5 text-[11px] tabular-nums text-[#A8A29E]">{t.count}</span>
            )}
            {isActive && <span className="absolute left-0 right-0 -bottom-px h-[2px] bg-[#111]" />}
          </button>
        )
      })}
    </div>
  )
}
