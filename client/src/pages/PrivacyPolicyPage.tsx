export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 12, 2026</p>
      </div>

      <div className="surface-card space-y-6 p-6 text-sm leading-relaxed text-slate-700">
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">1. Information We Collect</h2>
          <p>When you create an account, we collect your <strong>email address</strong> and <strong>display name</strong>. If you sign in with Google, we also receive your Google profile photo URL.</p>
          <p>When you use the app, we collect:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Location data</strong> (GPS coordinates or ZIP code) &mdash; only when you explicitly grant permission. This is used solely to find events near you and is stored locally on your device.</li>
            <li><strong>Preferences</strong> (preferred event types, default radius) &mdash; stored in our database to personalize your experience.</li>
            <li><strong>Favorited events</strong> &mdash; stored so you can save and revisit events you're interested in.</li>
            <li><strong>Usage data</strong> (click-throughs to ticket sites) &mdash; logged anonymously for analytics and affiliate reporting.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">2. How We Use Your Information</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>To provide and personalize the event discovery service</li>
            <li>To authenticate your identity and secure your account</li>
            <li>To save your preferences and favorites across devices</li>
            <li>To track affiliate click-throughs for revenue reporting (anonymized)</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal information to third parties.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">3. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Firebase Authentication</strong> (Google) &mdash; manages login and account security</li>
            <li><strong>Supabase</strong> &mdash; hosts our database (user profiles, preferences, favorites)</li>
            <li><strong>Ticketmaster, SeatGeek, Eventbrite</strong> &mdash; provide event data. When you click through to purchase tickets, you leave our site and are subject to their privacy policies.</li>
            <li><strong>Nominatim / OpenStreetMap</strong> &mdash; geocodes ZIP codes to coordinates (no personal data sent)</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">4. Data Storage &amp; Security</h2>
          <p>Your data is stored securely in cloud-hosted databases with encryption in transit (TLS) and at rest. Passwords are managed entirely by Firebase and are never stored in our database. We use industry-standard security practices including server-side token verification, rate limiting, input validation, and security headers.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Access</strong> your data &mdash; export all your data from Settings</li>
            <li><strong>Delete</strong> your account &mdash; permanently remove all your data from Settings</li>
            <li><strong>Correct</strong> your information &mdash; update your profile at any time</li>
            <li><strong>Withdraw consent</strong> &mdash; revoke location access through your browser settings</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">6. Cookies &amp; Local Storage</h2>
          <p>We use browser local storage to persist your location preference and authentication session. We do not use third-party tracking cookies.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">7. Affiliate Disclosure</h2>
          <p>We may earn a commission when you click through to ticket provider sites and make a purchase. This does not affect the price you pay. Affiliate links are clearly associated with external ticket sites.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">8. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. Significant changes will be communicated through the app.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-900">9. Contact</h2>
          <p>If you have questions about this privacy policy or your data, please reach out through our support channels.</p>
        </section>
      </div>
    </div>
  )
}
