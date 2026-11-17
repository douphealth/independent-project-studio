import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ChartNoAxesCombined, Database, Download, FolderLock, GitCompareArrows, ShieldCheck } from "lucide-react";
import hero from "@/assets/hero-rooftop.jpg";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { CITIES, COUNTRY_GUIDES } from "@/lib/cities";
import { HOME_DESCRIPTION, HOME_TITLE, jsonLdGraph, organizationNode, pageHead, websiteNode } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageHead({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: "/",
    jsonLd: jsonLdGraph(organizationNode(), websiteNode()),
  }),
  component: Home,
});

function Home() {
  return <div className="min-h-screen"><SiteHeader overlay /><main>
    <section className="relative isolate min-h-[88vh] overflow-hidden bg-night text-night-foreground"><img src={hero} alt="Solar panels on a whitewashed Mediterranean roof at sunset" width={1600} height={1008} fetchPriority="high" className="absolute inset-0 -z-10 h-full w-full object-cover" /><div className="absolute inset-0 -z-10 bg-dusk" /><div className="mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-end px-5 pb-20 pt-32"><p className="animate-rise text-sm font-semibold uppercase tracking-[0.25em] text-primary-glow">Independent · No installer commissions</p><h1 className="animate-rise mt-4 max-w-3xl text-5xl font-semibold leading-[1.02] sm:text-7xl" style={{ animationDelay: "80ms" }}>Know when your roof <em className="text-sun not-italic">pays you back.</em></h1><p className="animate-rise mt-6 max-w-xl text-lg text-night-foreground/80" style={{ animationDelay: "160ms" }}>SolarPayback estimates when rooftop solar pays for itself, using live EU PVGIS production, your electricity price, and your installer quote. No sign-up and no sales calls.</p><div className="animate-rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}><Button asChild variant="sun" size="xl"><Link to="/calculator">Calculate my payback<ArrowRight /></Link></Button><Button asChild variant="glass" size="xl"><Link to="/cities">Compare city data</Link></Button></div><div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-night-muted"><span>24 city profiles</span><span>Real PDF & CSV reports</span><span>Private on your device</span></div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-24"><div className="grid gap-12 md:grid-cols-[1fr_1.4fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">A better solar decision</p><h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Honest numbers beat a glossy sales quote.</h2><p className="mt-5 text-muted-foreground">Go beyond a single payback figure. Compare production, test assumptions and keep a reproducible record of every quote.</p></div><div className="grid gap-6 sm:grid-cols-2">{[
      { i: Database, t: "Verifiable sunlight", d: "Monthly yield from PVGIS satellite records, with source period, roof assumptions and retrieval date." },
      { i: ChartNoAxesCombined, t: "Full investment model", d: "Degradation, separate tariff escalation, maintenance, inverter replacement, NPV and IRR." },
      { i: FolderLock, t: "Private by default", d: "No account or analytics. Saved quotes and generated reports stay on your device unless you share them." },
      { i: BadgeCheck, t: "Assumptions in the open", d: "Every default is editable. The methodology explains the formulas and what the model cannot know." },
    ].map(({ i: Icon, t, d }) => <article key={t} className="rounded-3xl border border-border bg-card p-6 shadow-soft"><span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground"><Icon className="h-5 w-5" /></span><h3 className="mt-4 text-xl font-semibold">{t}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d}</p></article>)}</div></div></section>

    <section className="bg-secondary py-20"><div className="mx-auto max-w-6xl px-5"><div className="grid gap-8 lg:grid-cols-3">{[
      { icon: GitCompareArrows, n: "01", title: "Compare locations", text: "Search, filter and sort live yields. Compare monthly production in up to three cities with identical assumptions.", to: "/compare", cta: "Compare cities" },
      { icon: ShieldCheck, n: "02", title: "Compare installer quotes", text: "Save scenarios locally and evaluate upfront cost, payback, NPV and net gain without creating an account.", to: "/scenarios", cta: "Open saved scenarios" },
      { icon: Download, n: "03", title: "Keep the evidence", text: "Download a real PDF report or CSV ledger with the source period, assumptions and annual cash flows included.", to: "/calculator", cta: "Build a report" },
    ].map(({ icon: Icon, n, title, text, to, cta }) => <article key={n} className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-soft"><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-primary" /><span className="text-sm font-semibold text-primary">{n}</span></div><h3 className="mt-6 text-3xl font-semibold">{title}</h3><p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p><Button asChild variant="outline" className="mt-6 self-start"><Link to={to}>{cta}<ArrowRight /></Link></Button></article>)}</div></div></section>

    <section className="mx-auto max-w-6xl px-5 py-24"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">{COUNTRY_GUIDES.length} countries · {CITIES.length} cities</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Start with the sun where you live.</h2></div><Button asChild variant="outline"><Link to="/cities">Search the directory<ArrowRight /></Link></Button></div><div className="mt-8 flex flex-wrap gap-2">{CITIES.map((c) => <Link key={c.slug} to="/cities/$slug" params={{ slug: c.slug }} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">{c.name}<span className="text-muted-foreground"> · {c.country}</span></Link>)}</div></section>
  </main><SiteFooter /></div>;
}
