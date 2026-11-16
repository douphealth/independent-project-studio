import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator } from "@/components/Calculator";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SITE_URL } from "@/lib/cities";
import { decodeScenario } from "@/lib/scenarios";
import { getSolarProfile } from "@/lib/pvgis.functions";
import { Button } from "@/components/ui/button";

const T = "Solar payback calculator — savings, NPV & IRR | SolarPayback";
const D = "Calculate solar payback using live PVGIS production, your installer quote and electricity bill. Save, compare, share and download a real PDF report.";

export const Route = createFileRoute("/calculator")({
  validateSearch: (search): { scenario?: string | undefined } => ({ scenario: typeof search["scenario"] === "string" ? search["scenario"] : undefined }),
  loaderDeps: ({ search }) => ({ scenario: search.scenario }),
  loader: async ({ deps }) => {
    const scenario = decodeScenario(deps.scenario);
    if (!scenario) return { initial: undefined, shared: Boolean(deps.scenario) };
    const profile = await getSolarProfile({ data: { lat: scenario.place.lat, lon: scenario.place.lon, ...scenario.roof } });
    return { initial: { place: scenario.place, profile, scenario }, shared: true };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: T }, { name: "description", content: D }, ...(loaderData?.shared ? [{ name: "robots", content: "noindex,follow" }] : []),
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/calculator` }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/calculator` }],
  }),
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-3xl font-semibold">This scenario could not be loaded</h1><p className="mt-3 text-muted-foreground">The solar service may be unavailable, or the shared link is incomplete.</p><Button asChild className="mt-6"><Link to="/calculator">Start a new calculation</Link></Button></main><SiteFooter /></div>,
  notFoundComponent: () => <main className="mx-auto max-w-xl px-5 py-24"><h1>Calculator not found</h1></main>,
  component: CalculatorPage,
});

function CalculatorPage() {
  const { initial } = Route.useLoaderData();
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Free assessment · no sign-up</p><h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Solar payback calculator</h1><p className="mt-3 max-w-2xl text-muted-foreground">Start with your location, then use exact figures from your bill and installer quote. Your financial inputs stay in your browser unless you put them in a share link.</p>
    <div className="mt-10"><Calculator initial={initial} /></div>
    <section className="mt-16 grid gap-6 border-t border-border pt-10 md:grid-cols-3"><Step n="01" title="Use the avoidable tariff">Do not include fixed daily or standing charges you will still pay. Separate import savings from export revenue.</Step><Step n="02" title="Compare like-for-like quotes">Save each installer scenario with the same location and consumption. Compare total installed scope, replacement costs and cash flow.</Step><Step n="03" title="Treat the result as a range">Test cost, tariff and self-consumption changes. Roof shading, structural work and battery dispatch need a more detailed assessment.</Step></section>
  </main><SiteFooter /></div>;
}
function Step({ n, title, children }: { n: string; title: string; children: string }) { return <article><span className="text-sm font-semibold text-primary">{n}</span><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p></article>; }
