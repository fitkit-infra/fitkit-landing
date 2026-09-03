import ClosingCTA from './components/ClosingCTA';
import Creators from './components/Creators';
import Footer from './components/Footer';
import Hero from './components/Hero';
import OutfitShowcase from './components/OutfitShowcase';
import ProofStrip from './components/ProofStrip';
import Roadmap from './components/Roadmap';
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
 * Page order is deliberate: the hero's copy and the proof strip are one
 * continuous move from words into product, and they hold the whole first
 * screen. Below the fold one outfit is taken apart piece by piece — the
 * shopper's answer to what the feed above actually is — and then the page asks
 * once. What listing involves is a page of its own now (see Creators).
 */
function Landing() {
  return (
    <main>
      {/* One stage, two elements: on a wide screen the strip's panels are
          positioned inside this box against the screen edges and the copy
          stands between them; narrower, the stage is an ordinary block and the
          two simply stack (see Hero.css). */}
      <div className="stage">
        <Hero />
        <ProofStrip />
      </div>
      <OutfitShowcase />
      <ClosingCTA />
    </main>
  );
}
