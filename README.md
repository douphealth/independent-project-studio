# SolarPayback

Independent, account-free solar payback estimates using live EU JRC PVGIS production data and Open-Meteo geocoding. No installer lead selling, sponsored rankings, accounts, database, analytics service, or hosted AI service is required.

## Product

- Searchable and sortable directory of 24 European cities across 14 countries.
- Live city production profiles, country guides, and three-city comparisons.
- Location-based calculator with exact inputs, accessible sliders, roof settings, multi-currency support, degradation, maintenance, inverter replacement, escalation, NPV, IRR, LCOE, and annual cash flow.
- Private browser-only scenario saving and installer-quote comparison.
- Versioned, validated share links; shared scenario pages are `noindex`.
- Device-generated CSV and PDF reports with assumptions and source dates.
- Methodology, ownership, privacy, terms, and corrections pages.
- Unique route metadata, structured data, sitemap, self-hosted fonts, responsive layouts, and reduced-motion support.

Solar yields are never hard-coded per city. Financial defaults are illustrative and clearly labelled; users must enter their own quotes, tariffs, grants, and consumption.

## Local development

Requires Bun.

```sh
bun install
bun run dev
```

The development server listens on port 8080. Run the test suite with:

```sh
bunx vitest run
```

Create a production build with `bun run build`.

## Independent deployment

The app needs no application secrets. Deploy the production build to a Cloudflare-compatible TanStack Start host. Server functions must remain enabled: they proxy and cache PVGIS and Open-Meteo requests and avoid exposing a browser directly to upstream failures.

The public origin is the hardcoded constant `SITE_URL` in `src/lib/site.ts` (`https://solarpayback.shop`). Sitemap URLs, canonicals, Open Graph URLs, JSON-LD, `robots.txt`, and `llms.txt` all use that constant. Do not derive it from the request host or a `pages.dev` environment variable. The IndexNow key file is `public/b9172d99fb6df935a7819375eaeac9b9.txt`. Verify `sitemap.xml`, robots directives, share links, and live PVGIS responses on the deployed host.

PVGIS and Open-Meteo are the only external runtime data providers. Profiles are cached in memory for 24 hours with stale fallback; this is best-effort and not a persistent distributed cache.

## Privacy and storage

Saved scenarios use browser `localStorage`, capped at 30 entries. They do not synchronize between devices. Sharing deliberately puts scenario assumptions in the URL. PDF and CSV generation happens in the browser.

Payments, hosted analytics, customer accounts, cloud storage, and bill uploads are intentionally not included. Adding them requires separate user-approved providers and a new privacy/security review.

## Data credits

- Solar production: European Union, Joint Research Centre, PVGIS 5.3.
- Geocoding: Open-Meteo.
- Illustrative financial assumptions: SolarPayback defaults, not market quotations.
