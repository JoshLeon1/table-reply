import Link from 'next/link'
import type { BlogPostMeta } from './posts'

export const meta: BlogPostMeta = {
  slug: 'negative-restaurant-review-response-examples',
  title: 'Negative Restaurant Review Response Examples That Actually Work',
  description:
    'Real examples of great (and terrible) responses to 1-star restaurant reviews, broken down line by line — so you can write better replies in your own voice.',
  datePublished: '2025-10-16',
  readingMinutes: 8,
  keywords: [
    'negative restaurant review response examples',
    'bad review reply examples',
    'restaurant review response',
    'how to reply to 1 star review',
    'review management examples',
  ],
}

export default function Post() {
  return (
    <>
      <p>
        Templates are fine, but nothing teaches you faster than seeing a real bad-review reply and understanding why
        it worked — or why it made everything worse. Below are six annotated examples from real-world restaurant
        reviews, broken down sentence by sentence.
      </p>

      <p>
        All names and details are anonymized, but every example is modeled on actual reviews and responses you can
        find on Google Maps today.
      </p>

      <h2>Example 1: The classic &quot;long wait&quot; complaint</h2>

      <blockquote>
        &quot;Made a reservation for 7:30, weren&apos;t seated until 8:15. Server was clearly overwhelmed. Food was
        fine when it finally came but the whole experience felt chaotic. Expected better for a $200 dinner.&quot;
        <br />— 2 stars
      </blockquote>

      <h3>The bad response</h3>
      <div className="template">
        <span className="template-label">Don&apos;t write this</span>
        Hi there, we&apos;re sorry you feel that way. Saturdays are our busiest night and we were unfortunately short-staffed.
        We hope you&apos;ll give us another chance.
      </div>

      <p><strong>Why it fails:</strong></p>
      <ul>
        <li>&quot;We&apos;re sorry you feel that way&quot; is the hallmark non-apology. It shifts blame to the customer&apos;s feelings.</li>
        <li>&quot;Short-staffed&quot; is an excuse. The customer doesn&apos;t care about your staffing.</li>
        <li>No specific acknowledgment of the 45-minute delay or the chaotic service.</li>
        <li>No offer to make it right, no contact info, no name.</li>
      </ul>

      <h3>The good response</h3>
      <div className="template">
        <span className="template-label">Write this</span>
        Hi Alex — this is exactly the kind of feedback I need. A 45-minute wait on a confirmed 7:30 reservation
        isn&apos;t something to hand-wave, and the chaos you described means the floor wasn&apos;t managed well that
        night. That&apos;s on me. I&apos;d like to have you back for dinner on us — please email me at
        sofia@brassandvine.com and I&apos;ll take care of it personally.
        <br />— Sofia, owner
      </div>

      <p><strong>Why it works:</strong></p>
      <ul>
        <li>Names the specific issue: 45-minute wait on a <em>confirmed</em> reservation.</li>
        <li>&quot;That&apos;s on me&quot; is direct ownership without melodrama.</li>
        <li>Concrete offer to make it right, with a direct email — not &quot;reach out to our team.&quot;</li>
        <li>Signed by a real person with a real role. Feels human.</li>
      </ul>

      <hr />

      <h2>Example 2: The harsh 1-star</h2>

      <blockquote>
        &quot;Worst dining experience of my life. Server forgot half our order, manager was dismissive when we
        complained, and they still charged us full price. Avoid at all costs.&quot;
        <br />— 1 star
      </blockquote>

      <h3>The bad response</h3>
      <div className="template">
        <span className="template-label">Don&apos;t write this</span>
        We pride ourselves on excellent service and this is not consistent with how we operate. We would like to
        dispute some of what&apos;s written here. Please contact us so we can discuss.
      </div>

      <p><strong>Why it fails:</strong> &quot;We would like to dispute&quot; is a lawsuit sentence, not a hospitality
      one. Future customers reading this see a restaurant that argues with 1-star reviewers, not one that fixes problems.</p>

      <h3>The good response</h3>
      <div className="template">
        <span className="template-label">Write this</span>
        Hi Jordan — this is really hard to read and I&apos;m sorry. Forgetting half an order is bad enough; being
        dismissed on top of it is worse. I&apos;d like to understand exactly what happened — both to refund your
        meal and to talk directly with the manager on shift that night. Please email me at sofia@brassandvine.com.
        <br />— Sofia, owner
      </div>

      <p><strong>Why it works:</strong> It doesn&apos;t defend, it doesn&apos;t dispute, and it promises action (a refund
      and a conversation with the manager). A future customer reading this sees accountability.</p>

      <hr />

      <h2>Example 3: The vague negative review</h2>

      <blockquote>&quot;Not what I expected. Won&apos;t be back.&quot; — 2 stars</blockquote>

      <p>
        Vague reviews are frustrating because you have nothing to acknowledge specifically. The temptation is to
        either ignore them (bad) or write a generic &quot;we&apos;re sorry&quot; (also bad).
      </p>

      <h3>The good response</h3>
      <div className="template">
        <span className="template-label">Write this</span>
        Hi Pat — appreciate you taking the time to leave a note, even a short one. We&apos;d genuinely like to know
        what didn&apos;t land so we can do better. If you&apos;re open to a couple of sentences, I&apos;m at
        sofia@brassandvine.com.
        <br />— Sofia, owner
      </div>

      <p><strong>Why it works:</strong> You can&apos;t acknowledge specifics because there aren&apos;t any, so you
      acknowledge the effort of writing the review and ask a sincere question. Future readers see curiosity, not
      defensiveness.</p>

      <hr />

      <h2>Example 4: The &quot;food was bad&quot; review</h2>

      <blockquote>
        &quot;Ordered the lamb chops, they came out dry and overcooked. Sent them back, the replacement was the same.
        Left hungry and disappointed.&quot;
        <br />— 2 stars
      </blockquote>

      <h3>The good response</h3>
      <div className="template">
        <span className="template-label">Write this</span>
        Hi Morgan — dry lamb chops once is a miss. Twice is a kitchen problem. Thank you for sending them back and
        giving us the chance to fix it, even though we didn&apos;t. I&apos;ve already talked with our sous chef about
        the pan temps. I&apos;d like to have you back for a do-over — please email sofia@brassandvine.com.
        <br />— Sofia, owner
      </div>

      <p><strong>Why it works:</strong> &quot;Once is a miss. Twice is a kitchen problem&quot; is direct, credible,
      and mildly self-deprecating. It also quietly signals to future readers: <em>the owner is paying attention to the
      actual quality of food, not just the reviews.</em></p>

      <hr />

      <h2>Example 5: The entitled reviewer</h2>

      <blockquote>
        &quot;I told them I&apos;m a food blogger with 30k followers and I still had to wait for a table. Poor
        management.&quot;
        <br />— 1 star
      </blockquote>

      <p>
        Tempting to dunk on. <strong>Don&apos;t.</strong> Every future customer reading this can already see that the
        reviewer is being unreasonable. Your job is to look like the adult in the room.
      </p>

      <h3>The good response</h3>
      <div className="template">
        <span className="template-label">Write this</span>
        Hi Taylor — thanks for the feedback. We seat guests in the order they arrive, regardless of profession or
        following, and we&apos;re not going to change that. If you&apos;d like to try us again, we&apos;d love to have
        you.
        <br />— Sofia, owner
      </div>

      <p><strong>Why it works:</strong> Polite, firm, and quietly makes the restaurant look principled. The owner
      isn&apos;t petty or sycophantic. Future customers notice.</p>

      <hr />

      <h2>Example 6: The review that&apos;s probably fake</h2>

      <blockquote>
        &quot;Terrible place, rude staff, wouldn&apos;t recommend.&quot;
        <br />— 1 star (no other reviews on profile, generic name)
      </blockquote>

      <p>
        If you genuinely don&apos;t recognize the person and the review is vague + the reviewer&apos;s profile is
        empty, <strong>flag it with Google first</strong>. But while you&apos;re waiting for Google to process it,
        reply publicly so future readers don&apos;t see an unanswered 1-star.
      </p>

      <h3>The good response</h3>
      <div className="template">
        <span className="template-label">Write this</span>
        Hi — we don&apos;t have a record of your visit and we&apos;d like to understand what happened. If you were
        a guest, please reach out at sofia@brassandvine.com with a date or reservation name and we&apos;ll make it
        right.
        <br />— Sofia, owner
      </div>

      <p>
        <strong>Why it works:</strong> You&apos;re not accusing them of faking the review (that can backfire). You&apos;re
        politely saying &quot;we&apos;d love to verify and fix this&quot; — which is exactly what a fake reviewer can&apos;t
        do. For the full removal flow, see{' '}
        <Link href="/blog/how-to-remove-fake-google-review">How to Get a Fake Google Review Removed</Link>.
      </p>

      <hr />

      <h2>The patterns you probably noticed</h2>

      <p>Every good example above shares a short list of traits. If you remember nothing else from this post,
      remember these:</p>

      <ul>
        <li><strong>Name the specific issue.</strong> Not &quot;sorry for your experience&quot; — name the thing.</li>
        <li><strong>Take ownership without excuses.</strong> &quot;That&apos;s on us.&quot; No conditional sorries.</li>
        <li><strong>Move the fix offline.</strong> Direct email, direct to the owner.</li>
        <li><strong>Keep it short.</strong> Under 80 words almost always. A 3-paragraph reply looks defensive.</li>
        <li><strong>Sign with a real name.</strong> &quot;— Sofia, owner&quot; beats &quot;— The Brass &amp; Vine Team&quot;
          every time.</li>
      </ul>

      <h2>Don&apos;t want to write these yourself?</h2>

      <p>
        <Link href="/signup">ReplyFi drafts replies like these automatically</Link>, in your restaurant&apos;s voice —
        across Google and Yelp. You edit if you want, approve, post. Free for 7 days, no credit card.
      </p>

      <h2>Related reading</h2>
      <ul>
        <li><Link href="/blog/how-to-respond-to-bad-google-review">How to Respond to a Bad Google Review (10 Templates)</Link></li>
        <li><Link href="/blog/how-to-remove-fake-google-review">How to Get a Fake Google Review Removed (Step-by-Step)</Link></li>
        <li><Link href="/blog/how-to-get-more-google-reviews-restaurant">How to Get More Google Reviews for Your Restaurant</Link></li>
      </ul>
    </>
  )
}
