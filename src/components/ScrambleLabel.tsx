import { useEffect, useRef } from 'react';

/**
 * One word dissolving into another through noise.
 *
 * The label is written straight into the DOM node on every frame rather than
 * through state: this runs at 60fps for about two thirds of a second, and
 * re-rendering the pin — and its siblings — that many times to change a string
 * is work for nothing.
 *
 * The resolve runs left to right. Each character has its own settle point along
 * the run, so the target is not revealed all at once and the tail of the word
 * is still churning while the head has already landed.
 */

/** Deliberately not letters: the in-between state should not read as a word. */
const GLYPHS = '▚▞▛▜█▓▒░#%&@$*+=<>/\\|{}[]!?~^§±';

/** Milliseconds the dissolve runs for. Long enough to be seen, short enough to
 *  still read as a glitch rather than an animation. */
const DURATION = 660;

/** How much of the run is spent staggering the settle points across the word. */
const SPREAD = 0.55;

interface ScrambleLabelProps {
  /** What stands there until the swap. */
  from: string;
  /** What it becomes. */
  to: string;
  /** The swap, driven by the page's scroll — false again puts `from` back. */
  active: boolean;
}

export default function ScrambleLabel({ from, to, active }: ScrambleLabelProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (!active) {
      node.textContent = from;
      node.classList.remove('scramble--done');
      return;
    }

    const length = Math.max(from.length, to.length);
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / DURATION, 1);

      let out = '';
      for (let i = 0; i < length; i++) {
        const settle = (i / length) * SPREAD;
        const local = (t - settle) / (1 - SPREAD);

        if (local >= 1) out += to[i] ?? '';
        // A space stays a space: scrambling the gaps turns the word into a
        // block and the shape of the phrase is half of what is recognised.
        else if (to[i] === ' ' && local > 0) out += ' ';
        else if (local > 0) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += from[i] ?? '';
      }

      node.textContent = out;

      if (t < 1) frame = requestAnimationFrame(tick);
      else {
        node.textContent = to;
        node.classList.add('scramble--done');
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [active, from, to]);

  // The initial text is server-truthful; the effect owns it from then on.
  return (
    <span className="scramble" ref={ref}>
      {from}
    </span>
  );
}
