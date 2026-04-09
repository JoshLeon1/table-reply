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

export const metadata: Metadata = {
  title: 'TableReply — AI Review Replies for Restaurants',
  description:
    'Generate personalized, on-brand responses to your Google and Yelp reviews in 10 seconds. Built specifically for restaurants. Unlimited replies, $29/mo.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'TableReply — AI Review Replies for Restaurants',
    description:
      'Generate personalized, on-brand responses to your Google and Yelp reviews in 10 seconds. Built specifically for restaurants.',
    url: 'https://tablereply.com',
    siteName: 'TableReply',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'TableReply' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TableReply — AI Review Replies for Restaurants',
    description: 'Generate personalized, on-brand responses to your Google and Yelp reviews in 10 seconds.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} ${inter.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  )
}
