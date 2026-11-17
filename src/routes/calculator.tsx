import { createFileRoute, Link } from "@tanstack/react-router";
import { Breadcrumbs, RelatedLinks, breadcrumbItems } from "@/components/Breadcrumbs";
import { Calculator } from "@/components/Calculator";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { decodeScenario } from "@/lib/scenarios";
import { getSolarProfile } from "@/lib/pvgis.functions";
import { CALCULATOR_DESCRIPTION, CALCULATOR_TITLE, SITE_URL, breadcrumbNode, jsonLdGraph, pageHead } from "@/lib/seo";
import { Button } from "@/components/ui/button";

const CRUMBS = [{ name: "Home", path: "/" }, { name: "Calculator", path: "/calculator" }] as const;

export const Route = createFileRoute("/calculator")({
  validateSearch: (search): { scenario?: string | undefined } => {
    const scenario = typeof search["scenario"] === "string" ? search["scenario"].trim() : "";
    return { scenario: scenario || undefined };
  },
  loaderDeps: ({ search }) => ({ scenario: search.scenario }),
  loader: async ({ deps }) => {
    const scenario = decodeScenario(deps.scenario);
    if (!scenario) return { initial: undefined, shared: Boolean(deps.scenario) };
    const profile = await getSolarProfile({ data: { lat: scenario.place.lat, lon: scenario.place.lon, ...scenario.roof } });
    return { initial: { place: scenario.place, profile, scenario }, shared: true };
  },
  head: ({ loaderData }) => pageHead({
    title: CALCULATOR_TITLE,
    description: CALCULATOR_DESCRIPTION,
    path: "/calculator",
    noindex: Boolean(loaderData?.shared),
    jsonLd: jsonLdGraph(breadcrumbNode(CRUMBS), {
      "@type": "WebApplication",
      name: "Solar payback calculator",
      url: `${SITE_URL}/calculator`,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
      description: CALCULATOR_DESCRIPTION,
      provider: { "@type": "Organization", name: "SolarPayback", url: `${SITE_URL}/` },
    }),
  }),
  headers: ({ loaderData }) => (loaderData?.shared ? { "X-Robots-Tag": "noindex" } : undefined),
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-xl px-5 py-24 text-center"><h1 className="text-3xl font-semibold">This scenario could not be loaded</h1><p className="mt-3 text-muted-foreground">The solar service may be unavailable, or the shared link is incomplete.</p><Button asChild className="mt-6"><Link to="/calculator">Start a new calculation</Link></Button></main><SiteFooter /></div>,
  notFoundComponent: () => <main className="mx-auto max-w-xl px-5 py-24"><h1>Calculator not found</h1></main>,
  component: CalculatorPage,
});

function CalculatorPage() {
  const { initial } = Route.useLoaderData();
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12">
    <Breadcrumbs items={breadcrumbItems(CRUMBS)} />
    <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Free assessment · no sign-up</p><h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Solar payback calculator</h1><p className="mt-3 max-w-2xl text-muted-foreground">This calculator estimates solar payback, savings, NPV and IRR from live PVGIS production and the quote and tariff you enter. Your financial inputs stay in this browser unless you put them in a share link.</p>
    <div className="mt-10"><Calculator initial={initial} /></div>
    <section className="mt-16 grid gap-6 border-t border-border pt-10 md:grid-cols-3"><Step n="01" title="Use the avoidable tariff">Do not include fixed daily or standing charges you will still pay. Separate import savings from export revenue.</Step><Step n="02" title="Compare like-for-like quotes">Save each installer scenario with the same location and consumption. Compare total installed scope, replacement costs and cash flow.</Step><Step n="03" title="Treat the result as a range">Test cost, tariff and self-consumption changes. Roof shading, structural work and battery dispatch need a more detailed assessment.</Step></section>
    <RelatedLinks links={[{ href: "/methodology", label: "Methodology" }, { href: "/cities", label: "City directory" }, { href: "/compare", label: "Compare cities" }]} />
  </main><SiteFooter /></div>;
}
function Step({ n, title, children }: { n: string; title: string; children: string }) { return <article><span className="text-sm font-semibold text-primary">{n}</span><h2 className="mt-2 text-2xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p></article>; }
