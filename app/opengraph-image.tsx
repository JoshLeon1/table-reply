import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ReplyFi — AI Review Replies for Local Businesses'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#F8F6F3',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle top gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 300,
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(224,90,40,0.12), transparent)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: '#E05A28',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
            boxShadow: '0 8px 32px rgba(224,90,40,0.35)',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 20 20" fill="none">
            <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
            <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: '#111',
            letterSpacing: '-0.03em',
            marginBottom: 16,
          }}
        >
          ReplyFi
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 26,
            color: '#666',
            letterSpacing: '-0.01em',
            marginBottom: 48,
            maxWidth: 700,
            textAlign: 'center',
            lineHeight: 1.35,
          }}
        >
          AI-powered review replies for local businesses
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {['Auto-draft replies', 'Track competitors', 'Keyword alerts'].map((text) => (
            <div
              key={text}
              style={{
                background: 'white',
                border: '1.5px solid #E4DED8',
                borderRadius: 100,
                padding: '10px 22px',
                fontSize: 18,
                color: '#444',
                fontWeight: 500,
              }}
            >
              {text}
            </div>
          ))}
        </div>

        {/* Bottom domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 18,
            color: '#A8A29E',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
        >
          replyfi.app
        </div>
      </div>
    ),
    { ...size }
  )
}
