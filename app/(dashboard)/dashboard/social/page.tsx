import { redirect } from 'next/navigation'

export const metadata = { title: 'Social — Replyfi' }

export default function SocialPage() {
  redirect('/dashboard/grow')
}
