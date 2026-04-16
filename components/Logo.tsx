// components/Logo.tsx
//
// Single source of truth for the ReplyFi logo. Two variants:
//   <Logo />       — wordmark + glyph (use in headers, auth pages)
//   <LogoMark />   — glyph only (use in nav, favicon-style spots)
//
// The two-bubble glyph represents customer review (back) + business reply (front).

interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 28, className = '' }: LogoMarkProps) {
  return (
    <div
      className={`rounded-[8px] bg-accent flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 20 20"
        fill="none"
        style={{ width: size * 0.62, height: size * 0.62 }}
        aria-hidden="true"
      >
        {/* Back bubble — customer review */}
        <path
          d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z"
          fill="white"
          fillOpacity="0.5"
        />
        {/* Front bubble — restaurant reply */}
        <path
          d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z"
          fill="white"
        />
      </svg>
    </div>
  )
}

interface LogoProps {
  size?: number
  className?: string
}

export default function Logo({ size = 30, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="text-[16px] font-bold text-text-1 tracking-tight">ReplyFi</span>
    </div>
  )
}
