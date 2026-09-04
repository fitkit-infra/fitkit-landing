import { useAnimationFrame, type MotionValue } from 'motion/react';
import { useEffect, useRef } from 'react';
import type { FeedImage } from '../data/feed';
import FeedCard from './FeedCard';

/** How much of the page's scroll velocity feeds into the drift. */
const VELOCITY_COUPLING = 0.16;
/** Ceiling on that contribution, px/s, so a flung scroll never turns into a blur. */
const MAX_VELOCITY_BOOST = 820;

interface DriftColumnProps {
  items: FeedImage[];
  /** Resting drift, px/s. */
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
export default function DriftColumn({ items, speed, velocity, running }: DriftColumnProps) {
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
    <div className="feed__track" ref={trackRef}>
      <div className="feed__copy" ref={copyRef}>
        {items.map((image, i) => (
          <FeedCard key={`a-${i}`} image={image} />
        ))}
      </div>
      {/* Second copy — what the viewport is looking at for half of every loop. */}
      <div className="feed__copy" aria-hidden="true">
        {items.map((image, i) => (
          <FeedCard key={`b-${i}`} image={image} />
        ))}
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
