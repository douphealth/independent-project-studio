import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { Calculator } from "@/components/Calculator";
import { CITIES, SITE_URL, getCity } from "@/lib/cities";
import { getSolarProfile } from "@/lib/pvgis.functions";
import { DEFAULTS, calculate, eur, num } from "@/lib/solar";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const Route = createFileRoute("/cities/$slug")({
  loader: async ({ params }) => {
    const city = getCity(params.slug);
    if (!city) throw notFound();
    const profile = await getSolarProfile({ data: { lat: city.lat, lon: city.lon } });
    return { city, profile };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "City unavailable | SolarPayback" }, { name: "robots", content: "noindex" }] };
    const { city, profile } = loaderData;
    const t = `Solar panels in ${city.name}: ${num(profile.annualKwhPerKwp)} kWh/kWp yield & payback | SolarPayback`;
    const d = `A 1 kWp system in ${city.name}, ${city.country} produces about ${num(profile.annualKwhPerKwp)} kWh a year (PVGIS ${profile.radiationDb}). See monthly output and estimate your payback.`;
    const url = `${SITE_URL}/cities/${city.slug}`;
    return {
      meta: [
        { title: t }, { name: "description", content: d },
        { property: "og:title", content: t }, { property: "og:description", content: d },
        { property: "og:type", content: "article" }, { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL + "/" },
            { "@type": "ListItem", position: 2, name: "Cities", item: SITE_URL + "/cities" },
            { "@type": "ListItem", position: 3, name: city.name, item: url },
          ],
        }),
      }],
    };
  },
  errorComponent: () => (
    <div className="min-h-screen"><SiteHeader />
      <main className="mx-auto max-w-xl px-5 py-24 text-center">
        <h1 className="text-3xl font-semibold">Solar data is temporarily unavailable</h1>
        <p className="mt-3 text-muted-foreground">The PVGIS service didn't respond. Please refresh in a moment.</p>
      </main></div>
  ),
  component: CityPage,
});

function CityPage() {
  const { city, profile } = Route.useLoaderData();
  const best = [...profile.monthly].sort((a, b) => b.kwh - a.kwh)[0]!;
  const worst = [...profile.monthly].sort((a, b) => a.kwh - b.kwh)[0]!;
  const ref = calculate({ ...DEFAULTS, annualKwhPerKwp: profile.annualKwhPerKwp });
  const nearby = CITIES.filter((c) => c.slug !== city.slug)
    .map((c) => ({ c, d: Math.hypot(c.lat - city.lat, c.lon - city.lon) }))
    .sort((a, b) => a.d - b.d).slice(0, 5).map((x) => x.c);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/cities" className="hover:text-foreground">Cities</Link> / <span className="text-foreground">{city.name}</span>
        </nav>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">Solar panels in {city.name}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Each kilowatt of south-facing panels at 30° in {city.name} generates about <strong className="text-foreground">{num(profile.annualKwhPerKwp)} kWh per year</strong>, ranging from {num(worst.kwh)} kWh in {MONTHS[worst.month - 1]} to {num(best.kwh)} kWh in {MONTHS[best.month - 1]}.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {[
            ["Annual yield", `${num(profile.annualKwhPerKwp)} kWh/kWp`],
            ["Best month", `${MONTHS[best.month - 1]} · ${num(best.kwh)} kWh`],
            ["Year-to-year variation", profile.yearToYearSdKwh ? `±${num(profile.yearToYearSdKwh)} kWh` : "—"],
            ["Reference payback*", ref.payback ? `${num(ref.payback, 1)} years` : "> 25 years"],
          ].map(([l, v]) => (
            <div key={l} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="mt-1 font-display text-2xl font-semibold tabular">{v}</p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">Monthly production per kWp</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer>
              <BarChart data={profile.monthly.map((m) => ({ m: MONTHS[m.month - 1], kwh: m.kwh }))}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(n: number) => `${num(n, 1)} kWh`} cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} />
                <Bar dataKey="kwh" fill="var(--primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Source: EU JRC PVGIS 5.3, {profile.radiationDb} ({profile.period}), {city.lat.toFixed(4)}, {city.lon.toFixed(4)}{profile.elevation != null ? `, ${num(profile.elevation)} m elevation` : ""}. Retrieved {new Date(profile.fetchedAt).toISOString().slice(0, 10)}.
            {" "}*Reference payback uses illustrative defaults ({DEFAULTS.systemKw} kWp, {eur(DEFAULTS.costPerKw)}/kWp, {eur(DEFAULTS.importPrice, 2)}/kWh) — not local market prices. Adjust below.
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold">Estimate your own payback in {city.name}</h2>
          <div className="mt-6">
            <Calculator initial={{ place: { name: city.name, country: city.country, lat: city.lat, lon: city.lon }, profile }} />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold">Nearby cities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {nearby.map((c) => (
              <Link key={c.slug} to="/cities/$slug" params={{ slug: c.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary">{c.name}</Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
