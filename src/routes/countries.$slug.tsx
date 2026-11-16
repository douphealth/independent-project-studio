import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowRight, ExternalLink, FileCheck2, Languages, WalletCards } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { citiesForCountry, getCountry, SITE_URL } from "@/lib/cities";
import { getDirectoryProfiles } from "@/lib/pvgis.functions";
import { calculate, DEFAULTS, money, num } from "@/lib/solar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/countries/$slug")({
  loader: async ({ params }) => {
    const country = getCountry(params.slug);
    if (!country) throw notFound();
    const cities = citiesForCountry(country.slug);
    const profiles = await getDirectoryProfiles({ data: { places: cities } });
    return { country, entries: cities.map((city) => ({ city, profile: profiles.find((p) => p.slug === city.slug)?.profile ?? null })) };
  },
  staleTime: 24 * 60 * 60 * 1000,
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Country unavailable | SolarPayback" }, { name: "robots", content: "noindex" }] };
    const { country, entries } = loaderData;
    const t = `Solar panels in ${country.name}: city yield guide | SolarPayback`;
    const d = `Compare live PVGIS solar yield in ${entries.map((e) => e.city.name).join(", ")}. Calculate payback in ${country.currency} and check official energy guidance.`;
    const url = `${SITE_URL}/countries/${country.slug}`;
    return { meta: [{ title: t }, { name: "description", content: d }, { property: "og:title", content: t }, { property: "og:description", content: d }, { property: "og:type", content: "article" }, { property: "og:url", content: url }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: url }], scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Cities", item: `${SITE_URL}/cities` }, { "@type": "ListItem", position: 2, name: country.name, item: url }] }) }] };
  },
  errorComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">Country data is temporarily unavailable</h1></main><SiteFooter /></div>,
  notFoundComponent: () => <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-2xl px-5 py-24"><h1 className="text-4xl font-semibold">Country not found</h1><Button asChild className="mt-6"><Link to="/cities">Browse all cities</Link></Button></main><SiteFooter /></div>,
  component: CountryPage,
});

function CountryPage() {
  const { country, entries } = Route.useLoaderData();
  const available = entries.filter((e) => e.profile);
  const average = available.length ? available.reduce((s, e) => s + e.profile!.annualKwhPerKwp, 0) / available.length : 0;
  return <div className="min-h-screen"><SiteHeader /><main className="mx-auto max-w-6xl px-5 py-12">
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground"><Link to="/" className="hover:text-foreground">Home</Link> / <Link to="/cities" className="hover:text-foreground">Cities</Link> / <span className="text-foreground">{country.name}</span></nav>
    <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-primary">Country solar guide</p><h1 className="mt-3 text-4xl font-semibold sm:text-6xl">Solar panels in {country.name}</h1><p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{country.intro}</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Info icon={WalletCards} label="Calculator currency" value={country.currency} /><Info icon={Languages} label="Local language" value={country.language} /><Info icon={FileCheck2} label="Cities compared" value={`${entries.length} · average ${average ? num(average) : "—"} kWh/kWp`} /></div>
    <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-soft"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-semibold">City solar yields</h2><p className="mt-1 text-sm text-muted-foreground">Consistent PVGIS assumptions make differences easier to interpret.</p></div><Button asChild variant="outline"><Link to="/compare" search={{ cities: entries.map((e) => e.city.slug).slice(0, 3) }}>Compare these cities<ArrowRight /></Link></Button></div><div className="mt-6 space-y-3">{entries.map(({ city, profile }) => { const result = profile ? calculate({ ...DEFAULTS, annualKwhPerKwp: profile.annualKwhPerKwp }) : null; return <Link key={city.slug} to="/cities/$slug" params={{ slug: city.slug }} className="grid gap-3 rounded-2xl border border-border p-4 transition hover:border-primary sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-center"><span className="font-display text-xl font-semibold">{city.name}</span><span className="text-sm"><span className="text-muted-foreground">Yield </span><strong>{profile ? `${num(profile.annualKwhPerKwp)} kWh/kWp` : "Unavailable"}</strong></span><span className="text-sm"><span className="text-muted-foreground">Reference payback </span><strong>{result?.payback != null ? `${num(result.payback, 1)} years` : "—"}</strong></span><ArrowRight className="hidden h-5 w-5 text-primary sm:block" /></Link>; })}</div><p className="mt-4 text-xs text-muted-foreground">Reference payback is illustrative and not a local market quote. Use each city's calculator for your own figures.</p></section>
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <section className="rounded-3xl bg-night p-7 text-night-foreground shadow-soft"><h2 className="text-3xl font-semibold">Before you trust a payback quote</h2><ul className="mt-5 space-y-4">{country.checklist.map((item, i) => <li key={item} className="flex gap-3 text-night-muted"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sun text-xs font-bold text-night">{i + 1}</span><span>{item}</span></li>)}</ul></section>
      <aside className="rounded-3xl border border-border bg-card p-7 shadow-soft"><h2 className="text-2xl font-semibold">Verify the current rules</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Incentives, export arrangements and eligibility can change. We do not claim a grant or tariff without a current, installation-specific source.</p><a href={country.officialSource} target="_blank" rel="noreferrer" className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-border p-4 text-sm font-semibold hover:border-primary hover:text-primary">{country.officialSourceLabel}<ExternalLink className="h-4 w-4 shrink-0" /></a><p className="mt-3 text-xs text-muted-foreground">Official starting point, not a determination of eligibility. Confirm the exact scheme and effective date for your address.</p></aside>
    </div>
  </main><SiteFooter /></div>;
}
function Info({ icon: Icon, label, value }: { icon: typeof WalletCards; label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft"><Icon className="h-5 w-5 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
