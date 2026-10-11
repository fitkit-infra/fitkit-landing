import { useEffect } from 'react';
import './Policies.css';

/** One place to change when the policy is next touched: dated in the page. */
const EFFECTIVE = 'October 11, 2026';

const CONTACT = 'contactfitkit8@gmail.com';

/**
 * The policies page at `#/policies`, linked from the top bar. For now it is
 * one policy — the Fitkit browser extension's privacy policy, which the
 * Chrome Web Store requires to be publicly reachable.
 *
 * Prose over motion: nothing here animates, because a reader arrives for the
 * words, not for a beat. The page borrows the roadmap's arrangement — a
 * centred head, then a left-set reading column — so it reads as the same site
 * without sharing any of the roadmap's machinery.
 */
export default function Policies() {
  // One document, several pages: the title belongs to whichever is on screen.
  useEffect(() => {
    const previous = document.title;
    document.title = 'Privacy — Fitkit';

    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <main className="policy shell">
      <header className="policy__head">
        <h1 className="policy__title">Privacy Policy</h1>
        <p className="policy__lede">
          This policy covers the Fitkit browser extension (“Fitkit”) and its
          backend, <code>fitkit-api</code>. It explains, plainly and
          completely, what data Fitkit handles when you use it to find and shop
          the items in a Pinterest pin.
        </p>
        <p className="policy__meta">Effective {EFFECTIVE}</p>
      </header>

      <div className="policy__body">
        <section className="policy__section">
          <h2>The short version</h2>
          <p>
            Fitkit only processes a pin when you ask it to — no background
            monitoring of your browsing. It has no accounts, no analytics, no
            trackers, and it never collects your name, email, browsing history,
            or anything you type. Everything it does handle is listed below.
          </p>
        </section>

        <section className="policy__section">
          <h2>What Fitkit handles, and where it goes</h2>
          <ul>
            <li>
              <strong>The pin&rsquo;s image.</strong> When you scan a pin,
              Fitkit fetches the image from Pinterest&rsquo;s own CDN and sends
              it to our server, <code>fitkit-api</code>, which forwards it to
              the Google Gemini API to detect the wearable items in it.
            </li>
            <li>
              <strong>Crops of the detected items.</strong> The reverse-image
              shopping search needs a publicly reachable image URL, so each
              crop is hosted on imgbb for a maximum of{' '}
              <strong>10 minutes</strong>, after which imgbb deletes it
              automatically. The crop&rsquo;s hosted URL is then sent to the
              shopping search provider you selected — SearchApi or Scrapingdog —
              to find merchant listings and prices.
            </li>
            <li>
              <strong>A random install token.</strong> A random identifier
              generated on your device, used only to keep one install from
              exhausting everyone&rsquo;s shared request quota. It identifies an
              install, not a person — there are no accounts.
            </li>
            <li>
              <strong>Daily exchange rates.</strong> Fetched from Frankfurter,
              a free exchange-rate API, through our server. No Fitkit data is
              included in those requests.
            </li>
          </ul>
        </section>

        <section className="policy__section">
          <h2>What stays on your device</h2>
          <p>
            Your settings, and a cache of scan results keyed by the pin&rsquo;s
            ID and URL, live in <code>chrome.storage.local</code>. Cache entries
            expire after 24 hours. Everything stored locally is removed when
            you uninstall Fitkit, and none of it is ever transmitted except the
            scan inputs above while a scan is running.
          </p>
        </section>

        <section className="policy__section">
          <h2>The Fitkit server</h2>
          <p>
            Scans are routed through our own server on Cloudflare Workers so
            the extension ships with no API keys. It stores no images, crops,
            or request content — scan data exists in memory only while a
            request is processed. It logs only the request method, path,
            response status, and duration for reliability, never images or
            identifiers. Your IP address is used transiently, via Cloudflare,
            solely to enforce a rate limit that protects the shared API keys;
            it is not stored.
          </p>
        </section>

        <section className="policy__section">
          <h2>What Fitkit never collects or does</h2>
          <ul>
            <li>
              No browsing history: Fitkit reads only the Pinterest pin page you
              actively scan.
            </li>
            <li>
              No accounts, names, email addresses, or personal identifiers; no
              authentication, financial, health, or precise-location data; no
              tracking of clicks, scrolling, or keystrokes.
            </li>
            <li>
              No analytics, telemetry, trackers, or advertising of any kind. No
              selling or sharing of data with advertisers or data brokers —
              your data is used solely to run the scan you requested.
            </li>
            <li>
              Nothing is read, modified, or injected into any page other than
              Pinterest pin pages, and on those only the pin&rsquo;s image and
              URL.
            </li>
          </ul>
        </section>

        <section className="policy__section">
          <h2>Third parties</h2>
          <ul>
            <li>
              <strong>Cloudflare</strong> — hosts the Fitkit server.
            </li>
            <li>
              <strong>Google (Gemini API)</strong> — receives the pin image to
              detect items in it.
            </li>
            <li>
              <strong>imgbb</strong> — temporarily hosts item crops
              (auto-deleted after 10 minutes).
            </li>
            <li>
              <strong>SearchApi / Scrapingdog</strong> — the shopping search
              provider selected in your settings.
            </li>
            <li>
              <strong>Frankfurter</strong> — exchange rates; receives no Fitkit
              data.
            </li>
            <li>
              <strong>Affiliate networks.</strong> Some outbound product links
              may be affiliate links (for example via sovrn or Skimlinks). If
              you buy through one, the network pays Fitkit a commission; this
              costs you nothing extra and sends Fitkit no data about you.
            </li>
          </ul>
        </section>

        <section className="policy__section">
          <h2>Permissions, and why</h2>
          <ul>
            <li>
              <code>activeTab</code> and <code>scripting</code> — to read the
              pin on the tab you acted on. Access is granted per action, for
              that one tab, only when you click.
            </li>
            <li>
              <code>storage</code> — for the settings and caches described
              above.
            </li>
            <li>
              Access to <code>i.pinimg.com</code> (Pinterest&rsquo;s image CDN)
              — to fetch the pin&rsquo;s image so the crop can be made on your
              device.
            </li>
            <li>
              Access to <code>fitkit-api</code> — our backend, the only server
              Fitkit talks to directly.
            </li>
          </ul>
          <p>
            Fitkit runs only code that ships inside the extension package. It
            never loads or executes remote code.
          </p>
        </section>

        <section className="policy__section">
          <h2>Data retention</h2>
          <ul>
            <li>
              Crops on imgbb: automatically deleted after 10 minutes.
            </li>
            <li>
              Fitkit server: nothing retained; logs contain no user data.
            </li>
            <li>
              On your device: settings until changed or uninstalled; scan
              results for 24 hours.
            </li>
          </ul>
          <p>
            Uninstalling Fitkit deletes everything stored on your device, and
            there is no account to delete — the install token identifies an
            install, not a person. Questions about data that reached our server
            can be sent to the contact below.
          </p>
        </section>

        <section className="policy__section">
          <h2>Chrome Web Store Limited Use</h2>
          <p>
            The use of information received from Google APIs will adhere to the
            Chrome Web Store User Data Policy, including the Limited Use
            requirements.
          </p>
        </section>

        <section className="policy__section">
          <h2>Children</h2>
          <p>
            Fitkit is not directed at children under 13 and collects no data
            knowingly from them.
          </p>
        </section>

        <section className="policy__section">
          <h2>Changes to this policy</h2>
          <p>
            If it changes, this page changes and the effective date above moves
            with it.
          </p>
        </section>

        <section className="policy__section">
          <h2>Contact</h2>
          <p>
            Questions about this policy or your data:{' '}
            <a className="policy__mail" href={`mailto:${CONTACT}`}>
              {CONTACT}
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
