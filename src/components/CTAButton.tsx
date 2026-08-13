import { motion, useReducedMotion } from 'motion/react';
import { PRIMARY_CTA } from '../data/nav';
import { HOVER, PRESS } from '../motion/springs';
import './CTAButton.css';

interface CTAButtonProps {
  /** Rendered at hero scale by default; `small` is for the closing section. */
  size?: 'hero' | 'small';
}

/**
 * The page's single action. Carries the only filled accent surface on the page,
 * so it wants weight: it lifts a little under the cursor and compresses under a
 * press, both on springs rather than a timed ease.
 */
export default function CTAButton({ size = 'hero' }: CTAButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      className={`cta cta--${size}`}
      href={PRIMARY_CTA.href}
      whileHover={reduceMotion ? undefined : { scale: 1.028, y: -2, transition: HOVER }}
      whileTap={reduceMotion ? undefined : { scale: 0.972, y: 0, transition: PRESS }}
    >
      {PRIMARY_CTA.label}
    </motion.a>
  );
}
