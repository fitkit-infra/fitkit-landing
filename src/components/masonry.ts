import type { FeedImage } from '../data/feed';

/**
 * Greedy shortest-column packing — the same masonry the app feed uses
 * (fitkit/frontend HomeScreen's `FlashList masonry`), done up front because the
 * strip's content is static and nothing here is virtualised.
 *
 * Heights are measured in column-width units (1 / aspectRatio), so the packing
 * is resolution independent: it holds at any column width.
 */
export function packColumns(
  images: FeedImage[],
  columnCount: number,
  itemsPerColumn: number
): FeedImage[][] {
  const columns: FeedImage[][] = Array.from({ length: columnCount }, () => []);
  if (images.length === 0) return columns;

  const heights = new Array<number>(columnCount).fill(0);
  const stride = coprimeStride(images.length);
  const total = columnCount * itemsPerColumn;

  for (let i = 0; i < total; i++) {
    // Walking the pool by a co-prime stride still visits every image before
    // repeating, but neighbouring columns no longer end up holding the same
    // picture at the same height.
    const image = images[(i * stride) % images.length];

    let target = 0;
    for (let c = 1; c < columnCount; c++) {
      if (heights[c] < heights[target]) target = c;
    }
    columns[target].push(image);
    heights[target] += 1 / image.aspectRatio;
  }

  return columns;
}

/** Largest handy prime that does not divide `n` — i.e. co-prime with it. */
function coprimeStride(n: number): number {
  for (const candidate of [5, 7, 3, 11, 13, 2]) {
    if (candidate < n && n % candidate !== 0) return candidate;
  }
  return 1;
}
