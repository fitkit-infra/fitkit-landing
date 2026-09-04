import {
  motion,
  useAnimationControls,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
  type TargetAndTransition,
  type Transition,
} from 'motion/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { STORY_FEED, STORY_OUTFIT, type FeedImage } from '../data/feed';
import { useColumnCount } from '../hooks/useColumnCount';
import { useSplitLayout } from '../hooks/useSplitLayout';
import { HOVER, PRESS, REVEAL, SCROLL_SMOOTH } from '../motion/springs';
import ClosingCTA from './ClosingCTA';
import ComingSoonDialog from './ComingSoonDialog';
import DriftColumn from './DriftColumn';
import Hero from './Hero';
import { packColumns } from './masonry';
import ScrambleLabel from './ScrambleLabel';
import './ScrollStory.css';

/*
 * The landing page, told once, on the scroll bar.
 *
 * Everything below the first screen is one pinned stage and one progress value.
 * The reader scrolls, the stage stays, and the story runs through it in beats —
 * each beat a window on that 0..1 value, so the whole sequence is scrubbable in
 * both directions and never plays on a timer the reader is not driving.
 *
 * The beats, in order:
 *
 *   1. genie      the two edge feeds pull themselves into the middle of the
 *                 screen, and the slogan and its button leave for good
 *   2. hold       the feed alone, centred, and then still: it stops drifting
 *                 before it fades, so nothing is moving under what comes next
 *   3. pick       on the empty paper the feed left, one outfit — a card that
 *                 was drifting in it a moment ago — pops up, named
 *   4. point      a cursor arrives and goes to the denim, whose name flickers
 *                 through noise and settles as "Your item"
 *   5. buy        the cursor crosses to the button and presses it
 *   6. ship       the outfit blurs out through black into a parcel, and the
 *                 parcel is thrown to a door and dropped on its step
 *   7. ask        the doorstep goes, and the closing line takes the empty
 *                 stage on its own — the only beat that is a sentence
 *
 * Nothing here is measured off the DOM. The stage is the viewport, so every
 * position in the scene is derived from its width and height in `layout()`
 * below — which means the cursor's targets are known before anything is
 * painted and never have to be read back out of a transformed element.
 */

/** How much scrolling the whole sequence is worth. The stage is 100svh of it. */
const RUNWAY_VH = 700;

/** The photograph's own proportions: 1120 x 1855. */
const FIGURE_RATIO = 1120 / 1855;

/** Cards per column before the drift loop repeats. */
const ITEMS_PER_COLUMN = 5;

/** Resting drift, px/s per column — never the same in two neighbours. */
const COLUMN_SPEEDS = [21, 29, 24, 33, 19, 27];

/** Columns in each edge panel, and so four across the feed. */
const COLUMNS_PER_PANEL = 2;

/** The tilt the edge panels carry before the genie unwinds them. */
const PANEL_TILT = 17;

/**
 * The beats, as points and windows on the scroll progress. Every animated value
 * in this file reads its timing out of here, so retiming the story is done once.
 *
 * A pair is a window the reader scrubs through. A single number is a line the
 * reader crosses: what it drives is a state, not a scrub, and it plays at its
 * own speed on the other side of that line (see `crossed`). Anything that has
 * to end up gone — the slogan, the feed — is a line, because a scrub only ever
 * gets somewhere as long as the reader keeps going.
 */
const BEAT: {
  genie: number[];
  heroOut: number;
  driftStopAt: number;
  feedOut: number;
  sceneAt: number;
  pins: number[];
  cursorIn: number[];
  toDenim: number[];
  toBuy: number[];
  glitchAt: number;
  clickAt: number;
  cursorOut: number[];
  shipAt: number;
  doorIn: number[];
  flight: number[];
  closeAt: number;
} = {
  genie: [0.04, 0.26],
  /** The slogan and its button leave while the feed is still closing up. */
  heroOut: 0.15,
  /** The feed freezes before it fades, so it never drifts under the outfit. */
  driftStopAt: 0.3,
  feedOut: 0.34,
  /**
   * Only then does the photograph arrive — on empty paper, in one pop. The gap
   * between the feed leaving and this is the one stretch of the story with
   * nothing on the stage, so it is kept to half of what the feed's own fade
   * needs; everything after it is shifted by the same amount, which leaves the
   * slack at the end where the closing line is glad of it.
   */
  sceneAt: 0.38,
  pins: [0.42, 0.54],
  cursorIn: [0.46, 0.505],
  toDenim: [0.47, 0.52],
  toBuy: [0.62, 0.67],
  /** The name flickers over at this point, a moment after the cursor lands. */
  glitchAt: 0.575,
  /** And the press lands here. */
  clickAt: 0.71,
  cursorOut: [0.74, 0.78],
  /** The photograph goes dark and blurs away; the parcel is what is left. */
  shipAt: 0.75,
  doorIn: [0.76, 0.82],
  /** Landed well before the end, so the doorstep holds for the last stretch. */
  flight: [0.8, 0.86],
  /** The parcel and the door go, and the closing line takes the empty stage. */
  closeAt: 0.905,
};

