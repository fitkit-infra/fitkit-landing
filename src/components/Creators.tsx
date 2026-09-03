import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { REVEAL, REVEAL_LIGHT } from '../motion/springs';
import ClosingCTA from './ClosingCTA';
import HowItWorks from './HowItWorks';
import './Creators.css';

/**
 * The page for the people who list: what Fitkit is from a brand's side, and the
 * four steps of getting on it. Reached at `#/for-indie-creators` from the top
 * bar — the how-it-works run lives here rather than on the landing page, which
 * now answers the shopper's question instead.
 *
 * The frame is the roadmap page's: title set out of a clipping box, the run
 * under it, then the action. HowItWorks is rendered unchanged; only
 * its opening air is trimmed here, since on this page it follows a header
 * rather than the hero's dissolving imagery.
 */
export default function Creators() {
  const reduceMotion = useReducedMotion();

  // One document, several pages: the title belongs to whichever is on screen.
  useEffect(() => {
    const previous = document.title;
    document.title = 'For indie creators — Fitkit';

    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="creators">
      <motion.header
        className="creators__head shell"
        initial={reduceMotion ? false : 'rest'}
        animate="shown"
      >
        <h1 className="creators__title">
          <span className="creators__title-clip">
            <motion.span
              className="creators__title-inner"
              variants={{ rest: { y: '116%' }, shown: { y: '0%' } }}
              transition={REVEAL}
            >
              For indie creators
            </motion.span>
          </span>
        </h1>
      </motion.header>

      <HowItWorks />

      <ClosingCTA />

      <motion.div
        className="creators__foot shell"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={REVEAL_LIGHT}
      >
        <a className="creators__back" href="#/">
          <ArrowLeft size={15} strokeWidth={1.6} absoluteStrokeWidth aria-hidden="true" />
          Back to the homepage
        </a>
      </motion.div>
    </main>
  );
}
