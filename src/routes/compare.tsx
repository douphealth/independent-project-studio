import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CityComparison } from "@/components/CityComparison";
import { CITIES, SITE_URL } from "@/lib/cities";
import { getDirectoryProfiles } from "@/lib/pvgis.functions";

const T = "Compare solar production in European cities | SolarPayback";
const D = "Compare annual and monthly PVGIS solar yield for up to three cities, with consistent reference payback and links to personalized calculators.";

export const Route = createFileRoute("/compare")({
  validateSearch: (search): { cities?: string[] | undefined } => ({ cities: typeof search["cities"] === "string" ? [...new Set(search["cities"].split(",").filter((s) => CITIES.some((c) => c.slug === s)))].slice(0, 3) : Array.isArray(search["cities"]) ? search["cities"].filter((s): s is string => typeof s === "string" && CITIES.some((c) => c.slug === s)).slice(0, 3) : undefined }),
  loaderDeps: () => ({}),
  loader: async () => {
    const profiles = await getDirectoryProfiles({ data: { places: CITIES } });
    return { entries: CITIES.map((city) => ({ city, profile: profiles.find((p) => p.slug === city.slug)?.profile ?? null })) };
  },
  staleTime: 24 * 60 * 60 * 1000,
  head: () => ({ meta: [{ title: T }, { name: "description", content: D }, { property: "og:title", content: T }, { property: "og:description", content: D }, { property: "og:type", content: "website" }, { property: "og:url", content: `${SITE_URL}/compare` }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: `${SITE_URL}/compare` }] }),
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">Comparison data is unavailable</h1><p className="mt-3 text-muted-foreground">Please try again shortly.</p></main><SiteFooter /></div>,
  notFoundComponent: () => <main className="mx-auto max-w-2xl px-5 py-24"><h1>Comparison not found</h1></main>,
  component: ComparePage,
});

function ComparePage() {
  const { entries } = Route.useLoaderData();
  const { cities = ["athens", "london"] } = Route.useSearch();
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Side-by-side</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">City solar comparison</h1><p className="mt-4 max-w-2xl text-lg text-muted-foreground">Same assumptions, live solar profiles, clear differences. Choose a city to see where production and seasonality diverge.</p><CityComparison entries={entries} selected={cities} /></main><SiteFooter /></div>;
}
