import { createFileRoute } from "@tanstack/react-router";
import { Calculator } from "@/components/Calculator";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SITE_URL } from "@/lib/cities";

const T = "Solar Payback Calculator — payback years, savings & IRR | SolarPayback";
const D = "Search any location, enter your electricity price and quote, and get a 25-year solar payback, NPV and IRR estimate based on PVGIS data.";

export const Route = createFileRoute("/calculator")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/calculator" }],
  }),
  component: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Free assessment</p>
        <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">Solar payback calculator</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Pick your location, then move the sliders to match your bill and installer quote. Results update instantly.</p>
        <div className="mt-10"><Calculator /></div>
      </main>
      <SiteFooter />
    </div>
  ),
});
