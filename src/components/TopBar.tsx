import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { useState } from 'react';
import { NAV_LINKS } from '../data/nav';
import { REVEAL_LIGHT } from '../motion/springs';
import './TopBar.css';

/** How far the page has to move before the bar earns its backdrop. */
const LIFT_AT = 24;

/**
 * Sticky top bar: Fitkit mark + wordmark on the left, the nav config on the
 * right. It sits on bare paper over the hero and only picks up a blurred
 * backdrop and a hairline once the page has scrolled under it, so there is no
 * border cutting across the hero at rest.
 */
export default function TopBar() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const [lifted, setLifted] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => setLifted(y > LIFT_AT));

  return (
    <motion.header
      className={`topbar${lifted ? ' topbar--lifted' : ''}`}
      initial={reduceMotion ? false : { opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={REVEAL_LIGHT}
    >
      <div className="topbar__inner shell">
        <a className="topbar__brand" href="/" aria-label="Fitkit — home">
          {/* The app ships this mark in white for its black canvas; the landing
              page carries the ink-on-transparent cut of the same art. */}
          <img className="topbar__logo" src="/logo-mark.png" alt="" width={34} height={34} />
          {/* Serif wordmark, matching the app's titlebar. The face sits high in
              its line box, so the baseline is nudged down onto the logo's. */}
          <span className="topbar__wordmark">Fitkit</span>
        </a>

        <nav className="topbar__nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              className={`topbar__link${link.compact === false ? ' topbar__link--wide-only' : ''}`}
              href={link.href}
            >
              {link.label}
              <span className="topbar__underline" aria-hidden="true" />
            </a>
          ))}
        </nav>
      </div>
    </motion.header>
  );
}