/** What the parcel shrinks to over its flight: the size it sits on the step at. */
const FLIGHT_END_SCALE = 0.55;

/** The pop the photograph and the parcel arrive on: fast, and left to overshoot. */
const POP: Transition = { type: 'spring', stiffness: 430, damping: 24, mass: 0.7 };
/** The collapse into the parcel, which is a cut rather than a spring. */
const COLLAPSE: Transition = { duration: 0.26, ease: [0.5, 0, 0.9, 0.4] };
/**
 * The parcel's own arrival. Held back a fraction of a second so it lands while
 * the photograph is still going out rather than after it — the two overlap, and
 * the box appears to be what the outfit has turned into. Loose enough to
 * overshoot hard, because that overshoot is the weight of the thing.
 */
const BOX_POP: Transition = {
  type: 'spring',
  stiffness: 540,
  damping: 16,
  mass: 0.9,
  delay: 0.14,
};
/** And the way anything leaves backwards, when the reader scrolls back up. */
const DISMISS: Transition = { duration: 0.22, ease: 'easeIn' };

/** Where the photograph is in the story. */
type Act = 'hidden' | 'outfit' | 'parcel';

/**
 * The photograph's three states. It does not shrink into the parcel so much as
 * go out: the blur opens up and the brightness goes to nothing at the same
 * time, so it passes through black on its way to being a box.
 */
const FIGURE: Record<Act, TargetAndTransition> = {
  hidden: { opacity: 0, scale: 0.72, y: 34, filter: 'blur(14px) brightness(1)' },
  outfit: { opacity: 1, scale: 1, y: 0, filter: 'blur(0px) brightness(1)' },
  parcel: { opacity: 0, scale: 0.36, y: 0, filter: 'blur(30px) brightness(0.04)' },
};

/**
 * One named piece in the lay. `x` and `y` are percentages of the photograph, so
 * the pins hold at every size the figure is drawn at.
 */
interface Piece {
  label: string;
  x: number;
  y: number;
  /** The one the story picks out. Its name is the one that flickers over. */
  chosen?: boolean;
}

const PIECES: Piece[] = [
  { label: 'Charcoal officer coat', x: 46, y: 17 },
  { label: 'Plaid wool scarf', x: 80, y: 28 },
  { label: 'Washed baggy denim', x: 52, y: 58, chosen: true },
  { label: 'Black low-top trainers', x: 28, y: 90 },
];

/** What the chosen piece's name becomes. */
const CHOSEN_AS = 'Your item';

export default function ScrollStory() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return <StillStory />;
  return <MovingStory />;
}

/* ------------------------------------------------------------------ layout */

interface Layout {
  w: number;
  h: number;
  /** Edge feed panel, and how far it travels to meet its twin in the middle. */
  panelW: number;
  panelTx: number;
  /** The photograph, once it is standing on its own. */
  figW: number;
  figH: number;
  figLeft: number;
  figTop: number;
  /** How far past the photograph a name starts, and the room held for names. */
  lead: number;
  rail: number;
  /** The denim's pin, which is where the cursor goes first. */
  dotX: number;
  dotY: number;
  /** The button's centre, which is where it goes next. */
  buyX: number;
  buyY: number;
  /** Where the cursor comes in from. */
  fromX: number;
  fromY: number;
  /** The door, and the spot on its step the parcel lands on. */
  doorW: number;
  doorH: number;
  doorX: number;
  doorY: number;
  landX: number;
  landY: number;
  /** The parcel, drawn off the door so the two are always in proportion. */
  boxSize: number;
}

/**
 * Every position in the scene, from the size of the stage and nothing else.
 *
 * The composition is the photograph plus the rail of names to the right of it,
 * so the figure is set left of centre by half the rail — the two together are
 * what sits in the middle of the screen, not the photograph alone.
 */
