import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Download, FileText, Loader2, MapPin, Save, Search, Share2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { geocode, getSolarProfile, type SolarProfile } from "@/lib/pvgis.functions";
import { DEFAULTS, calculate, money, num, type Inputs } from "@/lib/solar";
import { currencyForCountry, type Currency } from "@/lib/cities";
import { createScenario, DEFAULT_ROOF, encodeScenario, type RoofOptions, type Scenario, type ScenarioPlace, type ScenarioValues } from "@/lib/scenarios";
import { saveScenario } from "@/lib/storage";
import { exportScenarioCsv, exportScenarioPdf } from "@/lib/export";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type FieldKey = keyof ScenarioValues;
type Field = { key: FieldKey; label: string; min: number; max: number; step: number; hint?: string; fmt: (n: number, c: Currency) => string };
const BASIC_FIELDS: Field[] = [
  { key: "systemKw", label: "System size", min: 1, max: 20, step: 0.5, fmt: (n) => `${num(n, 1)} kWp` },
  { key: "costPerKw", label: "Installed cost", min: 600, max: 3000, step: 50, hint: "Use the complete figure from your quote.", fmt: (n, c) => `${money(n, c)}/kWp` },
  { key: "grant", label: "Confirmed grant", min: 0, max: 10000, step: 250, hint: "Enter only support you have verified.", fmt: (n, c) => money(n, c) },
  { key: "annualUsageKwh", label: "Annual electricity use", min: 1000, max: 15000, step: 250, hint: "Sum the last 12 months on your bills.", fmt: (n) => `${num(n)} kWh` },
  { key: "importPrice", label: "Avoidable electricity price", min: 0, max: 1, step: 0.01, hint: "The unit charges you avoid by using less grid electricity.", fmt: (n, c) => `${money(n, c, 2)}/kWh` },
  { key: "exportPrice", label: "Export payment", min: 0, max: 0.5, step: 0.01, fmt: (n, c) => `${money(n, c, 2)}/kWh` },
  { key: "selfUsePct", label: "Solar used at home", min: 0, max: 100, step: 5, hint: "An annual assumption, not a battery dispatch simulation.", fmt: (n) => `${n}%` },
  { key: "priceEscalationPct", label: "Yearly import price rise", min: -5, max: 10, step: 0.5, fmt: (n) => `${num(n, 1)}%` },
];
const ADVANCED_FIELDS: Field[] = [
  { key: "exportEscalationPct", label: "Yearly export price rise", min: -5, max: 10, step: 0.5, fmt: (n) => `${num(n, 1)}%` },
  { key: "degradationPct", label: "Panel degradation / year", min: 0, max: 2, step: 0.1, fmt: (n) => `${num(n, 1)}%` },
  { key: "discountPct", label: "Discount rate", min: 0, max: 15, step: 0.5, fmt: (n) => `${num(n, 1)}%` },
  { key: "omPerKwYear", label: "Maintenance / kWp / year", min: 0, max: 100, step: 5, fmt: (n, c) => money(n, c) },
  { key: "omEscalationPct", label: "Yearly maintenance rise", min: -5, max: 10, step: 0.5, fmt: (n) => `${num(n, 1)}%` },
  { key: "inverterReplacementYear", label: "Inverter replacement year", min: 0, max: 40, step: 1, hint: "Set to 0 to exclude replacement.", fmt: (n) => n === 0 ? "Not modelled" : `Year ${n}` },
  { key: "inverterReplacementCost", label: "Replacement cost", min: 0, max: 10000, step: 100, fmt: (n, c) => money(n, c) },
  { key: "lifetime", label: "Analysis lifetime", min: 10, max: 40, step: 5, fmt: (n) => `${n} years` },
];

