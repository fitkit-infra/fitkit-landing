import { useEffect, useState } from 'react';

/** Column count by viewport width. Same grid throughout — it only rescales. */
const COLUMN_STEPS: { minWidth: number; columns: number }[] = [
  { minWidth: 1400, columns: 6 },
  { minWidth: 1080, columns: 5 },
  { minWidth: 760, columns: 4 },
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