function layout(w: number, h: number): Layout {
  const compact = w < 1040;
  const panelW = clamp(w * 0.24, 300, 520);
  const lead = compact ? 26 : 54;
  const rail = compact ? Math.min(w * 0.34, 168) : Math.min(w * 0.2, 250);

  const figH = clamp(h * 0.5, 230, 470);
  const figW = figH * FIGURE_RATIO;
  const figLeft = w / 2 - figW / 2 - (lead + rail + 12) / 2;
  const figTop = h / 2 - figH / 2 - 34;

  const buyX = figLeft + figW / 2;
  const buyY = figTop + figH + 46;

  const doorH = clamp(h * 0.42, 236, 380);
  // Matches the icon's own box, so the drawing fills the space it is given.
  const doorW = doorH * 0.58;
  const doorX = w / 2 - doorW / 2;
  const doorY = h / 2 - doorH / 2;
  // Sized off the door rather than off the screen, and then a step up again on
  // top of that: the parcel grows with the door and is deliberately larger than
  // its share of it, so it reads as a thing on a step and not a sticker on one.
  const boxSize = clamp(doorH * 0.34, 86, 136);
  // The threshold the icon draws is at 96% of its height.
  const sill = doorY + doorH * 0.96;

  return {
    w,
    h,
    panelW,
    panelTx: w / 2 - panelW,
    figW,
    figH,
    figLeft,
    figTop,
    lead,
    rail,
    dotX: figLeft + (figW * 52) / 100,
    dotY: figTop + (figH * 58) / 100,
    buyX,
    buyY,
    // Off the bottom-right corner, the way a hand comes onto a trackpad.
    fromX: w * 0.5 + figW * 0.9,
    fromY: h + 90,
    doorW,
    doorH,
    doorX,
    doorY,
    // On the step, in front of the door: the parcel is set from its own centre,
    // so the landing point is lifted by half of what it will be standing there.
    landX: doorX + doorW * 0.78,
    landY: sill - boxSize * FLIGHT_END_SCALE * 0.42,
    boxSize,
  };
}

/* ------------------------------------------------------------------- story */

