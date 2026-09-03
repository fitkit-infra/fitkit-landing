import { ShoppingCart } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { HOVER, PRESS, REVEAL, REVEAL_LIGHT, STAGGER } from '../motion/springs';
import ComingSoonDialog from './ComingSoonDialog';
import './OutfitShowcase.css';

/**
 * One labelled piece in the flat lay.
 *
 * `x` and `y` are percentages of the image box, so they hold at every size the
 * figure is drawn at — the connector is pinned to the garment, not to a pixel.
 * The label sits at the same `y` as its anchor, which is what keeps every
 * connector horizontal; space the `y` values by a few points or two labels will
 * land on top of each other.
 */
interface Piece {
  label: string;
  x: number;
  y: number;
}

/** The clothing, and only the clothing: the watch, rings and glasses in the lay
 *  are styling, and naming them turns a set into an inventory. */
const PIECES: Piece[] = [
  { label: 'Charcoal officer coat', x: 46, y: 17 },
  { label: 'Plaid wool scarf', x: 80, y: 28 },
  { label: 'Washed baggy denim', x: 52, y: 58 },
  { label: 'Black low-top trainers', x: 28, y: 90 },
];

/** How far a curve stands off the label it leaves and the cart it arrives at. */
const LABEL_GAP = 12;
const CART_GAP = 7;

/** Below this the diagram stacks and there is no rail to run curves across —
 *  kept in step with the media query in OutfitShowcase.css. */
const STACKED = '(max-width: 1040px)';

/** The measured curve set: a viewBox the size of the stage, and one path per
 *  label. Null until measured, and while the layout is stacked. */
interface Connectors {
  width: number;
  height: number;
  paths: string[];
}

/**
 * The outfit, taken apart.
 *
 * A flat lay with each garment called out: a dot on the piece, a hairline
 * running out to the right, and the piece named at the end of it. Out of the
 * far side of every name a curve runs on to a cart, which stands beside the buy
 * action on the denim line — each named piece is a thing you can put in a
 * basket, and the curves are what say so. The three columns together are
 * centred on the page as one diagram.
 *
 * Under the width where a label rail stops fitting, the connectors are dropped:
 * the same list is set under the image and the actions follow it.
 */
