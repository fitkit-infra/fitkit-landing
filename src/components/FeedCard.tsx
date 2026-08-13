import { memo } from 'react';
import type { FeedImage } from '../data/feed';

interface FeedCardProps {
  image: FeedImage;
}

/**
 * One card in the masonry strip: the app's feed card with the title and author
 * line taken off. The strip is pure visual proof, so nothing is labelled.
 *
 * The aspect ratio comes from the manifest rather than the file, so the column
 * reserves the right height before the image decodes and the grid never jumps.
 */
function FeedCard({ image }: FeedCardProps) {
  return (
    <div className="feed-card">
      {/* Never lazy, never async. The whole strip is drawn from the same dozen
          files, so the loop's second copy costs no extra requests — and both
          hints leave cards standing empty here: lazy never fetches inside a
          transformed track, and an async decode can be deferred for seconds
          while the column carries on moving past an unpainted image. */}
      <img
        className="feed-card__image"
        src={image.src}
        style={{ aspectRatio: image.aspectRatio }}
        alt=""
        draggable={false}
        decoding="sync"
      />
    </div>
  );
}

export default memo(FeedCard);