function MovingStory() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useStageSize(stageRef);
  const L = useMemo(() => layout(size.w, size.h), [size.w, size.h]);

  const split = useSplitLayout();
  const slotCount = useColumnCount();
  const [soonOpen, setSoonOpen] = useState(false);

  const { scrollYProgress: p } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });
  // Everything that moves with the reader is read off the smoothed copy, so a
  // wheel notch arrives as a push rather than a step.
  const ps = useSpring(p, { stiffness: 140, damping: 28, mass: 0.45 });

  // The drift's own velocity coupling still comes off the raw page scroll.
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), SCROLL_SMOOTH);

  /* Beat 1 — the feed pulls itself in. What the slogan and the feed do about it
     is further down: both of them leave on a line rather than on a scrub. */
  const genie = useTransform(ps, BEAT.genie, [0, 1]);
  const feedY = useTransform(ps, [0, BEAT.driftStopAt], [0, -40]);

  /* Beat 3 — the names, and the button under the photograph. The photograph
     itself is a state, not a range: see `act`. */
  const pinsOpacity = useTransform(p, [BEAT.shipAt - 0.03, BEAT.shipAt], [1, 0]);
  const actionOpacity = useTransform(ps, [0.39, 0.45, 0.73, 0.76], [0, 1, 1, 0]);
  const actionRise = useTransform(ps, [0.39, 0.45], [20, 0]);

  /* Beats 4 and 5 — the cursor. Stepped targets pulled through soft springs:
     the step is what the scroll drives, the spring is what makes it a hand. */
  const targetX = useTransform(
    p,
    [BEAT.toDenim[0], BEAT.toDenim[1], BEAT.toBuy[0], BEAT.toBuy[1]],
    [L.fromX, L.dotX, L.dotX, L.buyX]
  );
  const targetY = useTransform(
    p,
    [BEAT.toDenim[0], BEAT.toDenim[1], BEAT.toBuy[0], BEAT.toBuy[1]],
    [L.fromY, L.dotY, L.dotY, L.buyY]
  );
  const cursorX = useSpring(targetX, { stiffness: 170, damping: 18, mass: 0.75 });
  const cursorY = useSpring(targetY, { stiffness: 155, damping: 17, mass: 0.8 });
  const cursorOpacity = useTransform(
    p,
    [BEAT.cursorIn[0], BEAT.cursorIn[1], BEAT.cursorOut[0], BEAT.cursorOut[1]],
    [0, 1, 1, 0]
  );

  /* Beat 6 — the parcel and the door. The parcel's arrival is a state; its
     flight, which is the part the reader should be able to hold, is a range. */
  const flightScale = useTransform(ps, BEAT.flight, [1, FLIGHT_END_SCALE]);
  const parcelX = useTransform(ps, BEAT.flight, [0, L.landX - (L.figLeft + L.figW / 2)]);
  // Thrown, so it turns on the way over and comes down square again.
  const parcelSpin = useTransform(
    ps,
    [BEAT.flight[0], (BEAT.flight[0] + BEAT.flight[1]) / 2, BEAT.flight[1]],
    [0, 15, 0]
  );
  const flightDy = L.landY - (L.figTop + L.figH / 2);
  // Thrown rather than slid: the arc peaks before it arrives.
  const parcelY = useTransform(
    ps,
    [BEAT.flight[0], (BEAT.flight[0] + BEAT.flight[1]) / 2, BEAT.flight[1]],
    [0, flightDy * 0.4 - 74, flightDy]
  );
  const doorOpacity = useTransform(p, BEAT.doorIn, [0, 1]);
  const doorScale = useTransform(ps, BEAT.doorIn, [0.92, 1]);

  /* Everything that is an event rather than a position. Each of these is a line
     the reader crosses, and what it drives then plays at its own speed. */
  const [heroGone, setHeroGone] = useState(false);
  const [feedGone, setFeedGone] = useState(false);
  const [drifting, setDrifting] = useState(true);
  const [act, setAct] = useState<Act>('hidden');
  const [swapped, setSwapped] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [overButton, setOverButton] = useState(false);
  const [landed, setLanded] = useState(false);
  const [closing, setClosing] = useState(false);

  useMotionValueEvent(p, 'change', (v) => {
    setHeroGone((was) => crossed(v, BEAT.heroOut, was));
    setFeedGone((was) => crossed(v, BEAT.feedOut, was));
    setDrifting(v < BEAT.driftStopAt);
    setSwapped(v >= BEAT.glitchAt);
    setPressed(v >= BEAT.clickAt && v < BEAT.shipAt + 0.04);
    // The hand, as the system does it: the arrow turns into a finger the moment
    // it is over something that can be pressed. Armed a hair before the cursor
    // finishes its crossing, so the change reads as arriving at the button.
    setOverButton((was) => crossed(v, BEAT.toBuy[1] - 0.015, was, 0.015));
    // The spring is still catching up when the scrub reaches the end of the
    // flight, so the thud is armed a hair early and lands with it.
    setLanded((was) => crossed(v, BEAT.flight[1] - 0.008, was, 0.02));
    setClosing((was) => crossed(v, BEAT.closeAt, was));
    setAct((was) => {
      if (crossed(v, BEAT.shipAt, was === 'parcel')) return 'parcel';
      return crossed(v, BEAT.sceneAt, was !== 'hidden') ? 'outfit' : 'hidden';
    });
  });

  // The frame of black the photograph goes out through. One flash, on arrival
  // at the parcel — long enough to read, short enough not to be a transition.
  const flash = useAnimationControls();

  useEffect(() => {
    if (act !== 'parcel') {
      flash.set({ opacity: 0 });
      return;
    }
    flash.start({
      opacity: [0, 0.92, 0],
      transition: { duration: 0.44, times: [0, 0.28, 1], ease: 'easeOut' },
    });
  }, [act, flash]);

  // The landing. A parcel with something in it does not stop when it touches
  // the step — it compresses, comes back up short of where it started, and
  // settles. That squash, and the shadow punching under it, are the weight.
  const thud = useAnimationControls();

  useEffect(() => {
    if (!landed) {
      thud.set({ scaleX: 1, scaleY: 1, y: 0 });
      return;
    }
    thud.start({
      scaleX: [1, 1.26, 0.95, 1.03, 1],
      scaleY: [1, 0.7, 1.07, 0.98, 1],
      y: [0, 5, -4, 1, 0],
      transition: { duration: 0.66, times: [0, 0.17, 0.42, 0.7, 1], ease: 'easeOut' },
    });
  }, [landed, thud]);

  // The press, on both the cursor and the button: down hard, back on a spring
  // loose enough to overshoot. That overshoot is the whole of the click.
  const cursorPop = useAnimationControls();
  const buyPop = useAnimationControls();

  useEffect(() => {
    if (!pressed) {
      cursorPop.set({ scale: 1 });
      buyPop.set({ scale: 1 });
      return;
    }
    let live = true;
    const down = { type: 'spring', stiffness: 700, damping: 30, mass: 0.5 } as const;
    const back = { type: 'spring', stiffness: 420, damping: 11, mass: 0.6 } as const;

    cursorPop.start({ scale: 0.76, transition: down }).then(() => {
      if (live) cursorPop.start({ scale: 1, transition: back });
    });
    buyPop.start({ scale: 0.955, transition: down }).then(() => {
      if (live) buyPop.start({ scale: 1, transition: back });
    });

    return () => {
      live = false;
    };
  }, [pressed, cursorPop, buyPop]);

  /* The feed itself. Packed once across every filled column, in both layouts. */
  const edgeSlots = slotCount >= 5 ? 1 : 0;
  const filledCount = split ? COLUMNS_PER_PANEL * 2 : slotCount - edgeSlots * 2;
  const columns = useMemo(
    () => packColumns(STORY_FEED, filledCount, ITEMS_PER_COLUMN),
    [filledCount]
  );

  return (
    <section className="story" id="the-outfit">
      <div className="story__runway" ref={runwayRef} style={{ height: `${RUNWAY_VH}vh` }}>
        {/* The closing line is a beat on the stage rather than a section under
            it, so the page's one anchor is a point on the runway: landing here
            puts the reader at the beat, not at the top of the story. */}
        <div className="story__anchor" id="list-your-brand" style={{ top: `${BEAT.closeAt * 100}%` }} />

        <div className="story__stage" ref={stageRef}>
          {/* --- the feed ------------------------------------------------ */}
          <motion.div
            className="story__feed"
            aria-hidden="true"
            initial={false}
            animate={
              feedGone
                ? { opacity: 0, transitionEnd: { visibility: 'hidden' } }
                : { opacity: 1, visibility: 'visible' }
            }
            transition={{ duration: feedGone ? 0.42 : 0.3, ease: 'easeInOut' }}
          >
            {split ? (
              (['left', 'right'] as const).map((side, panel) => (
                <Panel
                  key={side}
                  side={side}
                  genie={genie}
                  feedY={feedY}
                  travel={side === 'left' ? L.panelTx : -L.panelTx}
                  width={L.panelW}
                >
                  {columns
                    .slice(panel * COLUMNS_PER_PANEL, (panel + 1) * COLUMNS_PER_PANEL)
                    .map((items, i) => (
                      <Column
                        key={`${side}-${i}`}
                        items={items}
                        index={panel * COLUMNS_PER_PANEL + i}
                        delayStep={side === 'left' ? COLUMNS_PER_PANEL - 1 - i : i}
                        velocity={velocity}
                        running={drifting}
                      />
                    ))}
                </Panel>
              ))
            ) : (
              <Band genie={genie} feedY={feedY}>
                {Array.from({ length: slotCount }, (_, slot) => {
                  const index = slot - edgeSlots;
                  const items = columns[index];
                  if (!items) return <div className="feed__column" key={`empty-${slot}`} />;
                  return (
                    <Column
                      key={`${slotCount}-${slot}`}
                      items={items}
                      index={index}
                      delayStep={index}
                      velocity={velocity}
                      running={drifting}
                    />
                  );
                })}
              </Band>
            )}
          </motion.div>

          {/* --- the slogan ---------------------------------------------- */}
          {/* Off the stage entirely once it has gone, not merely transparent:
              this is the one thing on the page that has to be finished with. */}
          <motion.div
            className="story__hero"
            initial={false}
            animate={
              heroGone
                ? { opacity: 0, y: -74, transitionEnd: { visibility: 'hidden' } }
                : { opacity: 1, y: 0, visibility: 'visible' }
            }
            transition={heroGone ? { duration: 0.32, ease: 'easeIn' } : { duration: 0.3 }}
          >
            <Hero />
          </motion.div>

          {/* --- the outfit, named --------------------------------------- */}
          <div
            className="story__scene"
            style={{ '--lead': `${L.lead}px` } as React.CSSProperties}
          >
            <motion.figure
              className="scene__figure"
              style={{ left: L.figLeft, top: L.figTop, width: L.figW, height: L.figH }}
              initial={FIGURE.hidden}
              animate={FIGURE[act]}
              transition={act === 'parcel' ? COLLAPSE : act === 'outfit' ? POP : DISMISS}
            >
              <img
                className="scene__image"
                src={STORY_OUTFIT.src}
                alt="A flat lay of the outfit: a charcoal officer coat, plaid wool scarf, washed baggy denim and black low-top trainers."
                width={1120}
                height={1855}
              />

              <motion.ul className="scene__pins" style={{ opacity: pinsOpacity }}>
                {PIECES.map((piece, i) => (
                  <Pin key={piece.label} piece={piece} index={i} p={ps} swapped={swapped} />
                ))}
              </motion.ul>
            </motion.figure>

            {/* The black the photograph goes out through. */}
            <motion.div
              className="scene__flash"
              aria-hidden="true"
              style={{ left: L.figLeft, top: L.figTop, width: L.figW, height: L.figH }}
              initial={{ opacity: 0 }}
              animate={flash}
            />

            {/* The one thing on the stage a real cursor can also press. */}
            <div className="scene__action" style={{ left: L.buyX, top: L.buyY }}>
              <motion.div style={{ opacity: actionOpacity, y: actionRise }}>
                <motion.button
                  type="button"
                  className={pressed ? 'buy buy--pressed' : 'buy'}
                  onClick={() => setSoonOpen(true)}
                  animate={buyPop}
                  whileHover={{ scale: 1.02, y: -2, transition: HOVER }}
                  whileTap={{ scale: 0.98, y: 0, transition: PRESS }}
                >
                  <span className="buy__glow" aria-hidden="true" />
                  <span className="buy__label">Buy outfit</span>
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* --- shipped -------------------------------------------------- */}
          {/* The whole doorstep leaves before the closing line arrives: the
              last screen of the story is the sentence on its own. */}
          <motion.div
            className="story__ship"
            aria-hidden="true"
            initial={false}
            animate={
              closing
                ? { opacity: 0, transitionEnd: { visibility: 'hidden' } }
                : { opacity: 1, visibility: 'visible' }
            }
            transition={{ duration: closing ? 0.34 : 0.26, ease: 'easeInOut' }}
          >
            <motion.div
              className="ship__door"
              style={{
                left: L.doorX,
                top: L.doorY,
                width: L.doorW,
                height: L.doorH,
                opacity: doorOpacity,
                scale: doorScale,
              }}
            >
              <DoorIcon />
            </motion.div>

            {/* What the parcel drops onto. Wide and soft on the way down, then
                punched in tight underneath it. */}
            <motion.div
              className="ship__shadow"
              style={{
                left: L.landX,
                top: L.landY + L.boxSize * FLIGHT_END_SCALE * 0.44,
                width: L.boxSize * FLIGHT_END_SCALE * 1.05,
                height: L.boxSize * FLIGHT_END_SCALE * 0.22,
                x: '-50%',
                y: '-50%',
              }}
              initial={{ opacity: 0, scaleX: 1.5 }}
              animate={
                landed
                  ? { opacity: 0.42, scaleX: [1.55, 0.84, 1] }
                  : { opacity: 0, scaleX: 1.5 }
              }
              transition={landed ? { duration: 0.5, ease: 'easeOut' } : DISMISS}
            />

            {/* Three boxes, because three things are moving it: the flight,
                which the reader scrubs; the landing, which plays once; and the
                arrival, which plays when the outfit goes out. Nesting them
                keeps any two of the three off the same style property. */}
            <motion.div
              className="ship__parcel"
              style={{
                left: L.figLeft + L.figW / 2,
                top: L.figTop + L.figH / 2,
                fontSize: L.boxSize,
                scale: flightScale,
                rotate: parcelSpin,
                x: parcelX,
                y: parcelY,
              }}
            >
              <motion.span className="ship__thud" initial={false} animate={thud}>
                <motion.span
                  className="ship__box"
                  initial={{ opacity: 0, scale: 0.2, filter: 'blur(18px)' }}
                  animate={
                    act === 'parcel'
                      ? { opacity: 1, scale: 1, filter: 'blur(0px)' }
                      : { opacity: 0, scale: 0.2, filter: 'blur(18px)' }
                  }
                  transition={act === 'parcel' ? BOX_POP : DISMISS}
                >
                  📦
                </motion.span>
              </motion.span>
            </motion.div>
          </motion.div>

          {/* --- the question --------------------------------------------- */}
          {/* The last beat, and the only one that is not a picture: the empty
              stage, and the line the whole story was walking towards. */}
          <motion.div
            className="story__closing"
            initial={false}
            animate={
              closing
                ? { opacity: 1, visibility: 'visible' }
                : { opacity: 0, transitionEnd: { visibility: 'hidden' } }
            }
            transition={{ duration: closing ? 0.42 : 0.24, ease: 'easeOut' }}
          >
            <ClosingCTA play={closing} />
          </motion.div>

          {/* --- the hand ------------------------------------------------- */}
          <motion.div
            className="story__cursor"
            aria-hidden="true"
            style={{ x: cursorX, y: cursorY, opacity: cursorOpacity }}
          >
            <motion.div animate={cursorPop}>
              {overButton ? <HandIcon /> : <PointerIcon />}
            </motion.div>
          </motion.div>
        </div>
      </div>

      <ComingSoonDialog open={soonOpen} onClose={() => setSoonOpen(false)} />
    </section>
  );
}

