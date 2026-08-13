import ClosingCTA from './components/ClosingCTA';
import Footer from './components/Footer';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import ProofStrip from './components/ProofStrip';
import TopBar from './components/TopBar';

/**
 * Page order is deliberate: the hero's copy and the proof strip are one
 * continuous move from words into product, so the strip is pulled up under the
 * hero and dissolves into it (see ProofStrip.css). Below the fold the roadmap
 * answers what happens if a brand lists, and then the page asks once.
 */
export default function App() {
  return (
    <div className="page">
      <TopBar />
      <main>
        <Hero />
        <ProofStrip />
        <HowItWorks />
        <ClosingCTA />
      </main>
      <Footer />
    </div>
  );
}
