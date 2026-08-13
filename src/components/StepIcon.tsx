import { Brain, Handshake, Heart, Plus } from 'lucide-react';
import type { StepIconName } from '../data/steps';

/**
 * The four roadmap glyphs, from Lucide — one set, one stroke weight, and it
 * carries the three (brain, handshake, heart) that no UI icon set ships.
 *
 * They are set a little lighter than Lucide's default 2, which is drawn for
 * chrome at 16px; at pill size on paper that weight reads heavier than the
 * hairlines around it.
 */
const ICONS: Record<StepIconName, typeof Plus> = {
  plus: Plus,
  brain: Brain,
  heart: Heart,
  handshake: Handshake,
};

export default function StepIcon({ name }: { name: StepIconName }) {
  const Icon = ICONS[name];

  return <Icon className="how__icon" strokeWidth={1.6} absoluteStrokeWidth aria-hidden="true" />;
}
