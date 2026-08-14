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
| `src/App.tsx` | The two pages — landing and roadmap — inside the bar-and-footer frame. |
| `src/components/TopBar.tsx` | Sticky bar: mark, wordmark, nav. Picks up a blurred backdrop once the page scrolls. |
| `src/components/Hero.tsx` | Headline (two set lines) and the page's single CTA. |
| `src/components/ProofStrip.tsx` | Auto-scrolling masonry grid of real outfit imagery. |
| `src/components/PlaceholderSection.tsx` | Empty, outlined-in-dev scaffolding for the sections below the fold. |
| `src/components/Roadmap.tsx` | The roadmap page at `#/roadmap`, drawn from the JSON below. |
| `src/data/nav.ts` | Nav links and the CTA, as config. `compact: false` drops a link from the collapsed mobile bar. |
| `src/data/feed.ts` | The proof strip's static image manifest. |
| `src/data/roadmap.json` | **The roadmap itself. The only file to edit to move an item along.** |
| `src/hooks/useRoute.ts` | The router: which page the fragment names, and the scroll reset that comes with a change of page. |
| `src/motion/springs.ts` | The shared spring set. Every transition on the page comes from here. |

Sections below the proof strip — how it works, risk reversal, closing CTA — are
scaffolded and deliberately empty; their copy arrives in a follow-up brief.
`App.tsx` lists them in order.

## The roadmap page

`#/roadmap`, linked from the top bar and reachable no other way — it is a page of
its own, not a section the landing page can be scrolled into. Everything on it
comes from `src/data/roadmap.json`, which is a flat list of items:

```json
[
  {
    "order": 1,
    "title": "The feed",
    "description": "Outfits from every brand at once, packed into one endless grid.",
    "status": "done"
  }
]
```

| Field | What it does |
| --- | --- |
| `order` | Position in the run. `1` is at the top, `2` sits under it. Gaps are fine — the list is sorted, not indexed — and two items sharing a number keep the order the file lists them in. |
| `title` | The item's line, set in the serif. |
| `description` | A sentence or two under it. Anything past about three lines starts to fight the rail. |
| `status` | One of `done`, `in progress`, `pending`. |

**Changing a status is a one-word edit to that file.** `In Progress`, `in-progress`
and `in progress` are all read the same way, and an unrecognised status falls back
to `pending` rather than dropping the item — a typo costs an item its chip, not its
place on the page. The JSON is imported rather than fetched, so it is bundled at
build time: edit, `npm run build`, deploy. Moving the file to `public/` would make
it swappable on the host without a rebuild, at the cost of a loading state on a
page that currently has none.

The status is told three times over, so it never rests on colour alone: the node's
mark (a check, a filled dot, nothing at all), the chip's word, and the rail — which
carries the clay only as far as the shipped work actually goes, and runs on as a
hairline from there. The item in progress gets the one halo on the page, because
that is what a reader came here to find.

## Routing

Two pages, one document, and no router dependency. Routes are fragments —
`#/roadmap` — rather than paths, because this is a static build with nothing in
front of it: a real path would 404 on a refresh or a shared link unless the host
were configured to rewrite it, and a fragment needs no host cooperation at all.
Same reason nothing else here needs a backend.

The landing page's own anchors (`#how-it-works`, `#list-your-brand`) share that
address bar, so a fragment only names a page when it starts with `#/`; everything
else is a position on the landing page and leaves the route alone. Adding a page
means adding a line to `ROUTES` in `src/hooks/useRoute.ts` and an entry in
`src/data/nav.ts` — the bar marks whichever one is open by holding its hover rule
out, which is the bar's existing piece of state rather than a second one.

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
- **Accent** — a single deep clay (`--clay`), pulled from the outfit imagery. It
  appears on the CTA, on the nav's hover rule, on the how-it-works glyphs, and on
  the roadmap's rail and status marks, where it is the page's actual subject.
  Nowhere else, and never as small type: clay reads clearly as a surface or a
  rule, and poorly as 11px type on the night palette.
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

The grid is laid out in *slots*, and from five slots up the outermost slot on each
side is left empty, so the imagery stops short of the screen edges without any of
the remaining columns shifting: the slots stay full-bleed and equal-width, the
outer two simply hold nothing. `useColumnCount` picks the slot count per breakpoint
and is written around that — six slots (four filled) on a desktop, five (three
filled) on a small laptop or tablet, and full-bleed four or three below that, where
there aren't two columns to spare.

## Top bar alignment

The bar's contents line up with the hero headline's text, not with the page
gutters: the mark sits directly over the headline's first letter and the last nav
item ends on its last. `Hero` measures the widest set line and publishes it as
`--headline-width`; `.topbar__inner` is that wide and centred. If the headline copy
or its type size changes, the bar follows automatically — nothing to keep in sync.
