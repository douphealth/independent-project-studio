import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SITE_URL } from "@/lib/cities";

const T = "Methodology & limitations — how SolarPayback calculates payback";
const D = "Data sources, formulas and known limitations behind SolarPayback's solar payback, NPV, IRR and LCOE estimates.";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/methodology" }],
  }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-4xl font-semibold sm:text-5xl">Methodology & limitations</h1>
        <div className="mt-10 space-y-10 leading-relaxed text-muted-foreground [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
          <section>
            <h2>Solar data</h2>
            <p>Production comes from the European Commission JRC <strong>PVGIS 5.3</strong> PVcalc service, requested live for each location: crystalline silicon, 1 kWp, fixed 30° tilt, due south, 14% system losses, with terrain horizon. Results are long-term averages of the satellite radiation record shown on each page.</p>
          </section>
          <section>
            <h2>Financial model</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Upfront = system size × installed cost − grant.</li>
              <li>Generation in year <em>n</em> = yield × size × (1 − degradation)<sup>n−1</sup>.</li>
              <li>Self-used energy = generation × self-use share, capped at your annual consumption. The remainder is exported.</li>
              <li>Savings = self-used × import price + exported × export price, both escalated yearly.</li>
              <li>Cash flow = savings − maintenance. Payback is the interpolated year cumulative cash first reaches zero.</li>
              <li>NPV and LCOE are discounted at 4%; IRR is solved by bisection.</li>
            </ul>
          </section>
          <section>
            <h2>What this does not know</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>Your roof's real orientation, shading and structure — an on-site survey is required.</li>
              <li>Hourly consumption. The self-use share is an assumption; batteries and daytime usage raise it.</li>
              <li>Local tariffs, taxes, net-metering rules and inverter or battery replacement costs.</li>
              <li>Default prices are illustrative, not market data for any city.</li>
            </ul>
          </section>
          <p className="rounded-2xl border border-border bg-card p-5 text-sm">SolarPayback provides estimates only. It is not financial, tax or engineering advice.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});
