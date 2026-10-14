import Head from 'next/head';
import styles from './privacy-policy.module.css';

const PrivacyPolicy = () => (
  <>
    <Head>
      <title>Bikesy Privacy Policy</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta
        name="description"
        content="How Bikesy handles location, routes, search, analytics and other information, and your privacy choices."
      />
      <link rel="canonical" href="https://bikesy.com/privacy-policy" />
      <link rel="icon" href="/favicon/favicon-32x32.png" />
    </Head>

    <main className={styles.policy}>
      <a href="/">Back to Bikesy</a>
      <h1>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: October 14, 2026</p>
      <p>
        BlinkTag Inc. operates Bikesy. This policy covers bikesy.com, our routing service,
        the Bikesy iOS app and regional Bikesy sites that link to it. You can plan routes
        without an account. For privacy questions or requests, email{' '}
        <a href="mailto:info@blinktag.com">info@blinktag.com</a>.
      </p>

      <nav aria-label="Privacy policy sections">
        <ul>
          <li>
            <a href="#routes-location">Routes and location</a>
          </li>
          <li>
            <a href="#maps-conditions">Maps, search and conditions</a>
          </li>
          <li>
            <a href="#analytics">Website analytics</a>
          </li>
          <li>
            <a href="#logs-contact">Logs and messages</a>
          </li>
          <li>
            <a href="#storage">Device data and shared links</a>
          </li>
          <li>
            <a href="#sharing">Providers and disclosures</a>
          </li>
          <li>
            <a href="#retention">Retention and deletion</a>
          </li>
          <li>
            <a href="#choices-rights">Your choices and rights</a>
          </li>
          <li>
            <a href="#security">Security and processing locations</a>
          </li>
          <li>
            <a href="#children-changes">Children and policy changes</a>
          </li>
        </ul>
      </nav>

      <section aria-labelledby="routes-location">
        <h2 id="routes-location">Routes and location</h2>
        <p>
          Bikesy receives your starting and destination coordinates and route preferences
          to calculate directions, distance and elevation. These locations can reveal
          sensitive places, including your home or workplace.
        </p>
        <p>
          Device-location access is optional and requires browser or iOS permission. It
          helps show your position, select an endpoint or look up nearby places. The iOS
          map may update your position while in use; the app does not implement background
          ride recording. You can instead enter an address or choose a map point. Those
          selected locations still need to be processed for the features you request.
        </p>
      </section>

      <section aria-labelledby="maps-conditions">
        <h2 id="maps-conditions">Maps, search and conditions</h2>
        <ul>
          <li>
            <strong>Website:</strong> Google provides address suggestions and place
            lookups, receiving searches as you type and coordinates used for address
            lookups. Mapbox provides maps and layers, receiving requests for the areas you
            view.
          </li>
          <li>
            <strong>iOS app:</strong> The redesigned app uses Apple for maps, search,
            place details and address lookups. Older releases use Google Places and Mapbox
            geocoding alongside the native iOS map. These services receive the searches,
            places or coordinates needed for those features.
          </li>
          <li>
            <strong>Weather and air quality:</strong> Displaying route conditions sends a
            location associated with your route to Bikesy, which forwards it to
            OpenWeather and AirNow. These requests happen automatically with route
            conditions. Older app releases contact OpenWeather directly.
          </li>
        </ul>
        <p>
          Providers contacted by your device also receive connection information, such as
          your IP address and device or browser details. Denying location permission does
          not prevent processing of places you enter or view.
        </p>
      </section>

      <section aria-labelledby="analytics">
        <h2 id="analytics">Website analytics</h2>
        <p>
          Where enabled, Google Analytics helps us understand website visits and feature
          use. The redesigned iOS app does not include this website analytics integration;
          websites opened from the app are separate.
        </p>
        <p>
          Custom events sent by Bikesy&apos;s application code describe page views, route
          submissions, preferences, clearing a route and the outcome of requests to use
          location. These custom events exclude addresses, coordinates, search text and
          route shapes, and remove trip details from page addresses. This filtering does
          not describe all data Google may collect automatically or data processed for
          routing, maps, search or logs.
        </p>
        <p>
          Google Analytics can process browser and device details, approximate location
          and standard session events, and use cookies or similar identifiers to
          distinguish visits. Google receives connection information when contacted. Map
          and search providers may also use cookies or device storage. See the provider
          notices and controls below.
        </p>
      </section>

      <section aria-labelledby="logs-contact">
        <h2 id="logs-contact">Logs and messages</h2>
        <p>
          Vercel hosts Bikesy&apos;s website and routing service. Hosting and security
          systems may record IP addresses, requested URLs, timestamps, browser or device
          information, errors and performance data to operate, troubleshoot and protect
          the service. Request URLs can include route or weather coordinates. These logs
          are separate from custom analytics events.
        </p>
        <p>
          If you contact us, we receive your contact details, message and any attachments
          to respond and handle your request. Avoid including unnecessary sensitive
          information. Reports posted to public issue trackers may be visible to anyone.
        </p>
      </section>

      <section aria-labelledby="storage">
        <h2 id="storage">Device data and shared links</h2>
        <p>
          Bikesy keeps active trip state and preferences in application memory and
          temporarily reuses conditions data. It does not provide an account-based trip
          archive. Browsers, operating systems and providers may separately retain
          cookies, downloaded resources, caches or backups.
        </p>
        <p>
          Website trip links contain endpoint labels, coordinates and preferences. Browser
          history and copies you share can retain them. Anyone with a complete trip link
          can view its details and request the route. Clearing the planner does not erase
          history, shared copies or provider records.
        </p>
      </section>

      <section aria-labelledby="sharing">
        <h2 id="sharing">Providers and disclosures</h2>
        <p>
          Providers receive information for the features described above and handle it
          under their applicable terms and privacy notices:
        </p>
        <ul>
          <li>
            <a href="https://policies.google.com/privacy">Google</a>: search and website
            analytics.
          </li>
          <li>
            <a href="https://www.mapbox.com/legal/privacy">Mapbox</a>: website maps and
            older-app geocoding.
          </li>
          <li>
            <a href="https://www.apple.com/legal/privacy/data/en/apple-maps/">
              Apple Maps
            </a>
            : native maps and redesigned-app search.
          </li>
          <li>
            <a href="https://openweather.co.uk/privacy-policy">OpenWeather</a>: weather.
          </li>
          <li>
            <a href="https://www.epa.gov/privacy/privacy-and-security-notice">
              EPA/AirNow
            </a>
            : air quality.
          </li>
          <li>
            <a href="https://vercel.com/legal/privacy-notice">Vercel</a>: hosting,
            delivery and security.
          </li>
        </ul>
        <p>
          External services supplying website software, styles or regional map layers also
          receive connection information. Independent regional operators and external
          sites may have separate policies for their own services. We may disclose
          information when required by law or necessary to protect the service or
          people&apos;s rights and safety.
        </p>
      </section>

      <section aria-labelledby="retention">
        <h2 id="retention">Retention and deletion</h2>
        <p>
          Retention varies by the information and its purpose. Active trip data and
          temporary caches are separate from hosting logs, analytics and support messages.
          Hosting and analytics retention depends on provider and account settings.
          Support correspondence is kept in our mailbox to handle requests and follow-up.
          Operational, security and legal needs can affect retention; there is no single
          deletion period for all records.
        </p>
        <p>
          To ask about particular records or request deletion, email{' '}
          <a href="mailto:info@blinktag.com">info@blinktag.com</a>. We may need
          information to verify and locate your records. Some records may no longer exist
          or may not be identifiable as yours. Applicable legal exceptions may limit
          deletion. Removing the app or clearing a route does not erase server records or
          copies held by people you shared with.
        </p>
      </section>

      <section aria-labelledby="choices-rights">
        <h2 id="choices-rights">Your choices and rights</h2>
        <ul>
          <li>
            Withdraw location permission in your browser&apos;s site settings or iOS
            Location Services settings. You can still choose endpoints manually.
          </li>
          <li>
            Use browser controls to delete cookies, site data and history or block
            unwanted requests. Blocking maps or search can affect those features.
          </li>
          <li>
            The website has no Bikesy-specific analytics preference switch. On supported
            browsers, you can use{' '}
            <a href="https://tools.google.com/dlpage/gaoptout">
              Google&apos;s Analytics opt-out add-on
            </a>
            . Deleting or rejecting cookies alone may not stop analytics requests.
          </li>
        </ul>
        <p>
          Bikesy does not currently act on Do Not Track signals. It also does not
          currently implement Global Privacy Control, a separate opt-out signal. These
          statements do not limit rights you may have under applicable law.
        </p>
        <p>
          Depending on applicable law, you may have rights to access, correct, delete or
          obtain a copy of information, restrict or object to processing, withdraw
          consent, or complain to a privacy regulator. Contact{' '}
          <a href="mailto:info@blinktag.com">info@blinktag.com</a> with your request and
          the site or app you used. Withdrawing permission does not undo earlier
          processing. Provider controls apply to information they hold independently.
        </p>
      </section>

      <section aria-labelledby="security">
        <h2 id="security">Security and processing locations</h2>
        <p>
          Bikesy&apos;s current public route and conditions connections use HTTPS,
          including our server&apos;s OpenWeather and AirNow requests. No service can
          guarantee complete security. Bikesy and its providers may process information in
          the United States and other countries with different privacy laws; provider
          notices describe their practices.
        </p>
      </section>

      <section aria-labelledby="children-changes">
        <h2 id="children-changes">Children and policy changes</h2>
        <p>
          Bikesy is a general-purpose bicycle route planner. Parents and guardians can
          manage location permissions and help children avoid sharing sensitive trips.
          Contact us with concerns about a child&apos;s personal information.
        </p>
        <p>
          We will post policy updates here and revise the date. Where applicable law
          requires additional notice or consent for a material change, we will provide
          that notice and obtain consent.
        </p>
      </section>
    </main>
  </>
);

export default PrivacyPolicy;
