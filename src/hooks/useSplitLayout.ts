import { useEffect, useState } from 'react';

/**
 * Where the hero splits: below this the feed is one full-bleed band under the
 * copy, at or above it the feed is two 2-column panels pinned to the screen
 * edges with the copy standing between them.
 *
 * Kept in sync by hand with the `min-width` query in Hero.css — the layout is chosen in JS because the two modes pack the masonry
 * differently (2 + 2 columns against N), which no media query can do.
 */
export const SPLIT_MIN_WIDTH = 1240;

/** True when there is room to stand the copy between two edge feeds. */
export function useSplitLayout(): boolean {
  const [split, setSplit] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= SPLIT_MIN_WIDTH
  );

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${SPLIT_MIN_WIDTH}px)`);
    const sync = () => setSplit(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return split;
}
