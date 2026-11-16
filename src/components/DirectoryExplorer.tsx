import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpDown, Check, MapPin, Search } from "lucide-react";
import { CITIES, COUNTRY_GUIDES } from "@/lib/cities";
import type { SolarProfile } from "@/lib/pvgis.functions";
import { calculate, DEFAULTS, money, num } from "@/lib/solar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type DirectoryEntry = { city: (typeof CITIES)[number]; profile: SolarProfile | null };
export type DirectoryFilters = { q?: string; country?: string; sort?: string };

export function DirectoryExplorer({ entries, filters, onFilters }: { entries: DirectoryEntry[]; filters: DirectoryFilters; onFilters: (next: DirectoryFilters) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const available = entries.filter((e) => e.profile);
  const average = available.length ? available.reduce((s, e) => s + e.profile!.annualKwhPerKwp, 0) / available.length : 0;
  const highest = [...available].sort((a, b) => b.profile!.annualKwhPerKwp - a.profile!.annualKwhPerKwp)[0];
  const filtered = useMemo(() => {
    const q = (filters.q ?? "").trim().toLowerCase();
    const rows = entries.filter((e) => (!q || `${e.city.name} ${e.city.country}`.toLowerCase().includes(q)) && (!filters.country || e.city.countrySlug === filters.country));
    return rows.sort((a, b) => {
      if (filters.sort === "name") return a.city.name.localeCompare(b.city.name);
      if (filters.sort === "payback") return payback(a) - payback(b);
      if (filters.sort === "yield-asc") return (a.profile?.annualKwhPerKwp ?? Infinity) - (b.profile?.annualKwhPerKwp ?? Infinity);
      return (b.profile?.annualKwhPerKwp ?? -1) - (a.profile?.annualKwhPerKwp ?? -1);
    });
  }, [entries, filters]);
  function toggle(slug: string) { setSelected((s) => s.includes(slug) ? s.filter((x) => x !== slug) : s.length < 3 ? [...s, slug] : s); }

  return <>
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <Summary label="Cities with live data" value={`${available.length} of ${entries.length}`} />
      <Summary label="Directory average" value={average ? `${num(average)} kWh/kWp` : "—"} />
      <Summary label="Highest current yield" value={highest ? `${highest.city.name} · ${num(highest.profile!.annualKwhPerKwp)}` : "—"} />
    </div>
    <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-soft" aria-label="Directory filters">
      <div className="grid gap-4 md:grid-cols-[1fr_220px_220px]">
        <div><label htmlFor="city-filter" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Find a city</label><div className="relative mt-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="city-filter" value={filters.q ?? ""} onChange={(e) => onFilters({ ...filters, q: e.target.value || undefined })} placeholder="City or country" className="h-10 pl-9" /></div></div>
        <div><label htmlFor="country-filter" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Country</label><select id="country-filter" value={filters.country ?? ""} onChange={(e) => onFilters({ ...filters, country: e.target.value || undefined })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">All countries</option>{COUNTRY_GUIDES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
        <div><label htmlFor="sort-cities" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sort by</label><select id="sort-cities" value={filters.sort ?? "yield-desc"} onChange={(e) => onFilters({ ...filters, sort: e.target.value })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="yield-desc">Highest yield</option><option value="yield-asc">Lowest yield</option><option value="payback">Shortest reference payback</option><option value="name">City name</option></select></div>
      </div>
    </section>
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" role="status">{filtered.length} {filtered.length === 1 ? "city" : "cities"} · select up to three to compare</p>
      <Button asChild variant={selected.length > 1 ? "sun" : "outline"} disabled={selected.length < 2}><Link to="/compare" search={{ cities: selected }}>Compare {selected.length || ""} {selected.length === 1 ? "city" : "cities"}<ArrowRight /></Link></Button>
    </div>
    <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-card shadow-soft" aria-label="Solar city results">
      <div className="hidden grid-cols-[44px_1.2fr_1fr_1fr_1fr_36px] gap-4 border-b border-border bg-secondary px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid"><span /><span>City</span><span>Annual yield</span><span>5 kWp year 1</span><span>Reference payback*</span><span /></div>
      {filtered.map(({ city, profile }) => {
        const checked = selected.includes(city.slug);
        const reference = profile ? calculate({ ...DEFAULTS, annualKwhPerKwp: profile.annualKwhPerKwp }) : null;
        return <div key={city.slug} className="grid gap-4 border-b border-border px-5 py-5 last:border-0 md:grid-cols-[44px_1.2fr_1fr_1fr_1fr_36px] md:items-center md:py-4">
          <label className="flex h-8 w-8 items-center justify-center rounded-md border border-input cursor-pointer" title={`Select ${city.name} for comparison`}><input type="checkbox" className="sr-only" checked={checked} disabled={!checked && selected.length >= 3} onChange={() => toggle(city.slug)} aria-label={`Compare ${city.name}` /><span className={`grid h-5 w-5 place-items-center rounded ${checked ? "bg-primary text-primary-foreground" : "bg-background"}`}>{checked && <Check className="h-3.5 w-3.5" />}</span></label>
          <div><Link to="/cities/$slug" params={{ slug: city.slug }} className="font-display text-xl font-semibold hover:text-primary">{city.name}</Link><p className="mt-0.5 text-sm text-muted-foreground"><MapPin className="mr-1 inline h-3 w-3" /><Link to="/countries/$slug" params={{ slug: city.countrySlug }} className="hover:text-primary">{city.country}</Link></p></div>
          <DataPoint label="Annual yield" value={profile ? `${num(profile.annualKwhPerKwp)} kWh/kWp` : "Unavailable"} />
          <DataPoint label="5 kWp year 1" value={profile ? `${num(profile.annualKwhPerKwp * 5)} kWh` : "—"} />
          <DataPoint label="Reference payback*" value={reference?.payback != null ? `${num(reference.payback, 1)} years` : "—"} />
          <Link to="/cities/$slug" params={{ slug: city.slug }} aria-label={`Open ${city.name}`} className="hidden text-primary md:block"><ArrowRight className="h-5 w-5" /></Link>
        </div>;
      })}
      {!filtered.length && <p className="p-10 text-center text-muted-foreground">No cities match these filters. Try a broader search.</p>}
    </section>
    <p className="mt-4 text-xs leading-relaxed text-muted-foreground">PVGIS fixed-system estimate: 30° tilt, south-facing, 14% losses. *Reference payback uses illustrative defaults ({money(DEFAULTS.costPerKw, "EUR")}/kWp in EUR for comparison only), not local market prices. Open a city to enter your quote and currency.</p>
  </>;
}

function payback(e: DirectoryEntry) { return e.profile ? calculate({ ...DEFAULTS, annualKwhPerKwp: e.profile.annualKwhPerKwp }).payback ?? Infinity : Infinity; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold tabular">{value}</p></div>; }
function DataPoint({ label, value }: { label: string; value: string }) { return <div className="flex items-baseline justify-between gap-3 md:block"><span className="text-xs text-muted-foreground md:hidden">{label}</span><span className="text-sm font-semibold tabular">{value}</span></div>; }
