import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Share2 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CITIES, currencyForCountry } from "@/lib/cities";
import type { SolarProfile } from "@/lib/pvgis.functions";
import { calculate, DEFAULTS, money, num } from "@/lib/solar";
import { Button } from "@/components/ui/button";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["var(--chart-1)", "var(--chart-3)", "var(--chart-4)"];
type Entry = { city: (typeof CITIES)[number]; profile: SolarProfile | null };

export function CityComparison({ entries, selected }: { entries: Entry[]; selected: string[] }) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const chosen = selected.map((slug) => entries.find((e) => e.city.slug === slug)).filter((e): e is Entry => Boolean(e));
  const chart = useMemo(() => MONTHS.map((month, i) => Object.fromEntries([["month", month], ...chosen.map((e) => [e.city.slug, e.profile?.monthly[i]?.kwh ?? null])])), [chosen]);
  function update(index: number, slug: string) {
    const next = [...selected];
    next[index] = slug;
    const clean = [...new Set(next.filter(Boolean))].slice(0, 3);
    void navigate({ to: "/compare", search: { cities: clean }, replace: true });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); } catch { setCopied(false); }
  }
  return <>
    <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft">
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((index) => <div key={index}><label htmlFor={`compare-${index}`} className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">City {index + 1}</label><select id={`compare-${index}`} value={selected[index] ?? ""} onChange={(e) => update(index, e.target.value)} className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Choose a city</option>{CITIES.map((c) => <option key={c.slug} value={c.slug} disabled={selected.includes(c.slug) && selected[index] !== c.slug}>{c.name}, {c.country}</option>)}</select></div>)}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Compare two or three cities using the same roof and financial assumptions.</p><Button variant="outline" size="sm" onClick={copy}>{copied ? <Check /> : <Share2 />}{copied ? "Copied" : "Share"}</Button></div>
    </section>
    {chosen.length < 2 ? <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center"><h2 className="text-2xl font-semibold">Choose at least two cities</h2><p className="mt-2 text-muted-foreground">Your comparison will appear here with monthly production and investment metrics.</p></div> : <>
      <div className="mt-8 grid gap-4 md:grid-cols-3">{chosen.map(({ city, profile }, i) => {
        const result = profile ? calculate({ ...DEFAULTS, annualKwhPerKwp: profile.annualKwhPerKwp }) : null;
        return <article key={city.slug} className="rounded-3xl border border-border bg-card p-6 shadow-soft"><div className="h-1 w-12 rounded-full" style={{ background: COLORS[i] }} /><h2 className="mt-4 text-3xl font-semibold">{city.name}</h2><Link to="/countries/$slug" params={{ slug: city.countrySlug }} className="text-sm text-muted-foreground hover:text-primary">{city.country}</Link><p className="mt-6 font-display text-4xl font-semibold tabular">{profile ? num(profile.annualKwhPerKwp) : "—"}<span className="ml-1 text-sm font-normal text-muted-foreground">kWh/kWp</span></p><dl className="mt-5 space-y-3 text-sm"><Metric label="5 kWp year 1" value={profile ? `${num(profile.annualKwhPerKwp * 5)} kWh` : "—"} /><Metric label="Reference payback*" value={result?.payback != null ? `${num(result.payback, 1)} years` : "—"} /><Metric label="Reference NPV" value={result ? money(result.npv, currencyForCountry(city.country)) : "—"} /></dl><Button asChild variant="outline" className="mt-6 w-full"><Link to="/cities/$slug" params={{ slug: city.slug }}>Calculate in {city.name}<ArrowRight /></Link></Button></article>;
      })}</div>
      <section className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft"><h2 className="text-2xl font-semibold">Monthly production per kWp</h2><p className="mt-1 text-sm text-muted-foreground">Compare seasonality, not just the annual total.</p><div className="mt-6 h-80"><ResponsiveContainer><BarChart data={chart}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} /><Tooltip formatter={(n: number) => `${num(n, 1)} kWh`} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} /><Legend />{chosen.map((e, i) => <Bar key={e.city.slug} isAnimationActive={false} dataKey={e.city.slug} name={e.city.name} fill={COLORS[i]} radius={[5, 5, 0, 0]} />)}</BarChart></ResponsiveContainer></div></section>
      <p className="mt-4 text-xs text-muted-foreground">*Reference economics use the same illustrative defaults everywhere and are not local market quotes. Solar data: EU JRC PVGIS 5.3, 30° tilt, south-facing, 14% losses.</p>
    </>}
  </>;
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0"><dt className="text-muted-foreground">{label}</dt><dd className="font-semibold tabular">{value}</dd></div>; }
