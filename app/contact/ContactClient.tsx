'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import Notice from '@/components/ui/Notice'
import MarketingNav from '@/components/MarketingNav'
import MarketingFooter from '@/components/MarketingFooter'

export default function ContactClient() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Opens default mail client as a simple fallback
    const subject = encodeURIComponent('ReplyFi Support Request')
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
    window.location.href = `mailto:support@replyfi.app?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F6F3]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <MarketingNav right="back" />

      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          <div className="text-center mb-10">
            <h1 className="text-[26px] sm:text-[32px] font-bold text-[#111] tracking-[-0.02em] mb-2">Contact us</h1>
            <p className="text-[14px] text-[#57534E]">We typically respond within one business day.</p>
          </div>

          {/* Quick-reference tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
            {[
              {
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
                label: 'Email Support',
                value: 'support@replyfi.app',
                href: 'mailto:support@replyfi.app',
              },
              {
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
                label: 'Response Time',
                value: 'Within 1 business day',
                href: null,
              },
              {
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
                label: 'Billing Issues',
                value: 'Handled via Stripe portal',
                href: null,
              },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-[#E4DED8] p-5 text-center shadow-card">
                <div className="w-9 h-9 rounded-xl bg-[#FEF0E8] border border-[#F5C9AD] flex items-center justify-center text-[#E05A28] mx-auto mb-3">
                  {item.icon}
                </div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-[#A8A29E] mb-1.5">{item.label}</p>
                {item.href ? (
                  <a href={item.href} className="text-[13px] font-medium text-[#E05A28] hover:text-[#C94E21] transition-colors">{item.value}</a>
                ) : (
                  <p className="text-[13px] font-medium text-[#333]">{item.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-[#E4DED8] p-6 sm:p-8 shadow-card">
            {sent ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-[15px] font-semibold text-[#111] mb-1">Message sent</p>
                <p className="text-[13px] text-[#57534E]">Your email client should have opened. We&apos;ll get back to you soon.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-5 text-[13px] font-semibold text-[#E05A28] hover:text-[#C94E21] transition-colors underline underline-offset-2"
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    id="contact-name"
                    label="Name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  <Input
                    id="contact-email"
                    type="email"
                    label="Email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    autoComplete="email"
                  />
                </div>
                <Textarea
                  id="contact-message"
                  label="Message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with…"
                  className="leading-relaxed"
                />
                <Button type="submit" variant="accent" className="w-full h-11 text-[14px]">
                  Send Message
                </Button>
                <Notice variant="info">
                  This form opens your mail client — we reply directly to your email. If nothing opens, write to <a className="underline underline-offset-2 font-semibold" href="mailto:support@replyfi.app">support@replyfi.app</a>.
                </Notice>
              </form>
            )}
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
