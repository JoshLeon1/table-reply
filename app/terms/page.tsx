import Link from 'next/link'

export const metadata = {
  title: 'Terms of Service — Replyfi',
  description: 'Terms and conditions for using Replyfi.',
}

export default function TermsPage() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F8F6F3', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="border-b border-[#E4DED8] bg-white sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E05A28] flex items-center justify-center">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                <path d="M2 1.5h9A1.5 1.5 0 0112.5 3v5A1.5 1.5 0 0111 9.5H7l-2 2v-2H2A1.5 1.5 0 01.5 8V3A1.5 1.5 0 012 1.5z" fill="white" fillOpacity="0.5"/>
                <path d="M8 8h9.5A1.5 1.5 0 0119 9.5v5A1.5 1.5 0 0117.5 16H16v2.5l-3-2.5H8A1.5 1.5 0 016.5 14.5v-5A1.5 1.5 0 018 8z" fill="white"/>
              </svg>
            </div>
            <span className="font-bold text-[15px] text-[#111] tracking-tight">Replyfi</span>
          </Link>
          <Link href="/" className="text-[13px] text-[#A8A29E] hover:text-[#111] transition-colors font-medium">← Back</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <h1 className="text-[26px] sm:text-[28px] font-bold text-[#111] tracking-tight mb-2">Terms of Service</h1>
          <p className="text-[13px] text-[#A8A29E]">Last updated: April 10, 2026</p>
        </div>

        <div className="space-y-8 text-[#57534E] leading-relaxed">

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">1. Acceptance of Terms</h2>
            <p className="text-[14px]">
              By creating an account and using Replyfi (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">2. Description of Service</h2>
            <p className="text-[14px]">
              Replyfi is a review management platform that helps business owners monitor, respond to, and analyze customer reviews. Features include AI-generated reply suggestions, review analytics, competitor tracking, social post generation, and review request templates.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">3. Account Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-2 text-[14px]">
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when creating your account.</li>
              <li>You may only use the Service for lawful purposes and in accordance with these Terms.</li>
              <li>You are responsible for all activity that occurs under your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">4. Acceptable Use</h2>
            <p className="text-[14px] mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2 text-[14px]">
              <li>Use AI-generated replies in a way that is deceptive, defamatory, or violates platform terms of service</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the Service beyond normal use</li>
              <li>Use the Service to harass, harm, or impersonate others</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">5. AI-Generated Content</h2>
            <p className="text-[14px]">
              Replyfi generates reply suggestions using artificial intelligence. These are suggestions only — you are responsible for reviewing content before posting it publicly. We are not liable for any consequences arising from replies you post based on AI suggestions.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">6. Subscription & Billing</h2>
            <ul className="list-disc pl-5 space-y-2 text-[14px]">
              <li>Replyfi offers a 7-day free trial with no credit card required.</li>
              <li>After the trial, continued use requires a paid subscription billed monthly or annually.</li>
              <li>You may cancel at any time from the Settings page. Cancellations take effect at the end of the current billing period.</li>
              <li>We reserve the right to change pricing with 30 days&rsquo; notice to existing subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">7. Intellectual Property</h2>
            <p className="text-[14px]">
              The Replyfi platform, including its design, code, and branding, is owned by Replyfi and protected by intellectual property laws. You retain ownership of your business&rsquo;s data and content. By using the Service, you grant us a limited license to process your data to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">8. Disclaimer of Warranties</h2>
            <p className="text-[14px]">
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or that AI-generated content will be accurate or appropriate for all situations.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">9. Limitation of Liability</h2>
            <p className="text-[14px]">
              To the fullest extent permitted by law, Replyfi shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to loss of revenue, reputation, or data.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">10. Termination</h2>
            <p className="text-[14px]">
              We reserve the right to suspend or terminate accounts that violate these Terms. You may delete your account at any time through the Settings page or by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">11. Changes to Terms</h2>
            <p className="text-[14px]">
              We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">12. Contact</h2>
            <p className="text-[14px]">
              Questions? Email us at <a href="mailto:support@replyfi.com" className="text-[#E05A28] hover:underline">support@replyfi.com</a> or visit our <Link href="/contact" className="text-[#E05A28] hover:underline">Contact page</Link>.
            </p>
          </section>

        </div>
      </div>

      <footer className="border-t border-[#E4DED8] py-8 text-center text-[12px] text-[#A8A29E] bg-white">
        <div className="flex items-center justify-center gap-5">
          <Link href="/privacy" className="hover:text-[#111] transition-colors">Privacy</Link>
          <span className="text-[#E4DED8]">·</span>
          <Link href="/terms" className="hover:text-[#111] transition-colors">Terms</Link>
          <span className="text-[#E4DED8]">·</span>
          <Link href="/contact" className="hover:text-[#111] transition-colors">Contact</Link>
        </div>
        <p className="mt-2.5 text-[#C4BEB8]">© {new Date().getFullYear()} Replyfi. All rights reserved.</p>
      </footer>
    </div>
  )
}
