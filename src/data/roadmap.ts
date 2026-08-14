import items from './roadmap.json';

/**
 * The roadmap page's contents.
 *
 * `roadmap.json` next to this file is the whole editing surface: add an entry,
 * or change one word — a status — and the page redraws around it. JSON rather
 * than a `.ts` list precisely because it holds no code and no comments, so
 * moving an item along is a one-word edit that cannot break a build.
 *
 * It is imported, which means it is bundled: edit, rebuild, deploy. The page
 * never fetches and there is no backend behind it — same principle as the proof
 * strip's manifest (see feed.ts). Serving it from `public/` instead would let
 * the file be swapped on the host without a rebuild, at the cost of a loading
 * state on a page that otherwise has none. Not worth it for a list that changes
 * when the product does.
 *
 * This module is the typed door onto that file: it fixes the shape, forgives the
 * spellings a human types into a status field, and puts the list in order.
 */

/** The three states an item can be in. `in progress` is written as it reads. */
export const STATUSES = ['done', 'in progress', 'pending'] as const;

export type RoadmapStatus = (typeof STATUSES)[number];

export interface RoadmapItem {
  /** 1 is the top of the list, 2 sits under it, and so on. Ties keep file order. */
  order: number;
  title: string;
  description: string;
  status: RoadmapStatus;
}

/** What the item's chip says. */
export const STATUS_LABEL: Record<RoadmapStatus, string> = {
  done: 'Done',
  'in progress': 'In progress',
  pending: 'Pending',
};

/** How the status is counted in the tally under the page title. */
export const STATUS_TALLY: Record<RoadmapStatus, string> = {
  done: 'shipped',
  'in progress': 'in progress',
  pending: 'ahead',
};

/** `in progress` carries a space and a class name cannot. */
export const STATUS_SLUG: Record<RoadmapStatus, string> = {
  done: 'done',
  'in progress': 'in-progress',
  pending: 'pending',
};

/**
 * `In Progress`, `in-progress` and `in progress` all mean the same thing, and
 * the JSON is written by hand, so all three are read the same way. Anything
 * unrecognised falls back to `pending` rather than dropping the item: a typo in
 * a status should cost that item its chip, not its place on the page.
 */
function readStatus(raw: string): RoadmapStatus {
  const cleaned = raw.trim().toLowerCase().replace(/[-_\s]+/g, ' ');

  return (STATUSES as readonly string[]).includes(cleaned) ? (cleaned as RoadmapStatus) : 'pending';
}

/**
 * The list as the page renders it: sorted by `order`, low to high. `map` copies
 * first, so the sort never touches the imported module, and `sort` is stable —
 * two items sharing an order number stay in the order the file lists them.
 */
export const ROADMAP: RoadmapItem[] = items
  .map((item) => ({ ...item, status: readStatus(item.status) }))
  .sort((a, b) => a.order - b.order);

/**
 * How many items sit in each status, in the order `STATUSES` lists them. Empty
 * statuses are dropped, so a roadmap with nothing shipped yet does not announce
 * "0 shipped".
 */
export const ROADMAP_TALLY = STATUSES.map((status) => ({
  status,
  count: ROADMAP.filter((item) => item.status === status).length,
})).filter((entry) => entry.count > 0);
