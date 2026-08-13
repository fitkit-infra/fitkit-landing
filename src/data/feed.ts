/**
 * Static asset manifest for the proof strip.
 *
 * The app's feed (fitkit/frontend — HomeScreen + FeedCard) pulls these from the
 * Go backend. The landing page has no backend and never should: the strip is
 * proof, not a live feed, so the images are checked-in static files.
 *
 * To swap the imagery:
 *   1. drop the new files into `public/feed/` (any name, any format the browser
 *      reads — 720px wide is plenty, the cards are never larger),
 *   2. replace the entries below.
 *
 * `aspectRatio` is width / height and drives the card's height in the masonry
 * columns before the image has loaded — get it wrong and the grid reflows mid
 * scroll. Regenerate the whole list from the files with:
 *
 *   python3 -c "from PIL import Image; import glob; \
 *     [print(f, *Image.open(f).size) for f in sorted(glob.glob('public/feed/*'))]"
 */
export interface FeedImage {
  /** Path under `public/`, or any absolute URL. */
  src: string;
  /** width / height of the source file. */
  aspectRatio: number;
}

export const FEED_IMAGES: FeedImage[] = [
  { src: '/feed/outfit-01.jpg', aspectRatio: 0.7775 },
  { src: '/feed/outfit-02.jpg', aspectRatio: 0.5625 },
  { src: '/feed/outfit-03.jpg', aspectRatio: 0.9783 },
  { src: '/feed/outfit-04.jpg', aspectRatio: 0.5629 },
  { src: '/feed/outfit-05.jpg', aspectRatio: 0.5551 },
  { src: '/feed/outfit-06.jpg', aspectRatio: 0.5629 },
  { src: '/feed/outfit-07.jpg', aspectRatio: 0.75 },
  { src: '/feed/outfit-08.jpg', aspectRatio: 0.5629 },
  { src: '/feed/outfit-09.jpg', aspectRatio: 0.5625 },
  { src: '/feed/outfit-10.jpg', aspectRatio: 0.5625 },
  { src: '/feed/outfit-11.jpg', aspectRatio: 0.5625 },
  { src: '/feed/outfit-12.jpg', aspectRatio: 0.7651 },
];
