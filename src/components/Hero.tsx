import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
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
  const headlineRef = useRef<HTMLHeadingElement>(null);

  // The top bar aligns to the headline's text, not to the page gutters, so the
  // widest set line's width is published as --headline-width for it to read.
  // The line boxes are inline-block, so their measured width is the text's; the
  // reveal only ever translates them, which leaves that width untouched.
  useEffect(() => {
    const headline = headlineRef.current;
    if (!headline) return;

    const lines = [...headline.querySelectorAll<HTMLElement>('.hero__line-inner')];
    const measure = () => {
      const widest = lines.reduce((max, line) => Math.max(max, line.getBoundingClientRect().width), 0);
      if (widest > 0) {
        document.documentElement.style.setProperty('--headline-width', `${Math.round(widest)}px`);
      }
    };

    // Observing the lines rather than the heading: above the copy's max width
    // the heading's box stops growing while the type inside it keeps scaling.
    const observer = new ResizeObserver(measure);
    lines.forEach((line) => observer.observe(line));
    measure();
    // Fraunces arrives after first paint and is wider than the fallback serif.
    document.fonts?.ready.then(measure).catch(() => {});

    return () => observer.disconnect();
  }, []);

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
        <h1 className="hero__headline" ref={headlineRef}>
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
          {/* Sends the reader into the roadmap: from the top of the page the
              question is what listing involves, not where the form is. */}
          <CTAButton href="#how-it-works" />
        </motion.div>
      </motion.div>
    </section>
  );
}
