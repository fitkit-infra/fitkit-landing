import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { REVEAL, REVEAL_LIGHT, STAGGER } from '../motion/springs';
import CTAButton from './CTAButton';
import './Hero.css';

/** The headline, one entry per rendered line. Line breaks are set, not reflowed. */
const HEADLINE = ['where fashion brands get found', 'by the people already looking'];

/**
 * Hero: the headline, and the one action on the page.
 *
 * Two motions, both deliberate. On load each line rises out of its own clipping
 * box on a heavy spring, so the type reads as being set rather than faded in.
 * On scroll the whole block drifts up slightly faster than the page and gives
 * up its opacity — the copy dissolves as the imagery below rises into it.
 */
export default function Hero() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();

  // Scroll-linked, not scroll-triggered: the copy is tied to the scroll
  // position through the first screen, then it is gone.
  const dissolveY = useTransform(scrollY, [0, 620], [0, -78]);
  const dissolveOpacity = useTransform(scrollY, [0, 420], [1, 0]);

  return (
    <section className="hero">
      <motion.div
        className="hero__copy"
        style={reduceMotion ? undefined : { y: dissolveY, opacity: dissolveOpacity }}
      >
        <h1 className="hero__headline">
          {HEADLINE.map((line, i) => (
            // Each line clips its own reveal; the box is padded and pulled back
            // by the same amount so descenders are never cut off.
            <span className="hero__line" key={line}>
              <motion.span
                className="hero__line-inner"
                initial={reduceMotion ? false : { y: '116%' }}
                animate={{ y: '0%' }}
                transition={{ ...REVEAL, delay: 0.08 + i * STAGGER }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.div
          className="hero__action"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...REVEAL_LIGHT, delay: 0.08 + HEADLINE.length * STAGGER + 0.12 }}
        >
          <CTAButton />
        </motion.div>
      </motion.div>
    </section>
  );
}