export default function OutfitShowcase() {
  const reduceMotion = useReducedMotion();
  const [soonOpen, setSoonOpen] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cartRef = useRef<HTMLDivElement | null>(null);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [connectors, setConnectors] = useState<Connectors | null>(null);

  /*
   * The curves are measured rather than authored, because they join two things
   * the stylesheet cannot relate: a label whose length is set by its own text,
   * and a cart on the other side of a flex gap. Everything is read back off the
   * laid-out DOM and redrawn whenever any of it resizes.
   */
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let live = true;

    const measure = () => {
      const cart = cartRef.current;
      if (!live || !cart) return;

      if (window.matchMedia(STACKED).matches) {
        setConnectors(null);
        return;
      }

      const frame = stage.getBoundingClientRect();
      const target = cart.getBoundingClientRect();
      // Every curve arrives at the same point — the middle of the cart's left
      // edge — so the four of them read as one bundle being gathered up.
      const endX = target.left - frame.left - CART_GAP;
      const endY = target.top - frame.top + target.height / 2;

      const paths = labelRefs.current.flatMap((label) => {
        if (!label) return [];
        const box = label.getBoundingClientRect();
        const startX = box.right - frame.left + LABEL_GAP;
        const startY = box.top - frame.top + box.height / 2;
        // Horizontal handles at both ends: the curve leaves the label along the
        // same line the straight connector arrived on, and meets the cart square
        // to its edge. Held under half the run each, so the two never cross and
        // the middle stays a bend rather than a plunge.
        const bend = (endX - startX) * 0.46;

        return [
          `M${round(startX)} ${round(startY)} C${round(startX + bend)} ${round(startY)}, ` +
            `${round(endX - bend)} ${round(endY)}, ${round(endX)} ${round(endY)}`,
        ];
      });

      setConnectors({ width: frame.width, height: frame.height, paths });
    };

    measure();

    // The labels are absolutely positioned, so their own width changes never
    // reach the stage: each one is watched as well.
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    labelRefs.current.forEach((label) => label && observer.observe(label));
    // Type set in a fallback face measures differently from type set in the
    // real one, and the swap happens after the first paint.
    document.fonts?.ready.then(measure);

    return () => {
      live = false;
      observer.disconnect();
    };
  }, []);

  return (
    <section className="showcase" id="the-outfit">
      <div className="showcase__stage" ref={stageRef}>
        {connectors && (
          <svg
            className="showcase__web"
            width={connectors.width}
            height={connectors.height}
            viewBox={`0 0 ${connectors.width} ${connectors.height}`}
            aria-hidden="true"
          >
            {connectors.paths.map((d, i) => (
              <motion.path
                key={i}
                d={d}
                fill="none"
                stroke="var(--pin-rule)"
                strokeWidth="1"
                strokeLinecap="round"
                initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ ...REVEAL, delay: 0.3 + i * STAGGER * 0.8 }}
              />
            ))}
          </svg>
        )}

        <motion.figure
          className="showcase__figure"
          initial={reduceMotion ? false : { opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={REVEAL}
        >
          <img
            className="showcase__image"
            src="/showcase/outfit.jpg"
            alt="A flat lay of the outfit: a charcoal officer coat, plaid wool scarf, washed baggy denim and black low-top trainers."
            width={1120}
            height={1855}
          />

          <motion.ul
            className="showcase__pins"
            initial={reduceMotion ? false : 'rest'}
            whileInView="shown"
            viewport={{ once: true, amount: 0.35 }}
            transition={{ delayChildren: 0.15, staggerChildren: STAGGER * 0.8 }}
          >
            {PIECES.map((piece, i) => (
              <motion.li
                className="showcase__pin"
                key={piece.label}
                style={
                  {
                    '--x': `${piece.x}%`,
                    '--y': `${piece.y}%`,
                  } as React.CSSProperties
                }
                variants={{ rest: { opacity: 0 }, shown: { opacity: 1 } }}
                transition={REVEAL_LIGHT}
              >
                <span className="showcase__dot" aria-hidden="true" />
                {/* Drawn out from the garment rather than faded in, so the
                    connector reads as being traced to its label. */}
                <motion.span
                  className="showcase__line"
                  aria-hidden="true"
                  variants={{ rest: { scaleX: 0 }, shown: { scaleX: 1 } }}
                  transition={REVEAL}
                />
                <span
                  className="showcase__label"
                  ref={(el) => {
                    labelRefs.current[i] = el;
                  }}
                >
                  {piece.label}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.figure>

        {/* Two elements, because the wrapper carries the layout's own
            translate (it sits the actions on the denim line) and the motion
            element writes a transform of its own on reveal — one node cannot
            hold both. */}
        <div className="showcase__aside">
          <motion.div
            className="showcase__actions"
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={REVEAL_LIGHT}
          >
            {/* Where the curves land. It is the diagram's full stop rather than
                a second control — the button beside it is the one thing to
                press — so it is out of the accessibility tree. */}
            <div className="cart" ref={cartRef} aria-hidden="true">
              <span className="cart__glow" />
              <ShoppingCart size={22} strokeWidth={1.5} absoluteStrokeWidth />
            </div>

            {/* The shopper's action, against the brand's one everywhere else
                on the page. There is no checkout behind it yet, and the dialog
                it opens says so. */}
            <motion.button
              type="button"
              className="buy"
              onClick={() => setSoonOpen(true)}
              whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2, transition: HOVER }}
              whileTap={reduceMotion ? undefined : { scale: 0.98, y: 0, transition: PRESS }}
            >
              <span className="buy__glow" aria-hidden="true" />
              <span className="buy__label">Buy outfit</span>
            </motion.button>
          </motion.div>
        </div>
      </div>

      <ComingSoonDialog open={soonOpen} onClose={() => setSoonOpen(false)} />
    </section>
  );
}

/** Path data is easier to read, and diffs smaller, at a tenth of a pixel. */
function round(value: number) {
  return Math.round(value * 10) / 10;
}
