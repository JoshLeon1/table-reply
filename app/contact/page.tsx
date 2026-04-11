'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Opens default mail client as a simple fallback
    const subject = encodeURIComponent('TableReply Support Request')
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)
    window.location.href = `mailto:support@tablereply.com?subject=${subject}&body=${body}`
    setSent(true)
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#FAFAF8', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="border-b border-[#E4DED8] bg-white">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#E05A28] flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
                <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] text-[#111]">TableReply</span>
          </Link>
          <Link href="/" className="text-[13px] text-[#888] hover:text-[#111] transition-colors">← Back</Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="text-[28px] font-bold text-[#111] mb-2">Contact Us</h1>
          <p className="text-[14px] text-[#888]">We typically respond within one business day.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
              label: 'Email Support',
              value: 'support@tablereply.com',
              href: 'mailto:support@tablereply.com',
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
            <div key={item.label} className="bg-white rounded-2xl border border-[#E4DED8] p-4 text-center">
              <div className="w-9 h-9 rounded-full bg-[#FEF0E8] flex items-center justify-center text-[#E05A28] mx-auto mb-2.5">
                {item.icon}
              </div>
              <p className="text-[11px] font-semibold text-[#A8A29E] uppercase tracking-wide mb-1">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="text-[13px] font-medium text-[#E05A28] hover:underline">{item.value}</a>
              ) : (
                <p className="text-[13px] font-medium text-[#111]">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-[#E4DED8] p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[15px] font-semibold text-[#111] mb-1">Message Sent</p>
              <p className="text-[13px] text-[#888]">Your email client should have opened. We&apos;ll get back to you soon.</p>
              <button onClick={() => setSent(false)} className="mt-4 text-[13px] text-[#E05A28] hover:underline">
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition bg-[#F8F6F3] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@restaurant.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition bg-[#F8F6F3] focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#888] mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Tell us what you need help with…"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E4DED8] text-[13px] text-[#111] placeholder:text-[#C4BEB8] focus:outline-none focus:ring-2 focus:ring-[#E05A28]/20 focus:border-[#E05A28] transition bg-[#F8F6F3] focus:bg-white resize-none leading-relaxed"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#E05A28] hover:bg-[#C94E21] text-white text-[13px] font-semibold transition-all duration-150 active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          )}
        </div>
      </div>

      <footer className="border-t border-[#E4DED8] py-8 text-center text-[12px] text-[#A8A29E]">
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacy" className="hover:text-[#111] transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-[#111] transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/contact" className="hover:text-[#111] transition-colors">Contact</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} TableReply. All rights reserved.</p>
      </footer>
    </div>
  )
}
