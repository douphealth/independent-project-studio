import { createFileRoute } from "@tanstack/react-router";
import { Breadcrumbs, RelatedLinks, breadcrumbItems } from "@/components/Breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CityComparison } from "@/components/CityComparison";
import { CITIES } from "@/lib/cities";
import { getDirectoryProfiles } from "@/lib/pvgis.functions";
import { COMPARE_DESCRIPTION, COMPARE_TITLE, breadcrumbNode, jsonLdGraph, pageHead } from "@/lib/seo";

const CRUMBS = [{ name: "Home", path: "/" }, { name: "Compare", path: "/compare" }] as const;

function selectedCities(search: Record<string, unknown>): string[] | undefined {
  const raw = typeof search["cities"] === "string"
    ? [...new Set(search["cities"].split(",").filter((slug) => CITIES.some((city) => city.slug === slug)))]
    : Array.isArray(search["cities"])
      ? search["cities"].filter((slug): slug is string => typeof slug === "string" && CITIES.some((city) => city.slug === slug))
      : [];
  const cities = raw.slice(0, 3);
  return cities.length ? cities : undefined;
}

export const Route = createFileRoute("/compare")({
  validateSearch: (search): { cities?: string[] | undefined } => ({ cities: selectedCities(search) }),
  loaderDeps: () => ({}),
  loader: async () => {
    const profiles = await getDirectoryProfiles({ data: { places: CITIES } });
    return { entries: CITIES.map((city) => ({ city, profile: profiles.find((p) => p.slug === city.slug)?.profile ?? null })) };
  },
  staleTime: 24 * 60 * 60 * 1000,
  head: ({ match }) => pageHead({
    title: COMPARE_TITLE,
    description: COMPARE_DESCRIPTION,
    path: "/compare",
    noindex: Boolean(match.search.cities?.length),
    jsonLd: jsonLdGraph(breadcrumbNode(CRUMBS)),
  }),
  headers: ({ match }) => (match.search.cities?.length ? { "X-Robots-Tag": "noindex" } : undefined),
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">Comparison data is unavailable</h1><p className="mt-3 text-muted-foreground">Please try again shortly.</p></main><SiteFooter /></div>,
  notFoundComponent: () => <main className="mx-auto max-w-2xl px-5 py-24"><h1>Comparison not found</h1></main>,
  component: ComparePage,
});

function ComparePage() {
  const { entries } = Route.useLoaderData();
  const { cities = ["athens", "london"] } = Route.useSearch();
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12"><Breadcrumbs items={breadcrumbItems(CRUMBS)} /><p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Side-by-side</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">City solar comparison</h1><p className="mt-4 max-w-2xl text-lg text-muted-foreground">Compare live PVGIS production for up to three cities with the same roof assumptions, then open a city calculator for your own quote.</p><CityComparison entries={entries} selected={cities} /><RelatedLinks links={[{ href: "/cities", label: "City directory" }, { href: "/calculator", label: "Payback calculator" }, { href: "/methodology", label: "Methodology" }]} /></main><SiteFooter /></div>;
}
