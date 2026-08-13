import type { Transition } from 'motion/react';

/**
 * Every transition on this page is a spring. Nothing here uses a duration or a
 * named easing curve: the page should settle the way physical things do, and a
 * shared set of springs is what keeps that consistent between a headline
 * reveal, a button press and the strip's scroll coupling.
 *
 * Read them as a family — same damping character, different weights:
 * heavier things (headlines, whole sections) arrive slower and settle longer.
 */

/** Large type and whole sections arriving on load. Slow, weighty, no overshoot. */
export const REVEAL: Transition = {
  type: 'spring',
  stiffness: 82,
  damping: 20,
  mass: 1.15,
};

/** Secondary elements following a reveal — a touch quicker so they don't drag. */
export const REVEAL_LIGHT: Transition = {
  type: 'spring',
  stiffness: 110,
  damping: 22,
  mass: 0.9,
};

/** Hover states. Fast enough to feel attached to the cursor, still a spring. */
export const HOVER: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 26,
  mass: 0.6,
};

/** Press. Stiffer and more damped than hover — a press should feel solid. */
export const PRESS: Transition = {
  type: 'spring',
  stiffness: 620,
  damping: 34,
  mass: 0.6,
};

/** Scroll-linked values (parallax, velocity coupling). Heavily damped so scroll
 *  never reads as springy — the spring is only there to smooth the input. */
export const SCROLL_SMOOTH = {
  stiffness: 90,
  damping: 34,
  mass: 0.55,
} as const;

/** Stagger between sibling reveals, in seconds. */
export const STAGGER = 0.09;
