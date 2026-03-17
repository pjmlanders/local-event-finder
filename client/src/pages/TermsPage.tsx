export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 12, 2026</p>
      </div>

      <div className="surface-card space-y-6 p-6 text-sm leading-relaxed text-slate-700">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">1. Acceptance of Terms</h2>
          <p>By accessing or using EventFinder ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">2. Description of Service</h2>
          <p>EventFinder is an event discovery platform that aggregates live event listings from third-party sources (Ticketmaster, SeatGeek, Eventbrite, and others). We provide information about events but do not sell tickets directly.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">3. User Accounts</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>You must provide accurate information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You must be at least 13 years old to create an account.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">4. Ticket Purchases &amp; Third-Party Links</h2>
          <p>When you click on a ticket link, you are redirected to a third-party ticket provider. Any purchase you make is between you and that provider. We are not responsible for:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Ticket availability, pricing, or accuracy of event details</li>
            <li>Refund policies of third-party ticket providers</li>
            <li>The content or privacy practices of external sites</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">5. Affiliate Relationships</h2>
          <p>We may earn commissions from ticket providers when you purchase tickets through links on our platform. This affiliate relationship does not increase the price you pay for tickets.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to scrape, crawl, or automate access to the Service</li>
            <li>Interfere with or disrupt the Service's infrastructure</li>
            <li>Impersonate another person or entity</li>
            <li>Use the Service to distribute spam or malicious content</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">7. Intellectual Property</h2>
          <p>Event data is sourced from third-party providers and remains their property. The EventFinder platform, design, and original content are our intellectual property.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">8. Limitation of Liability</h2>
          <p>The Service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the Service, including but not limited to inaccurate event information, service downtime, or issues with third-party ticket purchases.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">9. Account Termination</h2>
          <p>You may delete your account at any time from Settings. Upon deletion, all your personal data, preferences, and favorites will be permanently removed from our systems.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">10. Changes to Terms</h2>
          <p>We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the updated terms.</p>
        </section>
      </div>
    </div>
  )
}