/* ------------------------------------------------------------------- parts */

interface PanelProps {
  side: 'left' | 'right';
  genie: MotionValue<number>;
  feedY: MotionValue<number>;
  /** How far this panel travels to meet its twin in the middle. */
  travel: number;
  width: number;
  children: React.ReactNode;
}

/**
 * One edge feed, and the genie that takes it to the middle.
 *
 * The panel is scaled about its inner edge, so the squeeze in the middle of the
 * move reads as the imagery being pulled through the centre of the screen
 * rather than shrinking in place — that pinch, and the tilt unwinding to flat
 * as it arrives, are the whole of the effect.
 *
 * The two scrims cross over on the way: the inner edge stops dissolving into
 * the copy (there is no copy left to dissolve into), and the outer edge starts,
 * because by the end that edge is standing in open paper.
 */
function Panel({ side, genie, feedY, travel, width, children }: PanelProps) {
  const dir = side === 'left' ? 1 : -1;
  const x = useTransform(genie, [0, 1], [0, travel]);
  const rotateY = useTransform(genie, [0, 1], [PANEL_TILT * dir, 0]);
  const scaleX = useTransform(genie, [0, 0.5, 1], [1, 0.82, 1]);
  const scaleY = useTransform(genie, [0, 0.5, 1], [1, 1.07, 1]);
  const skewY = useTransform(genie, [0, 0.5, 1], [0, 1.6 * dir, 0]);
  const scrimIn = useTransform(genie, [0, 0.55], [1, 0]);
  const scrimOut = useTransform(genie, [0.45, 1], [0, 1]);

  return (
    <motion.div
      className={`feed__panel feed__panel--${side}`}
      style={{ width, x, rotateY, scaleX, scaleY, skewY }}
    >
      <motion.div className="feed__parallax" style={{ y: feedY }}>
        <div className="feed__columns">{children}</div>
      </motion.div>
      <div className="feed__scrim-v" />
      <motion.div className="feed__scrim feed__scrim--in" style={{ opacity: scrimIn }} />
      <motion.div className="feed__scrim feed__scrim--out" style={{ opacity: scrimOut }} />
    </motion.div>
  );
}

