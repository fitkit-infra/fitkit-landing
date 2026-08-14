import ClosingCTA from './components/ClosingCTA';
import Footer from './components/Footer';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ProofStrip from './components/ProofStrip';
import Roadmap from './components/Roadmap';
import TopBar from './components/TopBar';
import { useRoute } from './hooks/useRoute';

/**
 * The site is two pages inside one document: the landing page, and the roadmap
 * at `#/roadmap`. The bar and the footer are the frame around both, so they sit
 * out here and only the middle is swapped — the roadmap is a page of its own,
 * never a section the landing page can be scrolled into.
 *
 * The route is read once, here, and handed down (see hooks/useRoute).
 */
export default function App() {
  const route = useRoute();

  return (
    <div className="page">
      <TopBar route={route} />
      {route === 'roadmap' ? <Roadmap /> : <Landing />}
      <Footer />
    </div>
  );
}

/**
 * Page order is deliberate: the hero's copy and the proof strip are one
 * continuous move from words into product, so the strip is pulled up under the
 * hero and dissolves into it (see ProofStrip.css). Below the fold the roadmap
 * answers what happens if a brand lists, and then the page asks once.
 */
function Landing() {
  return (
    <main>
      <Hero />
      <ProofStrip />
      <HowItWorks />
      <ClosingCTA />
    </main>
  );
}
