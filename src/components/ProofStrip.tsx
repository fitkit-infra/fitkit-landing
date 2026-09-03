import {
  motion,
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
import { useSplitLayout } from '../hooks/useSplitLayout';
import { REVEAL, SCROLL_SMOOTH } from '../motion/springs';
import DriftColumn from './DriftColumn';
import { packColumns } from './masonry';
import './ProofStrip.css';

/** Cards per column before the loop repeats. Enough that one copy is always
 *  taller than the band, which is what makes the wrap invisible. */
const ITEMS_PER_COLUMN = 5;

/** Resting drift, px/s per column. Slow, and never the same in two neighbours —
 *  identical speeds read as one sliding sheet instead of a feed. */
const COLUMN_SPEEDS = [21, 29, 24, 33, 19, 27];

/** Columns per edge panel in the split layout, and so four in total — the same
 *  count the full-bleed band fills on a desktop, dealt out two a side. */
const COLUMNS_PER_PANEL = 2;

/**
 * The proof strip: real outfit imagery in a masonry grid that drifts upward on
 * its own, forever.
 *
 * It has two layouts. Wide enough (see useSplitLayout) it is two panels of two
 * columns each, pinned to the left and right screen edges and tilted towards
 * the reader like the wings of a curved screen, with the hero's copy standing
 * in the gap between them. Narrower, there is no gap to stand anything in, so
 * it falls back to one full-bleed band that the copy sits above.
 *
 * Three things move here, and they are meant to be felt rather than noticed:
 * the columns drift at their own speeds; the grid parallaxes against the page;
 * and the drift is coupled to scroll velocity through a heavily damped spring,
 * so throwing the page down pushes the feed along with it and it eases back to
 * its resting speed afterwards.
 *
 * The edges are scrimmed to paper, so the imagery dissolves into the page
 * instead of butting against it.
 */
export default function ProofStrip() {
  const reduceMotion = useReducedMotion();
  const bandRef = useRef<HTMLElement>(null);
  const split = useSplitLayout();
  const slotCount = useColumnCount();

  // Full-bleed band only: the outermost slot on each side is left empty, so the
  // grid stops short of the screen edges without any of the remaining columns
  // moving — the slots are still laid out full-bleed and at the same width, the
  // outer two just hold nothing. Below five slots there are not two to spare.
  const edgeSlots = slotCount >= 5 ? 1 : 0;
  const filledCount = split ? COLUMNS_PER_PANEL * 2 : slotCount - edgeSlots * 2;

  // Packed across every filled column at once in both layouts, so the two edge
  // panels are dealt from one shortest-column pass rather than repeating each
  // other's pictures.
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
    <section
      className={split ? 'proof proof--split' : 'proof'}
      ref={bandRef}
      aria-hidden="true"
    >
      {split ? (
        // Both panels are children of the same perspective, so they share one
        // vanishing point and the two tilts read as one curve around the copy.
        (['left', 'right'] as const).map((side, panel) => (
          <div className={`proof__panel proof__panel--${side}`} key={side}>
            <motion.div
              className="proof__parallax"
              style={reduceMotion ? undefined : { y: parallaxY }}
            >
              <div className="proof__columns">
                {columns
                  .slice(panel * COLUMNS_PER_PANEL, (panel + 1) * COLUMNS_PER_PANEL)
                  .map((items, i) => {
                    const columnIndex = panel * COLUMNS_PER_PANEL + i;
                    return (
                      <Column
                        key={`${side}-${i}`}
                        items={items}
                        index={columnIndex}
                        // Outer column first on each side, so both panels
                        // assemble inwards towards the copy.
                        delayStep={side === 'left' ? COLUMNS_PER_PANEL - 1 - i : i}
                        velocity={velocity}
                        running={running}
                        reduceMotion={!!reduceMotion}
                      />
                    );
                  })}
              </div>
            </motion.div>
          </div>
        ))
      ) : (
        <motion.div className="proof__parallax" style={reduceMotion ? undefined : { y: parallaxY }}>
          <div className="proof__columns">
            {Array.from({ length: slotCount }, (_, slot) => {
              const columnIndex = slot - edgeSlots;
              const items = columns[columnIndex];

              if (!items) {
                return <div className="proof__column" key={`${slotCount}-empty-${slot}`} />;
              }

              return (
                <Column
                  key={`${slotCount}-${slot}`}
                  items={items}
                  index={columnIndex}
                  delayStep={columnIndex}
                  velocity={velocity}
                  running={running}
                  reduceMotion={!!reduceMotion}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </section>
  );
}

interface ColumnProps {
  items: FeedImage[];
  /** Position in the packed grid — picks the column's resting speed. */
  index: number;
  /** Position in the reveal order, which is not always the packing order. */
  delayStep: number;
  velocity: MotionValue<number>;
  running: boolean;
  reduceMotion: boolean;
}

/** A drifting column in its slot: the reveal, and the clipping box it loops in. */
function Column({ items, index, delayStep, velocity, running, reduceMotion }: ColumnProps) {
  return (
    <motion.div
      className="proof__column"
      // Columns rise into place from below, one after another, so the grid
      // assembles rather than appearing.
      initial={reduceMotion ? false : { opacity: 0, y: 46 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REVEAL, delay: 0.12 + delayStep * 0.055 }}
    >
      <DriftColumn
        items={items}
        speed={COLUMN_SPEEDS[index % COLUMN_SPEEDS.length]}
        velocity={velocity}
        running={running}
      />
    </motion.div>
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
