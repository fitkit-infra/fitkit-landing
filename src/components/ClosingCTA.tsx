import { motion, useReducedMotion } from 'motion/react';
import { REVEAL, REVEAL_LIGHT } from '../motion/springs';
import CTAButton from './CTAButton';
import './ClosingCTA.css';

/**
 * The closing beat: one line, one button, and a lot of air either side of it.
 *
 * Same action as the hero's — the page has exactly one — so it repeats the
 * hero's arrival too: the line rises out of a clipping box on the heavy spring,
 * the button follows.
 *
 * The viewport trigger sits on the wrapper, not on the line itself. The line
 * starts fully below its own clipping box, so its intersection rectangle is
 * empty and an observer watching it would never fire — it would sit parked out
 * of frame forever. The wrapper is unclipped, and both reveals hang off it.
 */
export default function ClosingCTA() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="closing" id="list-your-brand">
      <motion.div
        className="closing__inner"
        initial={reduceMotion ? false : 'rest'}
        whileInView="shown"
        viewport={{ once: true, amount: 0.55 }}
      >
        <h2 className="closing__line">
          <span className="closing__line-clip">
            <motion.span
              className="closing__line-inner"
              variants={{ rest: { y: '116%' }, shown: { y: '0%' } }}
              transition={REVEAL}
            >
              Free. No commitment. Five minutes to list.
            </motion.span>
          </span>
        </h2>

        <motion.div
          className="closing__action"
          variants={{ rest: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
          transition={{ ...REVEAL_LIGHT, delay: 0.14 }}
        >
          <CTAButton size="small" />
        </motion.div>
      </motion.div>
    </section>
  );
}