/** The narrow layout's feed: one full-bleed band, drawn in towards the middle. */
function Band({
  genie,
  feedY,
  children,
}: {
  genie: MotionValue<number>;
  feedY: MotionValue<number>;
  children: React.ReactNode;
}) {
  const scale = useTransform(genie, [0, 0.5, 1], [1, 0.74, 0.8]);

  return (
    <motion.div className="feed__band" style={{ scale }}>
      <motion.div className="feed__parallax" style={{ y: feedY }}>
        <div className="feed__columns">{children}</div>
      </motion.div>
      <div className="feed__scrim-v" />
    </motion.div>
  );
}

interface ColumnProps {
  items: FeedImage[];
  index: number;
  delayStep: number;
  velocity: MotionValue<number>;
  running: boolean;
}

/** A drifting column in its slot: the reveal, and the clipping box it loops in. */
function Column({ items, index, delayStep, velocity, running }: ColumnProps) {
  return (
    <motion.div
      className="feed__column"
      initial={{ opacity: 0, y: 46 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...REVEAL, delay: 0.12 + delayStep * 0.055 }}
    >
      <DriftColumn
        items={items}
        speed={COLUMN_SPEEDS[index % COLUMN_SPEEDS.length]}
        velocity={velocity}
        running={running}
      />
    </motion.div>
  );
}

