import { motion, useReducedMotion } from 'motion/react';
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
 * The page's single action. Carries the only filled accent surface on the page,
 * so it wants weight: it lifts a little under the cursor and compresses under a
 * press, both on springs rather than a timed ease.
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
      {PRIMARY_CTA.label}
    </motion.a>
  );
}
