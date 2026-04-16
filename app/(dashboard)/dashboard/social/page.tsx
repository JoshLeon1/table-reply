import { redirect } from 'next/navigation'

export const metadata = { title: 'Social — ReplyFi' }

export default function SocialPage() {
  redirect('/dashboard/grow')
}
