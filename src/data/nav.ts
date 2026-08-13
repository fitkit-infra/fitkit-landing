/**
 * Top-bar navigation and the page's single call to action.
 *
 * Links live here as data so the bar grows with the business identity — add an
 * entry and it renders, on desktop and mobile alike. `compact: false` drops a
 * link from the collapsed mobile bar, which is how the bar stays legible once
 * this list is longer than a couple of items.
 */
export interface NavLink {
  label: string;
  href: string;
  /** Keep this link visible in the collapsed mobile bar. Defaults to true. */
  compact?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { label: 'Blog', href: '#blog' },
  { label: 'For indie creators', href: '#for-indie-creators', compact: false },
  { label: 'Policies', href: '#policies' },
];

/**
 * The only action on the page. Deliberately singular — there is no secondary
 * CTA in this version, in the hero or anywhere else.
 */
export const PRIMARY_CTA = {
  label: 'List your brand',
  href: '#list-your-brand',
};
