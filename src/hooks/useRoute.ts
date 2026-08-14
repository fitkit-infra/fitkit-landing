import { useEffect, useRef, useState } from 'react';

/**
 * The site's router, such as it is.
 *
 * Routes are fragments (`#/roadmap`), not paths, and deliberately so: this is a
 * static build with nothing in front of it, and a real path would 404 on a
 * refresh or a shared link unless the host were configured to rewrite it. A
 * fragment needs no host cooperation at all, which is the same reason nothing
 * else on this site needs a backend.
 *
 * The page's in-page anchors (`#how-it-works`) share that address bar, so a
 * fragment only names a route when it starts with `#/` — everything else is a
 * position on the landing page and leaves the route alone.
 */
export type Route = 'home' | 'roadmap';

const ROUTES: Record<string, Route> = {
  '#/roadmap': 'roadmap',
};

/** The route a fragment names. Anything unrecognised is the landing page. */
export function routeFor(hash: string): Route {
  return ROUTES[hash.toLowerCase().replace(/\/+$/, '')] ?? 'home';
}

/**
 * The current route, kept in step with the address bar — link clicks, the back
 * button and a pasted URL all arrive the same way.
 *
 * Call this once, at the top of the tree: it owns the scroll reset that comes
 * with a change of page, and that should happen once per navigation. Anything
 * further down takes the route as a prop.
 */
export function useRoute(): Route {
  const [route, setRoute] = useState(() => routeFor(window.location.hash));
  const shown = useRef(route);

  useEffect(() => {
    const read = () => setRoute(routeFor(window.location.hash));

    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  // A new page starts at the top, and gets there instantly: `html` scrolls
  // smoothly for in-page anchors, which is the wrong move for a page that has
  // just been replaced. Guarded on the route actually changing rather than on
  // "not the first render", so an in-page anchor — which re-runs nothing here —
  // and a deep link both leave the browser's own scrolling alone.
  useEffect(() => {
    if (shown.current === route) return;

    shown.current = route;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [route]);

  return route;
}
