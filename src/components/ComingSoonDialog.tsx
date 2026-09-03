import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { REVEAL_LIGHT } from '../motion/springs';
import './ComingSoonDialog.css';

interface ComingSoonDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * The note behind the buy button: there is nothing to check out into yet, and
 * saying so is the honest version of that button.
 *
 * A dialog rather than a toast — it is answering a deliberate click, so it
 * takes the screen until it is dismissed. Escape and the backdrop both close
 * it, and focus moves into the box on open and back to whatever opened it on
 * close, so a keyboard is never left behind the scrim.
 */
export default function ComingSoonDialog({ open, onClose }: ComingSoonDialogProps) {
  const reduceMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;

    opener.current = document.activeElement;
    boxRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    // The page behind a modal should not scroll under it.
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = scrollLock;
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="soon"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className="soon__box"
            ref={boxRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="soon-title"
            tabIndex={-1}
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
            transition={REVEAL_LIGHT}
            // The box is inside the backdrop, and the backdrop closes on click.
            onClick={(event) => event.stopPropagation()}
          >
            <p className="soon__eyebrow">Fitkit</p>

            <h2 className="soon__title" id="soon-title">
              Coming soon to iOS and Android
            </h2>

            <p className="soon__body">
              Buying a set happens in the app, and the app is not out yet. The feed, the outfits and
              the brands are all real — the checkout is what is left.
            </p>

            <button type="button" className="soon__close" onClick={onClose}>
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
