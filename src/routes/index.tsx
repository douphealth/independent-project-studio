import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Database, LineChart, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero-rooftop.jpg";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CITIES, SITE_URL } from "@/lib/cities";

const TITLE = "SolarPayback — When will solar panels pay for themselves?";
const DESC = "Independent solar payback calculator built on EU JRC PVGIS irradiation data. See payback years, savings and return for your roof in seconds.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "WebSite", name: "SolarPayback", url: SITE_URL }) }],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative isolate min-h-[92vh] overflow-hidden bg-night text-night-foreground">
        <img src={hero} alt="Solar panels on a whitewashed Mediterranean roof at sunset" width={1600} height={1008} className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-dusk" />
        <SiteHeader overlay />
        <div className="mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-5 pb-20 pt-32">
          <p className="animate-rise text-sm font-semibold uppercase tracking-[0.25em] text-primary-glow">Independent · No installer commissions</p>
          <h1 className="animate-rise mt-4 max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl" style={{ animationDelay: "80ms" }}>
            Know when your roof <em className="text-sun not-italic">pays you back.</em>
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg text-night-foreground/80" style={{ animationDelay: "160ms" }}>
            Real irradiation data from the EU's PVGIS service, your actual electricity price, and transparent maths. No sign-up, no sales calls.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
            <Button asChild variant="sun" size="xl"><Link to="/calculator">Calculate my payback <ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="glass" size="xl"><Link to="/cities">Browse city data</Link></Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.4fr]">
          <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">Honest numbers beat a glossy sales quote.</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { i: Database, t: "Measured sunlight", d: "Monthly yield from PVGIS SARAH3 satellite records, fetched live for your exact coordinates." },
              { i: LineChart, t: "Full 25-year model", d: "Degradation, price escalation, export rates, maintenance, NPV and IRR — every year shown." },
              { i: ShieldCheck, t: "Nothing to sell", d: "No account, no tracking of your inputs, no lead lists. Your numbers stay in your browser." },
              { i: BadgeCheck, t: "Assumptions in the open", d: "Every default is editable and the methodology page explains exactly what we don't know." },
            ].map(({ i: Icon, t, d }) => (
              <div key={t} className="rounded-3xl border border-border bg-card p-6 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold sm:text-4xl">Solar potential by city</h2>
          <Link to="/cities" className="text-sm font-semibold text-primary hover:underline">All {CITIES.length} cities →</Link>
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Link key={c.slug} to="/cities/$slug" params={{ slug: c.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
              {c.name} <span className="text-muted-foreground">· {c.country}</span>
            </Link>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
