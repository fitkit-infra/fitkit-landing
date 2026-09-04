import { useEffect, useState } from 'react';

/**
 * Masonry slot count by viewport width. Same grid throughout — it only
 * rescales.
 *
 * These are slots, not filled columns: from five slots up the strip leaves the
 * outermost one on each side empty (see ScrollStory), so the steps are chosen to
 * keep the *filled* columns at a sane width — four of them on a desktop, three
 * from tablet-landscape down to where the grid goes full-bleed again.
 */
const COLUMN_STEPS: { minWidth: number; columns: number }[] = [
  { minWidth: 1240, columns: 6 },
  { minWidth: 880, columns: 5 },
  { minWidth: 620, columns: 4 },
  { minWidth: 0, columns: 3 },
];

function columnsFor(width: number): number {
  return COLUMN_STEPS.find((step) => width >= step.minWidth)?.columns ?? 3;
}

/**
 * How many masonry columns the strip runs at the current viewport width.
 *
 * Resize is read on an animation frame so a drag-resize does not thrash React,
 * and state only changes when the count actually does — a column count change
 * repacks the grid, so it must not happen on every pixel.
 */
export function useColumnCount(): number {
  const [columns, setColumns] = useState(() =>
    typeof window === 'undefined' ? 5 : columnsFor(window.innerWidth)
  );

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      setColumns((current) => {
        const next = columnsFor(window.innerWidth);
        return next === current ? current : next;
      });
    };
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return columns;
}
