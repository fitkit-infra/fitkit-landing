import { motion, useReducedMotion } from 'motion/react';
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { REVEAL } from '../motion/springs';
import './ClosingCTA.css';

/**
 * One streak carried along the beam. `at` is where it starts as a fraction of
 * the beam's own length in from the right — the light travels right to left, so
 * that is the end they leave from — which keeps them spread along the line at
 * every size it is set at. The rest is deliberately uneven, because matching
 * lengths and delays read as a row leaving in formation rather than as light
 * travelling. The spread matches the hero button's, because this is the same
 * light: see CTAButton.
 */
interface Spark {
  at: number;
  /** Thickness, px. */
  size: number;
  /** Resting length, px. */
  length: number;
  /** Seconds. */
  delay: number;
  duration: number;
  /** Vertical wander over the run, px. */
  drift: number;
}

const SPARKS: Spark[] = [
  { at: 0.02, size: 2.5, length: 34, delay: 0, duration: 0.72, drift: -5 },
  { at: 0.12, size: 2, length: 22, delay: 0.12, duration: 0.9, drift: 4 },
  { at: 0.06, size: 3, length: 44, delay: 0.29, duration: 0.62, drift: 7 },
  { at: 0.18, size: 2, length: 26, delay: 0.4, duration: 0.84, drift: -3 },
  { at: 0.0, size: 2, length: 30, delay: 0.52, duration: 0.68, drift: 6 },
  { at: 0.1, size: 2.5, length: 38, delay: 0.66, duration: 0.76, drift: -6 },
  { at: 0.22, size: 2.5, length: 36, delay: 0.78, duration: 0.7, drift: 5 },
  { at: 0.04, size: 2, length: 24, delay: 0.92, duration: 0.86, drift: -6 },
  { at: 0.15, size: 3, length: 42, delay: 1.06, duration: 0.6, drift: -4 },
  { at: 0.08, size: 2, length: 28, delay: 1.18, duration: 0.8, drift: 6 },
  { at: 0.2, size: 2, length: 32, delay: 1.34, duration: 0.66, drift: 3 },
  { at: 0.0, size: 2.5, length: 40, delay: 1.46, duration: 0.74, drift: -5 },
];

interface ClosingCTAProps {
  /**
   * Driven by the story's last beat, where this line is a beat on the pinned
   * stage rather than a section under it — an element on that stage is always
   * inside the viewport, so it cannot be left to reveal itself. Omitted, it
   * reveals when it is scrolled to, which is what the reduced-motion page and
   * every other use of it want.
   */
  play?: boolean;
}

/**
 * The closing beat: one line, and one word in it to press.
 *
 * The button is gone. What is left is the sentence, with the verb carrying the
 * action — so the line has to do what the button did, and it does it with the
 * hero button's own light: a pink beam with white streaks running out along it,
 * at the button's own speed and brightness. The light is the hover state: it
 * arrives when the verb is pointed at, and it is the whole of the answer to
 * being pointed at, so the type itself is left alone.
 *
 * The beam is not the whole line. It runs from just past the F to the full stop
 * after "list" — the span of the sentence, not the span of the box — and it
 * travels right to left, arriving at the first word. Both ends are measured off
 * the set type rather than declared, because where the F ends and where the dot
 * sits are decided by the face, the size and the reader's screen.
 *
 * The viewport trigger sits on the wrapper, not on the line itself: the line
 * starts fully below its own clipping box, so its intersection rectangle is
 * empty and an observer watching it would never fire.
 */
export default function ClosingCTA({ play }: ClosingCTAProps) {
  const reduceMotion = useReducedMotion();
  const lineRef = useRef<HTMLHeadingElement>(null);
  const fRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const [beam, setBeam] = useState<{ left: number; width: number } | null>(null);
  const [lit, setLit] = useState(false);
  const [seen, setSeen] = useState(false);
  const shown = play ?? seen;

  const measure = useCallback(() => {
    const line = lineRef.current;
    const f = fRef.current;
    const dot = dotRef.current;
    if (!line || !f || !dot) return;

    const frame = line.getBoundingClientRect();
    // Shortly after the F, and out to the far side of the dot: the tail clears
    // the capital rather than starting under it.
    const left = f.getBoundingClientRect().right - frame.left + 3;
    const right = dot.getBoundingClientRect().right - frame.left + 2;

    setBeam((current) => {
      const next = { left: round(left), width: round(Math.max(0, right - left)) };
      return current && current.left === next.left && current.width === next.width
        ? current
        : next;
    });
  }, []);

  useLayoutEffect(() => {
    const line = lineRef.current;
    if (!line) return;

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(line);
    // Type set in a fallback face measures differently from type set in the
    // real one, and the swap lands after the first paint.
    document.fonts?.ready.then(measure);

    return () => observer.disconnect();
  }, [measure]);

  return (
    // The anchor is the runway's when this is a beat on the stage, because a
    // jump to the top of the story is not a jump to this line — see ScrollStory.
    <section className="closing" id={play === undefined ? 'list-your-brand' : undefined}>
      <motion.div
        className="closing__inner"
        initial={reduceMotion ? false : 'rest'}
        animate={reduceMotion ? undefined : shown ? 'shown' : 'rest'}
        onViewportEnter={() => setSeen(true)}
        viewport={{ once: true, amount: 0.55 }}
      >
        <h2 className={lit ? 'closing__line closing__line--lit' : 'closing__line'} ref={lineRef}>
          {/* Same clip-and-rise as the hero's headline lines. */}
          <span className="closing__clip">
            <motion.span
              className="closing__text"
              variants={{ rest: { y: '116%' }, shown: { y: '0%' } }}
              transition={REVEAL}
            >
              <span ref={fRef}>F</span>ive minutes to{' '}
              <a
                className="closing__list"
                href="#/for-indie-creators"
                onMouseEnter={() => setLit(true)}
                onMouseLeave={() => setLit(false)}
                onFocus={() => setLit(true)}
                onBlur={() => setLit(false)}
              >
                list
              </a>
              <span ref={dotRef}>.</span>
            </motion.span>
          </span>

          {/* Behind the type, blurred: light coming off the sentence rather
              than a rule drawn under it. */}
          {beam && !reduceMotion && (
            <span
              className="closing__beam"
              aria-hidden="true"
              style={
                {
                  left: beam.left,
                  width: beam.width,
                  // A streak overruns the beam and burns out past the end of
                  // it, the same way the button's do.
                  '--spark-distance': `${beam.width + 72}px`,
                } as CSSProperties
              }
            >
              {SPARKS.map((spark, i) => (
                <span
                  key={i}
                  className="closing__spark"
                  style={
                    {
                      '--at': `${spark.at * 100}%`,
                      '--size': `${spark.size}px`,
                      '--length': `${spark.length}px`,
                      '--delay': `${spark.delay}s`,
                      '--duration': `${spark.duration}s`,
                      '--drift': `${spark.drift}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </span>
          )}
        </h2>
      </motion.div>
    </section>
  );
}

/** Sub-pixel is noise here; a tenth of one is plenty. */
function round(value: number) {
  return Math.round(value * 10) / 10;
}
