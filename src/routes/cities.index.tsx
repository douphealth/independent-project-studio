import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Breadcrumbs, RelatedLinks, breadcrumbItems } from "@/components/Breadcrumbs";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { DirectoryExplorer, type DirectoryFilters } from "@/components/DirectoryExplorer";
import { CITIES, COUNTRY_GUIDES } from "@/lib/cities";
import { getDirectoryProfiles } from "@/lib/pvgis.functions";
import { CITIES_TITLE, absoluteUrl, breadcrumbNode, citiesDescription, jsonLdGraph, pageHead } from "@/lib/seo";

const CRUMBS = [{ name: "Home", path: "/" }, { name: "Cities", path: "/cities" }] as const;
const SORTS = new Set(["yield-asc", "payback", "name"]);

export const Route = createFileRoute("/cities/")({
  validateSearch: (search): DirectoryFilters => {
    const q = typeof search["q"] === "string" ? search["q"].trim().slice(0, 80) : "";
    const country = typeof search["country"] === "string" && COUNTRY_GUIDES.some((country) => country.slug === search["country"]) ? search["country"] : undefined;
    const sort = typeof search["sort"] === "string" && SORTS.has(search["sort"]) ? search["sort"] : undefined;
    return { q: q || undefined, country, sort };
  },
  loaderDeps: () => ({}),
  loader: async () => {
    const profiles = await getDirectoryProfiles({ data: { places: CITIES } });
    return { entries: CITIES.map((city) => ({ city, profile: profiles.find((p) => p.slug === city.slug)?.profile ?? null })) };
  },
  staleTime: 24 * 60 * 60 * 1000,
  head: ({ match }) => {
    const filtered = Boolean(match.search.q || match.search.country || match.search.sort);
    return pageHead({
      title: CITIES_TITLE,
      description: citiesDescription(),
      path: "/cities",
      noindex: filtered,
      jsonLd: jsonLdGraph(
        breadcrumbNode(CRUMBS),
        ...(filtered ? [] : [{
          "@type": "ItemList",
          name: "Solar potential by city",
          numberOfItems: CITIES.length,
          itemListElement: CITIES.map((city, index) => ({ "@type": "ListItem", position: index + 1, name: city.name, url: absoluteUrl(`/cities/${city.slug}`) })),
        }]),
      ),
    });
  },
  headers: ({ match }) => (match.search.q || match.search.country || match.search.sort ? { "X-Robots-Tag": "noindex" } : undefined),
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">The directory is temporarily unavailable</h1><p className="mt-3 text-muted-foreground">Please refresh in a moment. You can still use the calculator for a specific location.</p></main><SiteFooter /></div>,
  notFoundComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">Directory not found</h1></main><SiteFooter /></div>,
  component: Cities,
});

function Cities() {
  const { entries } = Route.useLoaderData();
  const filters = Route.useSearch();
  const navigate = useNavigate();
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12">
    <Breadcrumbs items={breadcrumbItems(CRUMBS)} />
    <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Independent solar intelligence</p>
    <h1 className="mt-3 max-w-3xl text-4xl font-semibold sm:text-6xl">Compare the sun before you compare quotes.</h1>
    <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Compare live PVGIS solar yield across {CITIES.length} European cities, then open a city to calculate payback with your own quote and tariff. No installer rankings, sponsored positions or invented market prices.</p>
    <DirectoryExplorer entries={entries} filters={filters} onFilters={(next) => void navigate({ to: "/cities", search: next, replace: true })} />
    <RelatedLinks links={[{ href: "/compare", label: "Compare cities" }, { href: "/calculator", label: "Payback calculator" }, { href: "/methodology", label: "Methodology" }]} />
  </main><SiteFooter /></div>;
}
