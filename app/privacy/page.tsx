import Link from 'next/link'

export const metadata = {
  title: 'Privacy Policy — TableReply',
  description: 'How TableReply collects, uses, and protects your data.',
}

export default function PrivacyPage() {
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

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-[28px] font-bold text-[#111] mb-2">Privacy Policy</h1>
        <p className="text-[13px] text-[#A8A29E] mb-10">Last updated: April 10, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-[#57534E] leading-relaxed">

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">1. Introduction</h2>
            <p className="text-[14px]">
              TableReply (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is a review management platform built for independent restaurants. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service at tablereply.com.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">2. Information We Collect</h2>
            <p className="text-[14px] mb-3">We collect the following types of information:</p>
            <ul className="list-disc pl-5 space-y-2 text-[14px]">
              <li><strong>Account information:</strong> Your name, email address, and password when you create an account.</li>
              <li><strong>Restaurant profile:</strong> Restaurant name, cuisine type, location, tone preferences, and your Google Maps listing URL.</li>
              <li><strong>Review data:</strong> Reviews we scrape from your connected Google listing, including reviewer names, ratings, and review text.</li>
              <li><strong>Usage data:</strong> Pages visited, features used, and actions taken within the dashboard.</li>
              <li><strong>Billing information:</strong> Processed securely through Stripe. We never store your full payment card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2 text-[14px]">
              <li>To provide and operate the TableReply service</li>
              <li>To generate AI-powered reply suggestions using your review data</li>
              <li>To deliver analytics, insights, and reports about your review performance</li>
              <li>To send you product updates, alerts, and transactional emails</li>
              <li>To process payments and manage your subscription</li>
              <li>To improve and debug our product</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">4. AI & Third-Party Services</h2>
            <p className="text-[14px]">
              TableReply uses Anthropic&rsquo;s Claude API to generate reply suggestions and insights. Review text is sent to Anthropic for processing. Anthropic&rsquo;s privacy policy governs how they handle this data. We do not use your review data to train AI models, and we do not sell your data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">5. Data Retention</h2>
            <p className="text-[14px]">
              We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting us at <a href="mailto:support@tablereply.com" className="text-[#E05A28] hover:underline">support@tablereply.com</a> or through the Settings page in your dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">6. Data Security</h2>
            <p className="text-[14px]">
              We use industry-standard security measures including TLS encryption in transit, and row-level security on all database tables via Supabase. Authentication is handled securely and passwords are never stored in plaintext.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">7. Your Rights</h2>
            <p className="text-[14px]">
              You have the right to access, correct, or delete your personal data. You may also export your data at any time from the Analytics page in your dashboard. To exercise any of these rights, contact us at <a href="mailto:support@tablereply.com" className="text-[#E05A28] hover:underline">support@tablereply.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">8. Cookies</h2>
            <p className="text-[14px]">
              We use essential cookies for authentication and session management. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">9. Changes to This Policy</h2>
            <p className="text-[14px]">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by a notice in the dashboard.
            </p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[#111] mb-3">10. Contact Us</h2>
            <p className="text-[14px]">
              Questions about this policy? Email us at <a href="mailto:support@tablereply.com" className="text-[#E05A28] hover:underline">support@tablereply.com</a> or visit our <Link href="/contact" className="text-[#E05A28] hover:underline">Contact page</Link>.
            </p>
          </section>

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
