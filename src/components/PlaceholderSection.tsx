import './PlaceholderSection.css';

interface PlaceholderSectionProps {
  id: string;
  /** Shown in dev only, as a reminder of what lands here. */
  label: string;
}

/**
 * A scaffolded, empty section below the fold.
 *
 * Copy for these arrives in a follow-up brief, so nothing is invented here: in
 * a production build they render as plain spacing, and the dev build outlines
 * them so the page structure is visible while it is still empty.
 */
export default function PlaceholderSection({ id, label }: PlaceholderSectionProps) {
  return (
    <section className="placeholder" id={id}>
      {import.meta.env.DEV && <span className="placeholder__label">{label}</span>}
    </section>
  );
}
