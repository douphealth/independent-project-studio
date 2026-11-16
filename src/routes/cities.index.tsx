import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CITIES, SITE_URL } from "@/lib/cities";

const T = "Solar Potential by City — European solar directory | SolarPayback";
const D = "Live PVGIS solar yield, monthly production and payback estimates for major European cities.";

export const Route = createFileRoute("/cities/")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/cities" }],
  }),
  component: Cities,
});

function Cities() {
  const byCountry = CITIES.reduce<Record<string, typeof CITIES>>((a, c) => ((a[c.country] ??= []).push(c), a), {});
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="text-4xl font-semibold sm:text-5xl">Solar potential by city</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Each page pulls current PVGIS data for the city centre and runs a transparent payback model you can adjust.</p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(byCountry).sort().map(([country, list]) => (
            <div key={country} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-2xl font-semibold">{country}</h2>
              <ul className="mt-4 space-y-1">
                {list.map((c) => (
                  <li key={c.slug}>
                    <Link to="/cities/$slug" params={{ slug: c.slug }} className="group flex items-center gap-2 rounded-xl px-2 py-1.5 -mx-2 hover:bg-muted">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-medium group-hover:text-primary">{c.name}</span>
                      <span className="ml-auto text-xs tabular text-muted-foreground">{c.lat.toFixed(2)}°N</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
