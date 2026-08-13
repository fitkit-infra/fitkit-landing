/**
 * Below-the-fold copy, kept as data for the same reason the nav is: the
 * sections render whatever is in these lists, so a copy edit never touches a
 * component.
 *
 * Step four names a commission. That is a pricing statement — keep it in sync
 * with whatever the commercial terms actually are, and review this block before
 * the page goes live externally.
 */
export type StepIconName = 'plus' | 'brain' | 'heart' | 'handshake';

export interface Step {
  icon: StepIconName;
  title: string;
  body: string;
}

export const STEPS: Step[] = [
  {
    icon: 'plus',
    title: 'Add your items',
    body: 'Upload a catalog: a few product photos and purchase links.',
  },
  {
    icon: 'brain',
    title: 'Get curated',
    body: "Fitkit's engine creates buyable posts from your pieces and suggests them to your target buyer.",
  },
  {
    icon: 'heart',
    title: 'Get discovered',
    body: 'People shopping at Fitkit will purchase your items as part of sets.',
  },
  {
    icon: 'handshake',
    title: 'Take profit',
    body: 'You receive the main cost of the item, we take a commission.',
  },
];
