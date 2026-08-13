# Fitkit landing

Landing page for Fitkit, aimed at independent fashion brand founders. React + Vite,
plain CSS, no UI kit. Light only.

```bash
npm install
npm run dev      # http://localhost:5183
npm run build    # type-check + production build into dist/
npm run preview
```

## Structure

| Path | What it is |
| --- | --- |
| `src/components/TopBar.tsx` | Sticky bar: mark, wordmark, nav. Picks up a blurred backdrop once the page scrolls. |
| `src/components/Hero.tsx` | Headline (two set lines) and the page's single CTA. |
| `src/components/ProofStrip.tsx` | Auto-scrolling masonry grid of real outfit imagery. |
| `src/components/PlaceholderSection.tsx` | Empty, outlined-in-dev scaffolding for the sections below the fold. |
| `src/data/nav.ts` | Nav links and the CTA, as config. |
| `src/data/feed.ts` | The proof strip's static image manifest. |
| `src/motion/springs.ts` | The shared spring set. Every transition on the page comes from here. |

Sections below the proof strip — how it works, risk reversal, closing CTA — are
scaffolded and deliberately empty; their copy arrives in a follow-up brief.
`App.tsx` lists them in order.

## Swapping the proof strip imagery

The images are static files, checked in. There is no backend and the page does not
need one — the strip is proof, not a live feed.

1. Drop new files into `public/feed/`. 720px wide is plenty; the cards are never
   rendered larger than about 300px.
2. Update `FEED_IMAGES` in `src/data/feed.ts` with each file's path and its
   `aspectRatio` (width / height).

The aspect ratio is what reserves a card's height before its image decodes, so a
wrong value makes the grid reflow mid-scroll. Regenerate the list from the files:

```bash
python3 -c "from PIL import Image; import glob; \
  [print(f, *Image.open(f).size) for f in sorted(glob.glob('public/feed/*'))]"
```

Any number of images works — the grid packs them into columns by height and walks
the list with a co-prime stride so neighbouring columns don't repeat in step. More
images means fewer visible repeats; a dozen is the practical minimum at six columns.

`public/logo-mark.png` is the app's icon art recut for a light surface — the same
cat, strokes filled with `--ink` on transparency, trimmed to its bounding box. The
app ships it white-on-transparent for its black canvas, which is invisible here.

## Design language

- **Surface** — warm off-white paper (`--paper: #faf8f5`), never pure white. No dark mode.
- **Type** — Fraunces (display serif, `opsz 144 / SOFT 34 / WONK 1`) for headlines
  and the wordmark; Inter for every piece of UI chrome and body copy. The split is
  disciplined: the serif never sets a button, the sans never sets a headline.
- **Accent** — a single deep clay (`--clay: #8f4a31`), pulled from the outfit
  imagery. It appears on the CTA and on the nav's hover rule. Nowhere else.
- **Motion** — springs only; no durations, no named easing curves for anything that
  moves (`src/motion/springs.ts`). The headline is set line by line out of its own
  clipping box, the strip's columns drift at their own speeds and parallax against
  the page, and the drift is coupled to scroll velocity through a damped spring, so
  a flung page pushes the feed along and it eases back. All of it stops under
  `prefers-reduced-motion`, which leaves a static, still-masked grid.

## The proof strip

The visual structure is a port of the app's feed (`fitkit/frontend`:
`HomeScreen` + `FeedCard`) — same masonry packing, same aspect-ratio-driven card
heights, same hairline-bordered rounded cards, with the title and author line
removed. It loops by holding two copies of each column and jumping back by exactly
one measured copy height, and it masks to nothing at its top edge so the imagery
dissolves into the hero's paper rather than butting against it.
