import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'fitkit-theme';

/**
 * The page's light/dark switch.
 *
 * The applied theme is a `data-theme` attribute on <html>, and every colour on
 * the page is a token that reads from it (see global.css). The attribute is set
 * before first paint by the inline script in index.html, so this hook reads the
 * current state off the document rather than deciding it a second time — that
 * is what keeps the button from disagreeing with what is already on screen.
 */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';

      if (next === 'dark') {
        document.documentElement.dataset.theme = 'dark';
      } else {
        delete document.documentElement.dataset.theme;
      }

      // The choice outranks the system preference from here on.
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private mode, storage disabled — the switch still works for the session.
      }

      return next;
    });
  }, []);

  return [theme, toggle];
}
