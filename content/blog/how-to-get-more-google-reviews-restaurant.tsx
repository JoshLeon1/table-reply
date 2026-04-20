import Link from 'next/link'
import type { BlogPostMeta } from './posts'

export const meta: BlogPostMeta = {
  slug: 'how-to-get-more-google-reviews-restaurant',
  title: 'How to Get More Google Reviews for Your Restaurant (Without Being Annoying)',
  description:
    'Seven tactics that actually drive new 5-star Google reviews for restaurants — plus the one thing that will get your listing suspended.',
  datePublished: '2025-10-20',
  readingMinutes: 7,
  keywords: [
    'how to get more google reviews',
    'get more restaurant reviews',
    'google review request',
    'how to ask for reviews',
    'restaurant review generation',
  ],
}

export default function Post() {
  return (
    <>
      <p>
        Your overall Google rating and review count are two of the biggest factors in whether a stranger walking past
        your restaurant stops to check the menu or keeps walking. Here&apos;s how to steadily increase both —
        without becoming the restaurant that pesters every guest for a review.
      </p>

      <h2>First: the one thing that will get your listing suspended</h2>

      <div className="callout">
        <strong>Never offer a discount, free item, or any incentive in exchange for a review.</strong> Google&apos;s
        policy is explicit about this, and they do enforce it. Restaurants caught doing it have had reviews wiped and
        listings temporarily suspended.
      </div>

      <p>
        What counts as &quot;incentive&quot;? A free dessert for a 5-star review. A raffle entry for anyone who posts a
        review. &quot;Show us your review for 10% off.&quot; Even subtle versions of these cross the line.
      </p>

      <p>
        You <em>can</em> reward loyal customers generally (a free coffee after 10 visits). You can&apos;t tie any reward
        to the act of leaving a review specifically.
      </p>

      <h2>Tactic 1: Ask at the right moment</h2>

      <p>
        Most review requests fail because they&apos;re asked at the wrong time. The golden window: <strong>the moment
        a guest has said something specifically positive.</strong> Not at the beginning of the meal. Not when the check
        drops. When a guest leans over and says &quot;the risotto was incredible.&quot;
      </p>

      <p>That&apos;s the moment to reply:</p>

      <blockquote>
        &quot;That means so much — thank you. If you have 30 seconds, would you share that on Google? It genuinely
        helps us more than you know.&quot;
      </blockquote>

      <p>
        Conversion rate on in-the-moment verbal requests from servers is 15–25% in our experience — far higher than
        any email or text-based method.
      </p>

      <h2>Tactic 2: Print a short-link QR code on the check presenter</h2>

      <p>
        Use <a href="https://bitly.com" target="_blank" rel="noopener noreferrer">bitly</a> or your own domain to create a
        short link that redirects directly to your Google review form. Generate a QR code for it. Print it on the
        inside of every check presenter with one line:
      </p>

      <blockquote>&quot;Loved it? 30 seconds on Google means the world to us. →&quot;</blockquote>

      <p>
        The key is that the link goes <em>directly</em> to the review form, not to your Google listing. You can
        generate your direct review link by clicking <strong>Ask for reviews</strong> inside Google Business Profile.
      </p>

      <h2>Tactic 3: Post-visit text message (if you have phone numbers)</h2>

      <p>
        If you take reservations via a platform that captures phone numbers (Resy, OpenTable, SevenRooms), send a
        follow-up text 2–4 hours after the meal:
      </p>

      <div className="template">
        <span className="template-label">Template</span>
        Hi Sarah — hope you enjoyed dinner tonight. If you had a great time, a quick Google review helps more than
        you&apos;d think: {'{short link}'}. Either way, thanks for coming in! — Marco
      </div>

      <p>
        Two things matter here. <strong>One:</strong> send it from a real number, not a bulk marketing platform.
        Owner-to-guest texts feel personal. <strong>Two:</strong> don&apos;t mass-send. Pick one or two guests a day
        and do it manually. The reply rate is dramatically higher than bulk SMS.
      </p>

      <h2>Tactic 4: Add a review link to your email receipt</h2>

      <p>
        If your POS system emails receipts (Square, Toast, Clover), most let you customize the footer. Add one line
        with the review link:
      </p>

      <blockquote>&quot;Thanks for dining with us. We&apos;d love to hear how it went: {'{short link}'}&quot;</blockquote>

      <p>Low-effort, runs on autopilot, and captures 1–3% of recipients over time.</p>

      <h2>Tactic 5: Train servers to ask regulars</h2>

      <p>
        Your regulars are your single best source of positive reviews, and most of them have never left one simply
        because it hasn&apos;t occurred to them. When a regular comes in for the 4th time:
      </p>

      <blockquote>
        &quot;Hey — we&apos;re really grateful you keep coming back. Google reviews help us get found by people like
        you. Any chance you&apos;d leave one? No pressure.&quot;
      </blockquote>

      <p>Pair it with a card that has your QR code on it. The ask-to-review conversion rate on regulars is over 40%
      in the right context.</p>

      <h2>Tactic 6: Make it ridiculously easy on mobile</h2>

      <p>
        95% of Google reviews are submitted on phones. Test your review flow on your own phone — scan the QR code,
        tap through. If it takes more than 4 taps to get to the star-rating screen, something&apos;s wrong with your
        link.
      </p>

      <p>The ideal flow:</p>

      <ol>
        <li>Guest scans QR or taps link.</li>
        <li>Google Maps opens to your listing with the review form already popped up.</li>
        <li>Guest taps 5 stars, types a sentence, taps submit. Done in under 30 seconds.</li>
      </ol>

      <h2>Tactic 7: Reply to every review you already have</h2>

      <p>
        This is counter-intuitive but well-documented: <strong>restaurants that reply to 100% of their existing
        reviews get more new reviews.</strong> Reviewers are more likely to post when they see the business is paying
        attention — it signals that their review won&apos;t just vanish into the void.
      </p>

      <p>
        For a restaurant with 100 unreplied reviews, catching up is tedious but high-ROI. Two or three reviews a day
        for a month and you&apos;re caught up, and new reviews start landing more frequently.
      </p>

      <p>
        (This is literally what ReplyFi does — drafts a reply to every review you have across Google, Yelp, and
        TripAdvisor so you can knock out the backlog in one sitting.{' '}
        <Link href="/signup">Try free for 7 days</Link>.)
      </p>

      <h2>What to expect</h2>

      <p>A healthy restaurant implementing most of these tactics typically sees:</p>

      <ul>
        <li>An increase from ~5 reviews/month to 15–30 reviews/month within 60 days.</li>
        <li>Average rating drift upward by 0.2–0.4 stars within 4–6 months as new 5-star reviews outweigh the
          historical average.</li>
        <li>Meaningfully higher local-pack ranking on Google Maps searches for your neighborhood.</li>
      </ul>

      <p>
        None of these tactics require you to be aggressive or gimmicky. They just require doing one or two consistently
        for a few months.
      </p>

      <h2>FAQ</h2>

      <h3>Can I use a kiosk to let guests leave reviews inside the restaurant?</h3>
      <p>
        No. Google filters reviews left from the same IP address as the business, and an in-restaurant kiosk flags
        them all. Don&apos;t do this.
      </p>

      <h3>What about asking on receipts at fast-casual spots with no server interaction?</h3>
      <p>Receipts and digital ordering confirmation screens are the primary channels. The short-link + QR code on the
      receipt is your workhorse.</p>

      <h3>How many Google reviews do I actually need?</h3>
      <p>
        For most neighborhoods, 50 reviews is the threshold where customers start treating your rating as
        statistically meaningful. Above 100 reviews, you&apos;re in the trust tier where a 4.3+ rating generates
        serious foot traffic.
      </p>

      <h2>Related reading</h2>
      <ul>
        <li><Link href="/blog/how-to-respond-to-bad-google-review">How to Respond to a Bad Google Review (10 Templates)</Link></li>
        <li><Link href="/blog/negative-restaurant-review-response-examples">Negative Restaurant Review Response Examples That Actually Work</Link></li>
        <li><Link href="/blog/how-to-remove-fake-google-review">How to Get a Fake Google Review Removed (Step-by-Step)</Link></li>
      </ul>
    </>
  )
}
