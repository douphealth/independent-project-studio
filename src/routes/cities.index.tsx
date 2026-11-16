import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { DirectoryExplorer, type DirectoryFilters } from "@/components/DirectoryExplorer";
import { CITIES, SITE_URL } from "@/lib/cities";
import { getDirectoryProfiles } from "@/lib/pvgis.functions";

const T = "Compare solar yield by city | SolarPayback";
const D = "Search and compare live PVGIS solar production for 24 European cities, then calculate payback using your own quote and electricity tariff.";

export const Route = createFileRoute("/cities/")({
  validateSearch: (search): DirectoryFilters => ({
    q: typeof search["q"] === "string" ? search["q"].slice(0, 80) : undefined,
    country: typeof search["country"] === "string" ? search["country"] : undefined,
    sort: typeof search["sort"] === "string" ? search["sort"] : undefined,
  }),
  loaderDeps: () => ({}),
  loader: async () => {
    const profiles = await getDirectoryProfiles({ data: { places: CITIES } });
    return { entries: CITIES.map((city) => ({ city, profile: profiles.find((p) => p.slug === city.slug)?.profile ?? null })) };
  },
  staleTime: 24 * 60 * 60 * 1000,
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/cities` }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/cities` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "Solar potential by city", numberOfItems: CITIES.length, itemListElement: CITIES.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, url: `${SITE_URL}/cities/${c.slug}` })) }) }],
  }),
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">The directory is temporarily unavailable</h1><p className="mt-3 text-muted-foreground">Please refresh in a moment. You can still use the calculator for a specific location.</p></main><SiteFooter /></div>,
  notFoundComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">Directory not found</h1></main><SiteFooter /></div>,
  component: Cities,
});

function Cities() {
  const { entries } = Route.useLoaderData();
  const filters = Route.useSearch();
  const navigate = useNavigate();
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12">
    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Independent solar intelligence</p>
    <h1 className="mt-3 max-w-3xl text-4xl font-semibold sm:text-6xl">Compare the sun before you compare quotes.</h1>
    <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Live PVGIS production estimates, consistent assumptions and a calculator for your real bill. No installer rankings, sponsored positions or invented market prices.</p>
    <DirectoryExplorer entries={entries} filters={filters} onFilters={(next) => void navigate({ to: "/cities", search: next, replace: true })} />
  </main><SiteFooter /></div>;
}