export function Calculator({ initial }: { initial?: { place: ScenarioPlace; profile: SolarProfile; scenario?: Scenario } | undefined }) {
  const geo = useServerFn(geocode);
  const pv = useServerFn(getSolarProfile);
  const initialScenario = initial?.scenario;
  const [place, setPlace] = useState<ScenarioPlace | null>(initial?.place ?? null);
  const [profile, setProfile] = useState<SolarProfile | null>(initial?.profile ?? null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<ScenarioPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [v, setV] = useState<ScenarioValues>({ ...(initialScenario?.values ?? DEFAULTS) });
  const [roof, setRoof] = useState<RoofOptions>({ ...(initialScenario?.roof ?? (initial?.profile ? { angle: initial.profile.angle, aspect: initial.profile.aspect, loss: initial.profile.loss } : DEFAULT_ROOF)) });
  const [currency, setCurrency] = useState<Currency>(initialScenario?.currency ?? (initial?.place ? currencyForCountry(initial.place.country) : "EUR"));
  const [advanced, setAdvanced] = useState(false);
  const [name, setName] = useState(initialScenario?.name ?? "My solar scenario");
  const [savedId, setSavedId] = useState<string | undefined>();
  const [notice, setNotice] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [exporting, setExporting] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current || initial || place) { mounted.current = true; return; }
    mounted.current = true;
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
    } catch { setErr("Location search is unavailable right now. Please try again."); }
    finally { setBusy(false); }
  }

  async function choose(p: ScenarioPlace, nextRoof = roof) {
    setHits([]); setPlace(p); setBusy(true); setErr(null); setNotice(null);
    setCurrency(currencyForCountry(p.country));
    try {
      const next = await pv({ data: { lat: p.lat, lon: p.lon, ...nextRoof } });
      setProfile(next);
      if (!name || name === "My solar scenario") setName(`${p.name.split(",")[0]} solar`);
    } catch { setProfile(null); setErr("PVGIS could not provide data for this location. It covers Europe, Africa and most of Asia. Please retry."); }
    finally { setBusy(false); }
  }

  const res = useMemo(() => {
    if (!profile) return null;
    try { return calculate({ ...v, annualKwhPerKwp: profile.annualKwhPerKwp } as Inputs); } catch { return null; }
  }, [v, profile]);
  const scenario = useMemo<Scenario | null>(() => place ? createScenario(place, v, roof, currency, name.trim() || "My solar scenario") : null, [place, v, roof, currency, name]);
  const sensitivity = useMemo(() => {
    if (!profile) return [];
    return [-15, 15].map((change) => {
      const result = calculate({ ...v, costPerKw: v.costPerKw * (1 + change / 100), annualKwhPerKwp: profile.annualKwhPerKwp });
      return { change, payback: result.payback };
    });
  }, [v, profile]);

  function update(key: FieldKey, value: number) { setV((s) => ({ ...s, [key]: Number.isFinite(value) ? value : 0 })); setNotice(null); }
  function save(asNew = false) {
    if (!scenario || !profile) return;
    const saved = saveScenario(scenario, asNew ? undefined : savedId, profile); setSavedId(saved.id); setName(saved.name); setNotice("Saved in this browser. Open Saved scenarios to compare quotes.");
  }
  function updateRoof(patch: Partial<RoofOptions>) {
    setRoof((r) => ({ ...r, ...patch }));
    setProfile(null);
    setNotice("Roof settings changed. Select Update solar profile to calculate with the new assumptions.");
  }
  async function share() {
    if (!scenario) return;
    const url = `${window.location.origin}/calculator?scenario=${encodeScenario(scenario)}`;
    setShareUrl(url);
    try { await navigator.clipboard.writeText(url); setNotice("Share link copied. It contains your assumptions, not an account or upload."); }
    catch { setNotice("Your share link is ready below."); }
  }
  async function pdf() {
    if (!scenario || !profile) return;
    setExporting(true);
    try { await exportScenarioPdf(scenario, profile); setNotice("PDF report downloaded."); }
    catch { setErr("The PDF could not be created. CSV export is still available."); }
    finally { setExporting(false); }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft sm:p-6" aria-label="Location and scenario name">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <form onSubmit={search} className="relative">
            <label htmlFor="location-search" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Location</label>
            <div className="mt-2 flex gap-2">
              <Input id="location-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={place ? place.name : "Search a city or town"} className="h-11 rounded-full bg-background px-4" />
              <Button type="submit" variant="sun" size="icon" className="h-11 w-11 shrink-0" aria-label="Search location" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
            {hits.length > 0 && (
              <ul className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-popover shadow-soft" aria-label="Location results">
                {hits.map((h) => <li key={`${h.lat},${h.lon}`}><button type="button" onClick={() => choose(h)} className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-muted"><MapPin className="h-3.5 w-3.5 text-primary" /> {h.name} <span className="text-muted-foreground">· {h.country}</span></button></li>)}
              </ul>
            )}
          </form>
          <div>
            <label htmlFor="scenario-name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Scenario name</label>
            <Input id="scenario-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 rounded-full bg-background px-4" />
          </div>
          <div>
            <label htmlFor="currency" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Currency</label>
            <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className="mt-2 h-11 w-full rounded-full border border-input bg-background px-4 text-sm md:w-28">
              <option value="EUR">EUR €</option><option value="GBP">GBP £</option><option value="PLN">PLN zł</option>
            </select>
          </div>
        </div>
        {place && <p className="mt-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5 text-primary" /> {place.name}, {place.country}{profile && <span className="ml-auto font-semibold text-foreground tabular">{num(profile.annualKwhPerKwp)} kWh/kWp</span>}</p>}
        {err && <p role="alert" className="mt-3 flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0" />{err}</p>}
        {profile?.stale && <p className="mt-3 rounded-xl bg-accent p-3 text-sm text-accent-foreground">Live PVGIS is unavailable; this result uses the most recent cached solar profile from {new Date(profile.fetchedAt).toLocaleDateString("en-GB")}.</p>}
      </section>

      <div className="grid gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
        <div className="order-2 rounded-3xl border border-border bg-card p-6 shadow-soft lg:order-1">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Your quote & bill</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setAdvanced((a) => !a)} aria-expanded={advanced}>Advanced <ChevronDown className={`transition-transform ${advanced ? "rotate-180" : ""}`} /></Button>
          </div>
          <div className="mt-6 space-y-6">
            {BASIC_FIELDS.map((f) => <CalculatorField key={f.key} field={f} value={v[f.key]} currency={currency} onChange={update} slider />)}
          </div>
          {advanced && (
            <div className="mt-8 border-t border-border pt-7">
              <h3 className="font-semibold">Roof & solar data</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Aspect: 0° south, −90° east, 90° west. Apply to request a new PVGIS profile.</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <RoofInput label="Tilt °" value={roof.angle} min={0} max={90} onChange={(n) => updateRoof({ angle: n })} />
                <RoofInput label="Aspect °" value={roof.aspect} min={-180} max={180} onChange={(n) => updateRoof({ aspect: n })} />
                <RoofInput label="Losses %" value={roof.loss} min={0} max={40} onChange={(n) => updateRoof({ loss: n })} />
              </div>
              <Button type="button" variant="outline" className="mt-4 w-full" disabled={!place || busy} onClick={() => place && choose(place, roof)}>{busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} Update solar profile</Button>
              <h3 className="mt-8 font-semibold">Long-term assumptions</h3>
              <div className="mt-5 space-y-5">{ADVANCED_FIELDS.map((f) => <CalculatorField key={f.key} field={f} value={v[f.key]} currency={currency} onChange={update} />)}</div>
            </div>
          )}
        </div>

        <div className="order-1 space-y-6 lg:order-2">
          <section className="relative overflow-hidden rounded-3xl bg-night p-7 text-night-foreground shadow-soft sm:p-9" aria-live="polite">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sun opacity-20 blur-3xl" />
            <p className="text-xs font-semibold uppercase tracking-widest text-night-muted">Estimated simple payback</p>
            <p className="mt-2 font-display text-6xl font-semibold tabular sm:text-7xl">{!res ? "—" : res.payback === null ? `Not within ${v.lifetime} yrs` : <>{num(res.payback, 1)}<span className="ml-2 text-2xl text-night-muted">years</span></>}</p>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Stat label="Upfront cost" value={res ? money(res.upfront, currency) : "—"} />
              <Stat label="Year-1 savings" value={res ? money(res.year1Savings, currency) : "—"} />
              <Stat label={`${v.lifetime}-yr net gain`} value={res ? money(res.totalNet, currency) : "—"} />
              <Stat label="Return (IRR)" value={res?.irr != null ? `${num(res.irr, 1)}%` : "—"} />
            </div>
          </section>

          <div className="flex flex-wrap gap-2" aria-label="Scenario actions">
            <Button type="button" variant="sun" onClick={() => save()} disabled={!scenario || !profile}><Save />{savedId ? "Update saved" : "Save"}</Button>
            {savedId && <Button type="button" variant="outline" onClick={() => save(true)} disabled={!scenario || !profile}>Save as new</Button>}
            <Button type="button" variant="outline" onClick={share} disabled={!scenario}><Share2 />Share</Button>
            <Button type="button" variant="outline" onClick={() => scenario && profile && exportScenarioCsv(scenario, profile)} disabled={!scenario || !profile}><Download />CSV</Button>
            <Button type="button" variant="outline" onClick={pdf} disabled={!scenario || !profile || exporting}>{exporting ? <Loader2 className="animate-spin" /> : <FileText />}PDF report</Button>
            <Button asChild type="button" variant="ghost"><Link to="/scenarios">Compare saved <ArrowRight /></Link></Button>
          </div>
          {notice && <p role="status" className="flex items-start gap-2 rounded-xl bg-accent p-3 text-sm text-accent-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0" />{notice}</p>}
          {shareUrl && <div><label htmlFor="share-url" className="text-xs font-medium text-muted-foreground">Shareable scenario URL</label><Input id="share-url" readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="mt-1 text-xs" /></div>}

          <div className="grid gap-4 sm:grid-cols-3">
            <Tile label="Year-1 production" value={res ? `${num(res.year1Generation)} kWh` : "—"} />
            <Tile label="Bill covered by solar" value={res ? `${num(res.coveragePct)}%` : "—"} />
            <Tile label="Discounted cost / solar kWh" value={res ? money(res.lcoe, currency, 3) : "—"} />
          </div>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-xl font-semibold">Cumulative cash position</h2><span className="text-xs text-muted-foreground">NPV @{num(v.discountPct, 1)}%: {res ? money(res.npv, currency) : "—"}</span></div>
            <div className="mt-4 h-64" aria-label="Chart of cumulative cash position over the analysis lifetime">
              {res && <ResponsiveContainer><AreaChart data={[{ year: 0, cumulative: -res.upfront }, ...res.years]}>
                <defs><linearGradient id="cash" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="year" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} /><YAxis tickFormatter={(n) => `${currency === "GBP" ? "£" : currency === "PLN" ? "zł" : "€"}${Math.round(n / 1000)}k`} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} width={48} /><ReferenceLine y={0} stroke="var(--foreground)" strokeOpacity={0.4} /><Tooltip formatter={(n: number) => money(n, currency)} labelFormatter={(l) => `Year ${l}`} contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--popover)" }} /><Area isAnimationActive={false} type="monotone" dataKey="cumulative" stroke="var(--primary)" strokeWidth={2.5} fill="url(#cash)" />
              </AreaChart></ResponsiveContainer>}
            </div>
            {profile && <p className="mt-4 text-xs leading-relaxed text-muted-foreground">PVGIS {profile.radiationDb} ({profile.period}), {profile.angle}° tilt, {profile.aspect}° aspect, {profile.loss}% losses. {v.degradationPct}%/yr degradation, {money(v.omPerKwYear, currency)}/kWp/yr maintenance. Retrieved {new Date(profile.fetchedAt).toISOString().slice(0, 10)}.</p>}
            {res && <details className="mt-4 text-sm"><summary className="cursor-pointer font-medium">View annual cash-flow table</summary><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[540px] text-xs"><thead><tr className="text-left text-muted-foreground"><th className="py-2">Year</th><th>Generation</th><th>Savings</th><th>Costs</th><th>Cumulative</th></tr></thead><tbody>{res.years.map((r) => <tr key={r.year} className="border-t border-border"><td className="py-2">{r.year}</td><td>{num(r.generation)} kWh</td><td>{money(r.savings, currency)}</td><td>{money(r.om + r.replacement, currency)}</td><td>{money(r.cumulative, currency)}</td></tr>)}</tbody></table></div></details>}
          </section>

          {res && <section className="rounded-2xl border border-border bg-secondary p-5"><h2 className="font-semibold">Quote sensitivity</h2><p className="mt-1 text-sm text-muted-foreground">If every other assumption stayed the same:</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{sensitivity.map((s) => <p key={s.change} className="rounded-xl bg-card p-3 text-sm">Installed cost {s.change > 0 ? "+" : ""}{s.change}% → <strong>{s.payback == null ? `>${v.lifetime} years` : `${num(s.payback, 1)} years`}</strong></p>)}</div></section>}
        </div>
      </div>
    </div>
  );
}