/**
 * One pin: the dot on the garment, the hairline out to the rail, and the name.
 *
 * They arrive in order down the photograph, and the chosen one arrives last —
 * it is named just as the cursor reaches it, which is what gives its name the
 * split second it holds before the noise takes it.
 */
function Pin({
  piece,
  index,
  p,
  swapped,
}: {
  piece: Piece;
  index: number;
  p: MotionValue<number>;
  swapped: boolean;
}) {
  const from = BEAT.pins[0] + index * 0.022;
  const opacity = useTransform(p, [from, from + 0.06], [0, 1]);
  const scaleX = useTransform(p, [from, from + 0.09], [0, 1]);

  return (
    <motion.li
      className={piece.chosen ? 'scene__pin scene__pin--chosen' : 'scene__pin'}
      style={{
        ...({ '--x': `${piece.x}%`, '--y': `${piece.y}%` } as React.CSSProperties),
        opacity,
      }}
    >
      <span className="scene__dot" aria-hidden="true" />
      <motion.span className="scene__line" aria-hidden="true" style={{ scaleX }} />
      <span className="scene__label">
        {piece.chosen ? (
          <ScrambleLabel from={piece.label} to={CHOSEN_AS} active={swapped} />
        ) : (
          piece.label
        )}
      </span>
    </motion.li>
  );
}

/**
 * The macOS arrow, drawn rather than borrowed: it has to sit on photographs and
 * on paper, in both palettes, so it is white with its own dark edge and a soft
 * shadow under it. The tip is the origin — the element is offset by those two
 * pixels in CSS so the point, not the corner of the box, lands on the target.
 */
