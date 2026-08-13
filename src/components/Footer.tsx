import { motion, useReducedMotion } from 'motion/react';
import { REVEAL_LIGHT } from '../motion/springs';
import './Footer.css';

/**
 * Two rows: the copyright sits left, centred across the pair, and the name plus
 * its line sit in the middle, one to a row. All of it is the same small grotesk
 * — the footer is a colophon, not another place to say the brand loudly.
 *
 * It arrives as one piece rather than per-item — nothing here is a beat, and a
 * stagger this far down the page would read as the section wanting attention.
 */
export default function Footer() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.footer
      className="footer"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={REVEAL_LIGHT}
    >
      <div className="footer__inner shell">
        <p className="footer__copyright">© 2026</p>

        <div className="footer__identity">
          <span>Fitkit</span>
          <span>the next generation of e-commerce</span>
        </div>
      </div>
    </motion.footer>
  );
}