function CalculatorField({ field: f, value, currency, onChange, slider = false }: { field: Field; value: number; currency: Currency; onChange: (key: FieldKey, n: number) => void; slider?: boolean }) {
  const id = `field-${f.key}`;
  return <div>
    <div className="flex items-center justify-between gap-3 text-sm"><label htmlFor={id} className="font-medium">{f.label}</label><span className="font-semibold text-primary tabular">{f.fmt(value, currency)}</span></div>
    <div className={`mt-2 grid items-center gap-3 ${slider ? "grid-cols-[1fr_92px]" : ""}`}>
      {slider && <Slider min={f.min} max={f.max} step={f.step} value={[Math.min(f.max, Math.max(f.min, value))]} onValueChange={([n]) => n !== undefined && onChange(f.key, n)} aria-label={f.label} />}
      <Input id={id} type="number" inputMode="decimal" min={f.min} max={f.max} step={f.step} value={value} onChange={(e) => onChange(f.key, e.target.valueAsNumber)} className={slider ? "h-9 px-2 text-right text-xs" : "h-10"} />
    </div>
    {f.hint && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.hint}</p>}
  </div>;
}
function RoofInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return <div><label className="text-xs text-muted-foreground">{label}<Input type="number" value={value} min={min} max={max} onChange={(e) => onChange(Number.isFinite(e.target.valueAsNumber) ? e.target.valueAsNumber : 0)} className="mt-1 px-2" /></label></div>;
}
function Stat({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-night-muted">{label}</p><p className="mt-1 text-lg font-semibold tabular">{value}</p></div>; }
function Tile({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-soft"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-display text-2xl font-semibold tabular">{value}</p></div>; }
