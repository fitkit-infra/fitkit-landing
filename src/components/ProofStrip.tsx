import {
  motion,
  useAnimationFrame,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FEED_IMAGES, type FeedImage } from '../data/feed';
import { useColumnCount } from '../hooks/useColumnCount';
import { REVEAL, SCROLL_SMOOTH } from '../motion/springs';
import FeedCard from './FeedCard';
import { packColumns } from './masonry';
import './ProofStrip.css';

/** Cards per column before the loop repeats. Enough that one copy is always
 *  taller than the band, which is what makes the wrap invisible. */
const ITEMS_PER_COLUMN = 5;

/** Resting drift, px/s per column. Slow, and never the same in two neighbours —
 *  identical speeds read as one sliding sheet instead of a feed. */
const COLUMN_SPEEDS = [21, 29, 24, 33, 19, 27];

/** How much of the page's scroll velocity feeds into the drift. */
const VELOCITY_COUPLING = 0.16;
/** Ceiling on that contribution, px/s, so a flung scroll never turns into a blur. */
const MAX_VELOCITY_BOOST = 820;

/**
 * The proof strip: a masonry grid of real outfit imagery that drifts upward on
 * its own, forever.
 *
 * Three things move here, and they are meant to be felt rather than noticed:
 * the columns drift at their own speeds; the whole grid parallaxes against the
 * page; and the drift is coupled to scroll velocity through a heavily damped
 * spring, so throwing the page down pushes the feed along with it and it eases
 * back to its resting speed afterwards.
 *
 * The top edge is masked to nothing, so the imagery dissolves into the hero's
 * paper instead of butting against it.
 */
export default function ProofStrip() {
  const reduceMotion = useReducedMotion();
  const bandRef = useRef<HTMLElement>(null);
  const slotCount = useColumnCount();

  // The outermost slot on each side is left empty, so the grid stops short of
  // the screen edges without any of the remaining columns moving: the slots are
  // still laid out full-bleed and at the same width, the outer two just hold
  // nothing. Below five slots there are not two columns to spare.
  const edgeSlots = slotCount >= 5 ? 1 : 0;
  const filledCount = slotCount - edgeSlots * 2;

  const columns = useMemo(
    () => packColumns(FEED_IMAGES, filledCount, ITEMS_PER_COLUMN),
    [filledCount]
  );

  // Page scroll drives both the parallax and the velocity coupling.
  const { scrollY } = useScroll();
  const { scrollYProgress } = useScroll({
    target: bandRef,
    offset: ['start end', 'end start'],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-72, 72]);
  const rawVelocity = useVelocity(scrollY);
  const velocity = useSpring(rawVelocity, SCROLL_SMOOTH);

  // Off-screen the drift stops entirely: no transforms, no compositing work.
  const visible = useInView(bandRef);
  const running = visible && !reduceMotion;

  return (
    <section className="proof" ref={bandRef} aria-hidden="true">
      <motion.div className="proof__parallax" style={reduceMotion ? undefined : { y: parallaxY }}>
        <div className="proof__columns">
          {Array.from({ length: slotCount }, (_, slot) => {
            const columnIndex = slot - edgeSlots;
            const items = columns[columnIndex];

            if (!items) {
              return <div className="proof__column" key={`${slotCount}-empty-${slot}`} />;
            }

            return (
              <motion.div
                className="proof__column"
                key={`${slotCount}-${slot}`}
                // Columns rise into place from below, left to right, so the
                // grid assembles rather than appearing.
                initial={reduceMotion ? false : { opacity: 0, y: 46 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...REVEAL, delay: 0.12 + columnIndex * 0.055 }}
              >
                <DriftColumn
                  items={items}
                  speed={COLUMN_SPEEDS[columnIndex % COLUMN_SPEEDS.length]}
                  velocity={velocity}
                  running={running}
                />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

interface DriftColumnProps {
  items: FeedImage[];
  speed: number;
  velocity: MotionValue<number>;
  running: boolean;
}

/**
 * One infinitely looping column.
 *
 * The track holds two identical copies of the column and is translated upward;
 * the moment it has travelled one copy's height it jumps back by exactly that
 * height, which lands on a pixel-identical frame. Card spacing is padding
 * inside each card box rather than a flex gap, so a copy's measured height
 * already includes the spacing that follows it and the seam is seamless.
 */
function DriftColumn({ items, speed, velocity, running }: DriftColumnProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const copyHeight = useRef(0);
  const offset = useRef(0);

  // Measured rather than computed: images, gutters and rounding all land in
  // here, and the loop is only invisible if the jump matches the copy's height
  // exactly. Sub-pixel exactly — `offsetHeight` rounds to whole pixels, and
  // half a pixel of error is half a pixel of judder on every wrap.
  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    const measure = () => {
      copyHeight.current = copy.getBoundingClientRect().height;
    };
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    measure();
    return () => observer.disconnect();
  }, [items]);

  useAnimationFrame((_, delta) => {
    const track = trackRef.current;
    const height = copyHeight.current;
    if (!running || !track || height === 0) return;

    // Clamped: a backgrounded tab hands back one enormous delta on return, and
    // an unclamped one would teleport the column.
    const seconds = Math.min(delta, 48) / 1000;
    const boost = clamp(velocity.get() * VELOCITY_COUPLING, -MAX_VELOCITY_BOOST, MAX_VELOCITY_BOOST);

    let next = offset.current - (speed + boost) * seconds;
    if (next <= -height) next += height;
    else if (next > 0) next -= height;

    offset.current = next;
    track.style.transform = `translate3d(0, ${next.toFixed(2)}px, 0)`;
  });

  return (
    <div className="proof__track" ref={trackRef}>
      <div className="proof__copy" ref={copyRef}>
        {items.map((image, i) => (
          <FeedCard key={`a-${i}`} image={image} />
        ))}
      </div>
      {/* Second copy — what the viewport is looking at for half of every loop. */}
      <div className="proof__copy" aria-hidden="true">
        {items.map((image, i) => (
          <FeedCard key={`b-${i}`} image={image} />
        ))}
      </div>
    </div>
  );
}

/** True while any part of `ref` is on screen. */
function useInView(ref: React.RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: '120px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
