import { memo } from 'react';
import type { FeedImage } from '../data/feed';

interface FeedCardProps {
  image: FeedImage;
  /** Loaded eagerly in the first screenful, lazily in the loop's second copy. */
  eager?: boolean;
}

/**
 * One card in the masonry strip: the app's feed card with the title and author
 * line taken off. The strip is pure visual proof, so nothing is labelled.
 *
 * The aspect ratio comes from the manifest rather than the file, so the column
 * reserves the right height before the image decodes and the grid never jumps.
 */
function FeedCard({ image, eager = false }: FeedCardProps) {
  return (
    <div className="feed-card">
      <img
        className="feed-card__image"
        src={image.src}
        style={{ aspectRatio: image.aspectRatio }}
        alt=""
        draggable={false}
        decoding="async"
        loading={eager ? 'eager' : 'lazy'}
      />
    </div>
  );
}

export default memo(FeedCard);
