import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  // Cover extends page behind the iOS notch/status bar so we can
  // fill the gap with the nav background using safe-area-inset-top
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'ReplyFi — AI Review Replies for Local Businesses',
  description:
    'ReplyFi drafts personalized review replies for any local business. Approve and post in seconds.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'ReplyFi — AI Review Replies for Local Businesses',
    description:
      'ReplyFi drafts personalized review replies for any local business. Approve and post in seconds.',
    url: 'https://replyfi.com',
    siteName: 'ReplyFi',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ReplyFi' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReplyFi — AI Review Replies for Local Businesses',
    description: 'ReplyFi drafts personalized review replies for any local business. Approve and post in seconds.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  )
}
