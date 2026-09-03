import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties } from 'react';
import { PRIMARY_CTA } from '../data/nav';
import { HOVER, PRESS } from '../motion/springs';
import './CTAButton.css';

interface CTAButtonProps {
  /** Rendered at hero scale by default; `small` is for the closing section. */
  size?: 'hero' | 'small';
  /**
   * Where this instance lands. Defaults to the sign-up anchor; the hero's copy
   * sends the reader into the roadmap first instead, which is the same single
   * action seen from higher up the page — not a second one.
   */
  href?: string;
}

/**
 * One streak carried out along a beam.
 *
 * `y` is a percentage of the button's height, so the sparks stay spread across
 * the face at every size the button is drawn at. `length` is the streak at
 * rest — it stretches further as it accelerates away. The rest is deliberately
 * uneven: matching lengths, durations and delays would read as a row leaving in
 * formation rather than as light coming off a surface.
 */
interface Spark {
  side: 'left' | 'right';
  y: number;
  /** Thickness of the streak, in pixels. */
  size: number;
  /** Resting length of the streak, in pixels. */
  length: number;
  /** Seconds. */
  delay: number;
  duration: number;
  /** Vertical wander over the streak's run, in pixels. */
  drift: number;
}

const SPARKS: Spark[] = [
  { side: 'left', y: 30, size: 2.5, length: 34, delay: 0, duration: 0.72, drift: -5 },
  { side: 'left', y: 58, size: 2, length: 22, delay: 0.29, duration: 0.9, drift: 4 },
  { side: 'left', y: 44, size: 3, length: 44, delay: 0.52, duration: 0.62, drift: 7 },
  { side: 'left', y: 72, size: 2, length: 26, delay: 0.78, duration: 0.84, drift: -3 },
  { side: 'left', y: 22, size: 2, length: 30, delay: 1.06, duration: 0.68, drift: 6 },
  { side: 'left', y: 64, size: 2.5, length: 38, delay: 1.34, duration: 0.76, drift: -6 },
  { side: 'right', y: 38, size: 2.5, length: 36, delay: 0.12, duration: 0.7, drift: 5 },
  { side: 'right', y: 66, size: 2, length: 24, delay: 0.4, duration: 0.86, drift: -6 },
  { side: 'right', y: 26, size: 3, length: 42, delay: 0.66, duration: 0.6, drift: -4 },
  { side: 'right', y: 54, size: 2, length: 28, delay: 0.92, duration: 0.8, drift: 6 },
  { side: 'right', y: 76, size: 2, length: 32, delay: 1.18, duration: 0.66, drift: 3 },
  { side: 'right', y: 46, size: 2.5, length: 40, delay: 1.46, duration: 0.74, drift: -5 },
];

/**
 * The brand's action. Carries the page's one filled accent surface, so it wants
 * weight: a squircle with a lit top edge and a soft accent halo under it, an
 * arrow that steps forward under the cursor, and — on hover — two surging beams
 * of pink light that begin inside the face and carry it out of both sides, with
 * white streaks running out along them. It lifts under the cursor and compresses under a press, both on
 * springs rather than a timed ease.
 */
export default function CTAButton({ size = 'hero', href = PRIMARY_CTA.href }: CTAButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      className={`cta cta--${size}`}
      href={href}
      whileHover={reduceMotion ? undefined : { scale: 1.028, y: -2, transition: HOVER }}
      whileTap={reduceMotion ? undefined : { scale: 0.972, y: 0, transition: PRESS }}
    >
      <span className="cta__label">{PRIMARY_CTA.label}</span>
      <svg className="cta__arrow" viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M2.5 8h10M9 4.5 12.5 8 9 11.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Absolutely positioned, so none of these join the flex row. */}
      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className={`cta__spark cta__spark--${spark.side}`}
          aria-hidden="true"
          style={
            {
              '--y': `${spark.y}%`,
              '--size': `${spark.size}px`,
              '--length': `${spark.length}px`,
              '--delay': `${spark.delay}s`,
              '--duration': `${spark.duration}s`,
              '--drift': `${spark.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </motion.a>
  );
}
