import { motion, useReducedMotion } from 'motion/react';
import { STEPS } from '../data/steps';
import { REVEAL, REVEAL_LIGHT, STAGGER } from '../motion/springs';
import StepIcon from './StepIcon';
import './HowItWorks.css';

/** Stagger inside a step. The steps themselves are triggered one at a time by
 *  their own position on screen, so this only spaces a step's own parts. */
const PART = STAGGER * 0.7;

/**
 * How it works: a top-to-bottom roadmap, centred as a block. Each step heads
 * with its icon and title on one line, and the copy below runs from the icon's
 * own left edge; a hairline drops between steps to tie the four into one route.
 *
 * The reveal is the hero's move at a smaller weight: the pill arrives, then the
 * type rises behind it. The step's `li` owns the viewport trigger and the parts
 * inherit it as variants — a part must not set its own `initial`, or it opts
 * out of that inheritance and never animates.
 */
export default function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="how shell" id="how-it-works">
      <motion.h2
        className="how__title"
        initial={reduceMotion ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={REVEAL}
      >
        How it works
      </motion.h2>

      <ol className="how__steps">
        {STEPS.map((step) => (
          <motion.li
            className="how__step"
            key={step.title}
            initial={reduceMotion ? false : 'rest'}
            whileInView="shown"
            viewport={{ once: true, amount: 0.55 }}
          >
            <div className="how__head">
              <motion.span
                className="how__pill"
                variants={{ rest: { opacity: 0, scale: 0.86 }, shown: { opacity: 1, scale: 1 } }}
                transition={REVEAL}
              >
                <StepIcon name={step.icon} />
              </motion.span>

              <motion.h3
                className="how__step-title"
                variants={{ rest: { opacity: 0, y: 18 }, shown: { opacity: 1, y: 0 } }}
                transition={{ ...REVEAL, delay: PART }}
              >
                {step.title}
              </motion.h3>
            </div>

            <motion.p
              className="how__body"
              variants={{ rest: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
              transition={{ ...REVEAL_LIGHT, delay: PART * 2 }}
            >
              {step.body}
            </motion.p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
