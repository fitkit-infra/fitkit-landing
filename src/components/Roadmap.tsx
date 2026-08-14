import { ArrowLeft, Check, Circle } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useEffect } from 'react';
import { ROADMAP, ROADMAP_TALLY, STATUS_LABEL, STATUS_SLUG, STATUS_TALLY } from '../data/roadmap';
import type { RoadmapStatus } from '../data/roadmap';
import { REVEAL, REVEAL_LIGHT, STAGGER } from '../motion/springs';
import './Roadmap.css';

/** Stagger inside one item. The items are triggered by their own position on
 *  screen, so this only spaces a single item's parts — same as how-it-works. */
const PART = STAGGER * 0.7;

/** "3 shipped · 2 in progress · 3 ahead", built from whatever the JSON holds. */
const TALLY = ROADMAP_TALLY
  .map(({ status, count }) => `${count} ${STATUS_TALLY[status]}`)
  .join(' · ');

/**
 * The roadmap page: what has shipped, what is being built, and what is next, as
 * one vertical run. Reached at `#/roadmap` from the top bar and nowhere else —
 * it is not a section of the landing page and cannot be scrolled into.
 *
 * The structure is a rail with a node per item and the item's card set beside
 * it. Three things carry a status, so it is never colour alone: the node's mark
 * (a check, a filled dot, or nothing), the chip's word, and the rail, which
 * carries the accent only as far as the work has actually got.
 *
 * Everything here is drawn from `src/data/roadmap.json`. Nothing about the page
 * is hand-positioned per item — add an entry and the run grows.
 */
export default function Roadmap() {
  const reduceMotion = useReducedMotion();

  // One document, two pages: the title belongs to whichever is on screen.
  useEffect(() => {
    const previous = document.title;
    document.title = 'Roadmap — Fitkit';

    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="roadmap shell">
      {/* Above the fold on arrival, so the header animates on mount rather than
          on a viewport trigger that has already been satisfied. */}
      <motion.header
        className="roadmap__head"
        initial={reduceMotion ? false : 'rest'}
        animate="shown"
      >
        <h1 className="roadmap__title">
          {/* The hero's move at page-title weight: set out of a clipping box. */}
          <span className="roadmap__title-clip">
            <motion.span
              className="roadmap__title-inner"
              variants={{ rest: { y: '116%' }, shown: { y: '0%' } }}
              transition={REVEAL}
            >
              Roadmap
            </motion.span>
          </span>
        </h1>

        <motion.p
          className="roadmap__lede"
          variants={{ rest: { opacity: 0, y: 14 }, shown: { opacity: 1, y: 0 } }}
          transition={{ ...REVEAL_LIGHT, delay: PART * 2 }}
        >
          What we have built, what we are building now, and what comes after it. Top to bottom,
          updated as things land.
        </motion.p>

        {TALLY && (
          <motion.p
            className="roadmap__tally"
            variants={{ rest: { opacity: 0, y: 10 }, shown: { opacity: 1, y: 0 } }}
            transition={{ ...REVEAL_LIGHT, delay: PART * 3 }}
          >
            {TALLY}
          </motion.p>
        )}
      </motion.header>

      <ol className="roadmap__list">
        {ROADMAP.map((item) => (
          <motion.li
            key={`${item.order}-${item.title}`}
            className={`roadmap__item roadmap__item--${STATUS_SLUG[item.status]}`}
            initial={reduceMotion ? false : 'rest'}
            whileInView="shown"
            viewport={{ once: true, amount: 0.5 }}
          >
            <motion.span
              className="roadmap__node"
              variants={{ rest: { opacity: 0, scale: 0.86 }, shown: { opacity: 1, scale: 1 } }}
              transition={REVEAL}
            >
              <StatusMark status={item.status} />
            </motion.span>

            <motion.div
              className="roadmap__card"
              variants={{ rest: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } }}
              transition={{ ...REVEAL, delay: PART }}
            >
              <div className="roadmap__row">
                {/* The item's place in the list, which is the number in the
                    JSON. Chrome, so it is set in the grotesk and kept outside
                    the title — the serif does not set labels. */}
                <span className="roadmap__ordinal">{String(item.order).padStart(2, '0')}</span>
                <h2 className="roadmap__item-title">{item.title}</h2>
                <span className="roadmap__status">{STATUS_LABEL[item.status]}</span>
              </div>

              <p className="roadmap__body">{item.description}</p>
            </motion.div>
          </motion.li>
        ))}
      </ol>

      <motion.div
        className="roadmap__foot"
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={REVEAL_LIGHT}
      >
        <p className="roadmap__note">
          This is the list we work from. It changes when the product does.
        </p>

        {/* The top bar's mark goes home too; this is the one at the end of the
            read, where the reader actually is. */}
        <a className="roadmap__back" href="#/">
          <ArrowLeft size={15} strokeWidth={1.6} absoluteStrokeWidth aria-hidden="true" />
          Back to the homepage
        </a>
      </motion.div>
    </main>
  );
}

/**
 * The mark inside a node, one per status: a check for work that is done, a
 * filled dot for what is being built now, and nothing at all for what has not
 * started — an empty ring says "not yet" more plainly than a glyph would.
 *
 * Lucide at the same weight as the how-it-works glyphs (see StepIcon), so the
 * two pages draw their icons with one pen. The chip beside it carries the same
 * status in words; this is the fast read, not the only one.
 */
function StatusMark({ status }: { status: RoadmapStatus }) {
  if (status === 'done') {
    return (
      <Check className="roadmap__glyph" strokeWidth={1.6} absoluteStrokeWidth aria-hidden="true" />
    );
  }

  if (status === 'in progress') {
    return (
      <Circle
        className="roadmap__glyph roadmap__glyph--dot"
        fill="currentColor"
        strokeWidth={1.6}
        absoluteStrokeWidth
        aria-hidden="true"
      />
    );
  }

  return null;
}