function PointerIcon() {
  return (
    <svg className="cursor__arrow" viewBox="0 0 20 27" width="32" height="42" aria-hidden="true">
      <path
        d="M2.2 1.4 2.2 20.6 7.3 15.7 10.4 22.9 13.9 21.4 10.9 14.4 17.4 14.2Z"
        fill="#fff"
        stroke="rgba(12,10,9,0.88)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * And the hand it turns into over something pressable, drawn to match: the same
 * white fill, the same dark edge, the same shadow. The pointing finger is what
 * the reader is told the button by, so the swap happens as the cursor arrives
 * rather than as it presses.
 *
 * The raised finger stands about as far above the knuckles as a fingertip does
 * above a fist — drawn any longer it reads as a pointing prop rather than a hand.
 *
 * Its hotspot is the fingertip, at (10, 2) of the 26 x 29 box, which is why the
 * drawing carries its own offset in CSS — see .cursor__hand.
 */
function HandIcon() {
  return (
    <svg className="cursor__hand" viewBox="0 0 26 29" width="34" height="38" aria-hidden="true">
      <path
        d="M7.6 4.4A2.4 2.4 0 0 1 12.4 4.4V10.2C15.6 9.2 19.4 10.4 20.2 13.6C21.2 17.6 19.6 22.2 16.4 24.4L15.8 26.6L6.8 26.6L6.4 24.2C5.2 22.4 3.6 20.2 2.4 18C1.2 15.8 3.8 13.8 5.6 15.4L7.6 17.2Z"
        fill="#fff"
        stroke="rgba(12,10,9,0.88)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * A door, drawn square: a panelled white leaf in its casing, standing on a
 * threshold. Every corner is mitred rather than rounded, and the leaf is filled
 * white rather than left open, so the parcel lands against a surface instead of
 * against the paper the rest of the page is on.
 *
 * The box is 58 x 100 and the threshold sits at 96 — `layout()` reads both.
 */
function DoorIcon() {
  return (
    <svg viewBox="0 0 58 100" width="100%" height="100%" aria-hidden="true">
      <g stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M2 96V3h54v93" fill="none" strokeWidth="2.2" />
        <path d="M7 96V8h44v88" fill="#fff" strokeWidth="2.2" />
        <path d="M14 17h30v29h-30z" fill="none" strokeWidth="1.4" />
        <path d="M14 57h30v29h-30z" fill="none" strokeWidth="1.4" />
        <path d="M0 96h58" strokeWidth="2.6" />
      </g>
      <circle cx="45" cy="51" r="2.4" fill="currentColor" />
    </svg>
  );
}

/* ------------------------------------------------------------------ static */

/**
 * The same page with the motion taken out: the slogan, a still feed, and the
 * outfit named under it. There is no sequence to scrub, so there is no runway
 * and nothing is pinned — the beats become sections.
 */
function StillStory() {
  const [soonOpen, setSoonOpen] = useState(false);
  const slotCount = useColumnCount();
  const columns = useMemo(() => packColumns(STORY_FEED, slotCount, 3), [slotCount]);

  return (
    <section className="story story--still" id="the-outfit">
      <Hero />

      <div className="still__feed" aria-hidden="true">
        <div className="feed__columns">
          {columns.map((items, i) => (
            <div className="feed__column" key={i}>
              {items.map((image, j) => (
                <div className="feed-card" key={j}>
                  <img
                    className="feed-card__image"
                    src={image.src}
                    style={{ aspectRatio: image.aspectRatio }}
                    alt=""
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="still__scene">
        <figure className="still__figure">
          <img
            className="scene__image"
            src={STORY_OUTFIT.src}
            alt="A flat lay of the outfit: a charcoal officer coat, plaid wool scarf, washed baggy denim and black low-top trainers."
            width={1120}
            height={1855}
          />
        </figure>

        <ul className="still__pieces">
          {PIECES.map((piece) => (
            <li key={piece.label}>
              <span className="scene__dot" aria-hidden="true" />
              <span className="scene__label">{piece.chosen ? CHOSEN_AS : piece.label}</span>
            </li>
          ))}
        </ul>

        <button type="button" className="buy" onClick={() => setSoonOpen(true)}>
          <span className="buy__label">Buy outfit</span>
        </button>
      </div>

      {/* A beat on the stage when there is a stage; a section under it here. */}
      <ClosingCTA />

      <ComingSoonDialog open={soonOpen} onClose={() => setSoonOpen(false)} />
    </section>
  );
}

/* ------------------------------------------------------------------ helpers */

/**
 * The stage's own box. It is the viewport, so the first render can size itself
 * off `window` and be right — the observer is only here for resizes and for the
 * mobile toolbar sliding away underneath it.
 */
function useStageSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState(() => ({
    w: typeof window === 'undefined' ? 1440 : window.innerWidth,
    h: typeof window === 'undefined' ? 900 : window.innerHeight,
  }));

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const measure = () => {
      const box = node.getBoundingClientRect();
      const w = Math.round(box.width);
      const h = Math.round(box.height);
      setSize((current) => (current.w === w && current.h === h ? current : { w, h }));
    };

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, [ref]);

  return size;
}

/**
 * Whether progress is past a line, given which side of it we were on.
 *
 * The line moves under the reader by `slack` once it has been crossed, so a
 * value sitting on top of one — a trackpad settling, a spring ringing — cannot
 * flicker the state it drives. Coming back the other way still un-crosses it:
 * the whole story is scrubbable, and a line is no exception.
 */
function crossed(v: number, at: number, was: boolean, slack = 0.03): boolean {
  return was ? v > at - slack : v > at;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
