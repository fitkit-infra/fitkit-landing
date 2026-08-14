import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { useState } from 'react';
import { NAV_LINKS } from '../data/nav';
import { routeFor, type Route } from '../hooks/useRoute';
import { useTheme } from '../hooks/useTheme';
import { REVEAL_LIGHT } from '../motion/springs';
import './TopBar.css';

/** How far the page has to move before the bar earns its backdrop. */
const LIFT_AT = 24;

interface TopBarProps {
  /** The page currently open, so its link can be marked as the current one. */
  route: Route;
}

/**
 * Sticky top bar: Fitkit mark + wordmark on the left, the nav config on the
 * right. It sits on bare paper over the hero and only picks up a blurred
 * backdrop and a hairline once the page has scrolled under it, so there is no
 * border cutting across the hero at rest.
 *
 * A nav link that names a page of its own holds the hover rule out while that
 * page is open — the underline is already the bar's one piece of state, so the
 * current page borrows it rather than introducing a second mark.
 */
export default function TopBar({ route }: TopBarProps) {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [lifted, setLifted] = useState(false);
  const [theme, toggleTheme] = useTheme();

  useMotionValueEvent(scrollY, 'change', (y) => setLifted(y > LIFT_AT));

  return (
    <motion.header
      className={`topbar${lifted ? ' topbar--lifted' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={REVEAL_LIGHT}
    >
      {/* Width is the hero headline's measured width (see Hero), so the mark
          sits directly over the headline's first letter and the last nav item
          ends on its last. */}
      <div className="topbar__inner">
        <a className="topbar__brand" href="/" aria-label="Fitkit — home">
          {/* The app ships this mark in white for its black canvas; the landing
              page carries the ink-on-transparent cut of the same art. */}
          <img className="topbar__logo" src="/logo-mark.png" alt="" width={34} height={34} />
          {/* Serif wordmark, matching the app's titlebar. The face sits high in
              its line box, so the baseline is nudged down onto the logo's. */}
          <span className="topbar__wordmark">Fitkit</span>
        </a>

        <nav className="topbar__nav" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const current = link.href.startsWith('#/') && routeFor(link.href) === route;

            return (
              <a
                key={link.label}
                className={[
                  'topbar__link',
                  link.compact === false ? 'topbar__link--wide-only' : '',
                  current ? 'topbar__link--current' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                href={link.href}
                aria-current={current ? 'page' : undefined}
              >
                {link.label}
                <span className="topbar__underline" aria-hidden="true" />
              </a>
            );
          })}

          {/* Last item on the bar, and the only control among the links: same
              type and hover rule, with the glyph carrying the state. */}
          <button
            type="button"
            className="topbar__link topbar__theme"
            onClick={toggleTheme}
            aria-pressed={theme === 'dark'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            Theme
            <ThemeGlyph dark={theme === 'dark'} />
            <span className="topbar__underline" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </motion.header>
  );
}

/**
 * The Theme button's glyph: sun and moon stacked, one turned in as the other
 * turns out on the page's own spring. A swap rather than a fade — at 15px a
 * crossfade alone just reads as a smudge.
 *
 * Drawn here rather than pulled from HeroUI: HeroUI v3 ships filled 16px UI
 * glyphs (chevrons, plus, close, status) and no sun or moon, so these follow
 * that spec instead — 16 box, currentColor fill, no stroke.
 */
function ThemeGlyph({ dark }: { dark: boolean }) {
  const spin = (shown: boolean) => ({
    opacity: shown ? 1 : 0,
    scale: shown ? 1 : 0.5,
    rotate: shown ? 0 : -70,
  });

  return (
    <span className="topbar__glyph" aria-hidden="true">
      <motion.svg viewBox="0 0 16 16" animate={spin(!dark)} transition={REVEAL_LIGHT} initial={false}>
        <path d="M8 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6M8 .9a.7.7 0 0 1 .7.7v1.3a.7.7 0 0 1-1.4 0V1.6A.7.7 0 0 1 8 .9m0 11.5a.7.7 0 0 1 .7.7v1.3a.7.7 0 0 1-1.4 0v-1.3a.7.7 0 0 1 .7-.7M15.1 8a.7.7 0 0 1-.7.7h-1.3a.7.7 0 0 1 0-1.4h1.3a.7.7 0 0 1 .7.7M3.6 8a.7.7 0 0 1-.7.7H1.6a.7.7 0 0 1 0-1.4h1.3a.7.7 0 0 1 .7.7m9.4-5a.7.7 0 0 1 0 1l-.9.9a.7.7 0 1 1-1-1l.9-.9a.7.7 0 0 1 1 0M4.9 11.1a.7.7 0 0 1 0 1l-.9.9a.7.7 0 1 1-1-1l.9-.9a.7.7 0 0 1 1 0m8.1 1.9a.7.7 0 0 1-1 0l-.9-.9a.7.7 0 1 1 1-1l.9.9a.7.7 0 0 1 0 1M4.9 4.9a.7.7 0 0 1-1 0L3 4a.7.7 0 0 1 1-1l.9.9a.7.7 0 0 1 0 1" />
      </motion.svg>
      <motion.svg viewBox="0 0 16 16" animate={spin(dark)} transition={REVEAL_LIGHT} initial={false}>
        <path d="M13.8 10.1a6 6 0 0 1-7.9-7.9.7.7 0 0 0-.9-.9 6.9 6.9 0 1 0 9.7 9.7.7.7 0 0 0-.9-.9" />
      </motion.svg>
    </span>
  );
}
