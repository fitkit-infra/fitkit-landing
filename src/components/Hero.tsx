import { motion, useReducedMotion, type MotionValue } from 'motion/react';
import { useEffect, useState } from 'react';
import { REVEAL_LIGHT, STAGGER } from '../motion/springs';
import CTAButton from './CTAButton';
import ScrambleLabel from './ScrambleLabel';
import './Hero.css';

/** The headline, one entry per rendered line. Line breaks are set, not reflowed. */
const HEADLINE = ['where fashion brands get found', 'by the people already looking'];

/** What stands in each line's place until it resolves: the shape of the sentence
 *  in noise, spaces kept, so the phrase is already the right length. */
const NOISE = HEADLINE.map((line) => line.replace(/\S/g, '░'));

/** Milliseconds before the first line starts resolving, and between the lines. */
const FIRST = 120;
const APART = 190;

interface HeroProps {
  /**
   * The dissolve, handed down from the story that owns the scroll (see
   * ScrollStory): the copy drifts up slightly faster than the page and gives up
   * its opacity as the feed pulls itself into the middle of the screen behind
   * it. Omitted, the copy simply stands still — which is what the reduced
   * motion page wants.
   */
  y?: MotionValue<number>;
  opacity?: MotionValue<number>;
}

/**
 * Hero: the headline, and the one action on the page.
 *
 * The headline is not revealed, it is resolved. Each line stands there as noise
 * and settles into type through the same character dissolve the story uses on
 * the outfit's chosen piece — the page's one visual idea, said first here and
 * paid off later. The lines resolve a beat apart, so the sentence lands in the
 * order it is read.
 *
 * On scroll the whole block dissolves — scroll-linked, not scroll-triggered,
 * and driven from outside so the fade is one beat of a longer sequence rather
 * than a rule of its own.
 */
export default function Hero({ y, opacity }: HeroProps) {
  const reduceMotion = useReducedMotion();
  // How many lines have been let go. Under reduced motion the type is simply
  // set, with no noise for it to come out of.
  const [started, setStarted] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = HEADLINE.map((_, i) =>
      setTimeout(() => setStarted((n) => Math.max(n, i + 1)), FIRST + i * APART)
    );
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  return (
    <section className="hero">
      <motion.div className="hero__copy" style={reduceMotion ? undefined : { y, opacity }}>
        {/* The sentence is on the heading itself: what is inside it is a
            dissolve in progress for the first second of the page's life. */}
        <h1 className="hero__headline" aria-label={HEADLINE.join(' ')}>
          {HEADLINE.map((line, i) => (
            <span className="hero__line" key={line}>
              {reduceMotion ? (
                <span className="hero__line-inner">{line}</span>
              ) : (
                // The noise glyphs are wider than the letters they stand in for,
                // so the set line is left in place to hold the box open and the
                // dissolve is laid over it. Without that the whole centred
                // headline shifts sideways for as long as it is churning.
                <span className="hero__line-inner hero__line-inner--set">
                  <span className="hero__line-ghost" aria-hidden="true">
                    {line}
                  </span>
                  <ScrambleLabel from={NOISE[i]} to={line} active={i < started} />
                </span>
              )}
            </span>
          ))}
        </h1>

        <motion.div
          className="hero__action"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...REVEAL_LIGHT, delay: 0.08 + HEADLINE.length * STAGGER + 0.12 }}
        >
          {/* Sends the reader into the creators page: from the top of the page
              the question is what listing involves, not where the form is. */}
          <CTAButton href="#/for-indie-creators" />
        </motion.div>
      </motion.div>
    </section>
  );
}
