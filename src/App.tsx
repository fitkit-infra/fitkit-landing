import Creators from './components/Creators';
import Footer from './components/Footer';
import Roadmap from './components/Roadmap';
import ScrollStory from './components/ScrollStory';
import TopBar from './components/TopBar';
import { useRoute } from './hooks/useRoute';

/**
 * The site is three pages inside one document: the landing page, the roadmap at
 * `#/roadmap`, and the creators page at `#/for-indie-creators`. The bar and the
 * footer are the frame around all three, so they sit out here and only the
 * middle is swapped — neither of the other two is a section the landing page
 * can be scrolled into.
 *
 * The route is read once, here, and handed down (see hooks/useRoute).
 */
export default function App() {
  const route = useRoute();

  return (
    <div className="page">
      <TopBar route={route} />
      {route === 'roadmap' ? <Roadmap /> : route === 'creators' ? <Creators /> : <Landing />}
      <Footer />
    </div>
  );
}

/**
 * The landing page is one told sequence, ending in one question.
 *
 * ScrollStory holds all of it on a single pinned stage: the slogan, the feed
 * pulling itself into the middle of the screen, the outfit being picked out of
 * it, bought, shipped — and then, on the stage the doorstep leaves empty, the
 * closing line. That line is the last beat of the story rather than a section
 * under it, which is why there is nothing beside the story here.
 */
function Landing() {
  return (
    <main>
      <ScrollStory />
    </main>
  );
}
