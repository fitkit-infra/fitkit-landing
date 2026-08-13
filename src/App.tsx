import Hero from './components/Hero';
import PlaceholderSection from './components/PlaceholderSection';
import ProofStrip from './components/ProofStrip';
import TopBar from './components/TopBar';

/**
 * Page order is deliberate: the hero's copy and the proof strip are one
 * continuous move from words into product, so the strip is pulled up under the
 * hero and dissolves into it (see ProofStrip.css). Everything below the fold is
 * still scaffolding — copy lands in a follow-up brief.
 */
export default function App() {
  return (
    <div className="page">
      <TopBar />
      <main>
        <Hero />
        <ProofStrip />

        {/* Below the fold — to be written:
            • how it works
            • risk reversal: free, no exclusivity, live in minutes
            • closing CTA (reuse <CTAButton size="small" />) */}
        <PlaceholderSection id="how-it-works" label="How it works" />
        <PlaceholderSection id="risk-reversal" label="Risk reversal" />
        <PlaceholderSection id="list-your-brand" label="Closing CTA" />
      </main>
    </div>
  );
}
