const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "https://buy.stripe.com/fZucN7chm3Lgca3g2zenS10";

const fixes = [
  {
    number: "01",
    title: "Find the leaks",
    copy: "A focused review of your homepage, offer, calls to action, trust signals, mobile experience, and lead path.",
  },
  {
    number: "02",
    title: "Rewrite the money section",
    copy: "A replacement hero, supporting copy, and primary CTA written for your actual customer—not a generic checklist.",
  },
  {
    number: "03",
    title: "Hand you the patch list",
    copy: "Prioritized fixes, annotated evidence, FAQ copy, and schema-ready content your developer can implement immediately.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Lead Leak Fix Pack home">
          LEAD<span>/</span>LEAK
        </a>
        <a className="navCta" href={checkoutUrl}>Get the fix pack — $100</a>
      </header>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span /> One fixed price. Delivered within 24 hours.</div>
        <h1>Your website is getting visits.<br /><em>Where are the leads?</em></h1>
        <p className="heroCopy">
          Get a sharp, human-reviewed conversion teardown plus the exact copy and fixes to stop losing good prospects.
        </p>
        <div className="heroActions">
          <a className="primary" href={checkoutUrl}>Fix my lead leaks <span>→</span></a>
          <a className="secondary" href="/sample-report.html" target="_blank">View a sample report</a>
        </div>
        <p className="micro">One public website · one-time payment · no retainer · no access required</p>

        <div className="diagnostic" aria-label="Example conversion diagnosis">
          <div className="diagTop">
            <span className="statusDot" />
            <span>LIVE DIAGNOSIS</span>
            <span className="diagUrl">yourwebsite.com</span>
          </div>
          <div className="scoreRow">
            <div className="score"><strong>43</strong><span>/100</span></div>
            <div>
              <p>LEAD PATH SCORE</p>
              <h2>Visitors have to work too hard.</h2>
            </div>
          </div>
          <div className="signalGrid">
            <div><span className="bad">×</span><p>Vague first-screen promise</p><small>High impact</small></div>
            <div><span className="bad">×</span><p>Competing calls to action</p><small>High impact</small></div>
            <div><span className="warn">!</span><p>Trust arrives too late</p><small>Medium impact</small></div>
            <div><span className="good">✓</span><p>Contact path works</p><small>Keep</small></div>
          </div>
        </div>
      </section>

      <section className="problemBand">
        <div className="shell problemGrid">
          <p className="sectionLabel">The problem</p>
          <h2>Traffic is expensive.<br />Confusion is optional.</h2>
          <p>Most small-business sites do not need a redesign. They need a clearer promise, stronger proof, and one obvious next step. This pack shows you exactly what to change first.</p>
        </div>
      </section>

      <section className="shell deliverables" id="deliverables">
        <p className="sectionLabel">What you get</p>
        <div className="cards">
          {fixes.map((fix) => (
            <article key={fix.number}>
              <span>{fix.number}</span>
              <h3>{fix.title}</h3>
              <p>{fix.copy}</p>
            </article>
          ))}
        </div>
        <div className="included">
          <div><strong>8–12</strong><span>priority findings</span></div>
          <div><strong>1</strong><span>rewritten hero section</span></div>
          <div><strong>5+</strong><span>FAQ answers</span></div>
          <div><strong>24h</strong><span>delivery target</span></div>
        </div>
      </section>

      <section className="shell fit">
        <div>
          <p className="sectionLabel">A good fit?</p>
          <h2>Built for sites that should generate a call, booking, quote, or demo.</h2>
        </div>
        <div className="fitList">
          <p><span>✓</span> Local and home-service businesses</p>
          <p><span>✓</span> Consultants, agencies, and freelancers</p>
          <p><span>✓</span> B2B services and simple landing pages</p>
          <p><span>×</span> Not a technical SEO crawl or full redesign</p>
        </div>
      </section>

      <section className="faq shell">
        <p className="sectionLabel">Straight answers</p>
        <details open><summary>What happens after I pay?</summary><p>Stripe collects your payment, then asks for your website URL and best email. Your finished pack is delivered to that email within 24 hours.</p></details>
        <details><summary>Do you need access to my website?</summary><p>No. The review uses only the public pages you provide. You decide which recommendations to implement.</p></details>
        <details><summary>Is this generated by an automated audit tool?</summary><p>No. Tools may support performance checks, but the diagnosis, prioritization, replacement copy, and recommendations are reviewed and tailored to your site.</p></details>
        <details><summary>Can you guarantee more leads?</summary><p>No honest audit can guarantee revenue. This pack identifies friction and gives you specific fixes; results depend on traffic quality, implementation, offer, market, and follow-through.</p></details>
      </section>

      <section className="closing">
        <div className="shell closingInner">
          <p className="sectionLabel">One slot. One day.</p>
          <h2>Stop guessing what to fix.</h2>
          <p>Get a prioritized plan and the words to put on the page.</p>
          <a className="primary light" href={checkoutUrl}>Get the $100 fix pack <span>→</span></a>
          <small>Secure checkout powered by Stripe</small>
        </div>
      </section>

      <footer className="shell">
        <a className="brand" href="#top">LEAD<span>/</span>LEAK</a>
        <p>Clearer pages. Better next steps.</p>
        <p>© 2026 Lead Leak Fix Pack</p>
      </footer>
    </main>
  );
}
