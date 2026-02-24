/**
 * Affiliate URL handling for click-through revenue.
 * Append partner/affiliate IDs to booking URLs so we earn commissions on referred sales.
 *
 * Join the affiliate programs to get your IDs:
 * - Ticketmaster: https://developer.ticketmaster.com/partners/distribution-partners/affiliate-sign-up/
 * - SeatGeek: Sign up via Impact (seatgeek.com partner program)
 *
 * Parameter names may vary by agreement—verify with each partner.
 */

export type AffiliateSource = 'ticketmaster' | 'seatgeek' | 'web'

/**
 * Append affiliate tracking parameters to a booking URL.
 * Returns the original URL if no affiliate ID is configured for the source.
 */
export function withAffiliateParams(
  url: string,
  source: AffiliateSource,
  affiliateIds: { ticketmaster?: string; seatgeek?: string }
): string {
  try {
    const u = new URL(url)

    switch (source) {
      case 'ticketmaster':
        if (affiliateIds.ticketmaster) {
          // Ticketmaster affiliate param (verify with your agreement)
          u.searchParams.set('affiliate', affiliateIds.ticketmaster)
          u.searchParams.set('utm_source', 'localevents')
          u.searchParams.set('utm_medium', 'affiliate')
        }
        break

      case 'seatgeek':
        if (affiliateIds.seatgeek) {
          // SeatGeek affiliate ID (common param; Impact may use different format)
          u.searchParams.set('aid', affiliateIds.seatgeek)
          u.searchParams.set('utm_source', 'localevents')
          u.searchParams.set('utm_medium', 'affiliate')
        }
        break

      case 'web':
        // Web-sourced events: add UTM for analytics; no affiliate (external sites)
        u.searchParams.set('utm_source', 'localevents')
        u.searchParams.set('utm_medium', 'referral')
        break
    }

    return u.toString()
  } catch {
    return url
  }
}
