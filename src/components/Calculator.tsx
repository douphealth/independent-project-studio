import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, MapPin, Search, AlertTriangle } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { geocode, getSolarProfile, type SolarProfile } from "@/lib/pvgis.functions";
import { DEFAULTS, calculate, eur, num, type Inputs } from "@/lib/solar";

type Place = { name: string; country: string; lat: number; lon: number };

const FIELDS: { key: keyof typeof DEFAULTS; label: string; min: number; max: number; step: number; fmt: (n: number) => string; hint?: string }[] = [
  { key: "systemKw", label: "System size", min: 1, max: 20, step: 0.5, fmt: (n) => `${num(n, 1)} kWp` },
  { key: "costPerKw", label: "Installed cost", min: 600, max: 3000, step: 50, fmt: (n) => `${eur(n)}/kWp`, hint: "Use the figure from your quote." },
  { key: "grant", label: "Grant / subsidy", min: 0, max: 10000, step: 250, fmt: (n) => eur(n) },
  { key: "annualUsageKwh", label: "Annual electricity use", min: 1000, max: 15000, step: 250, fmt: (n) => `${num(n)} kWh`, hint: "Sum the last 12 months on your bills." },
  { key: "importPrice", label: "Your electricity price", min: 0.08, max: 0.6, step: 0.01, fmt: (n) => `${eur(n, 2)}/kWh`, hint: "All-in price per kWh from your bill." },
  { key: "exportPrice", label: "Export payment", min: 0, max: 0.3, step: 0.01, fmt: (n) => `${eur(n, 2)}/kWh` },
  { key: "selfUsePct", label: "Solar used at home", min: 10, max: 90, step: 5, fmt: (n) => `${n}%`, hint: "≈30–40% without battery, 60–80% with one." },
  { key: "priceEscalationPct", label: "Yearly price rise", min: 0, max: 8, step: 0.5, fmt: (n) => `${num(n, 1)}%` },
];

export function Calculator({ initial }: { initial?: { place: Place; profile: SolarProfile } }) {
  const geo = useServerFn(geocode);
  const pv = useServerFn(getSolarProfile);
  const [place, setPlace] = useState<Place | null>(initial?.place ?? null);
  const [profile, setProfile] = useState<SolarProfile | null>(initial?.profile ?? null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState({ ...DEFAULTS });

  useEffect(() => {
    if (initial || place) return;
    void choose({ name: "Athens, Attica", country: "Greece", lat: 37.9838, lon: 23.7275 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) return;
    setBusy(true); setErr(null);
    try {
      const r = await geo({ data: { q } });
      setHits(r);
      if (!r.length) setErr("No places found — try a city or town name.");
    } catch { setErr("Location search is unavailable right now."); }
    finally { setBusy(false); }
  }

  async function choose(p: Place) {
    setHits([]); setPlace(p); setBusy(true); setErr(null);
    try { setProfile(await pv({ data: { lat: p.lat, lon: p.lon } })); }
    catch { setProfile(null); setErr("PVGIS didn't respond for this location (it covers Europe, Africa and most of Asia). Please retry."); }
    finally { setBusy(false); }
  }

  const res = useMemo(() => {
    if (!profile) return null;
    try { return calculate({ ...v, annualKwhPerKwp: profile.annualKwhPerKwp } as Inputs); } catch { return null; }
  }, [v, profile]);

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <form onSubmit={search} className="relative">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</label>
          <div className="mt-2 flex gap-2">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={place ? place.name : "Search a city"} className="h-11 rounded-full bg-background px-4" aria-label="Search location" />
            <Button type="submit" variant="sun" size="icon" className="h-11 w-11 shrink-0" aria-label="Search">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {hits.length > 0 && (
            <ul className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-soft">
              {hits.map((h) => (
                <li key={`${h.lat},${h.lon}`}>
                  <button type="button" onClick={() => choose(h)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-muted">
                    <MapPin className="h-3.5 w-3.5 text-primary" /> {h.name} <span className="text-muted-foreground">· {h.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        {place && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {place.name}, {place.country}
            {profile && <span className="ml-auto tabular font-semibold text-foreground">{num(profile.annualKwhPerKwp)} kWh/kWp</span>}
          </p>
        )}
        {err && <p className="mt-3 flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{err}</p>}

        <div className="mt-6 space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{f.label}</span>
                <span className="tabular font-semibold text-primary">{f.fmt(v[f.key] as number)}</span>
              </div>
              <Slider className="mt-2.5" min={f.min} max={f.max} step={f.step} value={[v[f.key] as number]}
                onValueChange={([n]) => setV((s) => ({ ...s, [f.key]: n }))} aria-label={f.label} />
              {f.hint && <p className="mt-1.5 text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-3xl bg-night p-7 text-night-foreground shadow-soft sm:p-9">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun opacity-30 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-widest text-night-muted">Estimated payback</p>
          <p className="mt-2 font-display text-6xl font-semibold tabular sm:text-7xl">
            {!res ? "—" : res.payback === null ? "Not within 25 yrs" : <>{num(res.payback, 1)}<span className="ml-2 text-2xl text-night-muted">years</span></>}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
            <Stat label="Upfront cost" value={res ? eur(res.upfront) : "—"} />
            <Stat label="Year-1 savings" value={res ? eur(res.year1Savings) : "—"} />
            <Stat label="25-yr net gain" value={res ? eur(res.totalNet) : "—"} />
            <Stat label="Return (IRR)" value={res?.irr != null ? `${num(res.irr, 1)}%` : "—"} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Tile label="Year-1 production" value={res ? `${num(res.year1Generation)} kWh` : "—"} />
          <Tile label="Bill covered by solar" value={res ? `${num(res.coveragePct)}%` : "—"} />
          <Tile label="Cost per solar kWh" value={res ? `${eur(res.lcoe, 3)}` : "—"} />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-baseline justify-between">
            <h3 className="text-xl font-semibold">Cumulative cash position</h3>
            <span className="text-xs text-muted-foreground">NPV @4%: {res ? eur(res.npv) : "—"}</span>
          </div>
          <div className="mt-4 h-64">
            {res && (
              <ResponsiveContainer>
                <AreaChart data={[{ year: 0, cumulative: -res.upfront }, ...res.years]}>
                  <defs>
                    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(n) => `€${Math.round(n / 1000)}k`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={48} />
                  <ReferenceLine y={0} stroke="var(--foreground)" strokeOpacity={0.4} />
                  <Tooltip formatter={(n: number) => eur(n)} labelFormatter={(l) => `Year ${l}`} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} />
                  <Area type="monotone" dataKey="cumulative" stroke="var(--primary)" strokeWidth={2.5} fill="url(#g)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
          {profile && (
            <p className="mt-4 text-xs text-muted-foreground">
              Solar yield: PVGIS {profile.radiationDb} ({profile.period}), {profile.angle}° tilt, south-facing, 14% system losses. 0.5%/yr panel degradation, €15/kWp/yr maintenance.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-night-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular">{value}</p>
    </div>
  );
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tabular">{value}</p>
    </div>
  );
}
