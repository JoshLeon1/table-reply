import Link from 'next/link'
import type { BlogPostMeta } from './posts'

export const meta: BlogPostMeta = {
  slug: 'how-to-respond-to-bad-google-review',
  title: 'How to Respond to a Bad Google Review (10 Templates)',
  description:
    'A 5-minute guide to replying to negative Google reviews the right way — with 10 copy-paste templates for the most common restaurant scenarios.',
  datePublished: '2025-10-14',
  readingMinutes: 9,
  keywords: [
    'how to respond to a bad google review',
    'negative google review response',
    'restaurant review reply templates',
    'bad review reply examples',
    'google review response examples',
  ],
}

export default function Post() {
  return (
    <>
      <p>
        The short answer: <strong>reply within 24 hours, thank them for the feedback, acknowledge the specific issue
        without making excuses, offer to make it right offline, and keep it under 80 words.</strong> Don&apos;t argue,
        don&apos;t over-apologize, and never ignore a bad review — silence is louder than any reply you could write.
      </p>

      <p>
        Below are 10 templates for the most common negative-review scenarios restaurants face, plus the logic
        behind each one so you can adapt them to your voice.
      </p>

      <h2>Why replying to bad reviews actually matters</h2>

      <p>
        Your reply isn&apos;t really for the reviewer. It&apos;s for the <strong>next 200 customers</strong> who read
        the review before deciding where to eat. Those customers already expect to see a 1-star review or two —
        every restaurant has them. What they&apos;re actually looking at is how you handled it.
      </p>

      <p>According to a widely-cited BrightLocal survey, <strong>88% of consumers are more likely to use a business that
      responds to all of its reviews</strong>, good or bad. A well-written reply to a negative review can turn a
      reputation liability into a conversion asset.</p>

      <p>The three things a good reply signals to every future reader:</p>
      <ul>
        <li>You care about the experience (not just the rating)</li>
        <li>You&apos;re accountable when something goes wrong</li>
        <li>You&apos;re a real human being, not a faceless business</li>
      </ul>

      <h2>The 5-part framework every reply should follow</h2>

      <p>Every good reply to a negative review follows the same basic shape. Memorize this and you&apos;ll never
      stare at the cursor again.</p>

      <ol>
        <li><strong>Thank them by name.</strong> &quot;Hi Sarah — thank you for taking the time to share this.&quot;</li>
        <li><strong>Acknowledge the specific issue.</strong> Not generic &quot;we&apos;re sorry&quot; — name the
          actual thing. &quot;A 45-minute wait on a Friday night isn&apos;t the experience we want anyone to have.&quot;</li>
        <li><strong>Take ownership without excuses.</strong> &quot;That&apos;s on us.&quot; No &quot;but we were short-staffed&quot;,
          no &quot;most of our guests&quot;, no defensiveness.</li>
        <li><strong>Offer to resolve it offline.</strong> Give a direct email or phone number. This moves the conversation
          off the public page and shows future readers you&apos;re trying to fix it.</li>
        <li><strong>Sign it with a real name.</strong> &quot;— Marco, owner.&quot; Anonymous replies feel corporate. A first
          name and a role make it human.</li>
      </ol>

      <div className="callout">
        <strong>Don&apos;t do this:</strong> Don&apos;t re-litigate the facts in public. If they said they waited 45 minutes
        and you think it was 25, it doesn&apos;t matter — <em>they felt</em> like they waited 45 minutes. Arguing makes
        you look worse than the original review did.
      </div>

      <h2>10 templates for the most common scenarios</h2>

      <p>Copy these, swap in the reviewer&apos;s name and your specifics, and adjust the tone to match how you
      actually talk. Each template is kept under 80 words — short enough to read on a phone, long enough to feel
      genuine.</p>

      <h3>1. Slow service / long wait</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — thank you for flagging this. A {'{45}'}-minute wait isn&apos;t what we aim for, especially on a
        busy {'{Friday}'} night. That&apos;s on us. We&apos;ve already talked with the floor team about pacing and
        table turn times. If you&apos;d give us a chance to make it right, email me at {'{owner@yourrestaurant.com}'}
        and I&apos;ll take care of your next visit personally.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>2. Rude or inattentive staff</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — this is hard to read, and I&apos;m sorry. The way you were treated doesn&apos;t reflect who we
        try to be. I&apos;d like to understand what happened so I can address it with the team directly. Would you
        email me at {'{owner@yourrestaurant.com}'}? Whatever you share will be handled privately.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>3. Food was cold / undercooked</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — a cold {'{pasta}'} is never okay, and we should have caught it before it left the kitchen. Thank
        you for telling us. I&apos;ve shared this with our chef. If you&apos;re open to it, I&apos;d love to have you back for
        a meal on us so we can show you what we actually do — just email {'{owner@yourrestaurant.com}'}.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>4. Wrong order</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — getting your order wrong is inexcusable on our end. Thank you for the feedback — it helps us
        tighten up the ticket process. I&apos;d really like to make this right. Please reach me directly at
        {' {owner@yourrestaurant.com}'} and I&apos;ll sort it out.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>5. Overpriced / felt like a rip-off</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — appreciate the honest feedback. Price is something we think about a lot, and we want every
        guest to feel the experience matches the check. If something specific felt off, I&apos;d love to hear it —
        {' {owner@yourrestaurant.com}'}. Either way, thank you for giving us a try.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>6. Dirty restaurant / cleanliness issue</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — cleanliness is a non-negotiable for us and what you described falls well below our standard.
        Thank you for telling us. I&apos;ve already addressed it with the team and we&apos;re tightening our closing
        checks. If you&apos;d like to talk directly, please email me at {'{owner@yourrestaurant.com}'}.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>7. Reservation / seating problem</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — this was a failure on the reservation side and I&apos;m sorry. A confirmed booking should
        mean a table ready when you walk in. If you&apos;re willing to give us another chance, email me at
        {' {owner@yourrestaurant.com}'} and I&apos;ll personally handle your next visit.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>8. Dietary / allergy mistake</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — an allergy request is something we take extremely seriously, and I&apos;m grateful you&apos;re
        okay. Thank you for bringing this up publicly — it matters. I&apos;ve pulled the team together to review our
        allergy protocol. Please email me at {'{owner@yourrestaurant.com}'} so I can follow up with you directly.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>9. Bad takeout / delivery experience</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — thanks for the feedback. Takeout is tricky — packaging, timing, and travel all matter, and
        clearly we missed on this one. I&apos;d like to send you something on the house to try again. Email me at
        {' {owner@yourrestaurant.com}'}.
        <br />— {'{Marco}'}, owner
      </div>

      <h3>10. Vague / hard-to-parse complaint</h3>
      <div className="template">
        <span className="template-label">Template</span>
        Hi {'{Name}'} — sorry the visit didn&apos;t land for you. I&apos;d genuinely like to understand what went
        wrong so we can do better. Could you email me a few details at {'{owner@yourrestaurant.com}'}? It would
        really help us.
        <br />— {'{Marco}'}, owner
      </div>

      <h2>What <em>not</em> to say</h2>

      <p>The fastest way to turn a bad review into a worse one is to reply poorly. A few specific things to avoid:</p>

      <ul>
        <li><strong>&quot;I&apos;m sorry you feel that way.&quot;</strong> This is a non-apology. It implies the feeling is the
          problem, not the thing you did.</li>
        <li><strong>&quot;That&apos;s not what happened.&quot;</strong> Even if it&apos;s true, you&apos;ve just turned a
          customer-service moment into a courtroom. Take it to email.</li>
        <li><strong>&quot;We&apos;ve never had this complaint before.&quot;</strong> Reads as dismissive and is almost
          always untrue.</li>
        <li><strong>A 3-paragraph defense.</strong> If your reply is longer than the review, you&apos;ve lost.</li>
        <li><strong>Copy-pasted replies across every review.</strong> Google surfaces these, and reviewers read other reviews
          to see if your response is genuine. Each reply should name something specific from that review.</li>
      </ul>

      <h2>How to reply to a bad review in Google Business Profile (step-by-step)</h2>

      <ol>
        <li>Go to <a href="https://business.google.com" target="_blank" rel="noopener noreferrer">business.google.com</a> and sign in.</li>
        <li>Select your restaurant location.</li>
        <li>Click <strong>Reviews</strong> in the left sidebar (or <strong>Read reviews</strong> on the overview).</li>
        <li>Find the review and click <strong>Reply</strong>.</li>
        <li>Paste your draft, personalize it, and click <strong>Post reply</strong>. It goes live immediately and the reviewer
          gets an email notification.</li>
      </ol>

      <div className="callout">
        <strong>Pro tip:</strong> Reply from your phone. Restaurant owners are almost never at a desk — the Google Maps
        app lets you respond to reviews in under 30 seconds between services.
      </div>

      <h2>How fast should you reply?</h2>

      <p>
        The public-facing answer: <strong>within 24 hours for negative reviews</strong>, 48–72 hours for positive ones. The
        reason is that new reviews appear at the top of your listing for several days. A reply that shows up below a
        still-featured review captures maximum eyeballs.
      </p>

      <p>
        The bigger reason to be fast is the reviewer themselves. People who leave a 1-star review are often in the
        emotional immediate aftermath of a bad meal. A thoughtful reply within a few hours — before they&apos;ve told all
        their friends — disproportionately softens the damage.
      </p>

      <h2>Can you automate this?</h2>

      <p>
        Yes, and this is what ReplyFi does. We sync your reviews from Google, Yelp, and TripAdvisor, and draft a reply
        for every single one — in your restaurant&apos;s actual voice, not a generic AI tone. You review, edit if you
        want, approve. Most owners go from &quot;reviews are a weekly chore I avoid&quot; to &quot;done in 5 minutes a
        day.&quot;
      </p>

      <p>
        <Link href="/signup">Start a free 7-day trial</Link> — no credit card, cancel any time. We&apos;ll pull in your
        real reviews and draft the replies so you can see how it sounds before you pay a dollar.
      </p>

      <h2>FAQ</h2>

      <h3>Should I reply to positive reviews too?</h3>
      <p>
        Yes. A one-line thank-you is enough. Google has confirmed that response rate (not just response quality)
        factors into local search ranking.
      </p>

      <h3>What if the review is from someone who was never actually a customer?</h3>
      <p>
        Flag it. Google removes reviews that violate its policies, including fake ones from non-customers. We cover
        the full process in <Link href="/blog/how-to-remove-fake-google-review">How to Get a Fake Google Review Removed</Link>.
      </p>

      <h3>How many bad reviews are too many?</h3>
      <p>
        Below a 4.0 overall rating is where most customers start flinching. The good news is you can&apos;t undo bad
        reviews — but you can out-earn them with new positive ones. See
        {' '}<Link href="/blog/how-to-get-more-google-reviews-restaurant">How to Get More Google Reviews for Your Restaurant</Link>.
      </p>
    </>
  )
}
