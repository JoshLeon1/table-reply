interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 pt-8 pb-6">
      <div>
        <h1 className="text-[22px] sm:text-[24px] text-[#111] leading-[1.15]" style={{ fontWeight: 600, letterSpacing: '-0.022em' }}>{title}</h1>
        {description && <p className="text-[13px] text-[#57534E] mt-1.5" style={{ letterSpacing: '-0.006em' }}>{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
